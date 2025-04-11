import {
    getNotesByMatricule,
    createNote,
    updateNote,
    deleteNote,
  } from "../models/notesModel.js";
  
  export const getNotes = async (req, res) => {
    const { matricule } = req.params;
    try {
      const notes = await getNotesByMatricule(matricule);
      res.status(200).json(notes);
    } catch (error) {
      console.error("Erreur dans getNotes:", error);
      res.status(500).json({ error: "Erreur lors du chargement des notes.", details: error.message });
    }
};
  
  export const addNote = async (req, res) => {
    const { matricule, title, content } = req.body;
    if (!matricule || !title || !content) {
      return res
        .status(400)
        .json({ error: "Matricule, titre et contenu sont requis." });
    }
    try {
      const newNote = await createNote(matricule, title, content);
      res.status(201).json({ message: "Note ajoutée avec succès", note: newNote });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l’ajout de la note." });
    }
  };
  
  export const editNote = async (req, res) => {
    const { id } = req.params;
    const { matricule, title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Titre et contenu sont requis." });
    }
    if (!matricule) {
      return res.status(400).json({ error: "Matricule est requis." });
    }
    // Validate the ID
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      return res.status(400).json({ error: "L'ID de la note doit être un nombre valide." });
    }
    try {
      const success = await updateNote(noteId, matricule, title, content);
      if (success) {
        res.status(200).json({ message: "Note mise à jour avec succès" });
      } else {
        res.status(404).json({ error: "Note non trouvée ou vous n'êtes pas autorisé à la modifier." });
      }
    } catch (error) {
      console.error("Erreur dans editNote:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la note.", details: error.message });
    }
};
  
  export const removeNote = async (req, res) => {
    const { id } = req.params;
    try {
      const success = await deleteNote(id);
      if (success) {
        res.status(200).json({ message: "Note supprimée avec succès" });
      } else {
        res.status(404).json({ error: "Note non trouvée." });
      }
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la suppression de la note." });
    }
  };