import { Router } from "express";
import { imageUpload } from "../controllers/uploadController.js"
import {
    createNote,
    getNotesByUser,
    getNoteById,
    updateNote,
    deleteNote,
    markInterpretationCompleted,
    searchNotesRag
} from "../controllers/notesController.js";

const router = Router();

router.get("/", (req, res) => {
    res.send("backend server running at port 4001")
});

router.put("/presigned-url", imageUpload);

router.post("/notes/", createNote);
router.get("/notes/user/:userId", getNotesByUser);
router.get("/notes/:id", getNoteById);
router.put("/notes/:id", updateNote);
router.patch("/notes/:id/complete", markInterpretationCompleted);
router.delete("/notes/:id", deleteNote);

router.post("/notes/:userId/rag-search", searchNotesRag);

export default router;
