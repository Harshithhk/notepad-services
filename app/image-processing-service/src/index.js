// src/index.js
import dbConnect from "./config/db.js";
import { interpretImageFromS3 } from "./image-interpreter.js";

async function main() {
  try {
    const rawPayload = process.env.JOB_PAYLOAD;
    if (!rawPayload) {
      throw new Error("Missing JOB_PAYLOAD environment variable");
    }

    let payload;
    try {
      payload = JSON.parse(rawPayload);
    } catch (err) {
      throw new Error("JOB_PAYLOAD is not valid JSON");
    }

    const { imageUrl, noteId } = payload;

    if (!imageUrl) {
      throw new Error("Payload missing required field: imageUrl");
    }
    await dbConnect();

    const result = await interpretImageFromS3(imageUrl, noteId);

    const output = {
      noteId: noteId || null,
      ...result,
    };

    // Single clean JSON object to CloudWatch
    console.log(JSON.stringify(output, null, 2));

    process.exit(0);
  } catch (err) {
    console.error("Worker failed:", err.message || err);
    process.exit(1);
  }
}

main();
