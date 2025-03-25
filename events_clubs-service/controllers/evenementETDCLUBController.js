const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('./notificationETDController');

// Configuration de Multer pour gérer un fichier unique
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images JPEG/JPG/PNG sont autorisées'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
});

// Créer un événement dans la table ClubEvenement
const createEvenement = async (nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, gerant_matricule, clubId) => {
  try {
    console.log('Appel de createEvenement avec:', { nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, gerant_matricule, clubId });

    // Vérifier si la date de l'événement est dans le futur
    const currentDate = new Date();
    const eventDate = new Date(date_evenement);
    if (eventDate <= currentDate) {
      throw new Error('La date de l’événement doit être supérieure à la date courante');
    }

    // Vérifier si le gérant est bien le gérant du club et récupérer le nom du club
    const [club] = await pool.query('SELECT gerant_matricule, nom FROM Club WHERE ID_club = ?', [clubId]);
    if (club.length === 0) {
      throw new Error('Club non trouvé');
    }
    if (String(club[0].gerant_matricule) !== String(gerant_matricule)) {
      throw new Error('Vous n’êtes pas autorisé à créer un événement pour ce club');
    }
    const nomClub = club[0].nom;
    console.log('Nom du club récupéré:', nomClub);

    // Insérer l’événement dans la table ClubEvenement
    const [result] = await pool.query(
      'INSERT INTO ClubEvenement (nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, organisateur_admin, ID_club) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nom_evenement, description_evenement || null, date_evenement, lieu, capacite, image_url || null, gerant_matricule, clubId]
    );
    const evenementId = result.insertId;
    console.log('Événement créé avec ID:', evenementId);

    // Vérifier l'insertion de l'événement
    const [insertedEvent] = await pool.query('SELECT * FROM ClubEvenement WHERE ID_club_evenement = ?', [evenementId]);
    console.log('Événement inséré:', insertedEvent[0]);

    // Récupérer les membres du club
    const [membres] = await pool.query(
      'SELECT matricule_etudiant FROM MembreClub WHERE ID_club = ?',
      [clubId]
    );
    console.log('Membres du club trouvés:', membres);

    if (membres.length === 0) {
      console.warn('Aucun membre trouvé pour le club ID:', clubId);
    }

    // Envoyer une notification à chaque membre
    const notificationIds = [];
    const message = `Nouveau événement du club "${nomClub}": "${nom_evenement}" est là !`;
    console.log('Message de notification:', message);
    for (const membre of membres) {
      console.log('Envoi de la notification au membre:', membre.matricule_etudiant);
      const notificationId = await createNotification(membre.matricule_etudiant, message, gerant_matricule);
      console.log('Notification créée pour le membre:', membre.matricule_etudiant, 'avec ID:', notificationId);
      notificationIds.push(notificationId);

      // Vérifier que la notification a été insérée
      const [notification] = await pool.query(
        'SELECT * FROM Notification WHERE ID_notification = ?',
        [notificationId]
      );
      console.log('Notification insérée:', notification[0]);
    }

    return { evenementId, notificationIds, nomClub };
  } catch (error) {
    console.error('Erreur lors de la création de l’événement:', error);
    throw error;
  }
};

