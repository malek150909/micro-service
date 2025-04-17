import express from 'express';
import db from '../config/db.js';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import ExcelJS from 'exceljs'; 

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const JWT_SECRET = process.env.JWT_SECRET ; // Replace with a secure key in production (e.g., from .env)

// Middleware to authenticate token
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Now contains { matricule, role }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check role
const checkRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
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

// Fetch student grades
router.get('/grades/me', authenticate, checkRole('etudiant'), async (req, res) => {
  const { semestre } = req.query;
  const studentMatricule = req.user.matricule;

  if (!semestre || !['S1', 'S2'].includes(semestre)) {
    return res.status(400).json({ error: 'Please provide a valid semester (S1 or S2)' });
  }

  try {
    const [section] = await db.query(
      'SELECT ID_section FROM Etudiant_Section WHERE Matricule = ?',
      [studentMatricule]
    );
    if (!section.length) {
      return res.status(404).json({ error: 'Student not assigned to any section' });
    }
    const sectionId = section[0].ID_section;

    const [modules] = await db.query(`
      SELECT m.ID_module, m.nom_module
      FROM Module m
      JOIN Module_Section ms ON m.ID_module = ms.ID_module
      WHERE ms.ID_section = ?
    `, [sectionId]);

    const [grades] = await db.query(`
      SELECT me.ID_module, me.Moyenne, me.remarque, m.nom_module
      FROM Module_Etudiant me
      JOIN Module m ON me.ID_module = m.ID_module
      WHERE me.Matricule = ? AND me.Semestre = ?
    `, [studentMatricule, semestre]);

    // Fetch reclamations
    const [reclamations] = await db.query(`
      SELECT r.ID_reclamation, r.ID_module, r.reclamation_text, r.prof_response
      FROM Reclamation r
      WHERE r.Matricule_etudiant = ? AND r.Semestre = ?
    `, [studentMatricule, semestre]);

    const result = modules.map(module => {
      const grade = grades.find(g => g.ID_module === module.ID_module) || {};
      const reclamation = reclamations.find(r => r.ID_module === module.ID_module) || {};
      return {
        ID_module: module.ID_module,
        nom_module: module.nom_module,
        Semestre: semestre,
        Moyenne: grade.Moyenne || null,
        remarque: grade.remarque || null,
        reclamation: reclamation.reclamation_text || null,
        prof_response: reclamation.prof_response || null,
        reclamation_id: reclamation.ID_reclamation || null
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching student grades:', err.message, err.stack);
    res.status(500).json({ error: 'Error fetching grades', details: err.message });
  }
});

// Fetch facultes
router.get('/facultes', async (req, res) => {
  try {
    const [facultes] = await db.query('SELECT * FROM faculte');
    res.json(facultes);
  } catch (err) {
    console.error('Error fetching facultes:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des facultés', details: err.message });
  }
});

// Student submits a reclamation
router.post('/reclamation', authenticate, checkRole('etudiant'), async (req, res) => {
  const { ID_module, Semestre, reclamation_text } = req.body;
  const Matricule_etudiant = req.user.matricule;

  if (!ID_module || !Semestre || !reclamation_text || !['S1', 'S2'].includes(Semestre)) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if the student is enrolled in the module's section
    const [section] = await connection.query(
      'SELECT ID_section FROM Etudiant_Section WHERE Matricule = ?',
      [Matricule_etudiant]
    );
    if (!section.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Student not assigned to any section' });
    }
    const sectionId = section[0].ID_section;

    const [moduleSection] = await connection.query(
      'SELECT * FROM Module_Section WHERE ID_module = ? AND ID_section = ?',
      [ID_module, sectionId]
    );
    if (!moduleSection.length) {
      await connection.rollback();
      return res.status(403).json({ error: 'You are not enrolled in this module' });
    }

    // Insert the reclamation
    const [result] = await connection.query(
      'INSERT INTO Reclamation (ID_module, Matricule_etudiant, Semestre, reclamation_text) VALUES (?, ?, ?, ?)',
      [ID_module, Matricule_etudiant, Semestre, reclamation_text]
    );

    // Notify the professor
    const [professor] = await connection.query(
      'SELECT Matricule FROM Module_Enseignant WHERE ID_module = ?',
      [ID_module]
    );
    if (professor.length) {
      const professorMatricule = professor[0].Matricule;
      const [module] = await connection.query('SELECT nom_module FROM Module WHERE ID_module = ?', [ID_module]);
      const notificationContent = `Nouvelle réclamation pour le module ${module[0].nom_module} (Semestre ${Semestre}) par l'étudiant ${Matricule_etudiant}: "${reclamation_text}".`;
      await sendNotification(connection, Matricule_etudiant, professorMatricule, notificationContent);
    } else {
      console.warn(`No professor assigned to module ${ID_module}`);
    }

    await connection.commit();
    res.status(201).json({ message: 'Reclamation submitted successfully', id: result.insertId });
  } catch (err) {
    await connection.rollback();
    console.error('Error submitting reclamation:', err.message, err.stack);
    res.status(500).json({ error: 'Error submitting reclamation', details: err.message });
  } finally {
    connection.release();
  }
});

// Fetch user details
router.get('/user/:matricule', authenticate, async (req, res) => {
  const { matricule } = req.params;
  if (req.user.matricule !== matricule && req.user.role !== 'etudiant') {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const [users] = await db.query('SELECT nom, prenom FROM User WHERE Matricule = ?', [matricule]);
    if (!users.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (err) {
    console.error('Error fetching user:', err.message, err.stack);
    res.status(500).json({ error: 'Error fetching user', details: err.message });
  }
});

// Fetch departements
router.get('/departements/:idFaculte', async (req, res) => {
  const { idFaculte } = req.params;
  try {
    const [departements] = await db.query('SELECT * FROM Departement WHERE ID_faculte = ?', [idFaculte]);
    res.json(departements);
  } catch (err) {
    console.error('Error fetching departements:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des départements', details: err.message });
  }
});

// Fetch specialites
router.get('/specialites/:idDepartement', async (req, res) => {
  const { idDepartement } = req.params;
  try {
    const [specialites] = await db.query('SELECT * FROM Specialite WHERE ID_departement = ?', [idDepartement]);
    res.json(specialites);
  } catch (err) {
    console.error('Error fetching specialites:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des spécialités', details: err.message });
  }
});

// Fetch sections
router.get('/sections/:idSpecialite', async (req, res) => {
  const { idSpecialite } = req.params;
  try {
    const [sections] = await db.query('SELECT * FROM Section WHERE ID_specialite = ?', [idSpecialite]);
    res.json(sections);
  } catch (err) {
    console.error('Error fetching sections:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des sections', details: err.message });
  }
});

