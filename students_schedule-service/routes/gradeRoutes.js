import express from 'express';
import db from '../config/db.js';
import XLSX from 'xlsx';
import multer from 'multer';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get('/facultes', async (req, res) => {
  try {
    const [facultes] = await db.query('SELECT * FROM faculte');
    res.json(facultes);
  } catch (err) {
    console.error('Error fetching facultes:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des facultés', details: err.message });
  }
});

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

router.get('/existing-grades', async (req, res) => {
  const { idSection, idModule, semestre } = req.query;
  try {
    const [grades] = await db.query(`
      SELECT me.*, u.nom, u.prenom, m.nom_module, s.niveau, s.ID_section
      FROM Module_Etudiant me
      JOIN User u ON me.Matricule = u.Matricule
      JOIN Module m ON me.ID_module = m.ID_module
      JOIN Etudiant_Section es ON u.Matricule = es.Matricule
      JOIN Section s ON es.ID_section = s.ID_section
      WHERE me.ID_module = ? AND s.ID_section = ? AND me.Semestre = ?
    `, [idModule, idSection, semestre]);
    res.json(grades);
  } catch (err) {
    console.error('Error fetching existing grades:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la récupération des notes existantes', details: err.message });
  }
});

router.get('/professor-grades/:matricule', async (req, res) => {
  const { matricule } = req.params;
  const { semestre } = req.query;
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
    res.status(500).json({ error: 'Erreur lors de la récupération des notes du professeur', details: err.message });
  }
});

