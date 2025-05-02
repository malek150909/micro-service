const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

// Fonction pour générer un mot de passe aléatoire
const generateRandomPassword = (length = 8) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

// Fonction pour convertir une date
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

// Fonction pour envoyer une notification après une modification
const sendUpdateNotification = async (sectionId) => {
  try {
    console.log(`Envoi de la notification pour la section ${sectionId}`);

    // Récupérer le nom de la section et de la spécialité
    const [sectionInfo] = await db.query(`
      SELECT s.nom_section, sp.nom_specialite
      FROM Section s
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      WHERE s.ID_section = ?
    `, [sectionId]);

    if (sectionInfo.length === 0) {
      console.log(`Section ${sectionId} introuvable`);
      return;
    }

    const { nom_section, nom_specialite } = sectionInfo[0];
    const notificationContent = `La liste des étudiants de la ${nom_section} - ${nom_specialite} a été mise à jour, vous avez maintenant la nouvelle version.`;

    // Récupérer les enseignants associés à la section
    const [teachers] = await db.query(`
      SELECT Matricule
      FROM Enseignant_Section
      WHERE ID_section = ?
    `, [sectionId]);

    if (!teachers.length) {
      console.log(`Aucun enseignant trouvé pour la section ${sectionId}`);
      return;
    }

    // Tenter de récupérer le matricule de l'admin le plus récemment connecté
    const [admin] = await db.query(`
      SELECT u.Matricule  -- Spécifier u.Matricule pour éviter l'ambiguïté
      FROM admin a
      JOIN User u ON a.Matricule = u.Matricule
      ORDER BY u.Created_at DESC
      LIMIT 1
    `);

    const expediteurMatricule = admin.length > 0 ? admin[0].Matricule : null;
    if (!expediteurMatricule) {
      console.log('Aucun admin trouvé pour définir comme expéditeur, utilisation de NULL');
    }

    // Insérer une notification pour chaque enseignant avec l'expéditeur (ou NULL si non trouvé)
    for (const teacher of teachers) {
      console.log(`Envoi de la notification à l'enseignant ${teacher.Matricule} pour la section ${sectionId} par ${expediteurMatricule || 'NULL'}`);
      await db.query(`
        INSERT INTO Notification (contenu, expediteur, destinataire, date_envoi)
        VALUES (?, ?, ?, NOW())
      `, [notificationContent, expediteurMatricule, teacher.Matricule]);
    }

    console.log(`Notifications envoyées pour la section ${sectionId} par ${expediteurMatricule || 'NULL'}`);
  } catch (err) {
    console.error('Erreur lors de l\'envoi de la notification:', err.message || err);
  }
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

router.get('/filters', async (req, res) => {
  try {
    const [facultes] = await db.query('SELECT DISTINCT ID_faculte, nom_faculte FROM faculte');
    const [departements] = await db.query('SELECT DISTINCT ID_departement, Nom_departement, ID_faculte FROM Departement');
    const [specialites] = await db.query('SELECT DISTINCT ID_specialite, nom_specialite, ID_departement, ID_faculte FROM Specialite');

    const uniqueFacultes = [...new Map(facultes.map(f => [f.ID_faculte, f])).values()];
    const uniqueDepartements = [...new Map(departements.map(d => [d.ID_departement, d])).values()];
    const uniqueSpecialites = [...new Map(specialites.map(s => [s.ID_specialite, s])).values()];

    console.log('Facultés uniques renvoyées :', uniqueFacultes);
    console.log('Départements uniques renvoyés :', uniqueDepartements);
    console.log('Spécialités uniques renvoyées :', uniqueSpecialites);

    res.json({ facultes: uniqueFacultes, departements: uniqueDepartements, specialites: uniqueSpecialites });
  } catch (err) {
    console.error('Erreur dans GET /filters :', err);
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

  try {
    const [sections] = await db.query(`
      SELECT DISTINCT s.ID_section, sp.nom_specialite, s.niveau, s.nom_section, 
      (SELECT COUNT(*) FROM Groupe g WHERE g.ID_section = s.ID_section) as nombreGroupes
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

// Route pour ajouter une section avec groupes
router.post('/sections', async (req, res) => {
  const { idSpecialite, niveau, nombreGroupes, nom_section } = req.body;

  if (!idSpecialite || !niveau || !nombreGroupes || nombreGroupes < 1 || !nom_section) {
    return res.status(400).json({ error: 'L\'identifiant de la spécialité, le niveau, le nombre de groupes (≥ 1) et le nom de la section sont requis.' });
  }

  try {
    const [specialite] = await db.query('SELECT * FROM Specialite WHERE ID_specialite = ?', [idSpecialite]);
    if (specialite.length === 0) {
      return res.status(400).json({ error: 'Spécialité invalide.' });
    }

    await db.query('START TRANSACTION');

    const [result] = await db.query(
      'INSERT INTO Section (ID_specialite, niveau, nom_section) VALUES (?, ?, ?)',
      [idSpecialite, niveau, nom_section]
    );
    const sectionId = result.insertId;

    for (let i = 1; i <= nombreGroupes; i++) {
      await db.query(
        'INSERT INTO Groupe (num_groupe, ID_section) VALUES (?, ?)',
        [i, sectionId]
      );
    }

    await db.query('COMMIT');

    res.status(201).json({
      message: 'Section et groupes ajoutés avec succès !',
      idSection: sectionId,
      nom_specialite: specialite[0].nom_specialite,
      niveau: niveau,
      nom_section: nom_section,
      nombreGroupes: nombreGroupes
    });
  } catch (err) {
    await db.query('ROLLBACK');
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

// Route pour récupérer les étudiants d'une section avec leur groupe
router.get('/sections/:id/etudiants', async (req, res) => {
  const { id } = req.params;
  try {
    const [students] = await db.query(`
      SELECT e.*, 
             u.nom, 
             u.prenom, 
             u.email, 
             u.motdepasse AS generatedPassword, 
             g.num_groupe
      FROM Etudiant e
      JOIN User u ON e.Matricule = u.Matricule
      JOIN Etudiant_Section es ON e.Matricule = es.Matricule
      LEFT JOIN Groupe g ON e.ID_groupe = g.ID_groupe
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
        annee_inscription: formattedDate || (anneeInscription ? anneeInscription.toString() : null),
      };
    });

    res.json(formattedStudents);
  } catch (err) {
    console.error('Erreur lors de la récupération des étudiants :', err);
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Fonction pour assigner un groupe à un étudiant
const assignGroup = async (sectionId, matricule) => {
  const [groups] = await db.query('SELECT ID_groupe FROM Groupe WHERE ID_section = ?', [sectionId]);
  if (groups.length === 0) return null;

  const [studentCounts] = await db.query(`
    SELECT g.ID_groupe, COUNT(e.Matricule) as student_count
    FROM Groupe g
    LEFT JOIN Etudiant e ON e.ID_groupe = g.ID_groupe
    WHERE g.ID_section = ?
    GROUP BY g.ID_groupe
  `, [sectionId]);

  const minGroup = studentCounts.reduce((min, curr) => 
    curr.student_count < min.student_count ? curr : min, studentCounts[0]);

  await db.query('UPDATE Etudiant SET ID_groupe = ? WHERE Matricule = ?', [minGroup.ID_groupe, matricule]);
  return minGroup.ID_groupe;
};

// Route pour ajouter un étudiant dans une section avec groupe
router.post('/sections/:id/etudiants', async (req, res) => {
  const { id: sectionId } = req.params;
  const { matricule, nom, prenom, email, niveau, etat, anneeInscription, nomSpecialite, num_groupe } = req.body;

  if (!matricule || !nom || !prenom || !email || !niveau || !anneeInscription || !nomSpecialite || !num_groupe) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires, y compris le groupe.' });
  }

  const matriculeNum = parseInt(matricule, 10);
  if (isNaN(matriculeNum) || matriculeNum <= 0) {
    return res.status(400).json({ error: 'Le matricule doit être un nombre positif valide.' });
  }

  try {
    const formattedDate = convertDate(anneeInscription);
    if (!formattedDate) {
      return res.status(400).json({ error: 'La date d\'inscription est invalide.' });
    }

    const [specialite] = await db.query('SELECT ID_specialite FROM Specialite WHERE nom_specialite = ?', [nomSpecialite]);
    if (specialite.length === 0) {
      return res.status(400).json({ error: 'La spécialité sélectionnée n\'existe pas.' });
    }
    const idSpecialite = specialite[0].ID_specialite;

    const [existingStudent] = await db.query('SELECT * FROM Etudiant WHERE Matricule = ?', [matriculeNum]);
    let studentExistsInSection = false;
    let isSameSection = false;

    if (existingStudent.length > 0) {
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
        isSameSection = sectionCheck[0].ID_section === parseInt(sectionId);
        if (!isSameSection) {
          return res.status(400).json({
            error: `Cet étudiant existe déjà dans une autre section de la spécialité ${sectionCheck[0].nom_specialite}.`
          });
        }
      }
    }

    const [existingEmail] = await db.query('SELECT * FROM User WHERE email = ?', [email]);
    if (existingEmail.length > 0 && existingEmail[0].Matricule !== matriculeNum) {
      return res.status(400).json({ error: `Cet email (${email}) est déjà utilisé par un autre utilisateur.` });
    }

    const [section] = await db.query('SELECT * FROM Section WHERE ID_section = ?', [sectionId]);
    if (section.length === 0) {
      return res.status(400).json({ error: 'Section introuvable.' });
    }

    const [group] = await db.query('SELECT ID_groupe FROM Groupe WHERE ID_section = ? AND num_groupe = ?', [sectionId, num_groupe]);
    if (group.length === 0) {
      return res.status(400).json({ error: `Le groupe ${num_groupe} n'existe pas pour cette section.` });
    }
    const groupId = group[0].ID_groupe;

    await db.query('START TRANSACTION');

    const [existingUser] = await db.query('SELECT * FROM User WHERE Matricule = ?', [matriculeNum]);
    let randomPassword = null;
    if (existingUser.length === 0) {
      randomPassword = generateRandomPassword();
      await db.query(
        'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?)',
        [matriculeNum, nom, prenom, email, randomPassword]
      );
    } else {
      await db.query(
        'UPDATE User SET nom = ?, prenom = ?, email = ? WHERE Matricule = ?',
        [nom, prenom, email, matriculeNum]
      );
    }

    await db.query(
      'INSERT INTO Etudiant (Matricule, niveau, etat, annee_inscription, ID_specialite, ID_groupe) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE niveau = VALUES(niveau), etat = VALUES(etat), annee_inscription = VALUES(annee_inscription), ID_specialite = VALUES(ID_specialite), ID_groupe = VALUES(ID_groupe)',
      [matriculeNum, niveau, etat || null, formattedDate, idSpecialite, groupId]
    );

    if (!studentExistsInSection || !isSameSection) {
      await db.query(
        'INSERT INTO Etudiant_Section (Matricule, ID_section) VALUES (?, ?)',
        [matriculeNum, sectionId]
      );
    }

    await db.query('COMMIT');

    // Envoyer une notification aux enseignants de la section
    console.log(`Envoi de la notification pour la section ${sectionId} après ajout de l'étudiant ${matriculeNum}`);
    await sendUpdateNotification(sectionId);
    console.log(`Notification envoyée pour la section ${sectionId}`);

    res.status(201).json({
      message: 'Étudiant ajouté avec succès !',
      generatedPassword: randomPassword,
      groupId: num_groupe
    });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Erreur lors de l’ajout de l’étudiant :', err);
    res.status(500).json({ error: 'Une erreur s’est produite. Veuillez réessayer.' });
  }
});

// Route pour modifier un étudiant
router.put('/etudiants/:matricule', async (req, res) => {
  const { nom, prenom, email, niveau, etat, num_groupe, sectionId } = req.body;

  try {
    let groupId = null;
    if (num_groupe && sectionId) {
      const [group] = await db.query('SELECT ID_groupe FROM Groupe WHERE ID_section = ? AND num_groupe = ?', [sectionId, num_groupe]);
      if (group.length === 0) {
        return res.status(400).json({ error: `Le groupe ${num_groupe} n'existe pas pour cette section.` });
      }
      groupId = group[0].ID_groupe;
    }

    await db.query(
      'UPDATE Etudiant SET niveau = ?, etat = ?, ID_groupe = ? WHERE Matricule = ?',
      [niveau, etat || null, groupId, req.params.matricule]
    );
    await db.query(
      'UPDATE User SET nom = ?, prenom = ?, email = ? WHERE Matricule = ?',
      [nom, prenom, email, req.params.matricule]
    );

    // Envoyer une notification aux enseignants de la section
    if (sectionId) {
      console.log(`Envoi de la notification pour la section ${sectionId} après modification de l'étudiant ${req.params.matricule}`);
      await sendUpdateNotification(sectionId);
      console.log(`Notification envoyée pour la section ${sectionId}`);
    }

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
    // Récupérer la section de l'étudiant avant de le supprimer
    const [section] = await db.query(`
      SELECT ID_section 
      FROM Etudiant_Section 
      WHERE Matricule = ?
    `, [matricule]);
    const sectionId = section.length > 0 ? section[0].ID_section : null;

    // Supprimer les dépendances liées aux clubs et autres tables
    await db.query('START TRANSACTION');

    // Récupérer les clubs gérés par l'étudiant
    const [clubs] = await db.query('SELECT ID_club FROM Club WHERE gerant_matricule = ?', [matricule]);
    const clubIds = clubs.map(club => club.ID_club);

    // Supprimer les publications associées aux clubs gérés (solution temporaire)
    if (clubIds.length > 0) {
      await db.query('DELETE FROM Publication WHERE ID_club IN (?)', [clubIds]);
    }

    // Supprimer les clubs gérés par l'étudiant
    await db.query('DELETE FROM Club WHERE gerant_matricule = ?', [matricule]);

    // Supprimer les messages associés dans MessageClub
    await db.query('DELETE FROM MessageClub WHERE expediteur = ? OR destinataire = ?', [matricule, matricule]);

    // Supprimer les réactions et commentaires associés
    await db.query('DELETE FROM Reaction WHERE matricule_etudiant = ?', [matricule]);
    await db.query('DELETE FROM Commentaire WHERE matricule_etudiant = ?', [matricule]);

    // Supprimer les demandes de création de club
    await db.query('DELETE FROM DemandeCreationClub WHERE matricule_etudiant = ?', [matricule]);

    // Supprimer les notifications associées
    await db.query('DELETE FROM Notification WHERE expediteur = ? OR destinataire = ?', [matricule, matricule]);
    await db.query('DELETE FROM Notification_seen WHERE matricule = ?', [matricule]);

    // Supprimer les événements du calendrier associés
    await db.query('DELETE FROM CalendarEvent WHERE matricule = ?', [matricule]);

    // Supprimer les notes associées
    await db.query('DELETE FROM notes WHERE Matricule = ?', [matricule]);

    // Supprimer les participations à des événements
    await db.query('DELETE FROM Participant WHERE Matricule = ?', [matricule]);

    // Supprimer les réponses aux sondages
    await db.query('DELETE FROM reponse_sondage WHERE matricule_etudiant = ?', [matricule]);

    // Supprimer les réclamations associées
    await db.query('DELETE FROM reclamation WHERE Matricule_etudiant = ?', [matricule]);

    // Supprimer les commentaires sur les annonces
    await db.query('DELETE FROM commentaire_annonce WHERE matricule_etudiant = ?', [matricule]);

    // Supprimer l'utilisateur de la table User (ce qui déclenchera les suppressions en cascade)
    await db.query('DELETE FROM User WHERE Matricule = ?', [matricule]);

    await db.query('COMMIT');

    // Envoyer une notification aux enseignants de la section
    if (sectionId) {
      console.log(`Envoi de la notification pour la section ${sectionId} après suppression de l'étudiant ${matricule}`);
      await sendUpdateNotification(sectionId);
      console.log(`Notification envoyée pour la section ${sectionId}`);
    }

    res.json({ message: 'Étudiant supprimé avec succès !' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('Erreur lors de la suppression de l’étudiant :', err);
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

    const [section] = await db.query('SELECT ID_specialite FROM Section WHERE ID_section = ?', [req.params.id]);
    if (section.length === 0) {
      return res.status(400).json({ error: 'Section introuvable.' });
    }
    const sectionSpecialiteId = section[0].ID_specialite;

    const [groups] = await db.query('SELECT num_groupe, ID_groupe FROM Groupe WHERE ID_section = ?', [req.params.id]);
    const groupMap = new Map(groups.map(g => [g.num_groupe, g.ID_groupe]));

    const importedStudents = [];
    const skippedStudents = [];

    const insertPromises = data.map(async (row, index) => {
      try {
        const formattedDate = convertDate(row.annee_inscription);
        if (!formattedDate) {
          throw new Error(`Ligne ${index + 2} : La date d'inscription est invalide.`);
        }

        const matricule = parseInt(row.Matricule, 10);
        if (isNaN(matricule) || matricule <= 0) {
          throw new Error(`Ligne ${index + 2} : Le matricule doit être un nombre positif valide.`);
        }

        if (!validNiveaux.includes(row.niveau)) {
          throw new Error(`Ligne ${index + 2} : Le niveau (${row.niveau}) est invalide.`);
        }

        const etat = row.etat || null;
        if (!validEtats.includes(etat)) {
          throw new Error(`Ligne ${index + 2} : L'état (${row.etat}) est invalide.`);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email)) {
          throw new Error(`Ligne ${index + 2} : L'email (${row.email}) est invalide.`);
        }

        let groupId = null;
        if (row.num_groupe) {
          const numGroupe = parseInt(row.num_groupe, 10);
          if (groupMap.has(numGroupe)) {
            groupId = groupMap.get(numGroupe);
          } else {
            throw new Error(`Ligne ${index + 2} : Le groupe ${numGroupe} n'existe pas pour cette section.`);
          }
        }

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
            isSameSection = sectionCheck[0].ID_section === parseInt(req.params.id);
            if (!isSameSection) {
              skippedStudents.push({
                matricule: matricule,
                nom: row.nom,
                prenom: row.prenom,
                reason: `Étudiant déjà assigné à une autre section de la spécialité ${sectionCheck[0].nom_specialite}`
              });
              return;
            }
          }
        }

        const [existingEmail] = await db.query('SELECT * FROM User WHERE email = ?', [row.email]);
        if (existingEmail.length > 0 && existingEmail[0].Matricule !== matricule) {
          throw new Error(`Ligne ${index + 2} : L'email (${row.email}) est déjà utilisé.`);
        }

        await db.query('START TRANSACTION');

        const [existingUser] = await db.query('SELECT * FROM User WHERE Matricule = ?', [matricule]);
        let randomPassword = null;

        if (existingUser.length === 0) {
          randomPassword = generateRandomPassword();
          await db.query(
            'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?)',
            [matricule, row.nom, row.prenom, row.email, randomPassword]
          );
        } else {
          await db.query(
            'UPDATE User SET nom = ?, prenom = ?, email = ? WHERE Matricule = ?',
            [row.nom, row.prenom, row.email, matricule]
          );
        }

        await db.query(
          'INSERT INTO Etudiant (Matricule, niveau, etat, annee_inscription, ID_specialite, ID_groupe) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE niveau = VALUES(niveau), etat = VALUES(etat), annee_inscription = VALUES(annee_inscription), ID_specialite = VALUES(ID_specialite), ID_groupe = VALUES(ID_groupe)',
          [matricule, row.niveau, etat, formattedDate, sectionSpecialiteId, groupId]
        );

        if (!studentExistsInSection || !isSameSection) {
          await db.query(
            'INSERT INTO Etudiant_Section (Matricule, ID_section) VALUES (?, ?)',
            [matricule, req.params.id]
          );
        }

        await db.query('COMMIT');

        importedStudents.push({
          matricule: matricule,
          nom: row.nom,
          prenom: row.prenom,
          generatedPassword: randomPassword,
          groupId: row.num_groupe || null
        });
      } catch (err) {
        skippedStudents.push({
          matricule: row.Matricule,
          nom: row.nom,
          prenom: row.prenom,
          reason: err.message
        });
      }
    });

    await Promise.all(insertPromises);

    // Envoyer une notification aux enseignants de la section si des étudiants ont été importés
    if (importedStudents.length > 0) {
      console.log(`Envoi de la notification pour la section ${req.params.id} après importation de ${importedStudents.length} étudiants`);
      await sendUpdateNotification(req.params.id);
      console.log(`Notification envoyée pour la section ${req.params.id}`);
    }

    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Fichier importé avec succès !',
      importedCount: importedStudents.length,
      skippedCount: skippedStudents.length,
      importedStudents: importedStudents,
      skippedStudents: skippedStudents
    });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Erreur lors de l’importation :', err);
    res.status(400).json({ error: err.message || 'Une erreur s’est produite lors de l’importation.' });
  }
});

module.exports = router;
