import db from '../config/db.js';

class StudentPlanningModel {
  // Login: Fetch student details by matricule
  static async login(matricule) {
    try {
      const [rows] = await db.query(
        `SELECT e.Matricule, e.niveau, es.ID_section as sectionId
         FROM Etudiant e
         LEFT JOIN Etudiant_Section es ON e.Matricule = es.Matricule
         WHERE e.Matricule = ?`,
        [matricule]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      throw new Error('Database error during login: ' + err.message);
    }
  }

  // Fetch Exams: Get exams and module info for a section and semester
  static async getExams(sectionId, semester) {
    try {
      // Fetch modules for the section and semester
      const [moduleRows] = await db.query(
        `SELECT m.ID_module, m.nom_module
         FROM Module m
         JOIN Module_Section ms ON m.ID_module = ms.ID_module
         WHERE ms.ID_section = ? AND ms.semestre = ?`,
        [sectionId, semester]
      );

      if (moduleRows.length === 0) {
        return { exams: [], modules: [], allExamsAvailable: true };
      }

      const moduleIds = moduleRows.map((m) => m.ID_module);

      // Fetch exams for these modules
      const [examRows] = await db.query(
        `SELECT e.ID_exam, e.ID_module, e.exam_date, e.time_slot, e.mode, 
                m.nom_module, s.nom_salle
         FROM Exam e
         JOIN Module m ON e.ID_module = m.ID_module
         LEFT JOIN Exam_Salle es ON e.ID_exam = es.ID_exam
         LEFT JOIN Salle s ON es.ID_salle = s.ID_salle
         WHERE e.ID_section = ? AND e.ID_semestre = ?
         ORDER BY e.exam_date, e.time_slot`,
        [sectionId, semester]
      );

      // Check if all modules have at least one exam
      const examModuleIds = [...new Set(examRows.map((e) => e.ID_module))];
      const allExamsAvailable = moduleIds.every((id) => examModuleIds.includes(id));

      return {
        exams: examRows,
        modules: moduleRows,
        allExamsAvailable,
      };
    } catch (err) {
      throw new Error('Database error fetching exams: ' + err.message);
    }
  }
}

export default StudentPlanningModel;