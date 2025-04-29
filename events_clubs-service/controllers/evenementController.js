const pool = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

exports.createEvenement = async (req, res) => {
  try {
    console.log('Requête POST reçue, req.body brut :', req.body);
    console.log('Fichier reçu :', req.file);

    // Extraire les données de req.body
    const {
      nom_evenement,
      description_evenement,
      date_evenement,
      lieu,
      capacite,
      organisateur_admin,
      target_type,
      target_filter,
      clubId = null,
      time_slots = null
    } = req.body;

    console.log('date_evenement extrait :', date_evenement);

    // Extraire l'image
    const image_url = req.file ? `/Uploads/${req.file.filename}` : req.body.image_url || null;

    // Validation des champs obligatoires
    if (!nom_evenement || !date_evenement || !lieu || !capacite || !organisateur_admin) {
      return res.status(400).json({ message: 'Les champs nom_evenement, date_evenement, lieu, capacite et organisateur_admin sont requis' });
    }

    // Validation du format de date_evenement (YYYY-MM-DD HH:mm:ss)
    const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!dateRegex.test(date_evenement)) {
      console.error('Format de date_evenement invalide :', date_evenement);
      return res.status(400).json({ message: 'Format de date invalide. Utilisez le format YYYY-MM-DD HH:mm:ss (par exemple, 2025-04-29 10:00:00).' });
    }

    // Vérifier que l'heure n'est pas 00:00:00
    const [, timePart] = date_evenement.split(' ');
    if (timePart === '00:00:00') {
      console.error('Heure nulle détectée :', date_evenement);
      return res.status(400).json({ message: 'L\'heure de l\'événement ne peut pas être 00:00:00.' });
    }

    // Validation de la date
    let eventDate;
    try {
      eventDate = new Date(date_evenement);
      if (isNaN(eventDate.getTime())) {
        console.error('Date invalide après parsing :', date_evenement);
        return res.status(400).json({ message: 'Date invalide. Vérifiez le format YYYY-MM-DD HH:mm:ss.' });
      }
    } catch (err) {
      console.error('Erreur de parsing de date_evenement :', err.message, 'Valeur :', date_evenement);
      return res.status(400).json({ message: 'Erreur lors du parsing de la date. Utilisez le format YYYY-MM-DD HH:mm:ss.' });
    }

    const currentDate = new Date();
    if (eventDate <= currentDate) {
      return res.status(400).json({ message: 'La date de l\'événement doit être postérieure à la date courante.' });
    }

    // Extraire l'heure pour la colonne heure_evenement (si conservée)
    const heure_evenement = timePart;

    // Vérification de l'image
    if (image_url && image_url.startsWith('/Uploads/')) {
      const sourcePath = path.join(__dirname, '..', image_url);
      try {
        await fs.access(sourcePath);
        console.log('Fichier image trouvé :', sourcePath);
      } catch (err) {
        console.error('Fichier image introuvable :', err);
        return res.status(400).json({ message: 'Fichier image introuvable' });
      }
    }

    // Insérer l'événement
    const eventSql = `
      INSERT INTO Evenement (nom_evenement, description_evenement, date_evenement, heure_evenement, lieu, capacite, image_url, organisateur_admin, target_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const eventValues = [
      nom_evenement,
      description_evenement || 'Pas de description',
      date_evenement,
      heure_evenement, // Ajout de heure_evenement
      lieu,
      parseInt(capacite),
      image_url || null,
      parseInt(organisateur_admin),
      target_type || 'Etudiants'
    ];

    console.log('Valeurs à insérer dans Evenement :', eventValues);

    const [eventResult] = await pool.query(eventSql, eventValues);
    const eventId = eventResult.insertId;
    console.log('Événement créé, ID :', eventId);

    // Récupérer le nom du club
    let nomClub = 'Club inconnu';
    if (clubId) {
      const [club] = await pool.query('SELECT nom FROM Club WHERE ID_club = ?', [parseInt(clubId)]);
      nomClub = club[0]?.nom || 'Club inconnu';
    }

    // Créer une annonce
    const content = `Nouveau événement : ${description_evenement || 'Détails à venir'} - Date : ${date_evenement} - Lieu : ${lieu}`;
    const effectiveTargetType = target_type || 'Etudiants';
    const effectiveTargetFilter = target_filter ? (typeof target_filter === 'string' ? JSON.parse(target_filter) : target_filter) : { tous: true, faculte: '', departement: '', specialite: '' };

    const annonceSql = `
      INSERT INTO annonce (title, content, image_url, admin_matricule, event_id, target_type, target_filter, enseignant_matricule)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const annonceValues = [
      nom_evenement,
      content,
      image_url || '',
      parseInt(organisateur_admin),
      eventId,
      effectiveTargetType,
      JSON.stringify(effectiveTargetFilter),
      null
    ];

    console.log('Valeurs à insérer dans annonce :', annonceValues);

    const [annonceResult] = await pool.query(annonceSql, annonceValues);
    const annonceId = annonceResult.insertId;
    console.log(`Annonce créée pour l'événement ${eventId} : ID ${annonceId}`);

    // Générer des notifications
    const query = 'SELECT Matricule FROM Etudiant';
    const [destinataires] = await pool.query(query);
    console.log(`Destinataires trouvés :`, destinataires);

    const notificationIds = [];
    if (destinataires.length > 0) {
      const notificationMessage = `Nouveau événement du club "${nomClub}": ${nom_evenement}`;
      const notificationValues = destinataires.map(d => [
        new Date(),
        notificationMessage,
        parseInt(organisateur_admin),
        d.Matricule
      ]);
      await pool.query(
        'INSERT INTO Notification (date_envoi, contenu, expediteur, destinataire) VALUES ?',
        [notificationValues]
      );
      console.log(`Notifications envoyées pour ${destinataires.length} étudiants`);
      notificationIds.push(...destinataires.map((_, i) => annonceId + i));
    }

    // URL complète pour l'image
    const fullImageUrl = image_url && !image_url.startsWith('http')
      ? `http://events.localhost${image_url}`
      : image_url || '';

    res.json({
      evenementId: eventId,
      annonceId: annonceId,
      notificationIds,
      nomClub,
      image_url: fullImageUrl
    });
  } catch (err) {
    console.error('Erreur lors de la création de l\'événement :', err);
    res.status(500).json({ message: err.message || 'Erreur lors de la création de l\'événement' });
  }
};

