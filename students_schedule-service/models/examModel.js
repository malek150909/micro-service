import pool from '../config/db.js';

const Exam = {
  getExams: async (filters) => {
    const { faculte, departement, niveau, specialite, section, ID_semestre } = filters;
    let sql = `
      SELECT DISTINCT e.*, 
                     m.nom_module, m.seances, 
                     s.ID_salle, s.capacite, 
                     se.date_debut, se.date_fin,
                     f.nom_faculte
      FROM Exam e
      JOIN Module m ON e.ID_module = m.ID_module
      JOIN Section sec ON e.ID_section = sec.ID_section
      JOIN Specialite sp ON sec.ID_specialite = sp.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
      JOIN Faculte f ON d.ID_faculte = f.ID_faculte
      JOIN Semestre se ON e.ID_semestre = se.ID_semestre
      LEFT JOIN Salle s ON e.ID_salle = s.ID_salle
      WHERE 1=1
    `;
    const params = [];
  
    if (section) {
      sql += ' AND e.ID_section = ?';
      params.push(section);
    }
    if (faculte) {
      sql += ' AND f.ID_faculte = ?';
      params.push(faculte);
    }
    if (departement) {
      sql += ' AND d.ID_departement = ?';
      params.push(departement);
    }
    if (niveau) {
      sql += ' AND sec.niveau = ?';
      params.push(niveau);
    }
    if (specialite) {
      sql += ' AND sp.ID_specialite = ?';
      params.push(specialite);
    }
    if (ID_semestre) {
      sql += ' AND e.ID_semestre = ?';
      params.push(ID_semestre);
    }
  
    const [results] = await pool.query(
      sql + ' GROUP BY e.ID_exam ORDER BY e.exam_date ASC, e.time_slot ASC',
      params
    );
  
    return results.map(exam => ({
      ...exam,
      exam_date: new Date(exam.exam_date).toISOString().split('T')[0],
      date_debut: new Date(exam.date_debut).toISOString().split('T')[0],
      date_fin: new Date(exam.date_fin).toISOString().split('T')[0],
    }));
  },

  addExam: async (examData) => {
    const { ID_module, ID_section, exam_date, time_slot, ID_salle, ID_semestre, mode } = examData;

    const [section] = await pool.query(
      'SELECT num_etudiant FROM Section WHERE ID_section = ?',
      [ID_section]
    );
    if (section.length === 0) {
      return { success: false, message: 'Section introuvable.' };
    }
    const numEtudiant = section[0].num_etudiant;

    let roomCapacity = Infinity;
    if (mode === 'presentiel') {
      if (!ID_salle) {
        return { success: false, message: 'Une salle est requise pour un examen présentiel.' };
      }
      const [salle] = await pool.query(
        'SELECT capacite FROM Salle WHERE ID_salle = ?',
        [ID_salle]
      );
      if (salle.length === 0) {
        return { success: false, message: 'Salle introuvable.' };
      }
      roomCapacity = salle[0].capacite;
    }

    if (mode === 'presentiel' && numEtudiant > roomCapacity) {
      return { success: false, message: `La salle sélectionnée n'a pas assez de capacité (capacité: ${roomCapacity}, étudiants: ${numEtudiant}).` };
    }

    const [semester] = await pool.query(
      'SELECT date_debut, date_fin FROM Semestre WHERE ID_semestre = ?',
      [ID_semestre]
    );
    if (semester.length === 0) {
      return { success: false, message: 'Semestre introuvable.' };
    }

    const examDate = new Date(exam_date);
    const startDate = new Date(semester[0].date_debut);
    const endDate = new Date(semester[0].date_fin);
    if (examDate < startDate || examDate > endDate) {
      return { success: false, message: 'La date de l’examen est en dehors de la plage du semestre.' };
    }

    if (mode === 'presentiel') {
      const [roomConflict] = await pool.query(
        `SELECT COUNT(*) AS conflict 
         FROM Exam 
         WHERE ID_salle = ? 
           AND exam_date = ? 
           AND time_slot = ?
           AND mode = 'presentiel'`,
        [ID_salle, exam_date, time_slot]
      );
      if (roomConflict[0].conflict > 0) {
        return { success: false, message: 'La salle est déjà réservée à ce moment.' };
      }
    } else if (mode === 'en ligne' && ID_salle) {
      return { success: false, message: 'Une salle ne peut pas être sélectionnée pour un examen en ligne.' };
    }

    const [moduleConflict] = await pool.query(
      `SELECT COUNT(*) AS conflict 
       FROM Exam 
       WHERE ID_module = ? 
         AND ID_section = ?`,
      [ID_module, ID_section]
    );
    if (moduleConflict[0].conflict > 0) {
      return { success: false, message: 'Ce module a déjà un examen pour cette section.' };
    }

    const [sectionConflict] = await pool.query(
      `SELECT COUNT(*) AS conflict 
       FROM Exam 
       WHERE ID_section = ? 
         AND exam_date = ? 
         AND time_slot = ?`,
      [ID_section, exam_date, time_slot]
    );
    if (sectionConflict[0].conflict > 0) {
      return { success: false, message: 'Un autre examen est déjà prévu pour cette section à la même date et heure.' };
    }

    const [result] = await pool.query(
      `INSERT INTO Exam 
       (ID_module, ID_section, exam_date, time_slot, ID_salle, ID_semestre, mode)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ID_module, ID_section, exam_date, time_slot, mode === 'en ligne' ? null : ID_salle, ID_semestre, mode]
    );
    return { success: true, insertId: result.insertId };
  },

  updateExam: async (id, examData) => {
    const { ID_module, ID_section, exam_date, time_slot, ID_salle, ID_semestre, mode } = examData;
  
    const normalizedExamDate = exam_date;

    const [section] = await pool.query(
      'SELECT num_etudiant FROM Section WHERE ID_section = ?',
      [ID_section]
    );
    if (section.length === 0) {
      return { success: false, message: 'Section introuvable.' };
    }
    const numEtudiant = section[0].num_etudiant;

    let roomCapacity = Infinity;
    if (mode === 'presentiel') {
      if (!ID_salle) {
        return { success: false, message: 'Une salle est requise pour un examen présentiel.' };
      }
      const [salle] = await pool.query(
        'SELECT capacite FROM Salle WHERE ID_salle = ?',
        [ID_salle]
      );
      if (salle.length === 0) {
        return { success: false, message: 'Salle introuvable.' };
      }
      roomCapacity = salle[0].capacite;
    }

    if (mode === 'presentiel' && numEtudiant > roomCapacity) {
      return { success: false, message: `La salle sélectionnée n'a pas assez de capacité (capacité: ${roomCapacity}, étudiants: ${numEtudiant}).` };
    }

    const [semester] = await pool.query(
      'SELECT date_debut, date_fin FROM Semestre WHERE ID_semestre = ?',
      [ID_semestre]
    );
    if (semester.length === 0) {
      return { success: false, message: 'Semestre introuvable.' };
    }
  
    const examDateStr = normalizedExamDate;
    const startDateStr = semester[0].date_debut.toISOString().split('T')[0];
    const endDateStr = semester[0].date_fin.toISOString().split('T')[0];
    if (examDateStr < startDateStr || examDateStr > endDateStr) {
      return { success: false, message: 'La date de l’examen est en dehors de la plage du semestre.' };
    }
  
    if (mode === 'presentiel') {
      const [roomConflict] = await pool.query(
        `SELECT COUNT(*) AS conflict 
         FROM Exam 
         WHERE ID_salle = ? 
           AND exam_date = ? 
           AND time_slot = ?
           AND mode = 'presentiel'
           AND ID_exam != ?`,
        [ID_salle, normalizedExamDate, time_slot, id]
      );
      if (roomConflict[0].conflict > 0) {
        return { success: false, message: 'La salle est déjà réservée à ce moment.' };
      }
    } else if (mode === 'en ligne' && ID_salle) {
      return { success: false, message: 'Une salle ne peut pas être sélectionnée pour un examen en ligne.' };
    }
  
    const [moduleConflict] = await pool.query(
      `SELECT COUNT(*) AS conflict 
       FROM Exam 
       WHERE ID_module = ? 
         AND ID_section = ?
         AND ID_exam != ?`,
      [ID_module, ID_section, id]
    );
    if (moduleConflict[0].conflict > 0) {
      return { success: false, message: 'Ce module a déjà un examen pour cette section.' };
    }
  
    const [sectionConflict] = await pool.query(
      `SELECT COUNT(*) AS conflict 
       FROM Exam 
       WHERE ID_section = ? 
         AND exam_date = ? 
         AND time_slot = ?
         AND ID_exam != ?`,
      [ID_section, normalizedExamDate, time_slot, id]
    );
    if (sectionConflict[0].conflict > 0) {
      return { success: false, message: 'Un autre examen est déjà prévu pour cette section à la même date et heure.' };
    }
  
    await pool.query(
      `UPDATE Exam SET
        ID_module = ?,
        ID_section = ?,
        exam_date = ?,
        time_slot = ?,
        ID_salle = ?,
        ID_semestre = ?,
        mode = ?
       WHERE ID_exam = ?`,
      [ID_module, ID_section, normalizedExamDate, time_slot, mode === 'en ligne' ? null : ID_salle, ID_semestre, mode, id]
    );
    return { success: true };
  },

  deleteExam: async (id) => {
    const sql = 'DELETE FROM Exam WHERE ID_exam = ?';
    const [result] = await pool.query(sql, [id]);
    if (result.affectedRows === 0) {
      return { success: false, message: `Aucun examen trouvé avec l'ID ${id}.` };
    }
    return { success: true };
  },

  getModulesBySection: async (sectionId, semesterId) => {
    let sql = `
      SELECT m.ID_module, m.nom_module, m.seances
      FROM Module m
      JOIN Module_Section ms ON m.ID_module = ms.ID_module
      WHERE ms.ID_section = ?
    `;
    const params = [sectionId];

    if (semesterId) {
      sql += ' AND ms.semestre = ?';
      params.push(semesterId);
    }

    const [results] = await pool.query(sql, params);
    return results;
  },

  getSalles: async (exam_date, time_slot) => {
    let sql = `
      SELECT s.ID_salle, s.capacite,
      (SELECT COUNT(*) 
       FROM Exam e 
       WHERE e.ID_salle = s.ID_salle 
         AND e.exam_date = ? 
         AND e.time_slot = ?
         AND e.mode = 'presentiel') AS is_booked
      FROM Salle s
      WHERE s.disponible = TRUE
    `;
    const params = [exam_date, time_slot];
    const [results] = await pool.query(sql, params);
    return results.map(salle => ({
      ...salle,
      available: salle.is_booked === 0
    }));
  },

  getSemestres: async (niveau) => {
    let semesters;
    if (niveau === 'L1') {
      semesters = ['1', '2'];
    } else if (niveau === 'L2') {
      semesters = ['3', '4'];
    } else if (niveau === 'L3') {
      semesters = ['5', '6'];
    } else {
      semesters = ['1', '2'];
    }

    const [results] = await pool.query(
      `SELECT ID_semestre, date_debut, date_fin 
       FROM Semestre 
       WHERE ID_semestre IN (${semesters.map(() => '?').join(',')})`,
      semesters
    );
    return results.map(semestre => ({
      ...semestre,
      date_debut: new Date(semestre.date_debut).toISOString().split('T')[0],
      date_fin: new Date(semestre.date_fin).toISOString().split('T')[0],
    }));
  }
};

export default Exam;