// src/image-interpreter.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";
import notes from "./models/notes.js";

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * s3ObjectUrl: string like "s3://bucket/key"
 */
export async function interpretImageFromS3(s3ObjectUrl, noteId) {
  if (!s3ObjectUrl) {
    throw new Error("s3ObjectUrl is required");
  }

  const match = s3ObjectUrl.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error("Invalid S3 URL format. Expected s3://bucket/key");
  }

  const [, bucket, key] = match;

  const s3 = new S3Client({}); // region comes from AWS env/metadata in ECS

  const s3Response = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const imageBuffer = await streamToBuffer(s3Response.Body);
  const imageBase64 = imageBuffer.toString("base64");
  console.log("ANTHROPIC KEY ===> ", process.env.ANTHROPIC_API_KEY);
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  if (!client.apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

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

  const claudeResponse = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 4096,
    temperature: 1,
    system: "Return only JSON. No explanations.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg", // change if you want to detect from S3 ContentType
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Extract structured information from this whiteboard image following the given schema.",
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

  const parsed = JSON.parse(raw);

  notes.findByIdAndUpdate(noteId, { interpretation: parsed });

  console.log({ s3_object: s3ObjectUrl, interpretation: parsed });

  return {
    s3_object: s3ObjectUrl,
    interpretation: parsed,
  };
}
