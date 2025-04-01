import pool from '../config/db.js'; // Importe le pool depuis db.js

const Exam = {
  getExams: async (filters) => {
    const { faculte, departement, niveau, specialite, section, ID_semestre } = filters;
    let sql = `
      SELECT DISTINCT e.*, 
                     m.nom_module, m.seances, 
                     GROUP_CONCAT(s.nom_salle SEPARATOR ' + ') AS nom_salle,
                     se.date_debut, se.date_fin,
                     f.nom_faculte
      FROM Exam e
      JOIN Module m ON e.ID_module = m.ID_module
      JOIN Section sec ON e.ID_section = sec.ID_section
      JOIN Specialite sp ON sec.ID_specialite = sp.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
      JOIN Faculte f ON d.ID_faculte = f.ID_faculte
      JOIN Semestre se ON e.ID_semestre = se.ID_semestre
      LEFT JOIN Exam_Salle es ON e.ID_exam = es.ID_exam
      LEFT JOIN Salle s ON es.ID_salle = s.ID_salle
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
    const { ID_module, ID_section, exam_date, time_slot, ID_salles, ID_semestre, mode } = examData;

    // Validate that ID_salles is an array
    if (mode === 'presentiel' && (!ID_salles || !Array.isArray(ID_salles) || ID_salles.length === 0)) {
      return { success: false, message: 'Au moins une salle est requise pour un examen présentiel.' };
    }

    // Fetch the number of students in the section
    const [section] = await pool.query(
      'SELECT num_etudiant FROM Section WHERE ID_section = ?',
      [ID_section]
    );
    if (section.length === 0) {
      return { success: false, message: 'Section introuvable.' };
    }
    const numEtudiant = section[0].num_etudiant;

    // Fetch the combined room capacity if mode is "presentiel"
    let totalRoomCapacity = 0;
    if (mode === 'presentiel') {
      const [salles] = await pool.query(
        'SELECT ID_salle, capacite FROM Salle WHERE ID_salle IN (?)',
        [ID_salles]
      );
      if (salles.length !== ID_salles.length) {
        return { success: false, message: 'Une ou plusieurs salles sont introuvables.' };
      }
      totalRoomCapacity = salles.reduce((sum, salle) => sum + salle.capacite, 0);
    }

    // Validate room capacity against the number of students
    if (mode === 'presentiel' && numEtudiant > totalRoomCapacity) {
      return { success: false, message: `Les salles sélectionnées n'ont pas assez de capacité (capacité totale: ${totalRoomCapacity}, étudiants: ${numEtudiant}).` };
    }

    // Semester date validation
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

    // Room conflict check (only if mode is "presentiel")
    if (mode === 'presentiel') {
      const [roomConflict] = await pool.query(
        `SELECT COUNT(*) AS conflict 
         FROM Exam e
         JOIN Exam_Salle es ON e.ID_exam = es.ID_exam
         WHERE es.ID_salle IN (?) 
           AND e.exam_date = ? 
           AND e.time_slot = ?
           AND e.mode = 'presentiel'`,
        [ID_salles, exam_date, time_slot]
      );
      if (roomConflict[0].conflict > 0) {
        return { success: false, message: 'Une ou plusieurs salles sont déjà réservées à ce moment.' };
      }
    } else if (mode === 'en ligne' && ID_salles && ID_salles.length > 0) {
      return { success: false, message: 'Des salles ne peuvent pas être sélectionnées pour un examen en ligne.' };
    }

    // Module uniqueness check (include ID_semestre in the condition)
    const [moduleConflict] = await pool.query(
      `SELECT COUNT(*) AS conflict 
       FROM Exam 
       WHERE ID_module = ? 
         AND ID_section = ?
         AND ID_semestre = ?`,
      [ID_module, ID_section, ID_semestre]
    );
    if (moduleConflict[0].conflict > 0) {
      return { success: false, message: 'Ce module a déjà un examen pour cette section dans ce semestre.' };
    }

    // No two exams in the same section at the same date and time
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

    // Insert into Exam table
    const [result] = await pool.query(
      `INSERT INTO Exam 
       (ID_module, ID_section, exam_date, time_slot, ID_semestre, mode)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ID_module, ID_section, exam_date, time_slot, ID_semestre, mode]
    );

    const examId = result.insertId;

    // Insert into Exam_Salle table if mode is "presentiel"
    if (mode === 'presentiel') {
      const examSalleValues = ID_salles.map(id_salle => [examId, id_salle]);
      await pool.query(
        `INSERT INTO Exam_Salle (ID_exam, ID_salle) VALUES ?`,
        [examSalleValues]
      );
    }

    return { success: true, insertId: examId };
  },

  updateExam: async (id, examData) => {
    const { ID_module, ID_section, exam_date, time_slot, ID_salles, ID_semestre, mode } = examData;

    // Validate that ID_salles is an array for "presentiel" mode
    if (mode === 'presentiel' && (!ID_salles || !Array.isArray(ID_salles) || ID_salles.length === 0)) {
      return { success: false, message: 'Au moins une salle est requise pour un examen présentiel.' };
    }

    const normalizedExamDate = exam_date;

    // Fetch the number of students in the section
    const [section] = await pool.query(
      'SELECT num_etudiant FROM Section WHERE ID_section = ?',
      [ID_section]
    );
    if (section.length === 0) {
      return { success: false, message: 'Section introuvable.' };
    }
    const numEtudiant = section[0].num_etudiant;

    // Fetch the combined room capacity if mode is "presentiel"
    let totalRoomCapacity = 0;
    if (mode === 'presentiel') {
      const [salles] = await pool.query(
        'SELECT ID_salle, capacite FROM Salle WHERE ID_salle IN (?)',
        [ID_salles]
      );
      if (salles.length !== ID_salles.length) {
        return { success: false, message: 'Une ou plusieurs salles sont introuvables.' };
      }
      totalRoomCapacity = salles.reduce((sum, salle) => sum + salle.capacite, 0);
    }

    // Validate room capacity against the number of students
    if (mode === 'presentiel' && numEtudiant > totalRoomCapacity) {
      return { success: false, message: `Les salles sélectionnées n'ont pas assez de capacité (capacité totale: ${totalRoomCapacity}, étudiants: ${numEtudiant}).` };
    }

    // Semester date validation
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

    // Room conflict check (only if mode is "presentiel")
    if (mode === 'presentiel') {
      const [roomConflict] = await pool.query(
        `SELECT COUNT(*) AS conflict 
         FROM Exam e
         JOIN Exam_Salle es ON e.ID_exam = es.ID_exam
         WHERE es.ID_salle IN (?) 
           AND e.exam_date = ? 
           AND e.time_slot = ?
           AND e.mode = 'presentiel'
           AND e.ID_exam != ?`,
        [ID_salles, normalizedExamDate, time_slot, id]
      );
      if (roomConflict[0].conflict > 0) {
        return { success: false, message: 'Une ou plusieurs salles sont déjà réservées à ce moment.' };
      }
    } else if (mode === 'en ligne' && ID_salles && ID_salles.length > 0) {
      return { success: false, message: 'Des salles ne peuvent pas être sélectionnées pour un examen en ligne.' };
    }

    // Module uniqueness check (include ID_semestre in the condition)
    const [moduleConflict] = await pool.query(
      `SELECT COUNT(*) AS conflict 
       FROM Exam 
       WHERE ID_module = ? 
         AND ID_section = ?
         AND ID_semestre = ?
         AND ID_exam != ?`,
      [ID_module, ID_section, ID_semestre, id]
    );
    if (moduleConflict[0].conflict > 0) {
      return { success: false, message: 'Ce module a déjà un examen pour cette section dans ce semestre.' };
    }

    // No two exams in the same section at the same date and time
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

    // Update the Exam table
    await pool.query(
      `UPDATE Exam SET
        ID_module = ?,
        ID_section = ?,
        exam_date = ?,
        time_slot = ?,
        ID_semestre = ?,
        mode = ?
       WHERE ID_exam = ?`,
      [ID_module, ID_section, normalizedExamDate, time_slot, ID_semestre, mode, id]
    );

    // Delete existing room assignments
    await pool.query(
      `DELETE FROM Exam_Salle WHERE ID_exam = ?`,
      [id]
    );

    // Insert new room assignments if mode is "presentiel"
    if (mode === 'presentiel') {
      const examSalleValues = ID_salles.map(id_salle => [id, id_salle]);
      await pool.query(
        `INSERT INTO Exam_Salle (ID_exam, ID_salle) VALUES ?`,
        [examSalleValues]
      );
    }

    return { success: true };
  },

  deleteExam: async (id) => {
    // Note: The ON DELETE CASCADE in Exam_Salle will automatically remove related entries
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
      SELECT s.ID_salle, s.nom_salle, s.capacite,
      (SELECT COUNT(*) 
       FROM Exam e 
       JOIN Exam_Salle es ON e.ID_exam = es.ID_exam
       WHERE es.ID_salle = s.ID_salle 
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