router.post('/grades/import', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Aucun fichier téléchargé.' });

    const module_id = req.query.module_id;
    const semestre = req.query.semestre;
    if (!module_id || isNaN(module_id)) return res.status(400).json({ error: 'L\'identifiant du module est requis.' });
    if (!semestre || !['S1', 'S2'].includes(semestre)) return res.status(400).json({ error: 'Le semestre est requis (S1 ou S2).' });

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

      const [student] = await db.query('SELECT Matricule FROM User WHERE nom = ? AND prenom = ?', [nom, prenom]);
      if (!student.length) {
        skippedGrades.push({ nom, prenom, reason: 'Étudiant non trouvé dans la base de données' });
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

router.post('/grades/submit', async (req, res) => {
  const { section_id, grades, semestre } = req.body;

  if (!section_id) return res.status(400).json({ error: 'L\'identifiant de la section est requis.' });
  if (!semestre || !['S1', 'S2'].includes(semestre)) {
    return res.status(400).json({ error: 'Le semestre est requis (S1 ou S2)' });
  }
  if (!grades || !Array.isArray(grades) || grades.length === 0) {
    return res.status(400).json({ error: 'Les notes sont requises et doivent être un tableau non vide.' });
  }

  try {
    if (!grades[0].ID_module || isNaN(grades[0].ID_module)) {
      throw new Error('ID_module manquant ou invalide dans les données des notes.');
    }

    const [teacher] = await db.query('SELECT Matricule FROM Module_Enseignant WHERE ID_module = ?', [grades[0].ID_module]);
    if (!teacher.length) {
      return res.status(404).json({ error: 'Enseignant non trouvé pour ce module.' });
    }
    const teacherMatricule = teacher[0].Matricule;

    const [teacherUser] = await db.query('SELECT Matricule FROM User WHERE Matricule = ?', [teacherMatricule]);
    if (!teacherUser.length) {
      return res.status(404).json({ error: 'Enseignant non trouvé dans la base de données.' });
    }

    const [module] = await db.query('SELECT nom_module FROM Module WHERE ID_module = ?', [grades[0].ID_module]);
    if (!module.length) {
      return res.status(404).json({ error: 'Module non trouvé.' });
    }
    const moduleName = module[0].nom_module;

    const insertPromises = grades.map(async (grade) => {
      if (!grade.Matricule || !grade.ID_module || grade.Moyenne === undefined || grade.Moyenne === null || isNaN(grade.Moyenne)) {
        console.log(`Skipping invalid grade: ${JSON.stringify(grade)}`);
        return;
      }

      if (grade.Moyenne < 0 || grade.Moyenne > 20) {
        console.log(`Skipping grade with invalid Moyenne (${grade.Moyenne}) for student ${grade.Matricule}`);
        return;
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        const [result] = await connection.query(
          'INSERT INTO Module_Etudiant (ID_module, Matricule, Semestre, Moyenne, remarque) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Moyenne = ?, remarque = ?',
          [grade.ID_module, grade.Matricule, semestre, grade.Moyenne, grade.remarque || '', grade.Moyenne, grade.remarque || '']
        );

        console.log(`Grade for student ${grade.Matricule} (Module ${grade.ID_module}, Semestre ${semestre}): `, result);

        const [student] = await connection.query('SELECT Matricule FROM User WHERE Matricule = ?', [grade.Matricule]);
        if (!student.length) {
          console.log(`Student ${grade.Matricule} not found in User table. Skipping notification.`);
          await connection.rollback();
          return;
        }

        const notificationContent = `Votre note pour le module ${moduleName} (Semestre ${semestre}) a été soumise : ${grade.Moyenne}/20.`;
        const [notificationResult] = await connection.query(
          'INSERT INTO Notification (contenu, expediteur, destinataire) VALUES (?, ?, ?)',
          [notificationContent, teacherMatricule, grade.Matricule]
        );

        console.log(`Notification created for student ${grade.Matricule}: `, notificationResult);

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        console.error(`Error processing grade for student ${grade.Matricule}:`, err.message, err.stack);
        throw err;
      } finally {
        connection.release();
      }
    });

    await Promise.all(insertPromises);
    res.status(201).json({ message: 'Notes soumises avec succès et notifications envoyées.' });
  } catch (err) {
    console.error('Error submitting grades:', err.message, err.stack);
    res.status(500).json({ error: 'Erreur lors de la soumission des notes', details: err.message });
  }
});

router.delete('/grades/:matricule/:module_id/:semestre', async (req, res) => {
  const { matricule, module_id, semestre } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'DELETE FROM Module_Etudiant WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
      [matricule, module_id, semestre]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Note non trouvée.' });
    }

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

router.delete('/grades', async (req, res) => {
  const { idSection, idModule, semestre } = req.query;
  if (!idSection || !idModule || !semestre) {
    return res.status(400).json({ error: 'idSection, idModule et semestre sont requis.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

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

    const [deleteResult] = await connection.query(`
      DELETE me FROM Module_Etudiant me
      JOIN Etudiant_Section es ON me.Matricule = es.Matricule
      WHERE me.ID_module = ? AND es.ID_section = ? AND me.Semestre = ?
    `, [idModule, idSection, semestre]);

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

router.put('/grades/:matricule/:module_id/:semestre', async (req, res) => {
  const { matricule, module_id, semestre } = req.params;
  const { Moyenne, remarque } = req.body;

  if (Moyenne === undefined || isNaN(Moyenne) || Moyenne < 0 || Moyenne > 20) {
    return res.status(400).json({ error: 'La note doit être un nombre entre 0 et 20.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      'UPDATE Module_Etudiant SET Moyenne = ?, remarque = ? WHERE Matricule = ? AND ID_module = ? AND Semestre = ?',
      [Moyenne, remarque || '', matricule, module_id, semestre]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Note non trouvée.' });
    }

    const [teacher] = await connection.query('SELECT Matricule FROM Module_Enseignant WHERE ID_module = ?', [module_id]);
    if (!teacher.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Enseignant non trouvé pour ce module.' });
    }
    const teacherMatricule = teacher[0].Matricule;

    const [module] = await connection.query('SELECT nom_module FROM Module WHERE ID_module = ?', [module_id]);
    if (!module.length) {
      await connection.rollback();
      return res.status(404).json({ error: 'Module non trouvé.' });
    }
    const moduleName = module[0].nom_module;

    const notificationContent = `Votre note pour le module ${moduleName} (Semestre ${semestre}) a été mise à jour : ${Moyenne}/20.`;
    await connection.query(
      'INSERT INTO Notification (contenu, expediteur, destinataire) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE contenu = ?',
      [notificationContent, teacherMatricule, matricule, notificationContent]
    );

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