// Fetch modules
router.get('/modules/:idSection', async (req, res) => {
  const { idSection } = req.params;
  try {
    const [modules] = await db.query(`
      SELECT m.* FROM Module m
      JOIN Module_Section ms ON m.ID_module = ms.ID_module
      WHERE ms.ID_section = ?
    `, [idSection]);
    res.json(modules);
  } catch (err) {
    console.error('Error fetching modules:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des modules', details: err.message });
  }
});

// Fetch grades (general)
router.get('/grades', async (req, res) => {
  const { idFaculte, idDepartement, idSpecialite, niveau, idSection, idModule, semestre } = req.query;
  try {
    let query = `
      SELECT me.*, u.nom, u.prenom, m.nom_module, s.niveau, s.ID_section
      FROM Module_Etudiant me
      JOIN User u ON me.Matricule = u.Matricule
      JOIN Module m ON me.ID_module = m.ID_module
      JOIN Etudiant_Section es ON u.Matricule = es.Matricule
      JOIN Section s ON es.ID_section = s.ID_section
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
      WHERE 1=1
    `;
    const params = [];

    if (idFaculte) { query += ' AND d.ID_faculte = ?'; params.push(idFaculte); }
    if (idDepartement) { query += ' AND d.ID_departement = ?'; params.push(idDepartement); }
    if (idSpecialite) { query += ' AND sp.ID_specialite = ?'; params.push(idSpecialite); }
    if (niveau) { query += ' AND s.niveau = ?'; params.push(niveau); }
    if (idSection) { query += ' AND s.ID_section = ?'; params.push(idSection); }
    if (idModule) { query += ' AND me.ID_module = ?'; params.push(idModule); }
    if (semestre) { query += ' AND me.Semestre = ?'; params.push(semestre); }

    const [grades] = await db.query(query, params);
    res.json(grades);
  } catch (err) {
    console.error('Error fetching grades:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des notes', details: err.message });
  }
});

