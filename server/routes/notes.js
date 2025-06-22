import express from "express";
import { verifyToken } from "../middleware/auth.js";
import supabase from "../db.js";

export const notesRouter = express.Router();
notesRouter.use(verifyToken);

// GET Request - Get all notes for the user, who is authenticated
notesRouter.get("/", async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data: notes, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user_id);

    if (error) throw error;

    res.status(200).json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error.message);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

// POST Request - Create a new note
notesRouter.post("/", async (req, res) => {
  const user_id = req.user.id;
  const { title, content } = req.body;

  if (!title || !content) {
    return res
      .statusMessage(400)
      .json({ message: "Title and content are required." });
  }

  try {
    const { data: newNote, error } = await supabase
      .from("notes")
      .insert([{ user_id, title, content }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(newNote);
  } catch (error) {
    console.error("Error creating note:", error.message);
    res.status(500).json({ message: "Failed to create note" });
  }
});

// PUT Request - Update a note
notesRouter.put("/:id", async (req, res) => {
  const user_id = req.user.id;
  const note_id = req.params.id;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  try {
    const { data: updatedNote, error } = await supabase
      .from("notes")
      .update({ title, content })
      .eq("note_id", note_id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json(updatedNote);
  } catch (err) {
    console.error("Error updating note:", err.message);
    res.status(500).json({ message: "Failed to update note" });
  }
});

notesRouter.delete("/:id", async (req, res) => {
  const user_id = req.user.id;
  const note_id = req.params.id;

  try {
    const { data: deletedNote, error } = await supabase
      .from("notes")
      .delete()
      .eq("note_id", note_id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ message: "Note deleted", note: deletedNote });
  } catch (err) {
    console.error("Error deleting note:", err.message);
    res.status(500).json({ message: "Failed to delete note" });
  }
});
