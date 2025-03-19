const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

// Fonction pour générer un mot de passe aléatoire de taille fixe
const generateRandomPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

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
    const [specialite] = await db.query('SELECT * FROM Specialite WHERE ID_specialite = ?', [id]);
    if (specialite.length === 0) {
      return res.status(404).json({ error: 'Spécialité introuvable. Vérifiez l\'identifiant.' });
    }
    res.json(specialite[0]);
  } catch (err) {
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour récupérer les filtres
router.get('/filters', async (req, res) => {
  try {
    const [facultes] = await db.query('SELECT * FROM faculte');
    const [departements] = await db.query('SELECT * FROM Departement');
    const [specialites] = await db.query('SELECT * FROM Specialite');
    res.json({ facultes, departements, specialites });
  } catch (err) {
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
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
    console.error(err);
    res.status(500).json({ error: 'Une erreur s’est produite lors du filtrage. Veuillez réessayer.' });
  }
});

// Route pour ajouter une section
router.post('/sections', async (req, res) => {
  const { idSpecialite, matriculeEnseignant, niveau } = req.body;
  if (!idSpecialite || !niveau) {
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
      'INSERT INTO Section (ID_specialite, Matricule, niveau) VALUES (?, ?, ?)',
      [idSpecialite, matriculeValue, niveau]
    );

    res.status(201).json({
      message: 'Section ajoutée avec succès !',
      idSection: result.insertId,
      nom_specialite: specialite[0].nom_specialite,
      niveau: niveau
    });
  } catch (err) {
    console.error(err);
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
  const { matricule, nom, prenom, email, niveau, etat, anneeInscription, nomSpecialite } = req.body;

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

    // Vérifier si la spécialité existe
    const [specialite] = await db.query('SELECT ID_specialite FROM Specialite WHERE nom_specialite = ?', [nomSpecialite]);
    if (specialite.length === 0) {
      return res.status(400).json({ error: 'La spécialité sélectionnée n\'existe pas.' });
    }
    const idSpecialite = specialite[0].ID_specialite;

    // Vérifier si l'étudiant existe déjà
    const [existingStudent] = await db.query('SELECT * FROM Etudiant WHERE Matricule = ?', [matriculeNum]);
    let studentExistsInSection = false;
    let isSameSection = false;

    if (existingStudent.length > 0) {
      // Vérifier si l'étudiant est assigné à une section (n'importe laquelle)
      const [sectionCheck] = await db.query(
        'SELECT es.ID_section, sp.nom_specialite ' +
        'FROM Etudiant_Section es ' +
        'JOIN Section s ON es.ID_section = s.ID_section ' +
        'JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite ' +
        'WHERE es.Matricule = ?',
        [matriculeNum]
      );
      if (sectionCheck.length > 0) {
        studentExistsInSection = true;
        // Vérifier si l'étudiant est dans la même section
        isSameSection = sectionCheck[0].ID_section === parseInt(sectionId);
        if (!isSameSection) {
          // Si l'étudiant est dans une autre section, retourner une erreur
          return res.status(400).json({
            error: `Cet étudiant existe déjà dans une autre section de la spécialité ${sectionCheck[0].nom_specialite}.`
          });
        }
      }
    }

    // Vérifier l'unicité de l'email (uniquement si l'étudiant est nouveau ou n'est pas assigné à une section)
    const [existingEmail] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    if (existingEmail.length > 0 && existingEmail[0].Matricule !== matriculeNum) {
      return res.status(400).json({ error: `Cet email (${email}) est déjà utilisé par un autre utilisateur.` });
    }

    // Vérifier si la section existe
    const [section] = await db.query('SELECT * FROM Section WHERE ID_section = ?', [sectionId]);
    if (section.length === 0) {
      return res.status(400).json({ error: 'Section introuvable.' });
    }

    // Vérifier si l'utilisateur existe déjà pour décider si on génère un mot de passe
    const [existingUser] = await db.query('SELECT * FROM User WHERE Matricule = ?', [matriculeNum]);
    let randomPassword = null;
    if (existingUser.length === 0) {
      // Générer un mot de passe uniquement pour les nouveaux utilisateurs
      randomPassword = generateRandomPassword();
    }

    // Ajout ou mise à jour de l'étudiant avec transaction
    await db.query('START TRANSACTION');

    if (randomPassword) {
      // Si l'utilisateur est nouveau, insérer avec le mot de passe
      await db.query(
        'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nom = VALUES(nom), prenom = VALUES(prenom), email = VALUES(email)',
        [matriculeNum, nom, prenom, email, randomPassword]
      );
    } else {
      // Si l'utilisateur existe déjà, mettre à jour sans toucher au mot de passe
      await db.query(
        'INSERT INTO User (Matricule, nom, prenom, email) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nom = VALUES(nom), prenom = VALUES(prenom), email = VALUES(email)',
        [matriculeNum, nom, prenom, email]
      );
    }

    const [result] = await db.query(
      'INSERT INTO Etudiant (Matricule, niveau, etat, annee_inscription, ID_specialite) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE niveau = VALUES(niveau), etat = VALUES(etat), annee_inscription = VALUES(annee_inscription), ID_specialite = VALUES(ID_specialite)',
      [matriculeNum, niveau, etat || null, formattedDate, idSpecialite]
    );

    // Insérer dans Etudiant_Section uniquement si l'étudiant n'est pas déjà dans cette section
    if (!studentExistsInSection || !isSameSection) {
      await db.query(
        'INSERT INTO Etudiant_Section (Matricule, ID_section) VALUES (?, ?) ON DUPLICATE KEY UPDATE ID_section = VALUES(ID_section)',
        [matriculeNum, sectionId]
      );
    }

    await db.query('COMMIT');

    res.status(201).json({
      insertId: result.insertId,
      message: 'Étudiant ajouté avec succès !',
      generatedPassword: randomPassword // Renvoie le mot de passe uniquement s'il a été généré
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Erreur lors de l’ajout de l’étudiant :', err);
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

    const requiredColumns = ['Matricule', 'nom', 'prenom', 'email', 'niveau', 'annee_inscription'];
    if (!data.every(row => requiredColumns.every(col => row[col] !== undefined && row[col] !== ''))) {
      return res.status(400).json({ 
        error: `Le fichier Excel doit contenir toutes les colonnes suivantes avec des valeurs non vides : ${requiredColumns.join(', ')}.` 
      });
    }

    const validNiveaux = ['L1', 'L2', 'L3', 'M1', 'M2'];
    const validEtats = ['Admis', 'Admis avec dettes', 'Réintégré', null, 'Ajourné'];

    const [specialites] = await db.query('SELECT ID_specialite FROM Specialite');
    const validSpecialiteIds = specialites.map(s => s.ID_specialite);

    const [section] = await db.query('SELECT ID_specialite FROM Section WHERE ID_section = ?', [req.params.id]);
    if (section.length === 0) {
      return res.status(400).json({ error: 'Section introuvable.' });
    }
    const sectionSpecialiteId = section[0].ID_specialite;

    const importedStudents = [];
    const skippedStudents = [];

    const insertPromises = data.map(async (row, index) => {
      const formattedDate = convertDate(row.annee_inscription);
      if (!formattedDate) {
        throw new Error(`Ligne ${index + 2} : La date d'inscription est invalide. Utilisez un format correct (ex. JJ/MM/AAAA).`);
      }

      const year = new Date(formattedDate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (year < 2000 || year > currentYear + 1) {
        throw new Error(`Ligne ${index + 2} : L'année d'inscription (${year}) doit être entre 2000 et ${currentYear + 1}.`);
      }

      const matricule = parseInt(row.Matricule, 10);
      if (isNaN(matricule) || matricule <= 0) {
        throw new Error(`Ligne ${index + 2} : Le matricule (${row.Matricule}) doit être un nombre positif valide.`);
      }

      if (!validNiveaux.includes(row.niveau)) {
        throw new Error(`Ligne ${index + 2} : Le niveau (${row.niveau}) est invalide. Choisissez parmi : ${validNiveaux.join(', ')}.`);
      }

      const etat = row.etat || null;
      if (!validEtats.includes(etat)) {
        throw new Error(`Ligne ${index + 2} : L'état (${row.etat}) est invalide. Choisissez parmi : ${validEtats.filter(e => e !== null).join(', ')} ou laissez vide.`);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        throw new Error(`Ligne ${index + 2} : L'email (${row.email}) est invalide.`);
      }

      // Vérifier si l'étudiant existe déjà
      const [existingStudent] = await db.query('SELECT * FROM Etudiant WHERE Matricule = ?', [matricule]);
      let studentExistsInSection = false;
      let isSameSection = false;

      if (existingStudent.length > 0) {
        const [sectionCheck] = await db.query(
          'SELECT es.ID_section, sp.nom_specialite ' +
          'FROM Etudiant_Section es ' +
          'JOIN Section s ON es.ID_section = s.ID_section ' +
          'JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite ' +
          'WHERE es.Matricule = ?',
          [matricule]
        );
        if (sectionCheck.length > 0) {
          studentExistsInSection = true;
          // Vérifier si l'étudiant est dans la même section
          isSameSection = sectionCheck[0].ID_section === parseInt(req.params.id);
          if (!isSameSection) {
            // Si l'étudiant est dans une autre section, l'ignorer
            skippedStudents.push({
              matricule: matricule,
              nom: row.nom,
              prenom: row.prenom,
              reason: `Étudiant déjà assigné à une autre section de la spécialité ${sectionCheck[0].nom_specialite}`
            });
            return; // Ignorer cet étudiant
          }
        }
      }

      // Vérifier l'unicité de l'email (après la vérification de l'existence)
      const [existingEmail] = await db.query('SELECT * FROM User WHERE email = ?', [row.email]);
      if (existingEmail.length > 0 && existingEmail[0].Matricule !== matricule) {
        throw new Error(`Ligne ${index + 2} : L'email (${row.email}) est déjà utilisé par un autre utilisateur.`);
      }

      const idSpecialite = row.ID_specialite ? parseInt(row.ID_specialite, 10) : sectionSpecialiteId;
      if (!validSpecialiteIds.includes(idSpecialite)) {
        throw new Error(`Ligne ${index + 2} : L'ID_specialite (${idSpecialite}) n'existe pas dans la table Specialite.`);
      }

      // Vérifier si l'utilisateur existe déjà dans la table User
      const [existingUser] = await db.query('SELECT * FROM User WHERE Matricule = ?', [matricule]);
      console.log(`Étudiant avec matricule ${matricule} - Existe dans User : ${existingUser.length > 0}`);

      let randomPassword = null;

      try {
        await db.query('START TRANSACTION');

        // Si l'utilisateur n'existe pas, insérer avec un nouveau mot de passe
        if (existingUser.length === 0) {
          console.log(`Étudiant avec matricule ${matricule} - Nouvel utilisateur, génération d'un mot de passe.`);
          randomPassword = generateRandomPassword();
          await db.query(
            'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?)',
            [matricule, row.nom, row.prenom, row.email, randomPassword]
          );
        } else {
          // Si l'utilisateur existe déjà, mettre à jour sans toucher au mot de passe
          console.log(`Étudiant avec matricule ${matricule} - Utilisateur existant, mise à jour sans modifier le mot de passe.`);
          const [updateResult] = await db.query(
            'UPDATE User SET nom = ?, prenom = ?, email = ? WHERE Matricule = ?',
            [row.nom, row.prenom, row.email, matricule]
          );
          console.log(`Résultat de la mise à jour pour matricule ${matricule} :`, updateResult);
        }

        // Insérer ou mettre à jour dans la table Etudiant
        const [etudiantResult] = await db.query(
          'INSERT INTO Etudiant (Matricule, niveau, etat, annee_inscription, ID_specialite) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE niveau = VALUES(niveau), etat = VALUES(etat), annee_inscription = VALUES(annee_inscription), ID_specialite = VALUES(ID_specialite)',
          [matricule, row.niveau, etat, formattedDate, idSpecialite]
        );
        console.log(`Résultat de l'insertion/mise à jour dans Etudiant pour matricule ${matricule} :`, etudiantResult);

        // Insérer dans Etudiant_Section uniquement si l'étudiant n'est pas déjà dans cette section
        if (!studentExistsInSection || !isSameSection) {
          const [sectionResult] = await db.query(
            'INSERT INTO Etudiant_Section (Matricule, ID_section) VALUES (?, ?)',
            [matricule, req.params.id]
          );
          console.log(`Résultat de l'insertion dans Etudiant_Section pour matricule ${matricule} :`, sectionResult);
        }

        await db.query('COMMIT');
        console.log(`Transaction validée pour matricule ${matricule}`);

        // Ajouter l'étudiant à la liste des importés
        importedStudents.push({
          matricule: matricule,
          nom: row.nom,
          prenom: row.prenom,
          generatedPassword: randomPassword // Sera null pour les étudiants existants
        });
      } catch (err) {
        await db.query('ROLLBACK');
        console.error(`Erreur lors de la transaction pour matricule ${matricule} :`, err);
        throw new Error(`Ligne ${index + 2} : Erreur lors de l'insertion dans la base de données - ${err.message}`);
      }
    });

    await Promise.all(insertPromises);

    fs.unlinkSync(req.file.path);

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
    res.status(400).json({ error: err.message || 'Une erreur s’est produite lors de l’importation.' });
  }
});

module.exports = router;