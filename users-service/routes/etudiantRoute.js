const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

const convertDate = (dateValue) => {
  if (!dateValue) return null;

  let dateObj;
  if (dateValue instanceof Date) {
    dateObj = dateValue;
  } else if (typeof dateValue === 'string') {
    dateObj = new Date(dateValue);
    if (isNaN(dateObj.getTime())) {
      const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
      if (datePattern.test(dateValue)) {
        let [day, month, year] = dateValue.split('/').map(Number);
        if (year < 100) year += 2000;
        dateObj = new Date(year, month - 1, day);
      }
    }
  } else if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    const offsetDays = dateValue - 1;
    dateObj = new Date(excelEpoch.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    if (dateValue > 60) dateObj.setDate(dateObj.getDate() - 1);
  }

  if (isNaN(dateObj?.getTime())) return null;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Route pour récupérer une spécialité par ID
router.get('/specialites/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [specialite] = await db.query('SELECT * FROM specialite WHERE ID_specialite = ?', [id]);
    if (specialite.length === 0) {
      return res.status(404).json({ error: 'Spécialité introuvable. Vérifiez l\'identifiant.' });
    }
    res.json(specialite[0]);
  } catch (err) {
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour récupérer toutes les facultés
router.get('/facultes', async (req, res) => {
  try {
      const [facultes] = await db.query('SELECT * FROM faculte');
      res.json(facultes);
  } catch (err) {
      console.error('Erreur lors de la récupération des facultés:', err);
      res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les départements d'une faculté
router.get('/departements/:idFaculte', async (req, res) => {
  const { idFaculte } = req.params;
  try {
      const [departements] = await db.query('SELECT * FROM Departement WHERE ID_faculte = ?', [idFaculte]);
      res.json(departements);
  } catch (err) {
      console.error('Erreur lors de la récupération des départements:', err);
      res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer les spécialités d'un département
router.get('/specialites/:idDepartement', async (req, res) => {
  const { idDepartement } = req.params;
  try {
      const [specialites] = await db.query('SELECT * FROM Specialite WHERE ID_departement = ?', [idDepartement]);
      res.json(specialites);
  } catch (err) {
      console.error('Erreur lors de la récupération des spécialités:', err);
      res.status(500).json({ error: 'Erreur serveur' });
  }
});
// Route pour filtrer les sections
router.post('/etudiants/filtrer', async (req, res) => {
  const { niveau, idFaculte, idDepartement, idSpecialite } = req.body;

  if (!niveau || !idFaculte || !idDepartement || !idSpecialite) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs de filtrage.' });
  }

  const validNiveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
  if (!validNiveaux.includes(niveau)) {
    return res.status(400).json({ error: 'Niveau invalide. Choisissez parmi : L1, L2, L3, M1, M2.' });
  }

  if (isNaN(idFaculte) || isNaN(idDepartement) || isNaN(idSpecialite)) {
    return res.status(400).json({ error: 'Les identifiants doivent être des nombres valides.' });
  }

  try {
    const [sections] = await db.query(`
      SELECT DISTINCT s.ID_section, sp.nom_specialite, s.niveau
      FROM Section s
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
      JOIN Faculte f ON d.ID_faculte = f.ID_faculte
      WHERE f.ID_faculte = ? 
        AND d.ID_departement = ? 
        AND sp.ID_specialite = ?
        AND s.niveau = ?
    `, [parseInt(idFaculte), parseInt(idDepartement), parseInt(idSpecialite), niveau]);

    if (sections.length === 0) {
      return res.status(200).json({ message: 'Aucune section trouvée avec ces critères.' });
    }

    res.json(sections);
  } catch (err) {
    console.error(err); // Ajouter un log pour déboguer
    res.status(500).json({ error: 'Une erreur s’est produite lors du filtrage. Veuillez réessayer.' });
  }
});

router.get('/sections/:idSpecialite', async (req, res) => {
  const { idSpecialite } = req.params;
  
  try {
      console.log("Requête pour récupérer les sections de la spécialité:", idSpecialite); // Debug

      const [sections] = await db.query(
          'SELECT ID_section, niveau FROM Section WHERE ID_specialite = ?',
          [idSpecialite]
      );

      console.log("Sections récupérées:", sections); // Debug

      if (sections.length === 0) {
          return res.status(404).json({ error: 'Aucune section trouvée.' });
      }

      res.json(sections);
  } catch (err) {
      console.error('Erreur SQL lors de la récupération des sections:', err); // 🔴 Log SQL error
      res.status(500).json({ error: 'Erreur serveur lors de la récupération des sections' });
  }
});



// Route pour ajouter une section
router.post('/sections', async (req, res) => {
  const { idSpecialite, matriculeEnseignant, niveau } = req.body; // Ajouter niveau ici
  if (!idSpecialite || !niveau) { // Vérifier que niveau est fourni
    return res.status(400).json({ error: 'L\'identifiant de la spécialité et le niveau sont requis.' });
  }

  try {
    const [specialite] = await db.query('SELECT * FROM Specialite WHERE ID_specialite = ?', [idSpecialite]);
    if (specialite.length === 0) {
      return res.status(400).json({ error: 'Spécialité invalide.' });
    }

    let matriculeValue = matriculeEnseignant || null;
    if (matriculeEnseignant) {
      const [enseignant] = await db.query('SELECT * FROM Enseignant WHERE Matricule = ?', [matriculeEnseignant]);
      if (enseignant.length === 0) {
        return res.status(400).json({ error: 'Enseignant invalide.' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO Section (ID_specialite, Matricule, niveau) VALUES (?, ?, ?)', // Ajouter niveau dans l'insertion
      [idSpecialite, matriculeValue, niveau]
    );

    res.status(201).json({
      message: 'Section ajoutée avec succès !',
      idSection: result.insertId,
      nom_specialite: specialite[0].nom_specialite,
      niveau: niveau // Inclure le niveau dans la réponse
    });
  } catch (err) {
    console.error(err); // Ajouter un log pour déboguer
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour supprimer une section
router.delete('/sections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Section WHERE ID_section = ?', [id]);
    res.json({ message: 'Section supprimée avec succès !' });
  } catch (err) {
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour récupérer les étudiants d'une section
router.get('/sections/:id/etudiants', async (req, res) => {
  const { id } = req.params;
  try {
    const [students] = await db.query(`
      SELECT e.*, u.nom, u.prenom, u.email
      FROM Etudiant e
      JOIN User u ON e.Matricule = u.Matricule
      JOIN Etudiant_Section es ON e.Matricule = es.Matricule
      WHERE es.ID_section = ?
    `, [id]);

    const formattedStudents = students.map(student => {
      let anneeInscription = student.annee_inscription;
      if (anneeInscription && typeof anneeInscription === 'object' && anneeInscription instanceof Date) {
        anneeInscription = anneeInscription.toISOString().split('T')[0];
      }
      const formattedDate = convertDate(anneeInscription);
      return {
        ...student,
        annee_inscription: formattedDate || (anneeInscription ? anneeInscription.toString() : null)
      };
    });

    res.json(formattedStudents);
  } catch (err) {
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour ajouter un étudiant dans une section
router.post('/sections/:id/etudiants', async (req, res) => {
  const { id: sectionId } = req.params;
  const { matricule, nom, prenom, email, motdepasse, niveau, etat, anneeInscription, nomSpecialite } = req.body;

  // Validation des champs obligatoires (sauf etat)
  if (!matricule || !nom || !prenom || !email || !niveau || !anneeInscription || !nomSpecialite) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (sauf état).' });
  }

  const matriculeNum = parseInt(matricule, 10);
  if (isNaN(matriculeNum) || matriculeNum <= 0) {
    return res.status(400).json({ error: 'Le matricule doit être un nombre positif valide.' });
  }

  try {
    const formattedDate = convertDate(anneeInscription);
    if (!formattedDate) {
      return res.status(400).json({ error: 'La date d\'inscription est invalide. Utilisez un format correct (ex. JJ/MM/AAAA).' });
    }

    // Récupérer l'ID_specialite à partir du nomSpecialite
    const [specialite] = await db.query('SELECT ID_specialite FROM Specialite WHERE nom_specialite = ?', [nomSpecialite]);
    if (specialite.length === 0) {
      return res.status(400).json({ error: 'La spécialité sélectionnée n\'existe pas.' });
    }
    const idSpecialite = specialite[0].ID_specialite;

    // Vérifier si l'étudiant existe déjà
    const [existingStudent] = await db.query('SELECT * FROM Etudiant WHERE Matricule = ?', [matricule]);
    if (existingStudent.length > 0) {
      const [sectionCheck] = await db.query(
        'SELECT * FROM Etudiant_Section WHERE Matricule = ? AND ID_section = ?',
        [matricule, sectionId]
      );
      if (sectionCheck.length > 0) {
        return res.status(400).json({ error: 'Cet étudiant est déjà dans cette section.' });
      }
    }

    // Vérifier l'unicité de l'email
    const [existingEmail] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé. Choisissez un autre.' });
    }

    // Ajout de l'étudiant avec transaction
    await db.query('START TRANSACTION');

    await db.query(
      'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nom = VALUES(nom), prenom = VALUES(prenom), email = VALUES(email), motdepasse = VALUES(motdepasse)',
      [matricule, nom, prenom, email, motdepasse || 'default']
    );

    const [result] = await db.query(
      'INSERT INTO Etudiant (Matricule, niveau, etat, annee_inscription, ID_specialite) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE niveau = VALUES(niveau), annee_inscription = VALUES(annee_inscription), ID_specialite = VALUES(ID_specialite)',
      [matricule, niveau, etat || null, formattedDate, idSpecialite]
    );

    await db.query(
      'INSERT INTO Etudiant_Section (Matricule, ID_section) VALUES (?, ?) ON DUPLICATE KEY UPDATE ID_section = VALUES(ID_section)',
      [matricule, sectionId]
    );

    await db.query('COMMIT');

    res.json({ insertId: result.insertId, message: 'Étudiant ajouté avec succès !' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour modifier un étudiant
router.put('/etudiants/:matricule', async (req, res) => {
  const { nom, prenom, email, niveau, etat } = req.body;
  try {
    await db.query(
      'UPDATE Etudiant SET niveau = ?, etat = ? WHERE Matricule = ?',
      [niveau, etat || null, req.params.matricule]
    );
    await db.query(
      'UPDATE User SET nom = ?, prenom = ?, email = ? WHERE Matricule = ?',
      [nom, prenom, email, req.params.matricule]
    );
    res.json({ message: 'Étudiant modifié avec succès !' });
  } catch (err) {
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour supprimer un étudiant
router.delete('/etudiants/:matricule', async (req, res) => {
  const { matricule } = req.params;

  if (!matricule || matricule.trim() === '') {
    return res.status(400).json({ error: 'Le matricule est invalide.' });
  }

  try {
    await db.query('START TRANSACTION');

    await db.query('DELETE FROM Etudiant_Section WHERE Matricule = ?', [matricule]);
    await db.query('DELETE FROM Etudiant WHERE Matricule = ?', [matricule]);
    await db.query('DELETE FROM User WHERE Matricule = ?', [matricule]);

    await db.query('COMMIT');

    res.json({ message: 'Étudiant supprimé avec succès !' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour importer via Excel
router.post('/sections/:id/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Veuillez sélectionner un fichier Excel valide.' });
    }

    const workbook = xlsx.readFile(req.file.path, { dateNF: 'yyyy-mm-dd', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

    // Validation des colonnes obligatoires
    const requiredColumns = ['Matricule', 'nom', 'prenom', 'email', 'niveau', 'annee_inscription'];
    if (!data.every(row => requiredColumns.every(col => row[col] !== undefined && row[col] !== ''))) {
      return res.status(400).json({ 
        error: `Le fichier Excel doit contenir toutes les colonnes suivantes avec des valeurs non vides : ${requiredColumns.join(', ')}.` 
      });
    }

    // Validation des valeurs de niveau et etat
    const validNiveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
    const validEtats = ['Admis', 'Admis avec dettes', 'Réintégré', null]; // Inclure null comme valeur valide

    // Récupérer les ID_specialite valides
    const [specialites] = await db.query('SELECT ID_specialite FROM Specialite');
    const validSpecialiteIds = specialites.map(s => s.ID_specialite);

    // Récupérer l'ID_specialite de la section pour validation
    const [section] = await db.query('SELECT ID_specialite FROM Section WHERE ID_section = ?', [req.params.id]);
    if (section.length === 0) {
      return res.status(400).json({ error: 'Section introuvable.' });
    }
    const sectionSpecialiteId = section[0].ID_specialite;

    // Liste pour stocker les résultats (étudiants importés et ignorés)
    const importedStudents = [];
    const skippedStudents = [];

    const insertPromises = data.map(async (row, index) => {
      // Validation des données ligne par ligne
      const formattedDate = convertDate(row.annee_inscription);
      if (!formattedDate) {
        throw new Error(`Ligne ${index + 2} : La date d'inscription est invalide. Utilisez un format correct (ex. JJ/MM/AAAA).`);
      }

      const year = new Date(formattedDate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (year < 2000 || year > currentYear + 1) {
        throw new Error(`Ligne ${index + 2} : L'année d'inscription (${year}) doit être entre 2000 et ${currentYear + 1}.`);
      }

      // Validation du matricule
      const matricule = parseInt(row.Matricule, 10);
      if (isNaN(matricule) || matricule <= 0) {
        throw new Error(`Ligne ${index + 2} : Le matricule (${row.Matricule}) doit être un nombre positif valide.`);
      }

      // Validation du niveau
      if (!validNiveaux.includes(row.niveau)) {
        throw new Error(`Ligne ${index + 2} : Le niveau (${row.niveau}) est invalide. Choisissez parmi : ${validNiveaux.join(', ')}.`);
      }

      // Validation de l'état
      const etat = row.etat || null;
      if (!validEtats.includes(etat)) {
        throw new Error(`Ligne ${index + 2} : L'état (${row.etat}) est invalide. Choisissez parmi : ${validEtats.filter(e => e !== null).join(', ')} ou laissez vide.`);
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        throw new Error(`Ligne ${index + 2} : L'email (${row.email}) est invalide.`);
      }

      // Vérifier l'unicité de l'email
      const [existingEmail] = await db.query('SELECT * FROM User WHERE email = ?', [row.email]);
      if (existingEmail.length > 0 && existingEmail[0].Matricule !== matricule) {
        throw new Error(`Ligne ${index + 2} : L'email (${row.email}) est déjà utilisé par un autre utilisateur.`);
      }

      // Validation de l'ID_specialite
      const idSpecialite = row.ID_specialite ? parseInt(row.ID_specialite, 10) : sectionSpecialiteId;
      if (!validSpecialiteIds.includes(idSpecialite)) {
        throw new Error(`Ligne ${index + 2} : L'ID_specialite (${idSpecialite}) n'existe pas dans la table Specialite.`);
      }

      // Vérifier si l'étudiant existe déjà dans la base de données
      const [existingStudent] = await db.query('SELECT * FROM Etudiant WHERE Matricule = ?', [matricule]);
      if (existingStudent.length > 0) {
        // Vérifier si l'étudiant est déjà assigné à une section
        const [sectionCheck] = await db.query(
          'SELECT * FROM Etudiant_Section WHERE Matricule = ?',
          [matricule]
        );
        if (sectionCheck.length > 0) {
          // Étudiant déjà assigné à une section, on l'ignore
          skippedStudents.push({
            matricule: matricule,
            nom: row.nom,
            prenom: row.prenom,
            reason: `Étudiant déjà assigné à la section ID ${sectionCheck[0].ID_section}`
          });
          return; // Ignorer cet étudiant
        }
      }

      // Insertion avec transaction
      try {
        await db.query('START TRANSACTION');

        // Insérer dans User
        await db.query(
          'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?)',
          [matricule, row.nom, row.prenom, row.email, 'default']
        );

        // Insérer dans Etudiant
        await db.query(
          'INSERT INTO Etudiant (Matricule, niveau, etat, annee_inscription, ID_specialite) VALUES (?, ?, ?, ?, ?)',
          [matricule, row.niveau, etat, formattedDate, idSpecialite]
        );

        // Insérer dans Etudiant_Section
        await db.query(
          'INSERT INTO Etudiant_Section (Matricule, ID_section) VALUES (?, ?)',
          [matricule, req.params.id]
        );

        await db.query('COMMIT');

        // Ajouter à la liste des étudiants importés
        importedStudents.push({
          matricule: matricule,
          nom: row.nom,
          prenom: row.prenom
        });
      } catch (err) {
        await db.query('ROLLBACK');
        throw new Error(`Ligne ${index + 2} : Erreur lors de l'insertion dans la base de données - ${err.message}`);
      }
    });

    await Promise.all(insertPromises);

    // Supprimer le fichier temporaire
    fs.unlinkSync(req.file.path);

    // Ajuster le message en fonction du résultat
    if (importedStudents.length > 0) {
      res.json({
        message: 'Fichier importé avec succès !',
        importedCount: importedStudents.length,
        skippedCount: skippedStudents.length,
        importedStudents: importedStudents,
        skippedStudents: skippedStudents
      });
    } else {
      res.json({
        message: 'Aucun nouvel étudiant importé.',
        importedCount: importedStudents.length,
        skippedCount: skippedStudents.length,
        importedStudents: importedStudents,
        skippedStudents: skippedStudents
      });
    }
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Erreur lors de l’importation :', err);
    res.status(400).json({ error: err.message || 'Une erreur s’est produite lors de l’importation. Vérifiez le fichier et réessayez.' });
  }
});
module.exports = router;