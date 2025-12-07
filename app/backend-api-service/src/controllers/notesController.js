import Note from "../models/notes.js";
import { publishToSQS } from "../services/sqsService.js";

function s3UrlToS3Uri(imageUrl) {
  const url = new URL(imageUrl);
  const hostname = url.hostname;
  const pathname = url.pathname.replace(/^\/+/, "");

  // Case 1: bucket.s3.amazonaws.com OR bucket.s3.<region>.amazonaws.com
  let match = hostname.match(/^(.+)\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/);
  if (match) {
    const bucket = match[1];
    return `s3://${bucket}/${pathname}`;
  }

  // Case 2: s3.amazonaws.com/bucket/key OR s3.<region>.amazonaws.com/bucket/key
  match = hostname.match(/^s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/);
  if (match) {
    const parts = pathname.split("/");
    const bucket = parts.shift();
    const key = parts.join("/");
    return `s3://${bucket}/${key}`;
  }

  throw new Error(`Unsupported S3 imageUrl format: ${imageUrl}`);
}

const createNote = async (req, res) => {
  try {
    const { userId, imageUrl, embedding, title, summary, metadata } = req.body;

    if (!userId || !imageUrl) {
      return res
        .status(400)
        .json({ error: "userId and imageUrl are required" });
    }

    const note = await Note.create({
      userId,
      imageUrl,
      embedding,
      title,
      summary,
      metadata,
    });

    const s3Uri = s3UrlToS3Uri(note.imageUrl);

    await publishToSQS({ noteId: note._id.toString(), s3ObjectUrl: s3Uri });

    return res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return res.status(500).json({ error: "Failed to create note" });
  }
};

const getNotesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const notes = await Note.find({ userId }).sort({ createdAt: -1 });

    return res.status(200).json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return res.status(500).json({ error: "Failed to fetch notes" });
  }
};

const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return res.status(500).json({ error: "Failed to fetch the note" });
  }
};

const updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    return res.status(500).json({ error: "Failed to update note" });
  }
};

const markInterpretationCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findByIdAndUpdate(
      id,
      { interpretationCompleted: true },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.json(note);
  } catch (error) {
    console.error("Error updating interpretation flag:", error);
    return res
      .status(500)
      .json({ error: "Failed to update interpretation status" });
  }
};

const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    return res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).json({ error: "Failed to delete note" });
  }
};

export {
  createNote,
  getNotesByUser,
  getNoteById,
  updateNote,
  deleteNote,
  markInterpretationCompleted,
};
