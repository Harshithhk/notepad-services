// src/image-interpreter.js
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Anthropic from "@anthropic-ai/sdk";

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export async function interpretImageFromS3(s3ObjectUrl) {
  const match = s3ObjectUrl.match(/^s3:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error("Invalid S3 URL format. Expected: s3://bucket/key");
  }

  const [, bucket, key] = match;

  const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1"
  });

  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  const buffer = await streamToBuffer(response.Body);
  const imageBase64 = buffer.toString("base64");

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
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
              media_type: "image/jpeg",
              data: imageBase64
            }
          },
          {
            type: "text",
            text: "Extract all useful structured information from this image. Follow the schema."
          },
          {
            type: "text",
            text: JSON_PROMPT
          }
        ]
      }
    ]
  });

  const raw = claudeResponse.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("")
    .trim();

  const parsed = JSON.parse(raw);

  return {
    s3_object: s3ObjectUrl,
    interpretation: parsed
  };
}