const getEvenementsByGerant = async (req, res) => {
  const { gerant_matricule } = req.params;

  try {
    const [evenements] = await pool.query(
      `
      SELECT ce.*, c.nom AS nom_club
      FROM ClubEvenement ce
      JOIN Club c ON ce.ID_club = c.ID_club
      WHERE ce.organisateur_admin = ?
      `,
      [gerant_matricule]
    );
    console.log('Événements renvoyés par l’API pour matricule', gerant_matricule, ':', evenements);
    res.json(evenements);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
};

const updateEvenement = async (req, res) => {
    const { evenementId } = req.params;
    const {
      nom_evenement,
      description_evenement,
      date_evenement,
      lieu,
      capacite,
      gerant_matricule,
      image_url,
    } = req.body;
    const file = req.file;
  
    const evenementIdInt = parseInt(evenementId);
    const gerantMatriculeInt = parseInt(gerant_matricule);
  
    console.log('Requête de mise à jour reçue:', { evenementId: evenementIdInt, gerant_matricule: gerantMatriculeInt });
  
    // Validation
    if (isNaN(evenementIdInt) || isNaN(gerantMatriculeInt)) {
      return res.status(400).json({ error: 'ID de l’événement ou matricule du gérant invalide' });
    }
  
    try {
      // Récupérer l'événement existant
      const [evenement] = await pool.query(
        'SELECT ce.*, c.nom AS nom_club FROM ClubEvenement ce JOIN Club c ON ce.ID_club = c.ID_club WHERE ce.ID_club_evenement = ? AND ce.organisateur_admin = ?',
        [evenementIdInt, gerantMatriculeInt]
      );
      console.log('Résultat de la requête pour l’événement:', evenement);
  
      if (evenement.length === 0) {
        return res.status(404).json({ error: 'Événement non trouvé ou vous n’êtes pas autorisé à le modifier' });
      }
  
      const nomClub = evenement[0].nom_club;
      const clubId = evenement[0].ID_club;
      const ancienNomEvenement = evenement[0].nom_evenement;
  
      // Gérer l'image
      let newImageUrl = image_url;
      if (file) {
        if (evenement[0].image_url) {
          const oldImagePath = path.join(__dirname, '..', evenement[0].image_url);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('Ancienne image supprimée:', oldImagePath);
          }
        }
        newImageUrl = `/uploads/${file.filename}`;
      }
  
      // Mettre à jour l'événement dans la table ClubEvenement
      await pool.query(
        'UPDATE ClubEvenement SET nom_evenement = ?, description_evenement = ?, date_evenement = ?, lieu = ?, capacite = ?, image_url = ? WHERE ID_club_evenement = ?',
        [
          nom_evenement,
          description_evenement,
          date_evenement,
          lieu,
          parseInt(capacite),
          newImageUrl,
          evenementIdInt,
        ]
      );
      console.log('Événement mis à jour avec ID:', evenementIdInt);
  
      // Mettre à jour la publication associée
      const [publication] = await pool.query(
        'SELECT ID_publication FROM Publication WHERE ID_club = ? AND contenu LIKE ?',
        [clubId, `%**Événement du club "${nomClub}": ${ancienNomEvenement}**%`]
      );
  
      if (publication.length > 0) {
        const publicationId = publication[0].ID_publication;
  
        // Construire le nouveau contenu de la publication
        const newContenu = `
          **Événement du club "${nomClub}": ${nom_evenement}**
          - **Date** : ${new Date(date_evenement).toLocaleDateString('fr-FR')} ${new Date(date_evenement).toLocaleTimeString('fr-FR')}
          - **Lieu** : ${lieu}
          - **Capacité** : ${capacite} participants
          - **Description** : ${description_evenement || 'Aucune description'}
        `;
  
        // Mettre à jour la publication
        await pool.query(
          'UPDATE Publication SET contenu = ? WHERE ID_publication = ?',
          [newContenu, publicationId]
        );
        console.log('Publication mise à jour avec ID:', publicationId);
  
        // Si une nouvelle image est téléchargée, mettre à jour les images de la publication
        if (file) {
          // Supprimer les anciennes images
          const [images] = await pool.query(
            'SELECT image_url FROM PublicationImages WHERE ID_publication = ?',
            [publicationId]
          );
          for (const image of images) {
            const imagePath = path.join(__dirname, '..', image.image_url);
            try {
              if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log('Ancienne image de la publication supprimée:', imagePath);
              }
            } catch (unlinkError) {
              console.error('Erreur lors de la suppression de l’ancienne image de la publication:', unlinkError);
            }
          }
          await pool.query('DELETE FROM PublicationImages WHERE ID_publication = ?', [publicationId]);
  
          // Ajouter la nouvelle image
          await pool.query(
            'INSERT INTO PublicationImages (ID_publication, image_url) VALUES (?, ?)',
            [publicationId, newImageUrl]
          );
          console.log('Nouvelle image ajoutée à la publication:', newImageUrl);
        }
      } else {
        console.warn('Aucune publication associée trouvée pour l’événement:', evenementIdInt);
      }
  
      // Mettre à jour les notifications
      const message = `L’événement du club "${nomClub}": "${nom_evenement}" a été mis à jour !`;
      const [existingNotifications] = await pool.query(
        'SELECT * FROM Notification WHERE contenu LIKE ? OR contenu LIKE ?',
        [
          `%du club "${nomClub}": "${ancienNomEvenement}" est là !%`,
          `%du club "${nomClub}": "${ancienNomEvenement}" a été mis à jour !%`
        ]
      );
  
      const notificationPromises = existingNotifications.map(notification => {
        return pool.query(
          'UPDATE Notification SET contenu = ?, date_envoi = NOW() WHERE ID_notification = ?',
          [message, notification.ID_notification]
        );
      });
  
      await Promise.all(notificationPromises);
      console.log('Notifications mises à jour:', existingNotifications.length);
  
      // Retourner l'événement mis à jour pour le frontend
      const [updatedEvenement] = await pool.query(
        'SELECT ce.*, c.nom AS nom_club FROM ClubEvenement ce JOIN Club c ON ce.ID_club = c.ID_club WHERE ce.ID_club_evenement = ?',
        [evenementIdInt]
      );
  
      res.json({ message: 'Événement et publication associée mis à jour avec succès', updatedEvenement: updatedEvenement[0] });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l’événement:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l’événement' });
    }
  };

