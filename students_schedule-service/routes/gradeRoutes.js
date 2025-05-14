import express from 'express';
import db from '../config/db.js';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs';
import cron from 'node-cron';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate token
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT Error:', err.message, err.stack);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check role
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    console.error(`Access denied for user ${req.user.matricule} with role ${req.user.role}`);
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Helper function to check allowed course types
const checkCourseType = async (matricule, moduleId, res) => {
  const allowedCourseTypes = ['Cour', 'Cour/TD', 'Cour/TP', 'En ligne'];
  const [assignment] = await db.query(
    'SELECT course_type FROM Module_Enseignant WHERE Matricule = ? AND ID_module = ?',
    [matricule, moduleId]
  );
  if (!assignment.length || !allowedCourseTypes.includes(assignment[0].course_type)) {
    console.error(`Unauthorized course type for matricule ${matricule}, module ${moduleId}: ${assignment.length ? assignment[0].course_type : 'none'}`);
    res.status(403).json({ error: 'You are not authorized to manage grades for this module (invalid course type)' });
    return false;
  }
  return true;
};

// Helper function to send notifications
const sendNotification = async (connection, expediteur, destinataire, contenu) => {
  try {
    await connection.query(
      'INSERT INTO Notification (expediteur, destinataire, contenu) VALUES (?, ?, ?)',
      [expediteur, destinataire, contenu]
    );
    console.log(`Notification sent from ${expediteur} to ${destinataire}: ${contenu}`);
  } catch (err) {
    console.error('Error sending notification:', err.message, err.stack);
    throw err;
  }
};

// Helper function to sanitize filenames
const sanitizeFilename = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .trim();
};

// Helper function to calculate the current academic year
const getCurrentAcademicYear = () => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  if (currentMonth >= 7) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
};

// Helper function to calculate semester and annual averages and credits
const calculateAverages = async (connection, matricule, niveau, semestersForLevel, currentAcademicYear) => {
  const semesterAverages = {};
  const semesterCredits = {};
  const moduleCredits = {};

  const [grades] = await connection.query(`
    SELECT DISTINCT m.ID_module, m.nom_module, m.coefficient, m.credit, me.Moyenne, ms.semestre AS Semestre
    FROM Module m
    JOIN Module_Section ms ON m.ID_module = ms.ID_module
    JOIN Section s ON ms.ID_section = s.ID_section
    JOIN Etudiant_Section es ON s.ID_section = es.ID_section AND es.Matricule = ?
    LEFT JOIN Module_Etudiant me ON m.ID_module = me.ID_module AND me.Matricule = ?
    WHERE s.niveau = ? AND ms.semestre IN (?)
    ORDER BY ms.semestre, m.nom_module
  `, [matricule, matricule, niveau, semestersForLevel.map(s => s.replace('S', ''))]);

  if (!grades.length) {
    return {
      semesterAverages: {},
      semesterCredits: {},
      annualAverage: null,
      totalAnnualCredits: 0,
      status: null,
      debt: null,
      moduleCredits: {}
    };
  }

  const semesterGrades = {};
  semestersForLevel.forEach(sem => {
    const semNum = sem.replace('S', '');
    semesterGrades[sem] = grades.filter(g => g.Semestre === semNum);
  });

  let allSemestersComplete = true;
  for (const sem of semestersForLevel) {
    const semGrades = semesterGrades[sem];
    const allNotesPresent = semGrades.every(g => g.Moyenne !== null && g.Moyenne !== undefined);
    let semesterAverage = null;
    let totalCredits = 0;

    if (allNotesPresent) {
      const totalWeighted = semGrades.reduce((sum, g) => sum + (g.Moyenne * (g.coefficient || 1)), 0);
      const totalCoefficients = semGrades.reduce((sum, g) => sum + (g.coefficient || 1), 0);
      semesterAverage = totalCoefficients > 0 ? (totalWeighted / totalCoefficients).toFixed(2) : null;

      semGrades.forEach(grade => {
        const moduleCredit = grade.Moyenne >= 10 ? (grade.credit || 0) : 0;
        moduleCredits[`${grade.ID_module}-${sem}`] = moduleCredit;
        totalCredits += moduleCredit;
      });

      semesterCredits[sem] = semesterAverage >= 10 ? 30 : totalCredits;
    } else {
      semesterAverages[sem] = null;
      semesterCredits[sem] = 0;
      allSemestersComplete = false;
      semGrades.forEach(grade => {
        moduleCredits[`${grade.ID_module}-${sem}`] = 0;
      });
    }
    semesterAverages[sem] = semesterAverage;
  }

  let annualAverage = null;
  let totalAnnualCredits = 0;
  let status = null;
  let debt = null;

  if (allSemestersComplete && semestersForLevel.length === 2) {
    const semesterAveragesValues = Object.values(semesterAverages).map(Number);
    annualAverage = semesterAveragesValues.length === 2 ? (semesterAveragesValues.reduce((sum, avg) => sum + avg, 0) / 2).toFixed(2) : null;
    totalAnnualCredits = Object.values(semesterCredits).reduce((sum, cred) => sum + cred, 0);

    if (annualAverage !== null) {
      if (annualAverage >= 10) {
        status = 'Admis';
        totalAnnualCredits = 60;
      } else {
        if (totalAnnualCredits >= 50) {
          status = 'Admis avec dettes';
          debt = 60 - totalAnnualCredits;
        } else {
          status = 'Ajourné';
        }
      }

      await connection.query(
        'INSERT INTO Annee_Academique (niveau, Matricule, moyenne_annuelle, etat, annee_scolaire, credits, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW()) ' +
        'ON DUPLICATE KEY UPDATE moyenne_annuelle = VALUES(moyenne_annuelle), etat = VALUES(etat), credits = VALUES(credits), updated_at = VALUES(updated_at)',
        [niveau, matricule, annualAverage, status, currentAcademicYear, totalAnnualCredits]
      );
    }
  }

  return { semesterAverages, semesterCredits, annualAverage, totalAnnualCredits, status, debt, moduleCredits };
};

// Fetch user details
router.get('/user/:matricule', authenticate, checkRole(['etudiant', 'enseignant', 'admin']), async (req, res) => {
  const { matricule } = req.params;
  try {
    const [user] = await db.query(
      'SELECT nom, prenom FROM User WHERE Matricule = ?',
      [matricule]
    );
    if (!user.length) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user[0]);
  } catch (err) {
    console.error('Error fetching user details:', err.message);
    res.status(500).json({ error: 'Failed to fetch user details', details: err.message });
  }
});

