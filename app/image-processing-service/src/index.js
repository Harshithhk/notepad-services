// src/index.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import dbConnect from "./config/db.js";
import { interpretImageFromS3 } from "./image-interpreter.js";

/**
 * JOB_PAYLOAD is injected by Lambda when running the ECS task.
 * Example:
 * {
 *   "noteId": "6934d6407b2d758386cf7483",
 *   "s3ObjectUrl": "s3://bucket/key.jpg"
 * }
 */
async function main() {
  try {
    console.log("🔹 Image-processing ECS task started");

    if (!process.env.JOB_PAYLOAD) {
      throw new Error("JOB_PAYLOAD env var is missing");
    }

    const payload = JSON.parse(process.env.JOB_PAYLOAD);
    const { noteId, s3ObjectUrl } = payload;

    if (!noteId || !s3ObjectUrl) {
      throw new Error("JOB_PAYLOAD must contain noteId and s3ObjectUrl");
    }

    // Connect to Mongo ONCE per container
    await dbConnect();

    // Run interpreter
    await interpretImageFromS3(s3ObjectUrl, noteId);

    console.log("Image-processing ECS task completed");
    process.exit(0);
  } catch (err) {
    console.error(" Image-processing task failed:", err);
    process.exit(1);
  }
}

main();
