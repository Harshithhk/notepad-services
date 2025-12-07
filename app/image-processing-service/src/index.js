// src/index.js
import { interpretImageFromS3 } from "./image-interpreter.js";

async function main() {
  try {
    const raw = process.env.JOB_PAYLOAD;
    if (!raw) {
      throw new Error("Missing JOB_PAYLOAD environment variable.");
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new Error("JOB_PAYLOAD is not valid JSON.");
    }

    const { imageUrl, noteId } = payload;

    if (!imageUrl) {
      throw new Error("Payload missing required field: imageUrl");
    }

    const result = await interpretImageFromS3(imageUrl);

    const output = {
      noteId: noteId || null,
      ...result
    };

    console.log(JSON.stringify(output, null, 2));
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
