import pool from '../config/db.js';

class Seance {
  static async getTeacherTimetable(matricule) {
    const [rows] = await pool.query(`
      SELECT s.ID_seance, s.ID_salle, s.type_seance, s.ID_groupe, s.ID_module, 
             s.jour, s.time_slot, s.ID_section, m.nom_module, sal.nom_salle, g.num_groupe,
             sp.nom_specialite, sec.nom_section, sec.niveau
      FROM Seance s
      LEFT JOIN Module m ON s.ID_module = m.ID_module
      LEFT JOIN Salle sal ON s.ID_salle = sal.ID_salle
      LEFT JOIN Groupe g ON s.ID_groupe = g.ID_groupe
      LEFT JOIN Specialite sp ON m.ID_specialite = sp.ID_specialite
      LEFT JOIN Section sec ON s.ID_section = sec.ID_section
      WHERE s.Matricule = ?
      ORDER BY s.jour, s.time_slot
    `, [matricule]);
    return rows;
  }

  static async addSeance(seanceData) {
    const { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section } = seanceData;
    const [result] = await pool.query(`
      INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section]);
    return result.insertId;
  }

  static async updateSeance(id, seanceData) {
    const { ID_salle, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section } = seanceData;
    const [result] = await pool.query(`
      UPDATE Seance 
      SET ID_salle = ?, type_seance = ?, ID_groupe = ?, ID_module = ?, jour = ?, time_slot = ?, ID_section = ?
      WHERE ID_seance = ?
    `, [ID_salle, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section, id]);
    return result.affectedRows;
  }

  static async deleteSeance(id) {
    const [result] = await pool.query(`
      DELETE FROM Seance WHERE ID_seance = ?
    `, [id]);
    return result.affectedRows;
  }
}

export default Seance;