router.get('/existing-grades', authenticate, async (req, res) => {
  try {
    const matricule = req.user.matricule;
    const [professor] = await db.query(
      `SELECT Matricule FROM Enseignant WHERE Matricule = ?`,
      [matricule]
    );

    if (!professor.length) {
      return res.status(403).json({ error: 'Access restricted to professors.' });
    }

    const { idSection, idModule, semestre, export: exportFormat } = req.query;

    if (!idSection || !idModule || !semestre) {
      return res.status(400).json({ error: 'Module, section, and semester are required.' });
    }

    const [grades] = await db.query(`
      SELECT me.Matricule, u.nom, u.prenom, m.nom_module, me.Semestre, me.Moyenne, me.remarque
      FROM Module_Etudiant me
      JOIN User u ON me.Matricule = u.Matricule
      JOIN Etudiant e ON u.Matricule = e.Matricule
      JOIN Etudiant_Section es ON e.Matricule = es.Matricule
      JOIN Module m ON me.ID_module = m.ID_module
      WHERE me.ID_module = ? AND es.ID_section = ? AND me.Semestre = ?
    `, [idModule, idSection, semestre]);

    if (!grades.length) {
      return res.status(404).json({ error: 'No grades found for this combination.' });
    }

    if (exportFormat) {
      if (exportFormat === 'pdf') {
        const doc = new PDFDocument({ margin: 30 });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="Grades_${idModule}_${idSection}_${semestre}.pdf"`);
          res.send(pdfData);
        });

        doc.fillColor('#00008B');
        doc.fontSize(20).font('Helvetica-Bold').text('Liste des Notes', { align: 'center' });
        doc.fillColor('black');
        doc.moveDown(0.5);

        const moduleName = grades[0].nom_module;
        const semester = grades[0].Semestre;
        const creationDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc.fontSize(12).font('Helvetica');
        doc.text(`Module: ${moduleName}`, { align: 'center' });
        doc.text(`Semestre: ${semester}`, { align: 'center' });
        doc.text(`Created on: ${creationDate}`, { align: 'center' });
        doc.moveDown(1);

        const tableTop = doc.y;
        const rowHeight = 20;
        const colWidths = [80, 100, 100, 70, 120];
        const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);

        const pageWidth = doc.page.width - 60;
        const tableStartX = (pageWidth - tableWidth) / 2 + 30;
        let y = tableTop;

        doc.fontSize(10).font('Helvetica-Bold');
        const headers = ['Matricule', 'Nom', 'Prénom', 'Note', 'Remarque'];
        let x = tableStartX;

        doc.rect(tableStartX, y, tableWidth, rowHeight).fill('#D3D3D3');
        doc.fillColor('black');

        headers.forEach((header, i) => {
          doc.text(header, x + 5, y + 5, { width: colWidths[i] - 10, align: 'left' });
          x += colWidths[i];
        });

        y += rowHeight;

        doc.font('Helvetica');
        grades.forEach((grade, index) => {
          x = tableStartX;

          if (index % 2 === 0) {
            doc.rect(tableStartX, y, tableWidth, rowHeight).fill('#F5F5F5');
            doc.fillColor('black');
          }

          doc.text(grade.Matricule, x + 5, y + 5, { width: colWidths[0] - 10, align: 'left' });
          x += colWidths[0];
          doc.text(grade.nom, x + 5, y + 5, { width: colWidths[1] - 10, align: 'left' });
          x += colWidths[1];
          doc.text(grade.prenom, x + 5, y + 5, { width: colWidths[2] - 10, align: 'left' });
          x += colWidths[2];
          doc.text(grade.Moyenne.toString(), x + 5, y + 5, { width: colWidths[3] - 10, align: 'left' });
          x += colWidths[3];
          doc.text(grade.remarque || '-', x + 5, y + 5, { width: colWidths[4] - 10, align: 'left' });

          y += rowHeight;
        });

        const tableBottom = y;
        doc.lineWidth(1).strokeColor('#00008B');
        doc.rect(tableStartX, tableTop, tableWidth, tableBottom - tableTop).stroke();

        x = tableStartX;
        for (let i = 0; i <= colWidths.length; i++) {
          doc.moveTo(x, tableTop).lineTo(x, tableBottom).stroke();
          if (i < colWidths.length) x += colWidths[i];
        }

        for (let i = tableTop; i <= tableBottom; i += rowHeight) {
          doc.moveTo(tableStartX, i).lineTo(tableStartX + tableWidth, i).stroke();
        }

        doc.end();
      } else if (exportFormat === 'excel') {
        if (!ExcelJS) {
          return res.status(500).json({ error: 'Excel export functionality is not available. ExcelJS is not installed.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Grades');

        worksheet.columns = [
          { header: 'Matricule', key: 'Matricule', width: 15 },
          { header: 'Nom', key: 'nom', width: 15 },
          { header: 'Prénom', key: 'prenom', width: 15 },
          { header: 'Note', key: 'Moyenne', width: 10 },
          { header: 'Remarque', key: 'remarque', width: 20 },
        ];

        grades.forEach((grade) => {
          worksheet.addRow({
            Matricule: grade.Matricule,
            nom: grade.nom,
            prenom: grade.prenom,
            Moyenne: grade.Moyenne,
            remarque: grade.remarque || '-',
          });
        });

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D3D3D3' },
        };

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Grades_${idModule}_${idSection}_${semestre}.xlsx"`);
        res.send(buffer);
      } else {
        return res.status(400).json({ error: 'Invalid export format.' });
      }
    } else {
      res.json(grades);
    }
  } catch (err) {
    console.error('Error fetching existing grades:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch grades', details: err.message });
  }
});