// Fetch teacher's assigned sections and modules
router.get('/teacher-sections', authenticate, checkRole(['enseignant', 'admin']), async (req, res) => {
  const userMatricule = req.user.matricule;
  const userRole = req.user.role;
  try {
    let query;
    let params = [];
    if (userRole === 'admin') {
      query = `
        SELECT DISTINCT s.ID_section, s.nom_section, s.niveau, sp.nom_specialite, m.ID_module, m.nom_module
        FROM Module m
        JOIN Module_Section ms ON m.ID_module = ms.ID_module
        JOIN Section s ON ms.ID_section = s.ID_section
        JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      `;
    } else {
      query = `
        SELECT DISTINCT s.ID_section, s.nom_section, s.niveau, sp.nom_specialite, m.ID_module, m.nom_module
        FROM Module_Enseignant me
        JOIN Module m ON me.ID_module = m.ID_module
        JOIN Module_Section ms ON m.ID_module = ms.ID_module
        JOIN Section s ON ms.ID_section = s.ID_section
        JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
        JOIN Enseignant_Section es ON s.ID_section = es.ID_section AND es.Matricule = me.Matricule
        WHERE me.Matricule = ? AND me.course_type IN ('Cour', 'Cour/TD', 'Cour/TP', 'En ligne')
      `;
      params = [userMatricule];
    }

    const [sections] = await db.query(query, params);
    console.log(`Sections récupérées pour ${userRole} ${userMatricule}:`, sections);

    const formattedSections = sections.map(s => ({
      ID_section: s.ID_section,
      display: `${s.niveau} - ${s.nom_specialite} - ${s.nom_section} - ${s.nom_module}`,
      niveau: s.niveau,
      ID_module: s.ID_module,
      nom_module: s.nom_module
    }));

    res.json(formattedSections);
  } catch (err) {
    console.error('Error fetching teacher sections:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch sections', details: err.message });
  }
});

const semestersMap = {
  'L1': ['S1', 'S2'],
  'L2': ['S3', 'S4'],
  'L3': ['S5', 'S6'],
  'M1': ['S7', 'S8'],
  'M2': ['S9', 'S10'],
  'ING1': ['S1', 'S2'],
  'ING2': ['S3', 'S4'],
  'ING3': ['S5', 'S6']
};

// Fetch semesters with validation of teacher assignment
router.get('/semesters/:niveau', authenticate, checkRole(['enseignant', 'admin']), async (req, res) => {
  try {
    let { niveau } = req.params;
    const { idSection, idModule } = req.query;
    const userMatricule = req.user.matricule;
    const userRole = req.user.role;

    console.log(`Requête pour semestres, niveau: ${niveau}, idSection: ${idSection}, idModule: ${idModule}, user: ${userMatricule}`);

    niveau = niveau
      .toUpperCase()
      .replace(/LICENCE\s*1/, 'L1')
      .replace(/LICENCE\s*2/, 'L2')
      .replace(/LICENCE\s*3/, 'L3')
      .replace(/MASTER\s*1/, 'M1')
      .replace(/MASTER\s*2/, 'M2')
      .replace(/INGÉNIEUR\s*1/, 'ING1')
      .replace(/INGÉNIEUR\s*2/, 'ING2')
      .replace(/INGÉNIEUR\s*3/, 'ING3')
      .replace(/\s+/g, '');
    console.log(`Niveau normalisé: ${niveau}`);

    let semesters = semestersMap[niveau];
    if (!semesters) {
      console.warn(`Niveau non reconnu: ${niveau}`);
      return res.status(400).json({ error: `Niveau non reconnu: ${niveau}` });
    }

    if (userRole === 'enseignant' && idSection && idModule) {
      const [assignment] = await db.query(
        `SELECT ms.semestre 
         FROM Module_Enseignant me
         JOIN Module_Section ms ON me.ID_module = ms.ID_module
         JOIN Enseignant_Section es ON ms.ID_section = es.ID_section
         WHERE me.Matricule = ? AND me.ID_module = ? AND ms.ID_section = ? AND es.Matricule = ?`,
        [userMatricule, idModule, idSection, userMatricule]
      );
      if (!assignment.length) {
        console.warn(`Module ${idModule} non enseigné par ${userMatricule} pour la section ${idSection}`);
        return res.status(403).json({ error: 'Vous n’enseignez pas ce module pour cette section' });
      }
      semesters = assignment.map(a => `S${a.semestre}`);
      if (!semesters.length) {
        console.warn(`Aucun semestre valide pour module ${idModule}, section ${idSection}, enseignant ${userMatricule}`);
        return res.status(403).json({ error: 'Aucun semestre disponible pour ce module et cette section' });
      }
    }

    console.log(`Semestres renvoyés: ${semesters}`);
    res.json(semesters);
  } catch (err) {
    console.error('Erreur dans /semesters:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur serveur lors du chargement des semestres' });
  }
});

// Fetch grades for a section, including all students even without grades
router.get('/section-grades', authenticate, checkRole(['enseignant', 'admin']), async (req, res) => {
  const { idSection, idModule, semestre } = req.query;
  console.log(`Requête /section-grades - idSection: ${idSection}, idModule: ${idModule}, semestre: ${semestre}, user: ${req.user.matricule}`);
  
  if (!idSection || !idModule || !semestre) {
    console.warn('Paramètres manquants dans /section-grades');
    return res.status(400).json({ error: 'idSection, idModule et semestre sont requis' });
  }

  try {
    if (req.user.role === 'enseignant') {
      if (!(await checkCourseType(req.user.matricule, idModule, res))) return;
    }

    console.log('Exécution de la requête SQL pour les notes');
    const [rows] = await db.query(`
      SELECT DISTINCT u.Matricule, u.nom, u.prenom, me.Moyenne, me.remarque, 
             g.num_groupe AS groupe, r.ID_reclamation, r.reclamation_text, r.prof_response
      FROM User u
      JOIN Etudiant e ON u.Matricule = e.Matricule
      JOIN Etudiant_Section es ON u.Matricule = es.Matricule
      LEFT JOIN groupe g ON e.ID_groupe = g.ID_groupe
      LEFT JOIN Module_Etudiant me ON u.Matricule = me.Matricule 
        AND me.ID_module = ? AND me.semestre = ?
      LEFT JOIN Reclamation r ON u.Matricule = r.Matricule_etudiant 
        AND r.ID_module = ? AND r.Semestre = ?
      WHERE es.ID_section = ?
      ORDER BY u.nom, u.prenom
    `, [idModule, semestre, idModule, semestre, idSection]);

    console.log(`Résultat SQL: ${rows.length} lignes trouvées`);
    res.json(rows);
  } catch (err) {
    console.error('Erreur dans /section-grades:', err.message, err.stack);
    res.status(500).json({ error: `Erreur serveur lors du chargement des notes: ${err.message}` });
  }
});