exports.getAllEvenements = async (req, res) => {
  const sql = 'SELECT * FROM Evenement';
  try {
    const [results] = await pool.query(sql);
    const evenementsWithFullUrl = results.map(evenement => {
      const fullImageUrl = evenement.image_url && !evenement.image_url.startsWith('http')
        ? `http://events.localhost${evenement.image_url}`
        : evenement.image_url || '';
      console.log('Image URL pour événement', evenement.ID_evenement, ':', fullImageUrl);
      return {
        ...evenement,
        image_url: fullImageUrl
      };
    });
    res.json(evenementsWithFullUrl);
  } catch (err) {
    console.error('Erreur lors de la récupération des événements :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.deleteEvenement = async (req, res) => {
  const { id } = req.params;

  try {
    const [eventResult] = await pool.query('SELECT nom_evenement FROM Evenement WHERE ID_evenement = ?', [parseInt(id)]);
    if (eventResult.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    const title = eventResult[0].nom_evenement;

    await pool.query('DELETE FROM annonce WHERE event_id = ?', [parseInt(id)]);
    console.log(`Annonce supprimée pour l'événement ${id}`);

    const [deleteResult] = await pool.query('DELETE FROM Evenement WHERE ID_evenement = ?', [parseInt(id)]);
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    await pool.query('DELETE FROM Notification WHERE contenu LIKE ?', [`%${title}%`]);
    console.log(`Notifications supprimées pour l\'annonce ${title}`);

    res.json({ message: 'Événement, annonce et notifications supprimés avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'événement :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

exports.updateEvenement = async (req, res) => {
  const { id } = req.params;
  console.log(`Requête PUT reçue pour ID : ${id}, req.body brut :`, req.body);
  console.log('Fichier reçu :', req.file);

  const {
    nom_evenement,
    description_evenement,
    date_evenement,
    lieu,
    capacite,
    organisateur_admin,
    target_type,
    target_filter
  } = req.body;

  console.log('date_evenement extrait :', date_evenement);

  const image_url = req.file ? `/Uploads/${req.file.filename}` : req.body.image_url || null;

  // Validation des champs obligatoires
  if (!nom_evenement || !date_evenement || !lieu || !capacite || !organisateur_admin) {
    return res.status(400).json({ message: 'Les champs nom_evenement, date_evenement, lieu, capacite et organisateur_admin sont requis' });
  }

  // Validation du format de date_evenement (YYYY-MM-DD HH:mm:ss)
  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!dateRegex.test(date_evenement)) {
    console.error('Format de date_evenement invalide :', date_evenement);
    return res.status(400).json({ message: 'Format de date invalide. Utilisez le format YYYY-MM-DD HH:mm:ss (par exemple, 2025-04-29 10:00:00).' });
  }

  // Vérifier que l'heure n'est pas 00:00:00
  const [, timePart] = date_evenement.split(' ');
  if (timePart === '00:00:00') {
    console.error('Heure nulle détectée :', date_evenement);
    return res.status(400).json({ message: 'L\'heure de l\'événement ne peut pas être 00:00:00.' });
  }

  // Validation de la date
  let eventDate;
  try {
    eventDate = new Date(date_evenement);
    if (isNaN(eventDate.getTime())) {
      console.error('Date invalide après parsing :', date_evenement);
      return res.status(400).json({ message: 'Date invalide. Vérifiez le format YYYY-MM-DD HH:mm:ss.' });
    }
  } catch (err) {
    console.error('Erreur de parsing de date_evenement :', err.message, 'Valeur :', date_evenement);
    return res.status(400).json({ message: 'Erreur lors du parsing de la date. Utilisez le format YYYY-MM-DD HH:mm:ss.' });
  }

  const currentDate = new Date();
  if (eventDate <= currentDate) {
    return res.status(400).json({ message: 'La date de l\'événement doit être postérieure à la date courante.' });
  }

  // Extraire l'heure pour la colonne heure_evenement (si conservée)
  const heure_evenement = timePart;

  // Vérification de l'image
  if (image_url && image_url.startsWith('/Uploads/')) {
    const sourcePath = path.join(__dirname, '..', image_url);
    try {
      await fs.access(sourcePath);
      console.log('Fichier image trouvé :', sourcePath);
    } catch (err) {
      console.error('Fichier image introuvable :', err);
      return res.status(400).json({ message: 'Fichier image introuvable' });
    }
  }

  const eventSql = `
    UPDATE Evenement 
    SET nom_evenement = ?, description_evenement = ?, date_evenement = ?, heure_evenement = ?, lieu = ?, capacite = ?, organisateur_admin = ?, image_url = ?, target_type = ?
    WHERE ID_evenement = ?
  `;
  const eventValues = [
    nom_evenement,
    description_evenement || 'Pas de description',
    date_evenement,
    heure_evenement,
    lieu,
    parseInt(capacite),
    parseInt(organisateur_admin),
    image_url,
    target_type || 'Etudiants',
    parseInt(id)
  ];

  console.log('Valeurs à mettre à jour dans Evenement :', eventValues);

  try {
    const [eventResult] = await pool.query(eventSql, eventValues);
    if (eventResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const content = `Nouveau événement : ${description_evenement || 'Détails à venir'} - Date : ${date_evenement} - Lieu : ${lieu}`;

    const effectiveTargetType = target_type || 'Etudiants';
    const effectiveTargetFilter = target_filter ? (typeof target_filter === 'string' ? JSON.parse(target_filter) : target_filter) : { tous: true, faculte: '', departement: '', specialite: '' };
    console.log('effectiveTargetType :', effectiveTargetType);
    console.log('effectiveTargetFilter après parsing :', effectiveTargetFilter);

    const annonceSql = `
      UPDATE annonce 
      SET title = ?, content = ?, image_url = ?, admin_matricule = ?, target_type = ?, target_filter = ?, enseignant_matricule = ?
      WHERE event_id = ?
    `;
    const annonceValues = [
      nom_evenement,
      content,
      image_url || '',
      parseInt(organisateur_admin),
      effectiveTargetType,
      JSON.stringify(effectiveTargetFilter),
      null,
      parseInt(id)
    ];

    console.log('Valeurs à mettre à jour dans annonce :', annonceValues);

    const [annonceResult] = await pool.query(annonceSql, annonceValues);
    console.log(`Annonce mise à jour pour l'événement ${id}`);

    await pool.query('DELETE FROM Notification WHERE contenu LIKE ?', [`%${nom_evenement}%`]);

    let query = '';
    let params = [];

    if (!effectiveTargetFilter.tous) {
      console.log('Filtrage spécifique activé :', effectiveTargetFilter);
      if (effectiveTargetType === 'Enseignants') {
        query = `
          SELECT DISTINCT e.Matricule
          FROM Enseignant e
          JOIN Departement d ON d.ID_departement = e.ID_departement
          JOIN faculte f ON f.ID_faculte = e.ID_faculte
          WHERE 1=1
        `;
        if (effectiveTargetFilter.faculte) {
          query += ' AND f.ID_faculte = ?';
          params.push(parseInt(effectiveTargetFilter.faculte));
        }
        if (effectiveTargetFilter.departement) {
          query += ' AND d.ID_departement = ?';
          params.push(parseInt(effectiveTargetFilter.departement));
        }
      } else if (effectiveTargetType === 'Etudiants') {
        query = `
          SELECT DISTINCT e.Matricule
          FROM Etudiant e
          JOIN Specialite sp ON sp.ID_specialite = e.ID_specialite
          JOIN Departement d ON d.ID_departement = sp.ID_departement
          JOIN faculte f ON f.ID_faculte = d.ID_faculte
          WHERE 1=1
        `;
        const conditions = [];
        if (effectiveTargetFilter.faculte) {
          conditions.push('f.ID_faculte = ?');
          params.push(parseInt(effectiveTargetFilter.faculte));
        }
        if (effectiveTargetFilter.departement) {
          conditions.push('d.ID_departement = ?');
          params.push(parseInt(effectiveTargetFilter.departement));
        }
        if (effectiveTargetFilter.specialite) {
          conditions.push('sp.ID_specialite = ?');
          params.push(parseInt(effectiveTargetFilter.specialite));
        }
        if (conditions.length > 0) {
          query += ' AND ' + conditions.join(' AND ');
        }
      } else {
        console.error(`Type de cible inconnu : ${effectiveTargetType}`);
      }
    } else {
      console.log('Envoi à tous les', effectiveTargetType.toLowerCase());
      if (effectiveTargetType === 'Enseignants') {
        query = 'SELECT Matricule FROM Enseignant';
      } else if (effectiveTargetType === 'Etudiants') {
        query = 'SELECT Matricule FROM Etudiant';
      } else {
        console.error(`Type de cible inconnu pour "tous" : ${effectiveTargetType}`);
      }
    }

    if (!query) {
      console.error('Erreur : La requête SQL est vide. Vérifiez la logique de construction.');
      return res.status(500).json({ message: 'Erreur interne : Requête SQL vide', error: 'Query construction failed' });
    }

    console.log('Requête SQL construite :', query);
    console.log('Paramètres de la requête :', params);

    const [destinataires] = await pool.query(query, params);
    console.log(`Destinataires trouvés :`, destinataires);

    if (destinataires.length > 0) {
      const notificationMessage = `Annonce modifiée - nouvel événement : ${nom_evenement}`;
      const notificationValues = destinataires.map(d => [
        new Date(),
        notificationMessage,
        parseInt(organisateur_admin),
        d.Matricule
      ]);
      await pool.query(
        'INSERT INTO Notification (date_envoi, contenu, expediteur, destinataire) VALUES ?',
        [notificationValues]
      );
      console.log(`Notifications mises à jour pour ${destinataires.length} ${effectiveTargetType.toLowerCase()}`);
    } else {
      console.log(`Aucun ${effectiveTargetType.toLowerCase()} trouvé pour les critères donnés`);
    }

    const fullImageUrl = image_url && !image_url.startsWith('http')
      ? `http://events.localhost${image_url}`
      : image_url || '';
    console.log('URL complète renvoyée pour mise à jour :', fullImageUrl);

    res.json({
      message: 'Événement et annonce mis à jour avec succès',
      image_url: fullImageUrl
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'événement :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