router.get('/student-level', authenticate, async (req, res) => {
  try {
    const matricule = req.user.matricule;
    const [student] = await db.query(
      `SELECT niveau FROM Etudiant WHERE Matricule = ?`,
      [matricule]
    );

    if (!student.length) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.json({ niveau: student[0].niveau });
  } catch (err) {
    console.error('Error fetching student level:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch student level', details: err.message });
  }
});

router.get('/student-grades', authenticate, async (req, res) => {
  try {
    const matricule = req.user.matricule;
    const { niveau, semestre } = req.query;

    if (!niveau || !semestre) {
      return res.status(400).json({ error: 'Niveau and semestre are required.' });
    }

    const [student] = await db.query(
      `SELECT niveau FROM Etudiant WHERE Matricule = ?`,
      [matricule]
    );

    if (!student.length) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const currentLevel = student[0].niveau;
    const levels = ['L1', 'L2', 'L3', 'M1', 'M2', 'ING1', 'ING2', 'ING3'];
    const currentIndex = levels.indexOf(currentLevel);
    const requestedIndex = levels.indexOf(niveau);

    if (requestedIndex > currentIndex) {
      return res.status(400).json({ error: `Cannot access grades for ${niveau}. You are currently in ${currentLevel}.` });
    }

    const [grades] = await db.query(`
      SELECT me.Matricule, me.ID_module, m.nom_module, me.Semestre, me.Moyenne, me.remarque, me.niveau,
             r.reclamation_text AS reclamation, r.prof_response
      FROM Module_Etudiant me
      JOIN Module m ON me.ID_module = m.ID_module
      LEFT JOIN Reclamation r ON me.ID_module = r.ID_module 
        AND me.Matricule = r.Matricule_etudiant 
        AND me.Semestre = r.Semestre
      WHERE me.Matricule = ? AND me.niveau = ? AND me.Semestre = ?
    `, [matricule, niveau, semestre]);

    if (!grades.length) {
      return res.status(404).json({ error: `No grades found for ${niveau} ${semestre}.` });
    }

    res.json(grades);
  } catch (err) {
    console.error('Error fetching student grades:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch grades', details: err.message });
  }
});
router.post('/grades', authenticate, checkRole('enseignant'), async (req, res) => {
  try {
    const { Matricule, ID_module, Semestre, Moyenne, remarque } = req.body;

    if (!Matricule || !ID_module || !Semestre || !Moyenne) {
      return res.status(400).json({ error: 'Matricule, ID_module, Semestre, and Moyenne are required.' });
    }

    // Fetch the student's niveau from Etudiant_Section and Section
    const [studentSection] = await db.query(`
      SELECT s.niveau
      FROM Etudiant_Section es
      JOIN Section s ON es.ID_section = s.ID_section
      WHERE es.Matricule = ?
    `, [Matricule]);

    if (!studentSection.length) {
      return res.status(404).json({ error: 'Student section not found.' });
    }

    const niveau = studentSection[0].niveau;

    // Insert or update the grade with the niveau
    await db.query(`
      INSERT INTO Module_Etudiant (Matricule, ID_module, Semestre, Moyenne, remarque, niveau)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE Moyenne = ?, remarque = ?, niveau = ?
    `, [Matricule, ID_module, Semestre, Moyenne, remarque, niveau, Moyenne, remarque, niveau]);

    res.status(201).json({ message: 'Grade added/updated successfully.' });
  } catch (err) {
    console.error('Error adding/updating grade:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to add/update grade', details: err.message });
  }
});
router.get('/student-level', authenticate, checkRole('etudiant'), async (req, res) => {
  try {
    const matricule = req.user.matricule;
    const [student] = await db.query(
      `SELECT niveau FROM Etudiant WHERE Matricule = ?`,
      [matricule]
    );

    if (!student.length) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.json({ niveau: student[0].niveau });
  } catch (err) {
    console.error('Error fetching student level:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch student level', details: err.message });
  }
});
// Fetch professor grades
router.get('/professor-grades/:matricule', authenticate, checkRole('enseignant'), async (req, res) => {
  const { matricule } = req.params;
  const { semestre } = req.query;

  if (matricule !== req.user.matricule) {
    return res.status(403).json({ error: 'You can only view your own assigned grades' });
  }

  try {
    let query = `
      SELECT me.*, u.nom, u.prenom, m.nom_module, s.niveau, s.ID_section
      FROM Module_Etudiant me
      JOIN User u ON me.Matricule = u.Matricule
      JOIN Module m ON me.ID_module = m.ID_module
      JOIN Module_Enseignant me_ens ON m.ID_module = me_ens.ID_module
      JOIN Etudiant_Section es ON u.Matricule = es.Matricule
      JOIN Section s ON es.ID_section = s.ID_section
      WHERE me_ens.Matricule = ?
    `;
    const params = [matricule];
    if (semestre) {
      query += ' AND me.Semestre = ?';
      params.push(semestre);
    }

    const [grades] = await db.query(query, params);
    res.json(grades);
  } catch (err) {
    console.error('Error fetching professor grades:', err.message, err.stack);
    res.status(500).json({ error: 'Error fetching grades', details: err.message });
  }
});

