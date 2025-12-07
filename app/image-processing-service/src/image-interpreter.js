// src/image-interpreter.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";
import mongoose from "mongoose";
import Note from "./models/notes.js";

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * @param {string} s3ObjectUrl - s3://bucket/key
 * @param {string} noteId - Mongo ObjectId
 */
export async function interpretImageFromS3(s3ObjectUrl, noteId) {
  if (!s3ObjectUrl) {
    throw new Error("s3ObjectUrl is required");
  }

  if (!mongoose.Types.ObjectId.isValid(noteId)) {
    throw new Error(`Invalid noteId: ${noteId}`);
  }

  // Parse s3://bucket/key
  const match = s3ObjectUrl.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error("Invalid S3 URL format. Expected s3://bucket/key");
  }

  const [, bucket, key] = match;

  console.log("📥 Downloading image from S3:", s3ObjectUrl);

  const s3 = new S3Client({});
  const s3Response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const imageBuffer = await streamToBuffer(s3Response.Body);
  const imageBase64 = imageBuffer.toString("base64");

  // Ensure secret exists (DO NOT log it)
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  console.log("Anthropic API key detected");

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const MODEL_ID = "claude-sonnet-4-20250514";

  const JSON_PROMPT = `
Rules:
- Only output JSON
- No markdown
- Response must start with "{"

Schema:
{
  "todos": [
    {
      "deadline": "string | null | infinity",
      "task": "string",
      "checkbox_checked": true | false
    }
  ],
  "quote_of_the_day": "string | null",
  "written_and_drawn_notes_summary": ["string"],
  "sticky_notes_summary": ["string"]
}
`;

  console.log("Calling Claude Vision API...");

  const claudeResponse = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 4096,
    temperature: 1,
    system: "Return only valid JSON. No explanation text.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Extract structured information from this whiteboard image.",
          },
          {
            type: "text",
            text: JSON_PROMPT,
          },
        ],
      },
    ],
  });

  const raw = claudeResponse.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("Claude returned invalid JSON:", raw);
    throw new Error("Claude JSON parsing failed");
  }

  console.log("Writing interpretation to MongoDB");

  await Note.findByIdAndUpdate(
    noteId,
    {
      interpretation: parsed,
      interpretationCompleted: true,
    },
    { new: true }
  );

  console.log("Interpretation completed", {
    noteId,
    s3ObjectUrl,
  });

  return {
    noteId,
    s3_object: s3ObjectUrl,
    interpretation: parsed,
  };
}
