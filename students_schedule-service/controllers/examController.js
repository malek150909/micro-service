import pool from '../config/db.js';
import Exam from '../models/examModel.js';
import XLSX from 'xlsx';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

export const getExams = async (req, res) => {
  try {
    const results = await Exam.getExams(req.query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addExam = async (req, res) => {
  try {
    const result = await Exam.addExam(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    res.status(201).json({
      message: 'Examen ajouté avec succès',
      examId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const result = await Exam.updateExam(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    res.json({ message: 'Examen mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const result = await Exam.deleteExam(req.params.id);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    res.json({ message: 'Examen supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getModulesBySection = async (req, res) => {
  const { sectionId } = req.params;
  const { ID_semestre } = req.query;
  try {
    const results = await Exam.getModulesBySection(sectionId, ID_semestre);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSalles = async (req, res) => {
  const { exam_date, time_slot } = req.query;
  try {
    const results = await Exam.getSalles(exam_date, time_slot);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSemestres = async (req, res) => {
  const { niveau } = req.query;
  try {
    const results = await Exam.getSemestres(niveau);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFacultes = async (req, res) => {
  try {
    const [results] = await pool.query('SELECT ID_faculte, nom_faculte FROM Faculte');
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getDepartements = async (req, res) => {
  const { faculte } = req.query;
  let sql = 'SELECT ID_departement, Nom_departement FROM Departement';
  const params = [];
  if (faculte) {
    sql += ' WHERE ID_faculte = ?';
    params.push(faculte);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getNiveaux = async (req, res) => {
  const { departement } = req.query;
  let sql = 'SELECT DISTINCT niveau AS id, niveau AS name FROM Section';
  const params = [];
  if (departement) {
    sql += ' JOIN Specialite sp ON Section.ID_specialite = sp.ID_specialite JOIN Departement d ON sp.ID_departement = d.ID_departement WHERE d.ID_departement = ?';
    params.push(departement);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getSpecialites = async (req, res) => {
  const { departement, niveau } = req.query;
  let sql = 'SELECT ID_specialite, nom_specialite FROM Specialite';
  const params = [];
  if (departement) {
    sql += ' WHERE ID_departement = ?';
    params.push(departement);
  }
  if (niveau) {
    sql += ' AND (SELECT COUNT(*) FROM Section WHERE ID_specialite = Specialite.ID_specialite AND niveau = ?) > 0';
    params.push(niveau);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getSections = async (req, res) => {
  const { specialite, niveau } = req.query;
  let sql = 'SELECT ID_section, nom_section, num_etudiant FROM Section';
  const params = [];
  if (specialite) {
    sql += ' WHERE ID_specialite = ?';
    params.push(specialite);
  }
  if (niveau) {
    sql += ' AND niveau = ?';
    params.push(niveau);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const uploadExcel = [
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier n\'a été téléchargé.' });
      }
      if (!req.body.sectionId || !req.body.semestreId) {
        return res.status(400).json({ message: 'Section et semestre sont requis.' });
      }

      const sectionId = req.body.sectionId;
      const semestreId = req.body.semestreId;

      // Validate section existence
      const [section] = await pool.query(
        'SELECT ID_section FROM Section WHERE ID_section = ?',
        [sectionId]
      );
      if (section.length === 0) {
        return res.status(400).json({ message: 'Section introuvable.' });
      }

      // Validate semester existence
      const [semestre] = await pool.query(
        'SELECT ID_semestre FROM Semestre WHERE ID_semestre = ?',
        [semestreId]
      );
      if (semestre.length === 0) {
        return res.status(400).json({ message: 'Semestre introuvable.' });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

      // Find the header row index
      let headerIndex = -1;
      const expectedHeaders = ['Date', 'Horaire', 'Module', 'Salle(s)'];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i].map(cell => String(cell || '').trim());
        if (row.length >= 4 && row.slice(0, 4).every((cell, idx) => cell.toLowerCase() === expectedHeaders[idx].toLowerCase())) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) {
        return res.status(400).json({ message: 'En-tête du tableau non trouvé dans le fichier Excel.' });
      }

      // Extract data rows (skip rows before and including header)
      const dataRows = jsonData.slice(headerIndex + 1).filter(row => row.some(cell => cell != null && String(cell).trim() !== ''));

      if (dataRows.length === 0) {
        return res.status(400).json({ message: 'Aucune donnée valide trouvée dans le fichier Excel.' });
      }

      const errors = [];
      const validatedExams = [];

      // First pass: Validate all rows without inserting
      for (const row of dataRows) {
        try {
          // Ensure row has enough columns
          if (row.length < 4) {
            errors.push(`Ligne invalide: Données incomplètes (${JSON.stringify(row)}).`);
            continue;
          }

          const [date, horaire, module, salles] = row.map(cell => String(cell || '').trim());

          // Validate required fields
          if (!date || !horaire || !module) {
            errors.push(`Ligne invalide: Date, Horaire, et Module sont requis (${JSON.stringify(row)}).`);
            continue;
          }

          // Parse and normalize date (DD/MM/YYYY to YYYY-MM-DD)
          let examDate;
          try {
            const [day, month, year] = date.split('/');
            if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) {
              throw new Error('Format de date invalide');
            }
            examDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            if (isNaN(new Date(examDate).getTime())) {
              throw new Error('Date invalide');
            }
          } catch (e) {
            errors.push(`Ligne avec module "${module}": Date invalide (${date}).`);
            continue;
          }

          // Validate time slot
          const timeSlot = horaire.trim();
          const validTimeSlots = [
            '08:00 - 09:30',
            '09:40 - 11:10',
            '11:20 - 12:50',
            '13:00 - 14:30',
            '14:40 - 16:10',
            '16:20 - 17:50'
          ];
          if (!validTimeSlots.includes(timeSlot)) {
            errors.push(`Ligne avec module "${module}": Horaire invalide (${timeSlot}).`);
            continue;
          }

          // Determine mode and rooms
          let mode = 'presentiel';
          let salleNames = [];
          if (salles && salles.toLowerCase() === 'en ligne') {
            mode = 'en ligne';
          } else if (salles) {
            salleNames = salles.split(' + ').map(s => s.trim());
          }

          // Fetch module ID
          const [moduleResult] = await pool.query(
            'SELECT ID_module FROM Module WHERE nom_module = ?',
            [module.trim()]
          );
          if (moduleResult.length === 0) {
            errors.push(`Ligne avec module "${module}": Module introuvable.`);
            continue;
          }
          const moduleId = moduleResult[0].ID_module;

          // Validate module belongs to the section
          const [moduleSection] = await pool.query(
            'SELECT ID_section FROM Module_Section WHERE ID_module = ? AND ID_section = ? AND semestre = ?',
            [moduleId, sectionId, semestreId]
          );
          if (moduleSection.length === 0) {
            errors.push(`Ligne avec module "${module}": Module non associé à cette section ou semestre.`);
            continue;
          }

          // Fetch room IDs if presentiel
          let salleIds = [];
          if (mode === 'presentiel' && salleNames.length > 0) {
            const [salleResults] = await pool.query(
              'SELECT ID_salle FROM Salle WHERE nom_salle IN (?)',
              [salleNames]
            );
            salleIds = salleResults.map(s => s.ID_salle);
            if (salleIds.length !== salleNames.length) {
              errors.push(`Ligne avec module "${module}": Une ou plusieurs salles introuvables (${salles}).`);
              continue;
            }

            // Check room availability, excluding exams from the current section and semester
            const [conflictingSalles] = await pool.query(
              `SELECT ID_salle FROM Exam_Salle es
               JOIN Exam e ON es.ID_exam = e.ID_exam
               WHERE e.exam_date = ? 
                 AND e.time_slot = ? 
                 AND es.ID_salle IN (?)
                 AND NOT (e.ID_section = ? AND e.ID_semestre = ?)
                 AND e.mode = 'presentiel'`,
              [examDate, timeSlot, salleIds, sectionId, semestreId]
            );
            if (conflictingSalles.length > 0) {
              errors.push(`Ligne avec module "${module}": Une ou plusieurs salles sont déjà réservées à ce moment par une autre section.`);
              continue;
            }
          }

          // Check for duplicate modules within the Excel data
          const isDuplicateModule = validatedExams.some(exam => exam.ID_module === moduleId);
          if (isDuplicateModule) {
            errors.push(`Ligne avec module "${module}": Ce module est déjà présent dans le fichier Excel.`);
            continue;
          }

          // Check for duplicate time slots within the Excel data
          const isDuplicateTimeSlot = validatedExams.some(exam => 
            exam.exam_date === examDate && exam.time_slot === timeSlot
          );
          if (isDuplicateTimeSlot) {
            errors.push(`Ligne avec module "${module}": Un autre examen est déjà prévu à la même date et heure dans ce fichier.`);
            continue;
          }

          // Validate semester date range
          const [semester] = await pool.query(
            'SELECT date_debut, date_fin FROM Semestre WHERE ID_semestre = ?',
            [semestreId]
          );
          if (semester.length === 0) {
            errors.push(`Semestre introuvable pour ID ${semestreId}.`);
            continue;
          }
          const examDateObj = new Date(examDate);
          const startDate = new Date(semester[0].date_debut);
          const endDate = new Date(semester[0].date_fin);
          if (examDateObj < startDate || examDateObj > endDate) {
            errors.push(`Ligne avec module "${module}": La date de l’examen (${examDate}) est en dehors de la plage du semestre.`);
            continue;
          }

          // Validate room capacity if presentiel
          if (mode === 'presentiel' && salleIds.length > 0) {
            const [section] = await pool.query(
              'SELECT num_etudiant FROM Section WHERE ID_section = ?',
              [sectionId]
            );
            if (section.length === 0) {
              errors.push(`Section introuvable pour ID ${sectionId}.`);
              continue;
            }
            const numEtudiant = section[0].num_etudiant;

            const [salleCapacities] = await pool.query(
              'SELECT capacite FROM Salle WHERE ID_salle IN (?)',
              [salleIds]
            );
            const totalCapacity = salleCapacities.reduce((sum, salle) => sum + salle.capacite, 0);
            if (numEtudiant > totalCapacity) {
              errors.push(`Ligne avec module "${module}": Les salles sélectionnées n'ont pas assez de capacité (capacité totale: ${totalCapacity}, étudiants: ${numEtudiant}).`);
              continue;
            }
          }

          // If all validations pass, store the exam data for insertion later
          validatedExams.push({
            ID_module: moduleId,
            ID_section: sectionId,
            exam_date: examDate,
            time_slot: timeSlot,
            ID_salles: salleIds,
            ID_semestre: semestreId,
            mode: mode,
            moduleName: module, // For error reporting
          });

        } catch (e) {
          errors.push(`Ligne avec module "${module || 'inconnu'}": Erreur lors de la validation (${e.message}).`);
        }
      }

      // If there are any errors, return them without modifying the database
      if (errors.length > 0) {
        return res.status(400).json({
          message: 'Erreur lors de la validation des données. Aucun examen n\'a été importé.',
          errors
        });
      }

      // If all rows are valid, proceed to delete existing exams
      await pool.query(
        'DELETE FROM Exam WHERE ID_section = ? AND ID_semestre = ?',
        [sectionId, semestreId]
      );

      // Second pass: Insert all validated exams
      const insertedExams = [];
      for (const examData of validatedExams) {
        try {
          const result = await Exam.addExam({
            ID_module: examData.ID_module,
            ID_section: examData.ID_section,
            exam_date: examData.exam_date,
            time_slot: examData.time_slot,
            ID_salles: examData.ID_salles,
            ID_semestre: examData.ID_semestre,
            mode: examData.mode,
          });

          if (!result.success) {
            errors.push(`Ligne avec module "${examData.moduleName}": ${result.message}`);
            continue;
          }

          insertedExams.push(result.insertId);
        } catch (e) {
          errors.push(`Ligne avec module "${examData.moduleName}": Erreur lors de l'insertion (${e.message}).`);
        }
      }

      if (insertedExams.length === 0) {
        return res.status(400).json({
          message: 'Aucun examen n\'a pu être importé après validation.',
          errors
        });
      }

      res.status(201).json({
        message: insertedExams.length === validatedExams.length
          ? 'Tous les examens ont été importés avec succès, les anciens examens ont été remplacés.'
          : 'Certains examens ont été importés avec succès, les anciens examens ont été remplacés.',
        insertedExams,
        errors
      });
    } catch (err) {
      res.status(500).json({ error: `Erreur lors de l'importation du fichier Excel: ${err.message}` });
    }
  }
];

export default {
  getExams,
  addExam,
  updateExam,
  deleteExam,
  getModulesBySection,
  getSalles,
  getSemestres,
  getFacultes,
  getDepartements,
  getNiveaux,
  getSpecialites,
  getSections,
  uploadExcel
};