router.post('/grades/import', authenticate, checkRole('enseignant'), upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const professorMatricule = req.user.matricule; // From JWT token
    if (!file) return res.status(400).json({ error: 'Aucun fichier téléchargé.' });

    const module_id = req.query.module_id;
    const semestre = req.query.semestre;
    if (!module_id || isNaN(module_id)) return res.status(400).json({ error: 'L\'identifiant du module est requis.' });
    if (!semestre || !['S1', 'S2'].includes(semestre)) return res.status(400).json({ error: 'Le semestre est requis (S1 ou S2).' });

    // Verify that the professor is assigned to the module
    const [assignment] = await db.query(
      'SELECT * FROM Module_Enseignant WHERE Matricule = ? AND ID_module = ?',
      [professorMatricule, module_id]
    );
    if (!assignment.length) {
      return res.status(403).json({ error: 'Vous n’êtes pas assigné à ce module.' });
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false });

    console.log('Raw Excel Data:', data);

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
        if (normalizedKey === normalizeString('Nom')) normalizedRow['Nom'] = row[key]?.trim();
        if (normalizedKey === normalizeString('Prénom')) normalizedRow['Prénom'] = row[key]?.trim();
        if (normalizedKey === normalizeString('note')) normalizedRow['note'] = row[key]?.trim();
        if (normalizedKey === normalizeString('remarque')) normalizedRow['remarque'] = row[key]?.trim();
      }
      return normalizedRow;
    });

    console.log('Normalized Data:', normalizedData);

    const requiredColumns = ['Nom', 'Prénom', 'note'];
    if (!normalizedData.every(row => requiredColumns.every(col => row[col] !== undefined && row[col] !== ''))) {
      return res.status(400).json({ error: `Colonnes requises : ${requiredColumns.join(', ')}.` });
    }

    const processedGrades = [];
    const skippedGrades = [];
    const insertPromises = normalizedData.map(async (row) => {
      const nom = row.Nom;
      const prenom = row.Prénom;
      let note = parseFloat(row.note);
      const remarque = row.remarque || '';

      if (isNaN(note) || note < 0 || note > 20) {
        skippedGrades.push({ nom, prenom, reason: 'Note invalide (doit être un nombre entre 0 et 20)' });
        return;
      }

      // Map semestre from 'S1'/'S2' to '1'/'2' as stored in Module_Section
      const semestreValue = semestre === 'S1' ? '1' : '2';

      // Look up the student by nom and prenom, ensuring they are in the Etudiant table and in a section taking the module for the specific semestre
      const [student] = await db.query(`
        SELECT u.Matricule, u.nom, u.prenom, es.ID_section
        FROM User u
        JOIN Etudiant e ON u.Matricule = e.Matricule
        JOIN Etudiant_Section es ON u.Matricule = es.Matricule
        JOIN Module_Section ms ON es.ID_section = ms.ID_section
        WHERE u.nom = ? AND u.prenom = ? AND ms.ID_module = ? AND ms.semestre = ?
      `, [nom, prenom, module_id, semestreValue]);
      console.log(`Checking student ${nom} ${prenom} for module ${module_id}, semestre ${semestreValue}:`, student);

      if (!student.length) {
        skippedGrades.push({ nom, prenom, reason: 'Étudiant non trouvé ou non inscrit dans une section prenant ce module pour ce semestre' });
        processedGrades.push({ Matricule: null, nom, prenom, note, remarque, status: 'skipped' });
        return;
      }

      if (student.length > 1) {
        skippedGrades.push({ nom, prenom, reason: 'Plusieurs étudiants trouvés avec le même nom et prénom' });
        processedGrades.push({ Matricule: null, nom, prenom, note, remarque, status: 'skipped' });
        return;
      }

      const student_id = student[0].Matricule;

      const [existingGrade] = await db.query(
        'SELECT * FROM Module_Etudiant WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
        [student_id, module_id, semestre]
      );

      if (existingGrade.length) {
        await db.query(
          'UPDATE Module_Etudiant SET Moyenne = ?, remarque = ? WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
          [note, remarque, student_id, module_id, semestre]
        );
        processedGrades.push({ Matricule: student_id, nom, prenom, note, remarque, status: 'updated' });
      } else {
        await db.query(
          'INSERT INTO Module_Etudiant (ID_module, Matricule, Semestre, Moyenne, remarque) VALUES (?, ?, ?, ?, ?)',
          [module_id, student_id, semestre, note, remarque]
        );
        processedGrades.push({ Matricule: student_id, nom, prenom, note, remarque, status: 'inserted' });
      }
    });

    await Promise.all(insertPromises);

    const importedCount = processedGrades.filter(g => g.status !== 'skipped').length;

    console.log('Processed Grades:', processedGrades);
    console.log('Skipped Grades:', skippedGrades);

    res.status(201).json({
      message: importedCount > 0 ? 'Notes importées' : 'Aucune note importée',
      importedCount,
      skippedCount: skippedGrades.length,
      processedGrades,
      skippedGrades,
    });
  } catch (err) {
    console.error('Error importing grades:', err.message, err.stack);
    res.status(500).json({ error: `Erreur : ${err.message}` });
  }
});

