import express from "express";
import {
  getNotes,
  addNote,
  editNote,
  removeNote,
} from "../controllers/notesController.js";

const router = express.Router();

// Routes
router.get("/notes/:matricule", getNotes); // Get all notes for a student
router.post("/notes", addNote); // Create a new note
router.put("/notes/:id", editNote); // Update a note
router.delete("/notes/:id", removeNote); // Delete a note

export default router;