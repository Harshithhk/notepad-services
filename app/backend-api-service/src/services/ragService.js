import Note from "../models/notes.js";
import { getEmbedding } from "../utils/embedder.js"; // <-- change path to where your getEmbedding lives

// -------------------- Jaccard helpers --------------------
const Normalize = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const Tokens = (s) => Normalize(s).split(" ").filter((t) => t.length > 1);

const Jaccard = (aTokens, bTokens) => {
  const A = new Set(aTokens);
  const B = new Set(bTokens);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
};

// Decide what text Jaccard should compare against.
// (For your notes, title + summary + metadata usually makes sense.)
function noteToText(note) {
  const meta = note?.metadata ? JSON.stringify(note.metadata) : "";
  return `${note?.title ?? ""}\n${note?.summary ?? ""}\n${meta}`;
}

/**
 * Cosine-first using Atlas $vectorSearch, then Jaccard rerank in Node.
 * - cosineK: how many candidates to fetch from Atlas
 * - finalK: how many results to return after rerank
 */
export async function ragSearchNotes({
  userId,
  query,
  cosineK = 30,
  finalK = 10,
  indexName = process.env.ATLAS_VECTOR_INDEX || "notes_vector_index",
  embeddingPath = "embedding",
}) {
  if (!userId) throw new Error("ragSearchNotes: userId required");
  if (!query || typeof query !== "string") throw new Error("ragSearchNotes: query must be a string");

  // 1) Embed query (make sure same model as stored embeddings)
  const queryVector = await getEmbedding(query, { isQuery: true });

  // 2) Cosine retrieval in Atlas ($vectorSearch must be first stage) :contentReference[oaicite:3]{index=3}
  // Use filter to restrict by userId (requires userId indexed as type:"filter") :contentReference[oaicite:4]{index=4}
  const pipeline = [
    {
      $vectorSearch: {
        index: indexName,
        path: embeddingPath,
        queryVector,             // array-of-numbers is allowed :contentReference[oaicite:5]{index=5}
        numCandidates: Math.min(10000, cosineK * 30), // MongoDB recommends overrequesting for recall :contentReference[oaicite:6]{index=6}
        limit: cosineK,
        filter: { userId },      // pre-filter
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        imageUrl: 1,
        title: 1,
        summary: 1,
        metadata: 1,
        createdAt: 1,
        cosineScore: { $meta: "vectorSearchScore" }, // score from Atlas :contentReference[oaicite:7]{index=7}
      },
    },
  ];

  const candidates = await Note.aggregate(pipeline);

  // 3) Jaccard rerank among cosine candidates
  const qTok = Tokens(query);
  const reranked = candidates
    .map((n) => {
      const jac = Jaccard(qTok, Tokens(noteToText(n)));
      return { ...n, jaccardScore: jac };
    })
    // You asked: cosine first, then Jaccard to pick most appropriate.
    // This does exactly that: cosine gets the candidate set, Jaccard selects within it.
    .sort((a, b) => (b.jaccardScore - a.jaccardScore) || (b.cosineScore - a.cosineScore))
    .slice(0, finalK);

  return reranked;
}
