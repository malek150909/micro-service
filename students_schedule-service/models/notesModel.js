import  pool  from '../config/db.js'; // Adjust the path to your main server file

async function getNotesByMatricule(matricule) {
  const [rows] = await pool.query("SELECT * FROM notes WHERE matricule = ?", [matricule]);
  return rows;
}

async function createNote(matricule, title, content) {
  const [result] = await pool.query(
    "INSERT INTO notes (matricule, title, content) VALUES (?, ?, ?)",
    [matricule, title, content]
  );
  return { ID_note: result.insertId, matricule, title, content };
}

async function updateNote(id, matricule, title, content) {
  try {
    // Validate the ID (ensure it's a number, since ID_note is likely an integer)
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      throw new Error(`L'ID de la note doit être un nombre valide, reçu: ${id}`);
    }

    // Execute the UPDATE query with matricule in the WHERE clause
    const [result] = await pool.query(
      "UPDATE notes SET title = ?, content = ? WHERE ID_note = ? AND matricule = ?",
      [title, content, noteId, matricule]
    );

    // Return true if the update affected at least one row
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Erreur lors de la mise à jour de la note dans la base de données: ${error.message}`);
  }
}

async function deleteNote(id) {
  try {
    // Validate the ID (ensure it's a number, since ID_note is likely an integer)
    const noteId = parseInt(id, 10);
    if (isNaN(noteId)) {
      throw new Error(`L'ID de la note doit être un nombre valide, reçu: ${id}`);
    }

    const [result] = await pool.query("DELETE FROM notes WHERE ID_note = ?", [noteId]);
    return result.affectedRows > 0;
  } catch (error) {
    throw new Error(`Erreur lors de la suppression de la note dans la base de données: ${error.message}`);
  }
}

export { getNotesByMatricule, createNote, updateNote, deleteNote };