const deleteEvenement = async (req, res) => {
    const { evenementId } = req.params;
    const { gerant_matricule } = req.body;
  
    const evenementIdInt = parseInt(evenementId);
    const gerantMatriculeInt = parseInt(gerant_matricule);
  
    console.log('Requête de suppression reçue:', { evenementId: evenementIdInt, gerant_matricule: gerantMatriculeInt });
  
    // Validation
    if (isNaN(evenementIdInt) || isNaN(gerantMatriculeInt)) {
      return res.status(400).json({ error: 'ID de l’événement ou matricule du gérant invalide' });
    }
  
    try {
      // Récupérer l'événement
      const [evenement] = await pool.query(
        'SELECT ce.*, c.nom AS nom_club FROM ClubEvenement ce JOIN Club c ON ce.ID_club = c.ID_club WHERE ce.ID_club_evenement = ? AND ce.organisateur_admin = ?',
        [evenementIdInt, gerantMatriculeInt]
      );
      console.log('Résultat de la requête pour l’événement:', evenement);
  
      if (evenement.length === 0) {
        return res.status(404).json({ error: 'Événement non trouvé ou vous n’êtes pas autorisé à le supprimer' });
      }
  
      const nomClub = evenement[0].nom_club;
      const clubId = evenement[0].ID_club;
      const nomEvenement = evenement[0].nom_evenement;
  
      // Supprimer les notifications associées
      const [existingNotifications] = await pool.query(
        'SELECT * FROM Notification WHERE contenu LIKE ? OR contenu LIKE ?',
        [
          `%du club "${nomClub}": "${nomEvenement}" est là !%`,
          `%du club "${nomClub}": "${nomEvenement}" a été mis à jour !%`
        ]
      );
      console.log('Notifications existantes avant suppression:', existingNotifications);
  
      const [deleteNotificationResult] = await pool.query(
        'DELETE FROM Notification WHERE contenu LIKE ? OR contenu LIKE ?',
        [
          `%du club "${nomClub}": "${nomEvenement}" est là !%`,
          `%du club "${nomClub}": "${nomEvenement}" a été mis à jour !%`
        ]
      );
      console.log('Nombre de notifications supprimées:', deleteNotificationResult.affectedRows);
  
      // Supprimer la publication associée
      const [publication] = await pool.query(
        'SELECT ID_publication FROM Publication WHERE ID_club = ? AND contenu LIKE ?',
        [clubId, `%**Événement du club "${nomClub}": ${nomEvenement}**%`]
      );
  
      if (publication.length > 0) {
        const publicationId = publication[0].ID_publication;
  
        // Supprimer les images associées à la publication
        const [images] = await pool.query(
          'SELECT image_url FROM PublicationImages WHERE ID_publication = ?',
          [publicationId]
        );
        for (const image of images) {
          const imagePath = path.join(__dirname, '..', image.image_url);
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log('Image supprimée:', imagePath);
            }
          } catch (unlinkError) {
            console.error('Erreur lors de la suppression de l’image:', unlinkError);
          }
        }
  
        // Supprimer les données associées à la publication
        await pool.query('DELETE FROM PublicationImages WHERE ID_publication = ?', [publicationId]);
        await pool.query('DELETE FROM Commentaire WHERE ID_publication = ?', [publicationId]);
        await pool.query('DELETE FROM Reaction WHERE ID_publication = ?', [publicationId]);
        await pool.query('DELETE FROM Publication WHERE ID_publication = ?', [publicationId]);
        console.log('Publication associée supprimée avec ID:', publicationId);
      } else {
        console.warn('Aucune publication associée trouvée pour l’événement:', evenementIdInt);
      }
  
      // Supprimer l'image de l'événement
      if (evenement[0].image_url) {
        const eventImagePath = path.join(__dirname, '..', evenement[0].image_url);
        try {
          if (fs.existsSync(eventImagePath)) {
            fs.unlinkSync(eventImagePath);
            console.log('Image de l’événement supprimée:', eventImagePath);
          }
        } catch (unlinkError) {
          console.error('Erreur lors de la suppression de l’image de l’événement:', unlinkError);
        }
      }
  
      // Supprimer l'événement
      const [deleteEventResult] = await pool.query('DELETE FROM ClubEvenement WHERE ID_club_evenement = ?', [evenementIdInt]);
      if (deleteEventResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Événement non trouvé lors de la suppression' });
      }
      console.log('Événement supprimé avec ID:', evenementIdInt);
  
      res.json({ message: 'Événement et publication associée supprimés avec succès', deletedEvenementId: evenementIdInt });
    } catch (error) {
      console.error('Erreur lors de la suppression de l’événement:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l’événement' });
    }
  };

module.exports = {
  createEvenement,
  getEvenementsByGerant,
  updateEvenement: [upload.single('image'), updateEvenement],
  deleteEvenement,
};