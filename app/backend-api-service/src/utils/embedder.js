// src/utils/embedder.js
import { pipeline, env } from "@xenova/transformers";

// Optional: cache dir somewhere visible
env.cacheDir = "./.cache";

const MODEL_ID = "Xenova/bge-large-en-v1.5";

// Load once per process; reuse the pipeline
let embedderPromise;

async function getEmbedder() {
  if (!embedderPromise) {
    console.log("[embedder] Loading model:", MODEL_ID);
    embedderPromise = pipeline("feature-extraction", MODEL_ID);
  }
  return embedderPromise;
}

/**
 * Get an embedding for text.
 * - isQuery = true  -> prefix "query: "
 * - isQuery = false -> prefix "passage: "
 *
 * Returns: Array<number> vector (e.g. length 1024)
 */
export async function getEmbedding(text, { isQuery = true } = {}) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("getEmbedding: 'text' must be a non-empty string");
  }

  const embedder = await getEmbedder();
  const input = isQuery ? `query: ${text}` : `passage: ${text}`;

  // mean pooling + normalize for cosine similarity
  const out = await embedder(input, { pooling: "mean", normalize: true });

  return Array.from(out.data);
}

// (Optional helpers, if you want them)
export async function embedQuery(text) {
  return getEmbedding(text, { isQuery: true });
}

export async function embedPassage(text) {
  return getEmbedding(text, { isQuery: false });
}