// Submit grades manually
router.post('/grades/submit', authenticate, checkRole('enseignant'), async (req, res) => {
  const { section_id, grades, semestre } = req.body;

  if (!section_id || !semestre || !grades || !Array.isArray(grades) || grades.length === 0) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const professorMatricule = req.user.matricule;
    const moduleId = grades[0].ID_module;

    // Check if the professor is assigned to this module
    const [assignment] = await connection.query(
      'SELECT * FROM Module_Enseignant WHERE Matricule = ? AND ID_module = ?',
      [professorMatricule, moduleId]
    );
    if (!assignment.length) {
      await connection.rollback();
      return res.status(403).json({ error: 'You are not assigned to teach this module' });
    }

    // Insert or update grades
    const insertPromises = grades.map(async (grade) => {
      if (!grade.Matricule || !grade.ID_module || isNaN(grade.Moyenne) || grade.Moyenne < 0 || grade.Moyenne > 20) {
        return;
      }

      // Check if the student exists
      const [student] = await connection.query('SELECT Matricule FROM User WHERE Matricule = ?', [grade.Matricule]);
      if (!student.length) {
        return;
      }

      // Insert or update the grade
      await connection.query(
        'INSERT INTO Module_Etudiant (ID_module, Matricule, Semestre, Moyenne, remarque) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Moyenne = ?, remarque = ?',
        [grade.ID_module, grade.Matricule, semestre, grade.Moyenne, grade.remarque || '', grade.Moyenne, grade.remarque || '']
      );

      // Send notification to the student
      const [module] = await connection.query('SELECT nom_module FROM Module WHERE ID_module = ?', [grade.ID_module]);
      const notificationContent = `Votre note pour le module ${module[0].nom_module} (Semestre ${semestre}) a été soumise : ${grade.Moyenne}/20.`;
      await sendNotification(connection, professorMatricule, grade.Matricule, notificationContent);
    });

    await Promise.all(insertPromises);
    await connection.commit();
    res.status(201).json({ message: 'Grades submitted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error submitting grades:', err.message, err.stack);
    res.status(500).json({ error: 'Error submitting grades', details: err.message });
  } finally {
    connection.release();
  }
});

