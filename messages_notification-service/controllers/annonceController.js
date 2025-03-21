const db = require('../config/db');

const getAllAnnonces = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Annonce');
    const annonces = rows.map(annonce => {
      let image_url = annonce.image_url || '';
      if (image_url && !image_url.startsWith('http')) {
        image_url = annonce.event_id
          ? `http://localhost:9000${image_url}`
          : `http://localhost:8082${image_url}`;
        console.log(`Annonce ID ${annonce.id} - event_id: ${annonce.event_id}, URL ajustée: ${image_url}`);
      } else {
        console.log(`Annonce ID ${annonce.id} - URL inchangée: ${image_url}`);
      }
      return { ...annonce, image_url };
    });
    console.log('Liste complète des annonces avec URLs :', annonces);
    res.json(annonces);
  } catch (err) {
    console.error('Erreur lors de la récupération des annonces :', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const createAnnonce = async (req, res) => {
  const { title, content, Matricule, target_type, target_filter, event_id } = req.body;
  let image_url = req.body.image_url || '';

  console.log('Requête POST /api/annonces reçue :', {
    body: req.body,
    file: req.file ? { filename: req.file.filename, size: req.file.size, path: req.file.path } : 'Aucun fichier'
  });

  if (!title || !content || !Matricule || !target_type) {
    return res.status(400).json({ message: 'Tous les champs obligatoires sont requis' });
  }

  if (req.file) {
    image_url = `/uploads/${req.file.filename}`;
    console.log('Image stockée localement sur 5001 :', image_url);
    console.log('Chemin complet du fichier :', `C:/Users/AZUR/Desktop/gestion-annonces/backend${image_url}`);
    console.log('Fichier reçu :', req.file);
  }

  try {
    console.log('Valeur de target_filter brut :', target_filter);

    let targetFilterParsed;
    if (typeof target_filter === 'string') {
      targetFilterParsed = JSON.parse(target_filter);
    } else if (target_filter) {
      targetFilterParsed = target_filter;
    } else {
      targetFilterParsed = { tous: false, faculte: '', departement: '', specialite: '' };
    }
    console.log('targetFilterParsed après parsing :', targetFilterParsed);

    const effectiveTargetFilter = JSON.stringify(targetFilterParsed);
    console.log('effectiveTargetFilter pour insertion :', effectiveTargetFilter);

    const [result] = await db.query(
      'INSERT INTO Annonce (title, content, image_url, Matricule, event_id, target_type, target_filter) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, image_url, Matricule, event_id || null, target_type, effectiveTargetFilter]
    );
    console.log('Annonce créée avec succès :', { id: result.insertId, image_url });

    // Envoyer les notifications pour la création
    const [annonces] = await db.query('SELECT * FROM Annonce WHERE id = ?', [result.insertId]);
    const annonce = annonces[0];
    await sendNotificationsForAnnonce(annonce, 'created');

    res.status(201).json({
      id: result.insertId,
      title,
      content,
      image_url: image_url ? `http://localhost:5001${image_url}` : '',
      Matricule,
      target_type,
      target_filter: targetFilterParsed,
      event_id
    });
  } catch (err) {
    console.error('Erreur lors de la création de l\'annonce :', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

// Fonction interne pour envoyer ou gérer les notifications
const sendNotificationsForAnnonce = async (annonce, action) => {
  const { id, title, content, Matricule, target_type, target_filter } = annonce;
  const targetFilterParsed = typeof target_filter === 'string' ? JSON.parse(target_filter) : target_filter;

  let destinataires = [];
  let notificationMessage;
  switch (action) {
    case 'created':
      notificationMessage = `Nouvelle annonce: ${title} - ${content}`;
      break;
    case 'updated':
      notificationMessage = `Annonce modifiée: ${title} - ${content}`;
      break;
    default:
      return; // Pas de notification pour d'autres actions par défaut
  }

  if (target_type === 'Etudiants') {
    if (targetFilterParsed.tous) {
      [destinataires] = await db.query('SELECT Matricule FROM Etudiant');
    } else {
      const { faculte, departement, specialite } = targetFilterParsed;
      let query = 'SELECT Matricule FROM Etudiant e JOIN Specialite s ON e.ID_specialite = s.ID_specialite JOIN Departement d ON s.ID_departement = d.ID_departement JOIN faculte f ON d.ID_faculte = f.ID_faculte WHERE 1=1';
      const params = [];
      if (faculte) { query += ' AND f.ID_faculte = ?'; params.push(faculte); }
      if (departement) { query += ' AND d.ID_departement = ?'; params.push(departement); }
      if (specialite) { query += ' AND s.ID_specialite = ?'; params.push(specialite); }
      [destinataires] = await db.query(query, params);
    }
  } else if (target_type === 'Enseignants') {
    if (targetFilterParsed.tous) {
      [destinataires] = await db.query('SELECT Matricule FROM Enseignant');
    } else {
      const { faculte, departement } = targetFilterParsed;
      let query = 'SELECT Matricule FROM Enseignant e JOIN Departement d ON e.ID_departement = d.ID_departement JOIN faculte f ON d.ID_faculte = f.ID_faculte WHERE 1=1';
      const params = [];
      if (faculte) { query += ' AND f.ID_faculte = ?'; params.push(faculte); }
      if (departement) { query += ' AND d.ID_departement = ?'; params.push(departement); }
      [destinataires] = await db.query(query, params);
    }
  }

  if (destinataires.length > 0 && (action === 'created' || action === 'updated')) {
    // Supprimer les anciennes notifications basées sur le titre
    await db.query('DELETE FROM Notification WHERE contenu LIKE ?', [`%${title}%`]);
    const notificationValues = destinataires.map(d => [new Date(), notificationMessage, Matricule, d.Matricule]);
    await db.query('INSERT INTO Notification (date_envoi, contenu, expediteur, destinataire) VALUES ?', [notificationValues]);
    console.log(`Notifications ${action === 'created' ? 'créées' : 'modifiées'} pour ${destinataires.length} destinataires pour l'annonce ${id}`);
  } else {
    console.log('Aucun destinataire trouvé pour l\'annonce ou action non prise en charge');
  }
};

const sendNotifications = async (req, res) => {
  const { annonceId } = req.params;

  try {
    const [annonces] = await db.query('SELECT * FROM Annonce WHERE id = ?', [annonceId]);
    if (annonces.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }
    await sendNotificationsForAnnonce(annonces[0], 'manual');
    res.json({ message: 'Notifications envoyées avec succès' });
  } catch (err) {
    console.error('Erreur lors de l\'envoi des notifications :', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const updateAnnonce = async (req, res) => {
  const { id } = req.params;
  const { title, content, Matricule, target_type, target_filter, event_id } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;

  try {
    const [existing] = await db.query('SELECT * FROM Annonce WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    const effectiveTargetFilter = target_filter ? JSON.stringify(target_filter) : existing[0].target_filter;
    const [result] = await db.query(
      'UPDATE Annonce SET title = ?, content = ?, image_url = ?, Matricule = ?, event_id = ?, target_type = ?, target_filter = ? WHERE id = ?',
      [title || existing[0].title, content || existing[0].content, image_url || existing[0].image_url, Matricule || existing[0].Matricule, event_id || existing[0].event_id, target_type || existing[0].target_type, effectiveTargetFilter, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Aucune modification effectuée' });
    }

    // Envoyer les notifications pour la modification (remplace la notification existante)
    const [updatedAnnonce] = await db.query('SELECT * FROM Annonce WHERE id = ?', [id]);
    await sendNotificationsForAnnonce(updatedAnnonce[0], 'updated');

    res.json({ message: 'Annonce mise à jour avec succès' });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'annonce :', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const deleteAnnonce = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query('SELECT * FROM Annonce WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    const [result] = await db.query('DELETE FROM Annonce WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Aucune suppression effectuée' });
    }

    // Supprimer les notifications associées basées sur le titre
    const title = existing[0].title;
    await db.query('DELETE FROM Notification WHERE contenu LIKE ?', [`%${title}%`]);
    console.log(`Notifications supprimées pour l'annonce ${id} basée sur le titre "${title}"`);

    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression de l\'annonce :', err.message);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { getAllAnnonces, createAnnonce, sendNotifications, updateAnnonce, deleteAnnonce };