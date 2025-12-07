import Note from "../models/notes.js";
import { publishToSQS } from "../services/sqsService.js";

import { ragSearchNotes } from "../services/ragService.js";


const createNote = async (req, res) => {
    try {
        const { userId, imageUrl, embedding, title, summary, metadata } = req.body;

        if (!userId || !imageUrl) {
            return res.status(400).json({ error: "userId and imageUrl are required" });
        }

        const note = await Note.create({
            userId,
            imageUrl,
            embedding,
            title,
            summary,
            metadata
        });

        await publishToSQS({ noteId: note._id.toString(), imageUrl: note.imageUrl });


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
        return res.status(500).json({ error: "Failed to update interpretation status" });
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

const searchNotesRag = async (req, res) => {
  try {
    const { userId } = req.params;
    const { query, cosineK, finalK } = req.body;

    if (!query) return res.status(400).json({ error: "query is required" });

    console.log("userId:", userId);
    console.log("body:", req.body);

    // TEMP response for Postman testing
    return res.status(200).json({
      ok: true,
      userId,
      received: { query, cosineK, finalK }
    });
  } catch (err) {
    console.error("RAG search error:", err);
    return res.status(500).json({ error: "Failed to search notes" });
  }
};


export {
    createNote,
    getNotesByUser,
    getNoteById,
    updateNote,
    deleteNote,
    markInterpretationCompleted,
    searchNotesRag
}