// Update or insert a single grade
router.put('/grades/:matricule/:module_id/:semestre', authenticate, checkRole(['enseignant', 'admin']), async (req, res) => {
  const { matricule, module_id, semestre } = req.params;
  const { Moyenne, remarque } = req.body;
  const userMatricule = req.user.matricule;
  const userRole = req.user.role;

  if (Moyenne === undefined || isNaN(Moyenne) || Moyenne < 0 || Moyenne > 20) {
    return res.status(400).json({ error: 'Grade must be a number between 0 and 20' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    if (userRole === 'enseignant') {
      if (!(await checkCourseType(userMatricule, module_id, res))) {
        await connection.rollback();
        return;
      }
    }

    const [existing] = await connection.query(
      'SELECT * FROM Module_Etudiant WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
      [matricule, module_id, semestre]
    );

    if (existing.length) {
      await connection.query(
        'UPDATE Module_Etudiant SET Moyenne = ?, remarque = ? WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
        [Moyenne, remarque || '', matricule, module_id, semestre]
      );
    } else {
      await connection.query(
        'INSERT INTO Module_Etudiant (Matricule, ID_module, Semestre, Moyenne, remarque) VALUES (?, ?, ?, ?, ?)',
        [matricule, module_id, semestre, Moyenne, remarque || '']
      );
    }

    const [module] = await connection.query('SELECT nom_module FROM Module WHERE ID_module = ?', [module_id]);
    const notificationContent = `Votre note pour le module ${module[0].nom_module} (Semestre ${semestre}) a été ${existing.length ? 'mise à jour' : 'soumise'} : ${Moyenne}/20.`;
    await sendNotification(connection, userMatricule, matricule, notificationContent);

    const [student] = await connection.query('SELECT niveau FROM Etudiant WHERE Matricule = ?', [matricule]);
    if (student.length && student[0].niveau) {
      const niveau = student[0].niveau;
      const semestersForLevel = semestersMap[niveau];
      if (semestersForLevel) {
        await calculateAverages(connection, matricule, niveau, semestersForLevel, getCurrentAcademicYear());
      }
    }

    await connection.commit();
    res.json({ message: 'Grade updated successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating grade:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to update grade', details: err.message });
  } finally {
    connection.release();
  }
});

// Import grades from Excel
router.post('/grades/import', authenticate, checkRole(['enseignant', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const userMatricule = req.user.matricule;
    const userRole = req.user.role;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const { module_id, semestre, idSection } = req.query;
    if (!module_id || !semestre || !idSection) {
      return res.status(400).json({ error: 'Module, semester, and section are required' });
    }

    if (userRole === 'enseignant') {
      if (!(await checkCourseType(userMatricule, module_id, res))) return;
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    const normalizeString = (str) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    };

    const normalizedData = data.map(row => {
      const normalizedRow = {};
      for (const key in row) {
        const normalizedKey = normalizeString(key);
        if (normalizedKey === normalizeString('Matricule')) normalizedRow['Matricule'] = row[key]?.trim();
        if (normalizedKey === normalizeString('Note') || normalizedKey === normalizeString('Moyenne')) normalizedRow['note'] = row[key]?.trim();
        if (normalizedKey === normalizeString('Remarque')) normalizedRow['remarque'] = row[key]?.trim();
      }
      return normalizedRow;
    });

    const requiredColumns = ['Matricule', 'note'];
    if (!normalizedData.every(row => requiredColumns.every(col => row[col] !== undefined && row[col] !== ''))) {
      return res.status(400).json({ error: `Required columns: ${requiredColumns.join(', ')}` });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const processedGrades = [];
      const skippedGrades = [];
      const affectedStudents = new Set();

      for (const row of normalizedData) {
        const matricule = row.Matricule;
        let note = parseFloat(row.note);
        const remarque = row.remarque || '';

        if (isNaN(note) || note < 0 || note > 20) {
          skippedGrades.push({ matricule, reason: 'Invalid grade (must be between 0 and 20)' });
          continue;
        }

        const [student] = await connection.query(
          'SELECT Matricule FROM Etudiant_Section WHERE Matricule = ? AND ID_section = ?',
          [matricule, idSection]
        );
        if (!student.length) {
          skippedGrades.push({ matricule, reason: 'Student not in this section' });
          continue;
        }

        const [existing] = await connection.query(
          'SELECT * FROM Module_Etudiant WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
          [matricule, module_id, semestre]
        );

        if (existing.length) {
          await connection.query(
            'UPDATE Module_Etudiant SET Moyenne = ?, remarque = ? WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
            [note, remarque, matricule, module_id, semestre]
          );
          processedGrades.push({ matricule, note, remarque, status: 'updated' });
        } else {
          await connection.query(
            'INSERT INTO Module_Etudiant (Matricule, ID_module, Semestre, Moyenne, remarque) VALUES (?, ?, ?, ?, ?)',
            [matricule, module_id, semestre, note, remarque]
          );
          processedGrades.push({ matricule, note, remarque, status: 'inserted' });
        }

        const [module] = await connection.query('SELECT nom_module FROM Module WHERE ID_module = ?', [module_id]);
        const notificationContent = `Votre note pour le module ${module[0].nom_module} (Semestre ${semestre}) a été ${existing.length ? 'mise à jour' : 'soumise'} : ${note}/20.`;
        await sendNotification(connection, userMatricule, matricule, notificationContent);

        affectedStudents.add(matricule);
      }

      for (const matricule of affectedStudents) {
        const [student] = await connection.query('SELECT niveau FROM Etudiant WHERE Matricule = ?', [matricule]);
        if (student.length && student[0].niveau) {
          const niveau = student[0].niveau;
          const semestersForLevel = semestersMap[niveau];
          if (semestersForLevel) {
            await calculateAverages(connection, matricule, niveau, semestersForLevel, getCurrentAcademicYear());
          }
        }
      }

      await connection.commit();
      res.json({
        message: processedGrades.length > 0 ? 'Grades imported successfully' : 'No grades imported',
        importedCount: processedGrades.length,
        skippedCount: skippedGrades.length,
        processedGrades,
        skippedGrades
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error importing grades:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to import grades', details: err.message });
  }
});

// Provide an Excel template for importing grades
router.get('/grades/import-template', authenticate, checkRole(['enseignant', 'admin']), async (req, res) => {
  const { idSection, idModule, semestre } = req.query;
  if (!idSection || !idModule || !semestre) {
    return res.status(400).json({ error: 'Section, module, and semester are required' });
  }

  try {
    const [sectionInfo] = await db.query(`
      SELECT s.nom_section, sp.nom_specialite
      FROM Section s
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      WHERE s.ID_section = ?
    `, [idSection]);

    if (!sectionInfo.length) {
      return res.status(404).json({ error: 'Section or specialty not found' });
    }

    const { nom_section, nom_specialite } = sectionInfo[0];
    const sanitizedSpecialite = sanitizeFilename(nom_specialite);
    const sanitizedSection = sanitizeFilename(nom_section);
    const filename = `moyennes-${sanitizedSpecialite}-${sanitizedSection}.xlsx`;

    const [students] = await db.query(`
      SELECT u.Matricule, u.nom, u.prenom, e.ID_groupe AS groupe, me.Moyenne, me.remarque
      FROM User u
      JOIN Etudiant e ON u.Matricule = e.Matricule
      JOIN Etudiant_Section es ON u.Matricule = es.Matricule
      LEFT JOIN Module_Etudiant me ON u.Matricule = me.Matricule 
        AND me.ID_module = ? AND me.Semestre = ?
      WHERE es.ID_section = ?
      ORDER BY u.nom, u.prenom
    `, [idModule, semestre, idSection]);

    console.log('Données pour le modèle Excel:', students);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Grades Template');

    worksheet.columns = [
      { header: 'Matricule', key: 'Matricule', width: 15 },
      { header: 'Nom', key: 'nom', width: 15 },
      { header: 'Prénom', key: 'prenom', width: 15 },
      { header: 'Groupe', key: 'groupe', width: 10 },
      { header: 'Moyenne', key: 'Moyenne', width: 10 },
      { header: 'Remarque', key: 'remarque', width: 20 }
    ];

    students.forEach(student => {
      worksheet.addRow({
        Matricule: student.Matricule,
        nom: student.nom,
        prenom: student.prenom,
        groupe: student.groupe || '',
        Moyenne: student.Moyenne != null ? student.Moyenne.toString() : '',
        remarque: student.remarque || ''
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D3D3D3' } };

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    console.error('Error generating template:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to generate template', details: err.message });
  }
});

// Export grades as PDF or Excel
router.get('/export-grades', authenticate, checkRole(['enseignant', 'admin']), async (req, res) => {
  const { idSection, idModule, semestre, format } = req.query;
  const userMatricule = req.user.matricule;
  const userRole = req.user.role;

  console.log(`Requête /export-grades - idSection: ${idSection}, idModule: ${idModule}, semestre: ${semestre}, format: ${format}, user: ${userMatricule}`);

  if (!idSection || !idModule || !semestre || !format) {
    console.warn('Paramètres manquants dans /export-grades');
    return res.status(400).json({ error: 'Section, module, semester, and format are required' });
  }

  try {
    if (userRole === 'enseignant') {
      if (!(await checkCourseType(userMatricule, idModule, res))) return;
    }

    const [sectionInfo] = await db.query(`
      SELECT s.nom_section, sp.nom_specialite
      FROM Section s
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      WHERE s.ID_section = ?
    `, [idSection]);

    if (!sectionInfo.length) {
      return res.status(404).json({ error: 'Section or specialty not found' });
    }

    const { nom_section, nom_specialite } = sectionInfo[0];
    const sanitizedSpecialite = sanitizeFilename(nom_specialite);
    const sanitizedSection = sanitizeFilename(nom_section);
    const filename = `moyennes-${sanitizedSpecialite}-${sanitizedSection}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    console.log('Nom de fichier généré:', filename);

    console.log('Exécution de la requête SQL pour l’exportation des notes');
    const [grades] = await db.query(`
      SELECT u.Matricule, u.nom, u.prenom, e.ID_groupe AS groupe, me.Moyenne, me.remarque
      FROM User u
      JOIN Etudiant e ON u.Matricule = e.Matricule
      JOIN Etudiant_Section es ON u.Matricule = es.Matricule
      LEFT JOIN Module_Etudiant me ON u.Matricule = me.Matricule 
        AND me.ID_module = ? AND me.Semestre = ?
      WHERE es.ID_section = ?
      ORDER BY u.nom, u.prenom
    `, [idModule, semestre, idSection]);

    console.log('Données brutes récupérées pour exportation:', grades);

    if (format === 'pdf') {
      console.log('Génération du PDF');
      const doc = new PDFDocument({ margin: 30 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfData);
        console.log('PDF envoyé avec succès');
      });

      doc.fillColor('#00008B').fontSize(20).font('Helvetica-Bold').text('Liste des Notes', { align: 'center' });
      doc.fillColor('black').moveDown(0.5);

      const [module] = await db.query('SELECT nom_module FROM Module WHERE ID_module = ?', [idModule]);
      const [section] = await db.query('SELECT nom_section, niveau FROM Section WHERE ID_section = ?', [idSection]);
      doc.fontSize(12).font('Helvetica')
        .text(`Module: ${module[0].nom_module}`, { align: 'center' })
        .text(`Section: ${section[0].niveau} - ${section[0].nom_section}`, { align: 'center' })
        .text(`Semestre: ${semestre}`, { align: 'center' })
        .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' })
        .moveDown(1);

      const tableTop = doc.y;
      const rowHeight = 20;
      const colWidths = [80, 80, 80, 60, 60, 100];
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
      const pageWidth = doc.page.width - 60;
      const tableStartX = (pageWidth - tableWidth) / 2 + 30;
      let y = tableTop;

      doc.fontSize(10).font('Helvetica-Bold');
      const headers = ['Matricule', 'Nom', 'Prénom', 'Groupe', 'Note', 'Remarque'];
      let x = tableStartX;

      doc.rect(tableStartX, y, tableWidth, rowHeight).fill('#D3D3D3').fillColor('black');
      headers.forEach((header, i) => {
        doc.text(header, x + 5, y + 5, { width: colWidths[i] - 10, align: 'left' });
        x += colWidths[i];
      });
      y += rowHeight;

      doc.font('Helvetica');
      grades.forEach((grade, index) => {
        x = tableStartX;
        if (index % 2 === 0) {
          doc.rect(tableStartX, y, tableWidth, rowHeight).fill('#F5F5F5').fillColor('black');
        }

        doc.text(grade.Matricule, x + 5, y + 5, { width: colWidths[0] - 10, align: 'left' });
        x += colWidths[0];
        doc.text(grade.nom, x + 5, y + 5, { width: colWidths[1] - 10, align: 'left' });
        x += colWidths[1];
        doc.text(grade.prenom, x + 5, y + 5, { width: colWidths[2] - 10, align: 'left' });
        x += colWidths[2];
        doc.text(grade.groupe || '-', x + 5, y + 5, { width: colWidths[3] - 10, align: 'left' });
        x += colWidths[3];
        doc.text(grade.Moyenne != null ? grade.Moyenne.toString() : '-', x + 5, y + 5, { width: colWidths[4] - 10, align: 'left' });
        x += colWidths[4];
        doc.text(grade.remarque || '-', x + 5, y + 5, { width: colWidths[5] - 10, align: 'left' });

        y += rowHeight;
      });

      const tableBottom = y;
      doc.lineWidth(1).strokeColor('#00008B')
        .rect(tableStartX, tableTop, tableWidth, tableBottom - tableTop).stroke();
      x = tableStartX;
      for (let i = 0; i <= colWidths.length; i++) {
        doc.moveTo(x, tableTop).lineTo(x, tableBottom).stroke();
        x += colWidths[i];
      }
      for (let i = tableTop; i <= tableBottom; i += rowHeight) {
        doc.moveTo(tableStartX, i).lineTo(tableStartX + tableWidth, i).stroke();
      }

      doc.end();
    } else if (format === 'excel') {
      console.log('Génération de l’Excel au format .xlsx');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Grades');

      worksheet.columns = [
        { header: 'Matricule', key: 'Matricule', width: 15 },
        { header: 'Nom', key: 'nom', width: 15 },
        { header: 'Prénom', key: 'prenom', width: 15 },
        { header: 'Groupe', key: 'groupe', width: 10 },
        { header: 'Note', key: 'note', width: 10 },
        { header: 'Remarque', key: 'remarque', width: 20 }
      ];

      grades.forEach(grade => {
        const noteValue = grade.Moyenne != null ? grade.Moyenne.toString() : '-';
        const remarqueValue = grade.remarque || '-';
        const groupeValue = grade.groupe || '-';

        console.log(`Ajout de ligne pour matricule ${grade.Matricule}:`, {
          Matricule: grade.Matricule,
          nom: grade.nom,
          prenom: grade.prenom,
          groupe: groupeValue,
          note: noteValue,
          remarque: remarqueValue
        });

        worksheet.addRow({
          Matricule: grade.Matricule,
          nom: grade.nom,
          prenom: grade.prenom,
          groupe: groupeValue,
          note: noteValue,
          remarque: remarqueValue
        });
      });

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D3D3D3' } };

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
      console.log('Excel .xlsx envoyé avec succès');
    } else {
      console.warn(`Format invalide: ${format}`);
      res.status(400).json({ error: 'Invalid format' });
    }
  } catch (err) {
    console.error('Error exporting grades:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to export grades', details: err.message });
  }
});

/// Submit a new reclamation
router.post('/reclamation', authenticate, checkRole(['etudiant']), async (req, res) => {
  const { ID_module, Semestre, reclamation_text } = req.body;
  const matricule = req.user.matricule;

  console.log(`Requête POST /reclamation - matricule: ${matricule}, ID_module: ${ID_module}, Semestre: ${Semestre}, texte: ${reclamation_text}`);

  if (!ID_module || !Semestre || !reclamation_text) {
    return res.status(400).json({ error: 'ID_module, Semestre et reclamation_text sont requis' });
  }

  try {
    const [module] = await db.query('SELECT 1 FROM Module WHERE ID_module = ?', [ID_module]);
    if (!module.length) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    const [section] = await db.query(
      'SELECT ms.ID_section FROM Module_Section ms JOIN Etudiant_Section es ON ms.ID_section = es.ID_section WHERE ms.ID_module = ? AND es.Matricule = ?',
      [ID_module, matricule]
    );
    if (!section.length) {
      return res.status(403).json({ error: 'Vous n\'êtes pas inscrit à ce module' });
    }

    // Vérifier si la note existe dans Module_Etudiant (données actuelles)
    const [currentGrade] = await db.query(
      'SELECT Moyenne FROM Module_Etudiant WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
      [matricule, ID_module, Semestre]
    );

    // Vérifier si la note est déjà archivée
    const [archivedGrade] = await db.query(
      'SELECT moyenne FROM Student_Grades_Archive WHERE Matricule = ? AND ID_module = ? AND semestre = ?',
      [matricule, ID_module, Semestre]
    );

    if (!currentGrade.length || archivedGrade.length) {
      return res.status(403).json({ error: 'Vous ne pouvez pas soumettre de réclamation pour des données archivées ou inexistantes' });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query(
        'SELECT ID_reclamation FROM Reclamation WHERE Matricule_etudiant = ? AND ID_module = ? AND Semestre = ?',
        [matricule, ID_module, Semestre]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Une réclamation existe déjà pour ce module et ce semestre' });
      }

      const [result] = await connection.query(
        'INSERT INTO Reclamation (ID_module, Matricule_etudiant, Semestre, reclamation_text, date_reclamation) VALUES (?, ?, ?, ?, NOW())',
        [ID_module, matricule, Semestre, reclamation_text]
      );

      const [teacher] = await connection.query(
        'SELECT Matricule FROM Module_Enseignant WHERE ID_module = ? LIMIT 1',
        [ID_module]
      );
      if (teacher.length) {
        const [sectionInfo] = await connection.query(
          'SELECT s.nom_section, sp.nom_specialite FROM Module_Section ms JOIN Section s ON ms.ID_section = s.ID_section JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite WHERE ms.ID_module = ? AND ms.ID_section = ?',
          [ID_module, section[0].ID_section]
        );
        const notificationContent = `Nouvelle réclamation pour le module ${ID_module} (Section: ${sectionInfo[0].nom_section}, Spécialité: ${sectionInfo[0].nom_specialite}, Semestre: ${Semestre}).`;
        await sendNotification(connection, matricule, teacher[0].Matricule, notificationContent);
      }

      await connection.commit();
      console.log('Réclamation insérée avec ID:', result.insertId);
      res.status(201).json({ message: 'Réclamation soumise avec succès', id: result.insertId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Erreur dans /reclamation:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Update an existing reclamation
router.put('/reclamation/:id', authenticate, checkRole(['etudiant']), async (req, res) => {
  const { id } = req.params;
  const { reclamation_text } = req.body;
  const matricule = req.user.matricule;

  console.log(`Requête PUT /reclamation/${id} - matricule: ${matricule}, texte: ${reclamation_text}`);

  if (!reclamation_text) {
    return res.status(400).json({ error: 'reclamation_text est requis' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [reclamation] = await connection.query(
      'SELECT Matricule_etudiant, prof_response FROM Reclamation WHERE ID_reclamation = ?',
      [id]
    );
    if (!reclamation.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Réclamation non trouvée' });
    }
    if (reclamation[0].Matricule_etudiant !== matricule) {
      await connection.rollback();
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier cette réclamation' });
    }
    if (reclamation[0].prof_response) {
      await connection.rollback();
      return res.status(400).json({ error: 'La réclamation a déjà été répondue et ne peut plus être modifiée' });
    }

    await connection.query(
      'UPDATE Reclamation SET reclamation_text = ?, date_reclamation = NOW() WHERE ID_reclamation = ?',
      [reclamation_text, id]
    );

    await connection.commit();
    res.json({ message: 'Réclamation mise à jour avec succès' });
  } catch (err) {
    await connection.rollback();
    console.error('Erreur dans /reclamation/:id:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  } finally {
    connection.release();
  }
});

// Respond to a reclamation
router.post('/reclamation/:id/respond', authenticate, checkRole(['enseignant', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { prof_response } = req.body;
  const userMatricule = req.user.matricule;
  const userRole = req.user.role;

  if (!prof_response) {
    return res.status(400).json({ error: 'Response is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [reclamation] = await connection.query(
      'SELECT ID_module, Matricule_etudiant, Semestre, prof_response FROM Reclamation WHERE ID_reclamation = ?',
      [id]
    );
    if (!reclamation.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reclamation not found' });
    }

    if (reclamation[0].prof_response) {
      await connection.rollback();
      return res.status(400).json({ error: 'Reclamation already responded to' });
    }

    const { ID_module, Matricule_etudiant, Semestre } = reclamation[0];
    if (userRole === 'enseignant') {
      if (!(await checkCourseType(userMatricule, ID_module, res))) {
        await connection.rollback();
        return;
      }
    }

    await connection.query(
      'UPDATE Reclamation SET prof_response = ?, date_response = NOW() WHERE ID_reclamation = ?',
      [prof_response, id]
    );

    const [module] = await connection.query('SELECT nom_module FROM Module WHERE ID_module = ?', [ID_module]);
    const notificationContent = `Vous avez une réponse à votre réclamation pour le module ${module[0].nom_module} (Semestre ${Semestre}) de la part de votre enseignant : "${prof_response}".`;
    await sendNotification(connection, userMatricule, Matricule_etudiant, notificationContent);

    await connection.commit();
    res.json({ message: 'Response submitted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error responding to reclamation:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to respond to reclamation', details: err.message });
  } finally {
    connection.release();
  }
});

// Fetch student level
router.get('/student-level', authenticate, checkRole(['etudiant']), async (req, res) => {
  const matricule = req.user.matricule;
  console.log(`Fetching level for matricule: ${matricule}`);
  try {
    const [student] = await db.query(
      'SELECT niveau FROM Etudiant WHERE Matricule = ?',
      [matricule]
    );
    if (!student.length) {
      console.warn(`Étudiant non trouvé pour matricule: ${matricule}`);
      return res.status(404).json({ error: 'Étudiant non trouvé', defaultLevel: 'L1' });
    }
    if (!student[0].niveau) {
      console.warn(`Niveau non défini pour matricule: ${matricule}`);
      return res.json({ niveau: 'L1' });
    }
    console.log(`Niveau trouvé: ${student[0].niveau} pour matricule ${matricule}`);
    res.json({ niveau: student[0].niveau });
  } catch (err) {
    console.error('Error fetching student level:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch student level', defaultLevel: 'L1' });
  }
});

// Fetch all levels (current and historical) for the student
router.get('/student-level-history', authenticate, checkRole(['etudiant']), async (req, res) => {
  const matricule = req.user.matricule;
  try {
    const [currentLevel] = await db.query(
      'SELECT niveau FROM Etudiant WHERE Matricule = ?',
      [matricule]
    );

    if (!currentLevel.length) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }

    const [historicalLevels] = await db.query(
      'SELECT DISTINCT niveau FROM Student_Grades_Archive WHERE Matricule = ? ORDER BY niveau',
      [matricule]
    );

    const allLevels = [...new Set([
      currentLevel[0].niveau,
      ...historicalLevels.map(level => level.niveau)
    ])].sort();

    res.json({ levels: allLevels });
  } catch (err) {
    console.error('Error fetching student level history:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch level history', details: err.message });
  }
});

// Fetch student grades (including archived)
router.get('/student-grades', authenticate, checkRole(['etudiant']), async (req, res) => {
  const { niveau, semestre } = req.query;
  const matricule = req.user.matricule;
  const currentAcademicYear = getCurrentAcademicYear();

  console.log(`Requête /student-grades - niveau: ${niveau}, semestre: ${semestre}, matricule: ${matricule}, année académique: ${currentAcademicYear}`);

  if (!niveau || !semestre) return res.status(400).json({ error: 'Niveau et semestre sont requis' });

  try {
    const semesterNum = semestre.replace('S', '');
    const semestersForLevel = semestersMap[niveau];
    if (!semestersForLevel) return res.status(400).json({ error: `Niveau non reconnu: ${niveau}` });

    const [currentStudent] = await db.query(
      'SELECT niveau FROM Etudiant WHERE Matricule = ?',
      [matricule]
    );

    let grades = [];
    let average = null;
    let academicYear = currentAcademicYear;

    if (currentStudent[0].niveau === niveau) {
      const [currentGrades] = await db.query(`
        SELECT DISTINCT m.ID_module, m.nom_module, m.coefficient, m.credit, me.Moyenne, me.remarque,
               r.ID_reclamation, r.reclamation_text, r.prof_response, r.date_reclamation,
               s.niveau, ms.semestre AS Semestre
        FROM Module m
        JOIN Module_Section ms ON m.ID_module = ms.ID_module
        JOIN Section s ON ms.ID_section = s.ID_section
        JOIN Etudiant_Section es ON s.ID_section = es.ID_section AND es.Matricule = ?
        LEFT JOIN Module_Etudiant me ON m.ID_module = me.ID_module AND me.Matricule = ? AND me.semestre = ?
        LEFT JOIN (
          SELECT ID_reclamation, ID_module, Matricule_etudiant, Semestre, reclamation_text, prof_response, date_reclamation
          FROM Reclamation
          WHERE Matricule_etudiant = ? AND Semestre = ?
          ORDER BY date_reclamation DESC
          LIMIT 1
        ) r ON m.ID_module = r.ID_module AND r.Matricule_etudiant = ? AND r.Semestre = ? AND me.Moyenne IS NOT NULL
        WHERE s.niveau = ? AND ms.semestre = ?
        ORDER BY m.nom_module
      `, [matricule, matricule, semestre, matricule, semestre, matricule, semestre, niveau, semesterNum]);

      grades = currentGrades.map(module => ({
        ID_module: module.ID_module,
        nom_module: module.nom_module,
        coefficient: module.coefficient || 1,
        credit: module.credit || 0,
        Moyenne: module.Moyenne || null,
        remarque: module.remarque || '-',
        ID_reclamation: module.ID_reclamation || null,
        reclamation: module.reclamation_text || null,
        prof_response: module.prof_response || null,
        niveau: module.niveau,
        Semestre: `S${module.Semestre}`
      }));
    } else {
      const [archivedGrades] = await db.query(`
        SELECT ID_module, nom_module, coefficient, credit, moyenne AS Moyenne, remarque,
               reclamation_text AS reclamation, prof_response, date_reclamation, date_response,
               niveau, semestre AS Semestre, annee_scolaire
        FROM Student_Grades_Archive
        WHERE Matricule = ? AND niveau = ? AND semestre = ?
        ORDER BY nom_module
      `, [matricule, niveau, semestre]);

      if (archivedGrades.length) {
        academicYear = archivedGrades[0].annee_scolaire;
      }

      grades = archivedGrades.map(module => ({
        ID_module: module.ID_module,
        nom_module: module.nom_module,
        coefficient: module.coefficient || 1,
        credit: module.credit || 0,
        Moyenne: module.Moyenne || null,
        remarque: module.remarque || '-',
        ID_reclamation: null,
        reclamation: module.reclamation || null,
        prof_response: module.prof_response || null,
        niveau: module.niveau,
        Semestre: module.Semestre
      }));
    }

    if (!grades.length) {
      console.log(`Aucun module trouvé pour ${matricule}, niveau ${niveau}, semestre ${semestre}`);
      return res.json({ grades: [], average: null, academicYear });
    }

    const allNotesPresent = grades.every(grade => grade.Moyenne !== null && grade.Moyenne !== undefined);
    if (allNotesPresent) {
      const totalWeighted = grades.reduce((sum, grade) => sum + (grade.Moyenne * grade.coefficient), 0);
      const totalCoefficients = grades.reduce((sum, grade) => sum + grade.coefficient, 0);
      average = totalCoefficients > 0 ? (totalWeighted / totalCoefficients).toFixed(2) : null;
    }

    res.json({ grades, average, academicYear });
  } catch (err) {
    console.error('Erreur dans /student-grades:', err.message);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Fetch student transcript (including archived)
router.get('/student-transcript', authenticate, checkRole(['etudiant']), async (req, res) => {
  let { niveau } = req.query;
  const matricule = req.user.matricule;
  const currentAcademicYear = getCurrentAcademicYear();

  console.log(`Requête /student-transcript - matricule: ${matricule}, niveau: ${niveau}, année académique: ${currentAcademicYear}`);

  try {
    const [student] = await db.query(`
      SELECT u.nom, u.prenom, e.niveau AS currentNiveau
      FROM User u
      JOIN Etudiant e ON u.Matricule = e.Matricule
      WHERE u.Matricule = ?
    `, [matricule]);

    if (!student.length) return res.status(404).json({ error: 'Étudiant non trouvé' });

    const { nom, prenom, currentNiveau } = student[0];

    // If niveau is not provided, default to the student's current level
    if (!niveau) {
      console.log(`Niveau non fourni, utilisation du niveau actuel: ${currentNiveau}`);
      niveau = currentNiveau;
    }

    const semestersForLevel = semestersMap[niveau];
    if (!semestersForLevel) {
      return res.status(400).json({ error: `Niveau non reconnu: ${niveau}` });
    }

    let grades = [];
    let academicYear = currentAcademicYear;
    let semesterAverages = {};
    let semesterCredits = {};
    let annualAverage = null;
    let totalAnnualCredits = 0;
    let status = null;
    let debt = null;

    if (currentNiveau === niveau) {
      const [currentGrades] = await db.query(`
        SELECT DISTINCT m.ID_module, m.nom_module, m.coefficient, m.credit, me.Moyenne, ms.semestre AS Semestre
        FROM Module m
        JOIN Module_Section ms ON m.ID_module = ms.ID_module
        JOIN Section s ON ms.ID_section = s.ID_section
        JOIN Etudiant_Section es ON s.ID_section = es.ID_section AND es.Matricule = ?
        LEFT JOIN Module_Etudiant me ON m.ID_module = me.ID_module AND me.Matricule = ?
        WHERE s.niveau = ? AND ms.semestre IN (?)
        ORDER BY ms.semestre, m.nom_module
      `, [matricule, matricule, niveau, semestersForLevel.map(s => s.replace('S', ''))]);

      grades = currentGrades;

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const result = await calculateAverages(connection, matricule, niveau, semestersForLevel, currentAcademicYear);
        await connection.commit();

        semesterAverages = result.semesterAverages;
        semesterCredits = result.semesterCredits;
        annualAverage = result.annualAverage;
        totalAnnualCredits = result.totalAnnualCredits;
        status = result.status;
        debt = result.debt;

        const semesterGrades = {};
        semestersForLevel.forEach(sem => {
          const semNum = sem.replace('S', '');
          semesterGrades[sem] = grades.filter(g => g.Semestre === semNum).map(grade => ({
            ...grade,
            earnedCredits: result.moduleCredits[`${grade.ID_module}-${sem}`] || 0
          }));
        });

        grades = semesterGrades;
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      const [archivedGrades] = await db.query(`
        SELECT ID_module, nom_module, coefficient, credit, moyenne AS Moyenne, semestre AS Semestre,
               annee_scolaire, moyenne_semestre, moyenne_annuelle, credits_obtenus, etat
        FROM Student_Grades_Archive
        WHERE Matricule = ? AND niveau = ?
        ORDER BY semestre, nom_module
      `, [matricule, niveau]);

      if (!archivedGrades.length) {
        return res.json({
          message: 'Aucun relevé pour ce niveau',
          academicYear: null,
          grades: {},
          semesterAverages: {},
          semesterCredits: {},
          annualAverage: null,
          totalAnnualCredits: 0,
          status: null,
          debt: null
        });
      }

      academicYear = archivedGrades[0].annee_scolaire;
      annualAverage = archivedGrades[0].moyenne_annuelle;
      totalAnnualCredits = archivedGrades[0].credits_obtenus;
      status = archivedGrades[0].etat;

      const semesterGrades = {};
      semestersForLevel.forEach(sem => {
        semesterGrades[sem] = archivedGrades.filter(g => g.Semestre === sem).map(grade => ({
          ID_module: grade.ID_module,
          nom_module: grade.nom_module,
          coefficient: grade.coefficient || 1,
          credit: grade.credit || 0,
          Moyenne: grade.Moyenne || null,
          Semestre: grade.Semestre,
          earnedCredits: grade.Moyenne >= 10 ? grade.credit : 0
        }));
      });

      grades = semesterGrades;

      // Utiliser les moyennes semestrielles archivées si disponibles
      semestersForLevel.forEach(sem => {
        const semGrades = semesterGrades[sem];
        const archivedSemData = archivedGrades.find(g => g.Semestre === sem);
        semesterAverages[sem] = archivedSemData ? archivedSemData.moyenne_semestre : null;
        semesterCredits[sem] = archivedSemData ? (archivedSemData.moyenne_semestre >= 10 ? 30 : semGrades.reduce((sum, g) => sum + g.earnedCredits, 0)) : 0;
      });

      // Calculer la dette si applicable
      if (annualAverage < 10 && totalAnnualCredits >= 50) {
        debt = 60 - totalAnnualCredits;
      }
    }

    res.json({
      studentName: `${nom} ${prenom}`,
      niveau,
      academicYear,
      grades,
      semesterAverages,
      semesterCredits,
      annualAverage,
      totalAnnualCredits,
      status,
      debt
    });
  } catch (err) {
    console.error('Erreur dans /student-transcript:', err.message);
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

// Automatic archiving task
cron.schedule('0 0 * * *', async () => {
  console.log('Running automatic grade archiving task at midnight');
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [records] = await connection.query(`
      SELECT DISTINCT Matricule, niveau, annee_scolaire
      FROM Annee_Academique
      WHERE updated_at IS NOT NULL AND updated_at <= ?
    `, [oneMonthAgo]);

    for (const record of records) {
      const { Matricule, niveau, annee_scolaire } = record;

      const [student] = await connection.query(`
        SELECT e.niveau, es.ID_section, s.nom_section, 
               s.ID_specialite, sp.nom_specialite, sp.ID_departement, sp.ID_faculte
        FROM Etudiant e
        LEFT JOIN Etudiant_Section es ON e.Matricule = es.Matricule
        LEFT JOIN Section s ON es.ID_section = s.ID_section
        LEFT JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
        WHERE e.Matricule = ?
      `, [Matricule]);

      if (!student.length) continue;

      const { ID_section, nom_section, ID_specialite, nom_specialite, ID_departement, ID_faculte } = student[0];

      const [grades] = await connection.query(`
        SELECT me.ID_module, m.nom_module, m.coefficient, m.credit, me.semestre, me.Moyenne, me.remarque,
               r.reclamation_text, r.prof_response, r.date_reclamation, r.date_response
        FROM Module_Etudiant me
        JOIN Module m ON me.ID_module = m.ID_module
        LEFT JOIN Reclamation r ON me.ID_module = r.ID_module AND me.Matricule = r.Matricule_etudiant AND me.semestre = r.Semestre
        WHERE me.Matricule = ?
      `, [Matricule]);

      const [semesterAverages] = await connection.query(`
        SELECT ID_semestre, Moyenne
        FROM Semestre_Etudiant
        WHERE Matricule = ?
      `, [Matricule]);

      const [annualData] = await connection.query(`
        SELECT moyenne_annuelle, credits, etat
        FROM Annee_Academique
        WHERE Matricule = ? AND niveau = ? AND annee_scolaire = ?
      `, [Matricule, niveau, annee_scolaire]);

      const annualAverage = annualData[0]?.moyenne_annuelle || null;
      const creditsObtenus = annualData[0]?.credits || 0;
      const etat = annualData[0]?.etat || null;

      for (const grade of grades) {
        const semesterAverage = semesterAverages.find(s => s.ID_semestre.toString() === grade.semestre.replace('S', ''))?.Moyenne || null;

        await connection.query(`
          INSERT INTO Student_Grades_Archive (
            Matricule, annee_scolaire, niveau, ID_section, nom_section, ID_specialite, nom_specialite,
            ID_departement, ID_faculte, ID_module, nom_module, coefficient, credit, semestre, moyenne,
            remarque, reclamation_text, prof_response, date_reclamation, date_response, moyenne_semestre,
            moyenne_annuelle, credits_obtenus, etat
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          Matricule, annee_scolaire, niveau, ID_section, nom_section, ID_specialite, nom_specialite,
          ID_departement, ID_faculte, grade.ID_module, grade.nom_module, grade.coefficient, grade.credit,
          grade.semestre, grade.Moyenne, grade.remarque, grade.reclamation_text, grade.prof_response,
          grade.date_reclamation, grade.date_response, semesterAverage, annualAverage, creditsObtenus, etat
        ]);
      }
    }

    await connection.commit();
    console.log('Automatic grade archiving completed successfully');
  } catch (err) {
    await connection.rollback();
    console.error('Error in automatic grade archiving:', err.message, err.stack);
  } finally {
    connection.release();
  }
}, {
  scheduled: true,
  timezone: 'UTC'
});

export default router;