// src/encoder.js
import { pipeline } from "@xenova/transformers";

const MODEL_ID = "Xenova/bge-large-en-v1.5";

/**
 * Reuse the embedding pipeline (critical for ECS workers)
 */
let embedderPromise;

async function getEmbedder() {
  if (!embedderPromise) {
    console.log("Loading embedding model:", MODEL_ID);
    embedderPromise = pipeline("feature-extraction", MODEL_ID);
  }
  return embedderPromise;
}

/**
 * Generate embeddings for a text document
 * @param {string} text
 * @param {Object} options
 * @param {boolean} options.isQuery
 * @returns {number[]}
 */
export async function getEmbedding(text, { isQuery = false } = {}) {
  if (!text || typeof text !== "string") {
    throw new Error("getEmbedding expects a non-empty string");
  }

  const embedder = await getEmbedder();
  const input = isQuery ? `query: ${text}` : `passage: ${text}`;

  const output = await embedder(input, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
}