// Delete a single grade
router.delete('/grades/:matricule/:module_id/:semestre', async (req, res) => {
  const { matricule, module_id, semestre } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete the grade from Module_Etudiant
    const [result] = await connection.query(
      'DELETE FROM Module_Etudiant WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
      [matricule, module_id, semestre]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Note non trouvée.' });
    }

    // Delete related notifications
    await connection.query(
      'DELETE FROM Notification WHERE destinataire = ? AND contenu LIKE ?',
      [matricule, `%module%Semestre ${semestre}%soumise%`]
    );

    await connection.commit();
    res.status(200).json({ message: 'Note supprimée avec succès.' });
  } catch (err) {
    await connection.rollback();
    console.error('Error deleting grade:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la suppression de la note', details: err.message });
  } finally {
    connection.release();
  }
});

// Delete multiple grades
router.delete('/grades', async (req, res) => {
  const { idSection, idModule, semestre } = req.query;
  if (!idSection || !idModule || !semestre) {
    return res.status(400).json({ error: 'idSection, idModule et semestre sont requis.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch the grades to be deleted (to get the list of Matricules for notification deletion)
    const [grades] = await connection.query(`
      SELECT me.Matricule
      FROM Module_Etudiant me
      JOIN Etudiant_Section es ON me.Matricule = es.Matricule
      WHERE me.ID_module = ? AND es.ID_section = ? AND me.Semestre = ?
    `, [idModule, idSection, semestre]);

    if (grades.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Aucune note trouvée pour cette combinaison.' });
    }

    // Delete the grades from Module_Etudiant
    const [deleteResult] = await connection.query(`
      DELETE me FROM Module_Etudiant me
      JOIN Etudiant_Section es ON me.Matricule = es.Matricule
      WHERE me.ID_module = ? AND es.ID_section = ? AND me.Semestre = ?
    `, [idModule, idSection, semestre]);

    // Delete related notifications
    const matricules = grades.map(g => g.Matricule);
    if (matricules.length > 0) {
      await connection.query(
        `DELETE FROM Notification WHERE destinataire IN (${matricules.map(() => '?').join(',')}) AND contenu LIKE ?`,
        [...matricules, `%module%Semestre ${semestre}%soumise%`]
      );
    }

    await connection.commit();
    res.status(200).json({ message: 'Liste de notes supprimée avec succès.', deletedCount: deleteResult.affectedRows });
  } catch (err) {
    await connection.rollback();
    console.error('Error deleting grades:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la suppression de la liste de notes', details: err.message });
  } finally {
    connection.release();
  }
});

// Professor responds to a reclamation
router.post('/reclamation/:id/respond', authenticate, checkRole('enseignant'), async (req, res) => {
  const { id } = req.params;
  const { prof_response } = req.body;
  const professorMatricule = req.user.matricule;

  if (!prof_response) {
    return res.status(400).json({ error: 'Professor response is required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if the reclamation exists and the professor is assigned to the module
    const [reclamation] = await connection.query(
      'SELECT r.ID_module, r.Matricule_etudiant, r.Semestre FROM Reclamation r WHERE r.ID_reclamation = ?',
      [id]
    );
    if (!reclamation.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reclamation not found' });
    }

    const { ID_module, Matricule_etudiant, Semestre } = reclamation[0];
    const [assignment] = await connection.query(
      'SELECT * FROM Module_Enseignant WHERE Matricule = ? AND ID_module = ?',
      [professorMatricule, ID_module]
    );
    if (!assignment.length) {
      await connection.rollback();
      return res.status(403).json({ error: 'You are not assigned to this module' });
    }

    // Update the reclamation with the professor's response
    const [result] = await connection.query(
      'UPDATE Reclamation SET prof_response = ?, date_response = NOW() WHERE ID_reclamation = ?',
      [prof_response, id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Reclamation not found' });
    }

    // Notify the student
    const [module] = await connection.query('SELECT nom_module FROM Module WHERE ID_module = ?', [ID_module]);
    const notificationContent = `Le professeur a répondu à votre réclamation pour le module ${module[0].nom_module} (Semestre ${Semestre}): "${prof_response}".`;
    await sendNotification(connection, professorMatricule, Matricule_etudiant, notificationContent);

    await connection.commit();
    res.json({ message: 'Response submitted successfully' });
  } catch (err) {
    await connection.rollback();
    console.error('Error responding to reclamation:', err.message, err.stack);
    res.status(500).json({ error: 'Error responding to reclamation', details: err.message });
  } finally {
    connection.release();
  }
});

// Fetch reclamations for a professor
router.get('/reclamations', authenticate, checkRole('enseignant'), async (req, res) => {
  const professorMatricule = req.user.matricule;

  try {
    const [reclamations] = await db.query(`
      SELECT r.ID_reclamation, r.ID_module, r.Matricule_etudiant, r.Semestre, r.reclamation_text, r.date_reclamation, r.prof_response, r.date_response, m.nom_module, u.nom, u.prenom
      FROM Reclamation r
      JOIN Module_Enseignant me ON r.ID_module = me.ID_module
      JOIN Module m ON r.ID_module = m.ID_module
      JOIN User u ON r.Matricule_etudiant = u.Matricule
      WHERE me.Matricule = ?
    `, [professorMatricule]);

    res.json(reclamations);
  } catch (err) {
    console.error('Error fetching reclamations:', err.message, err.stack);
    res.status(500).json({ error: 'Error fetching reclamations', details: err.message });
  }
});

// Update a grade
router.put('/grades/:matricule/:module_id/:semestre', authenticate, checkRole('enseignant'), async (req, res) => {
  const { matricule, module_id, semestre } = req.params;
  const { Moyenne, remarque } = req.body;
  const professorMatricule = req.user.matricule;

  if (Moyenne === undefined || isNaN(Moyenne) || Moyenne < 0 || Moyenne > 20) {
    return res.status(400).json({ error: 'La note doit être un nombre entre 0 et 20.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if the professor is assigned to this module
    const [assignment] = await connection.query(
      'SELECT * FROM Module_Enseignant WHERE Matricule = ? AND ID_module = ?',
      [professorMatricule, module_id]
    );
    if (!assignment.length) {
      await connection.rollback();
      return res.status(403).json({ error: 'You are not assigned to this module' });
    }

    // Update the grade in Module_Etudiant
    const [result] = await connection.query(
      'UPDATE Module_Etudiant SET Moyenne = ?, remarque = ? WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
      [Moyenne, remarque || '', matricule, module_id, semestre]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Note non trouvée.' });
    }

    // Fetch the module name for the notification
    const [module] = await connection.query('SELECT nom_module FROM Module WHERE ID_module = ?', [module_id]);
    if (!module.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Module non trouvé.' });
    }
    const moduleName = module[0].nom_module;

    // Send notification to the student
    const notificationContent = `Votre note pour le module ${moduleName} (Semestre ${semestre}) a été mise à jour : ${Moyenne}/20.`;
    await sendNotification(connection, professorMatricule, matricule, notificationContent);

    await connection.commit();
    res.status(200).json({ message: 'Note mise à jour avec succès.' });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating grade:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la note', details: err.message });
  } finally {
    connection.release();
  }
});

export default router;