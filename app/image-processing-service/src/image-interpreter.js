// src/image-interpreter.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";
import Note from "./models/notes.js";
import { getEmbedding } from "./encoder.js";

/**
 * Convert readable stream → Buffer
 */
function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Flatten interpretation JSON → deterministic text
 * (critical for stable embeddings)
 */
function interpretationToText(interpretation) {
  const parts = [];

  if (interpretation.todos?.length) {
    parts.push("Todo list:");
    interpretation.todos.forEach((t) => {
      const status = t.checkbox_checked ? "completed" : "pending";
      parts.push(`- TODO (${status}): ${t.task}`);
    });
  } else {
    parts.push("Todo list: none");
  }

  if (interpretation.quote_of_the_day) {
    parts.push(`Quote of the day: "${interpretation.quote_of_the_day}"`);
  } else {
    parts.push("Quote of the day: none");
  }

  if (interpretation.written_and_drawn_notes_summary?.length) {
    parts.push("Whiteboard notes:");
    interpretation.written_and_drawn_notes_summary.forEach((n) =>
      parts.push(`- ${n}`)
    );
  }

  if (interpretation.sticky_notes_summary?.length) {
    parts.push("Sticky notes:");
    interpretation.sticky_notes_summary.forEach((n) => parts.push(`- ${n}`));
  }

  return parts.join("\n");
}

/**
 * @param {string} s3ObjectUrl - s3://bucket/key
 * @param {string} noteId     - custom noteId field (NOT Mongo _id)
 */
export async function interpretImageFromS3(s3ObjectUrl, noteId) {
  if (!s3ObjectUrl) throw new Error("s3ObjectUrl is required");
  if (!noteId) throw new Error("noteId is required");

  const match = s3ObjectUrl.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error("Invalid S3 URL format. Expected s3://bucket/key");
  }

  const [, bucket, key] = match;

  console.log("Downloading image from S3:", s3ObjectUrl);

  const s3 = new S3Client({});
  const s3Response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  const imageBuffer = await streamToBuffer(s3Response.Body);
  const imageBase64 = imageBuffer.toString("base64");

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
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Claude returned invalid JSON:", raw);
    throw new Error("Claude JSON parsing failed");
  }

  console.log("Generating embeddings...");
  const embeddingText = interpretationToText(parsed);
  const embedding = await getEmbedding(embeddingText, { isQuery: false });

  console.log("Writing interpretation + embedding to MongoDB");

  const result = await Note.findOneAndUpdate(
    { noteId }, // ✅ custom field
    {
      $set: {
        interpretation: parsed,
        interpretationCompleted: true,
        embedding,
      },
    },
    { new: true }
  );

  if (!result) {
    throw new Error(`Note not found for noteId ${noteId}`);
  }

  console.log("Interpretation completed", { noteId, s3ObjectUrl });

  return {
    noteId,
    s3_object: s3ObjectUrl,
    interpretation: parsed,
  };
}
