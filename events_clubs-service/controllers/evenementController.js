const pool = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

exports.createEvenement = async (req, res) => {
  try {
    // Extraire les données de req.body (champs texte)
    const {
      nom_evenement,
      description_evenement,
      date_evenement,
      lieu,
      capacite,
      organisateur_admin, // Correspond à matricule
      target_type,
      target_filter,
      clubId = null, // Optionnel, par défaut null
      time_slots = null // Optionnel, par défaut null
    } = req.body;

    // Extraire l'image de req.file (si fournie)
    const image_url = req.file ? `/Uploads/${req.file.filename}` : req.body.image_url || null;

    // Validation des champs obligatoires
    if (!nom_evenement || !date_evenement || !lieu || !capacite) {
      return res.status(400).json({ message: 'Les champs nom_evenement, date_evenement, lieu et capacite sont requis' });
    }

    // Validation de la date
    let eventDate;
    try {
      eventDate = new Date(date_evenement);
      if (isNaN(eventDate.getTime())) {
        return res.status(400).json({ message: 'Format de date invalide. Utilisez le format YYYY-MM-DD.' });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Format de date invalide. Utilisez le format YYYY-MM-DD.' });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate <= currentDate) {
      return res.status(400).json({ message: 'La date de l\'événement doit être strictement supérieure à la date courante.' });
    }

    // Vérification de l'image si fournie
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

    // Insérer l'événement dans la table Evenement
    const eventSql = `
      INSERT INTO Evenement (nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, organisateur_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const eventValues = [
      nom_evenement,
      description_evenement || 'Pas de description',
      date_evenement,
      lieu,
      capacite,
      image_url || null,
      organisateur_admin || 0
    ];

    const [eventResult] = await pool.query(eventSql, eventValues);
    const eventId = eventResult.insertId;
    console.log('Événement créé, ID :', eventId);

    // Récupérer le nom du club pour le contenu de la publication (si clubId est fourni)
    let nomClub = 'Club inconnu';
    if (clubId) {
      const [club] = await pool.query('SELECT nom FROM Club WHERE ID_club = ?', [clubId]);
      nomClub = club[0]?.nom || 'Club inconnu';
    }

    // Créer une annonce associée
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
      organisateur_admin || 0,
      eventId,
      effectiveTargetType,
      JSON.stringify(effectiveTargetFilter),
      null
    ];

    const [annonceResult] = await pool.query(annonceSql, annonceValues);
    const annonceId = annonceResult.insertId;
    console.log(`Annonce créée pour l'événement ${eventId} : ID ${annonceId}`);

    // Générer des notifications pour tous les étudiants
    const query = 'SELECT Matricule FROM Etudiant';
    const [destinataires] = await pool.query(query);
    console.log(`Destinataires trouvés :`, destinataires);

    const notificationIds = [];
    if (destinataires.length > 0) {
      const notificationMessage = `Nouveau événement du club "${nomClub}": ${nom_evenement}`;
      const notificationValues = destinataires.map(d => [
        new Date(),
        notificationMessage,
        organisateur_admin || 0,
        d.Matricule
      ]);
      await pool.query(
        'INSERT INTO Notification (date_envoi, contenu, expediteur, destinataire) VALUES ?',
        [notificationValues]
      );
      console.log(`Notifications envoyées pour ${destinataires.length} étudiants`);
      notificationIds.push(...destinataires.map((_, i) => annonceId + i));
    }

    // Construire l'URL complète pour l'image
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

// Conserver les autres fonctions telles quelles
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
    const [eventResult] = await pool.query('SELECT nom_evenement FROM Evenement WHERE ID_evenement = ?', [id]);
    if (eventResult.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }
    const title = eventResult[0].nom_evenement;

    await pool.query('DELETE FROM annonce WHERE event_id = ?', [id]);
    console.log(`Annonce supprimée pour l'événement ${id}`);

    const [deleteResult] = await pool.query('DELETE FROM Evenement WHERE ID_evenement = ?', [id]);
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
  const { nom_evenement, description_evenement, date_evenement, lieu, capacite, organisateur_admin, target_type, target_filter } = req.body;
  const image_url = req.file ? `/Uploads/${req.file.filename}` : req.body.image_url || null;

  console.log('Fichier image reçu pour mise à jour :', req.file ? req.file.filename : 'Aucun fichier');
  console.log('image_url pour mise à jour événement :', image_url);
  console.log('target_type reçu :', target_type);
  console.log('target_filter brut reçu :', target_filter);

  // Validation de la date
  let eventDate;
  try {
    eventDate = new Date(date_evenement);
    if (isNaN(eventDate.getTime())) {
      throw new Error('Format de date invalide');
    }
  } catch (err) {
    console.error('Erreur de parsing de la date :', err.message);
    return res.status(400).json({ message: 'Erreur : Format de date invalide. Utilisez le format YYYY-MM-DD.' });
  }

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  console.log('Date courante :', currentDate.toISOString().split('T')[0]);
  console.log('Date de l\'événement :', eventDate.toISOString().split('T')[0]);

  if (eventDate <= currentDate) {
    console.log('Validation échouée : Date de l\'événement <= date courante');
    return res.status(400).json({ message: 'Erreur : La date de l\'événement doit être strictement supérieure à la date courante.' });
  }

  const uploadsBasePath = path.join(__dirname, '..', 'Uploads');
  const sourcePath = req.file ? path.join(uploadsBasePath, req.file.filename) : null;

  if (req.file && sourcePath) {
    try {
      await fs.access(sourcePath);
      console.log('Fichier source trouvé :', sourcePath);
    } catch (err) {
      console.error('Fichier source introuvable :', err);
      return res.status(500).json({ message: 'Fichier source introuvable', error: err.message });
    }
  }

  const eventSql = `
    UPDATE Evenement 
    SET nom_evenement = ?, description_evenement = ?, date_evenement = ?, lieu = ?, capacite = ?, organisateur_admin = ?, image_url = ? 
    WHERE ID_evenement = ?
  `;
  const eventValues = [
    nom_evenement || 'Événement sans nom',
    description_evenement || 'Pas de description',
    date_evenement || null,
    lieu || 'Lieu non spécifié',
    capacite || 0,
    organisateur_admin || 0,
    image_url,
    id
  ];

  try {
    const [eventResult] = await pool.query(eventSql, eventValues);
    if (eventResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const content = `Nouveau événement : ${description_evenement || 'Détails à venir'} - Date : ${date_evenement || 'Non spécifiée'} - Lieu : ${lieu || 'Non spécifié'}`;

    const effectiveTargetType = (target_type || 'Etudiants').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const effectiveTargetFilter = target_filter ? (typeof target_filter === 'string' ? JSON.parse(target_filter) : target_filter) : { tous: true, faculte: '', departement: '', specialite: '' };
    console.log('effectiveTargetType normalisé :', effectiveTargetType);
    console.log('effectiveTargetFilter après parsing :', effectiveTargetFilter);

    const annonceSql = `
      UPDATE annonce 
      SET title = ?, content = ?, image_url = ?, admin_matricule = ?, target_type = ?, target_filter = ?, enseignant_matricule = ?
      WHERE event_id = ?
    `;
    const annonceValues = [
      nom_evenement || 'Événement sans nom',
      content,
      image_url || '',
      organisateur_admin || 0,
      effectiveTargetType,
      JSON.stringify(effectiveTargetFilter),
      null,
      id
    ];
    console.log('image_url pour mise à jour annonce :', image_url || '');

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
      const notificationMessage = `Annonce modifiée - nouveau evenement est la : ${nom_evenement}`;
      const notificationValues = destinataires.map(d => [
        new Date(),
        notificationMessage,
        organisateur_admin || 0,
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