const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createEvenement } = require('./evenementETDCLUBController');

// Configuration de Multer pour gérer plusieurs fichiers
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

// Créer une publication avec plusieurs images ou un événement
const createPublication = async (req, res) => {
  const { clubId, contenu, matricule, type, nom_evenement, description_evenement, date_evenement, lieu, capacite, time_slots, is_public } = req.body;
  const files = req.files;

  console.log('Requête reçue pour createPublication:', { clubId, contenu, matricule, type, time_slots, is_public });
  console.log('Matricule utilisé pour la création:', matricule);
  console.log('Fichiers reçus:', files ? files.map(f => f.originalname) : 'Aucun fichier');

  if (!clubId || !contenu || !matricule) {
    return res.status(400).json({ error: 'Club ID, contenu et matricule sont requis' });
  }

  try {
    // Vérifier si l'utilisateur est le gérant du club
    const [club] = await pool.query('SELECT gerant_matricule, nom FROM Club WHERE ID_club = ?', [clubId]);
    if (club.length === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }
    if (String(club[0].gerant_matricule) !== String(matricule)) {
      console.log('Incohérence matricule:', { matricule, gerant_matricule: club[0].gerant_matricule });
      return res.status(403).json({ error: 'Vous n’êtes pas autorisé à créer une publication pour ce club' });
    }

    const nomClub = club[0].nom;
    let evenementId = null;
    let notificationIds = [];
    let publicationContenu = contenu;

    if (type === 'evenement' || type === 'evenement_public') {
      if (!nom_evenement || !date_evenement || !lieu || !capacite) {
        return res.status(400).json({ error: 'Les champs nom_evenement, date_evenement, lieu et capacite sont requis pour un événement' });
      }

      const image_url = files && files.length > 0 ? `/uploads/${files[0].filename}` : null;
      console.log('Image URL générée:', image_url);
      if (image_url) {
        console.log('Chemin complet de l’image:', path.join(__dirname, '..', image_url));
        console.log('Fichier existe:', fs.existsSync(path.join(__dirname, '..', image_url)));
      }

      console.log('Appel de createEvenement avec:', { nom_evenement, description_evenement, date_evenement, lieu, capacite, image_url, matricule, clubId, time_slots, is_public });
      const result = await createEvenement(
        nom_evenement,
        description_evenement,
        date_evenement,
        lieu,
        parseInt(capacite),
        image_url,
        matricule,
        clubId,
        time_slots,
        type === 'evenement_public' ? true : false
      );

      evenementId = result.evenementId;
      notificationIds = result.notificationIds;

      publicationContenu = `
        ${contenu}

        **Événement du club "${nomClub}": ${nom_evenement}** 
        - **Date** : ${new Date(date_evenement).toLocaleString()}
        - **Heure** : ${time_slots}
        - **Lieu** : ${lieu}
        - **Capacité** : ${capacite} participants
        ${description_evenement ? `- **Description** : ${description_evenement}` : ''}
      `.trim();
    }

    const [result] = await pool.query(
      'INSERT INTO Publication (ID_club, contenu, date_publication) VALUES (?, ?, NOW())',
      [clubId, publicationContenu]
    );
    const publicationId = result.insertId;
    console.log('Publication créée avec ID:', publicationId);

    if (type !== 'evenement' && type !== 'evenement_public' && files && files.length > 0) {
      const imagePromises = files.map(file => {
        const imageUrl = `/uploads/${file.filename}`;
        return pool.query(
          'INSERT INTO PublicationImages (ID_publication, image_url) VALUES (?, ?)',
          [publicationId, imageUrl]
        );
      });
      await Promise.all(imagePromises);
    }

    res.status(201).json({
      message: (type === 'evenement' || type === 'evenement_public') ? 'Événement et publication créés avec succès' : 'Publication créée avec succès',
      publicationId,
      evenementId,
      notificationIds
    });
  } catch (error) {
    console.error('Erreur lors de la création de la publication:', error);
    if (files && files.length > 0) {
      files.forEach(file => {
        const filePath = path.join(__dirname, '..', `/uploads/${file.filename}`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    res.status(500).json({ error: error.message || 'Erreur lors de la création de la publication' });
  }
};

// Récupérer les publications d'un club
const getPublicationsByClub = async (req, res) => {
  const { clubId } = req.params;

  try {
    console.log('Requête reçue pour getPublicationsByClub:', clubId);

    const [publications] = await pool.query(
      `
      SELECT p.*,
             (SELECT COUNT(*) FROM Reaction r WHERE r.ID_publication = p.ID_publication) AS likes,
             (SELECT GROUP_CONCAT(r.matricule_etudiant) FROM Reaction r WHERE r.ID_publication = p.ID_publication) AS liked_by,
             (SELECT COUNT(*) FROM Commentaire c WHERE c.ID_publication = p.ID_publication) AS commentaires_count
      FROM Publication p
      WHERE p.ID_club = ?
      ORDER BY p.date_publication DESC
      `,
      [clubId]
    );

    for (let pub of publications) {
      pub.liked_by = pub.liked_by ? pub.liked_by.split(',') : [];

      const [images] = await pool.query(
        'SELECT ID_image, image_url FROM PublicationImages WHERE ID_publication = ?',
        [pub.ID_publication]
      );
      pub.images = images;

      const isEvent = pub.contenu.includes('**Événement du club');
      if (isEvent) {
        const eventIdMatch = pub.contenu.match(/\(ID: (\d+)\)/);
        if (eventIdMatch) {
          const eventId = parseInt(eventIdMatch[1]);
          console.log('ID de l’événement extrait:', eventId);

          const [event] = await pool.query(
            'SELECT image_url FROM ClubEvenement WHERE ID_club_evenement = ? AND ID_club = ?',
            [eventId, clubId]
          );
          console.log('Résultat de la requête ClubEvenement:', event);

          if (event.length > 0 && event[0].image_url) {
            pub.images = [{ image_url: event[0].image_url }];
            console.log('Image assignée pour la publication:', pub.images);
          } else {
            console.log('Aucune image trouvée pour l’événement ID:', eventId);
          }
        } else {
          console.log('Échec de l’extraction de l’ID de l’événement pour la publication:', pub.ID_publication);
        }
      }

      const [commentaires] = await pool.query(
        `
        SELECT c.ID_commentaire, c.contenu, u.nom, u.prenom
        FROM Commentaire c
        JOIN User u ON c.matricule_etudiant = u.Matricule
        WHERE c.ID_publication = ?
        `,
        [pub.ID_publication]
      );
      pub.commentaires = commentaires;
    }

    console.log('Publications renvoyées:', publications.map(pub => ({
      ID_publication: pub.ID_publication,
      contenu: pub.contenu,
      images: pub.images,
      commentaires_count: pub.commentaires_count,
      likes: pub.likes,
      liked_by: pub.liked_by,
    })));

    res.json(publications);
  } catch (error) {
    console.error('Erreur lors de la récupération des publications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des publications' });
  }
};

const getPublicEventPublications = async (req, res) => {
  const matricule = req.query.matricule;

  try {
    console.log('Début de getPublicEventPublications, matricule:', matricule || 'Non fourni');

    const [publicEvents] = await pool.query(
      `
      SELECT ce.*, c.nom AS club_nom, c.image_url AS club_image_url
      FROM ClubEvenement ce
      JOIN Club c ON ce.ID_club = c.ID_club
      WHERE ce.is_public = 1
      ORDER BY ce.date_evenement DESC
      `
    );
    console.log('Événements publics récupérés:', publicEvents);

    const publicEventPublications = [];
    for (const event of publicEvents) {
      if (matricule && event.organisateur_admin == matricule) {
        console.log(`Événement ID ${event.ID_club_evenement} exclu pour l'utilisateur ${matricule} (organisateur_admin)`);
        continue;
      }

      const [publication] = await pool.query(
        `
        SELECT p.*,
               (SELECT COUNT(*) FROM Reaction r WHERE r.ID_publication = p.ID_publication) AS likes,
               (SELECT GROUP_CONCAT(r.matricule_etudiant) FROM Reaction r WHERE r.ID_publication = p.ID_publication) AS liked_by,
               (SELECT COUNT(*) FROM Commentaire c WHERE c.ID_publication = p.ID_publication) AS commentaires_count
        FROM Publication p
        WHERE p.ID_club = ? AND p.contenu LIKE ?
        `,
        [event.ID_club, `%**Événement du club "${event.club_nom}": ${event.nom_evenement}**%`]
      );

      if (publication.length === 0) {
        console.log(`Aucune publication trouvée pour l’événement ID ${event.ID_club_evenement}`);
        continue;
      }

      const pub = publication[0];
      pub.club_nom = event.club_nom;
      pub.club_image_url = event.club_image_url;
      pub.eventId = event.ID_club_evenement; // Add eventId directly to the publication object
      pub.liked_by = pub.liked_by ? pub.liked_by.split(',') : [];

      pub.images = event.image_url ? [{ image_url: event.image_url }] : [];

      const [commentaires] = await pool.query(
        `
        SELECT c.ID_commentaire, c.contenu, u.nom, u.prenom
        FROM Commentaire c
        JOIN User u ON c.matricule_etudiant = u.Matricule
        WHERE c.ID_publication = ?
        `,
        [pub.ID_publication]
      );
      pub.commentaires = commentaires;

      publicEventPublications.push(pub);
    }

    console.log('Publications des événements publics renvoyées:', publicEventPublications.map(pub => ({
      ID_publication: pub.ID_publication,
      contenu: pub.contenu,
      eventId: pub.eventId, // Log the eventId to confirm
      images: pub.images,
      commentaires_count: pub.commentaires_count,
      likes: pub.likes,
      liked_by: pub.liked_by,
      club_nom: pub.club_nom,
    })));

    res.json(publicEventPublications);
  } catch (error) {
    console.error('Erreur détaillée dans getPublicEventPublications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des publications des événements publics' });
  }
};
// Ajouter ou retirer un "J'aime" sur une publication
const addLike = async (req, res) => {
  const { id: publicationId } = req.params;
  const { matricule } = req.body;

  if (!publicationId || !matricule) {
    return res.status(400).json({ error: 'Publication ID et matricule sont requis' });
  }

  try {
    const [publication] = await pool.query(
      'SELECT * FROM Publication WHERE ID_publication = ?',
      [publicationId]
    );
    if (publication.length === 0) {
      return res.status(404).json({ error: 'Publication non trouvée' });
    }

    const [existingReaction] = await pool.query(
      'SELECT * FROM Reaction WHERE ID_publication = ? AND matricule_etudiant = ?',
      [publicationId, matricule]
    );

    if (existingReaction.length > 0) {
      await pool.query(
        'DELETE FROM Reaction WHERE ID_publication = ? AND matricule_etudiant = ?',
        [publicationId, matricule]
      );
    } else {
      await pool.query(
        'INSERT INTO Reaction (ID_publication, matricule_etudiant) VALUES (?, ?)',
        [publicationId, matricule]
      );
    }

    const [updatedData] = await pool.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM Reaction r WHERE r.ID_publication = ?) AS likes,
        (SELECT GROUP_CONCAT(r.matricule_etudiant) FROM Reaction r WHERE r.ID_publication = ?) AS liked_by
      `,
      [publicationId, publicationId]
    );

    const likes = updatedData[0].likes;
    const liked_by = updatedData[0].liked_by ? updatedData[0].liked_by.split(',') : [];

    res.json({ likes, liked_by });
  } catch (error) {
    console.error('Erreur lors de la gestion du like:', error);
    res.status(500).json({ error: 'Erreur lors de la gestion du like' });
  }
};

// Ajouter un commentaire à une publication
const addComment = async (req, res) => {
  const { id: publicationId } = req.params;
  const { matricule, contenu } = req.body;

  if (!publicationId || !matricule || !contenu) {
    return res.status(400).json({ error: 'Publication ID, matricule et contenu sont requis' });
  }

  try {
    const [publication] = await pool.query(
      'SELECT * FROM Publication WHERE ID_publication = ?',
      [publicationId]
    );
    if (publication.length === 0) {
      return res.status(404).json({ error: 'Publication non trouvée' });
    }

    await pool.query(
      'INSERT INTO Commentaire (ID_publication, matricule_etudiant, contenu, date_commentaire) VALUES (?, ?, ?, NOW())',
      [publicationId, matricule, contenu]
    );

    res.json({ message: 'Commentaire ajouté avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’ajout du commentaire:', error);
    res.status(500).json({ error: 'Erreur lors de l’ajout du commentaire' });
  }
};

// Supprimer une publication
const deletePublication = async (req, res) => {
  const { publicationId } = req.params;
  const { matricule } = req.body;

  console.log('Requête de suppression reçue:', { publicationId, matricule });

  try {
    const [publications] = await pool.query(
      'SELECT p.ID_club, p.contenu FROM Publication p WHERE p.ID_publication = ?',
      [publicationId]
    );
    if (publications.length === 0) {
      console.log('Publication non trouvée:', publicationId);
      return res.status(404).json({ error: 'Publication non trouvée' });
    }

    const clubId = publications[0].ID_club;
    const contenu = publications[0].contenu;
    console.log('Club ID associé à la publication:', clubId);

    const [club] = await pool.query(
      'SELECT gerant_matricule, nom FROM Club WHERE ID_club = ?',
      [clubId]
    );
    console.log('Résultat de la requête Club:', club);

    if (club.length === 0) {
      console.log('Club non trouvé:', clubId);
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    const nomClub = club[0].nom;
    console.log('Comparaison matricule:', { matricule, gerant_matricule: club[0].gerant_matricule });

    if (String(club[0].gerant_matricule) !== String(matricule)) {
      console.log('Utilisateur non autorisé:', { matricule, gerant_matricule: club[0].gerant_matricule });
      return res.status(403).json({ error: 'Vous n’êtes pas autorisé à supprimer cette publication' });
    }

    const isEvent = contenu.includes('**Événement du club');
    if (isEvent) {
      const eventIdMatch = contenu.match(/\(ID: (\d+)\)/);
      if (eventIdMatch) {
        const eventId = parseInt(eventIdMatch[1]);
        console.log('Événement détecté avec ID:', eventId);

        const [evenement] = await pool.query(
          'SELECT nom_evenement FROM ClubEvenement WHERE ID_club_evenement = ? AND ID_club = ?',
          [eventId, clubId]
        );
        if (evenement.length > 0) {
          const eventName = evenement[0].nom_evenement;

          const messagePattern = `Nouveau événement du club "${nomClub}": "${eventName}" est là !`;
          const updatedMessagePattern = `L’événement du club "${nomClub}": "${eventName}" a été mis à jour !`;
          await pool.query(
            'DELETE FROM Notification WHERE contenu LIKE ? OR contenu LIKE ?',
            [`%${messagePattern}%`, `%${updatedMessagePattern}%`]
          );
          console.log('Notifications associées à l’événement supprimées');

          await pool.query('DELETE FROM ClubEvenement WHERE ID_club_evenement = ?', [eventId]);
          console.log('Événement supprimé avec ID:', eventId);
        }
      }
    }

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

    await pool.query('DELETE FROM PublicationImages WHERE ID_publication = ?', [publicationId]);
    await pool.query('DELETE FROM Commentaire WHERE ID_publication = ?', [publicationId]);
    await pool.query('DELETE FROM Reaction WHERE ID_publication = ?', [publicationId]);
    const [result] = await pool.query('DELETE FROM Publication WHERE ID_publication = ?', [publicationId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Publication non trouvée' });
    }

    res.json({ message: 'Publication et événement associé (si applicable) supprimés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la publication:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la publication' });
  }
};

// Mettre à jour une publication
const updatePublication = async (req, res) => {
  const { publicationId } = req.params;
  const { matricule, contenu } = req.body;
  const files = req.files;

  if (!contenu) {
    return res.status(400).json({ error: 'Le contenu est requis' });
  }

  try {
    const [publications] = await pool.query(
      'SELECT p.ID_club FROM Publication p WHERE p.ID_publication = ?',
      [publicationId]
    );
    if (publications.length === 0) {
      return res.status(404).json({ error: 'Publication non trouvée' });
    }

    const clubId = publications[0].ID_club;

    const [club] = await pool.query(
      'SELECT gerant_matricule FROM Club WHERE ID_club = ?',
      [clubId]
    );
    if (club.length === 0 || String(club[0].gerant_matricule) !== String(matricule)) {
      return res.status(403).json({ error: 'Vous n’êtes pas autorisé à modifier cette publication' });
    }

    await pool.query(
      'UPDATE Publication SET contenu = ? WHERE ID_publication = ?',
      [contenu, publicationId]
    );

    if (files && files.length > 0) {
      const [oldImages] = await pool.query(
        'SELECT image_url FROM PublicationImages WHERE ID_publication = ?',
        [publicationId]
      );

      for (const image of oldImages) {
        const imagePath = path.join(__dirname, '..', image.image_url);
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log('Ancienne image supprimée:', imagePath);
          }
        } catch (unlinkError) {
          console.error('Erreur lors de la suppression de l’ancienne image:', unlinkError);
        }
      }

      await pool.query('DELETE FROM PublicationImages WHERE ID_publication = ?', [publicationId]);

      const imagePromises = files.map(file => {
        const imageUrl = `/uploads/${file.filename}`;
        return pool.query(
          'INSERT INTO PublicationImages (ID_publication, image_url) VALUES (?, ?)',
          [publicationId, imageUrl]
        );
      });
      await Promise.all(imagePromises);
    }

    res.json({ message: 'Publication modifiée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la modification de la publication:', error);
    if (files && files.length > 0) {
      files.forEach(file => {
        const filePath = path.join(__dirname, '..', `/uploads/${file.filename}`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Image supprimée (erreur lors de la modification):', filePath);
        }
      });
    }
    res.status(500).json({ error: 'Erreur lors de la modification de la publication' });
  }
};

// Vérifier si un événement est déjà dans le calendrier de l'étudiant
const isEventInCalendar = async (req, res) => {
  const { eventId } = req.params;
  const { matricule } = req.query;

  if (!eventId || !matricule) {
    return res.status(400).json({ error: 'ID de l’événement et matricule sont requis' });
  }

  try {
    // Récupérer les détails de l'événement pour construire le titre
    const [event] = await pool.query(
      'SELECT ce.*, c.nom AS club_nom FROM ClubEvenement ce JOIN Club c ON ce.ID_club = c.ID_club WHERE ce.ID_club_evenement = ?',
      [eventId]
    );

    if (event.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    const eventDetails = event[0];
    const eventTitle = `Événement du club ${eventDetails.club_nom}: ${eventDetails.nom_evenement}`;

    // Vérifier si une entrée existe dans CalendarEvent avec le même titre et matricule
    const [existingEntry] = await pool.query(
      'SELECT * FROM CalendarEvent WHERE matricule = ? AND title = ? AND event_date = ?',
      [matricule, eventTitle, eventDetails.date_evenement]
    );

    res.json({ isInCalendar: existingEntry.length > 0 });
  } catch (error) {
    console.error('Erreur lors de la vérification de l’événement dans le calendrier:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de l’événement dans le calendrier' });
  }
};

// Ajouter un événement public au calendrier de l'étudiant
const addEventToCalendar = async (req, res) => {
  const { eventId } = req.params;
  const { matricule } = req.body;

  if (!eventId || !matricule) {
    return res.status(400).json({ error: 'ID de l’événement et matricule sont requis' });
  }

  try {
    // Vérifier si l'événement existe et est public
    const [event] = await pool.query(
      'SELECT ce.*, c.nom AS club_nom FROM ClubEvenement ce JOIN Club c ON ce.ID_club = c.ID_club WHERE ce.ID_club_evenement = ? AND ce.is_public = 1',
      [eventId]
    );

    if (event.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé ou non public' });
    }

    // Vérifier si l'étudiant existe
    const [student] = await pool.query('SELECT * FROM User WHERE Matricule = ?', [matricule]);
    if (student.length === 0) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }

    const eventDetails = event[0];
    const eventTitle = `Événement du club ${eventDetails.club_nom}: ${eventDetails.nom_evenement}`;

    // Vérifier si l'étudiant a déjà ajouté cet événement
    const [existingEntry] = await pool.query(
      'SELECT * FROM CalendarEvent WHERE matricule = ? AND title = ? AND event_date = ?',
      [matricule, eventTitle, eventDetails.date_evenement]
    );

    if (existingEntry.length > 0) {
      return res.status(400).json({ error: 'Cet événement est déjà dans votre calendrier' });
    }

    // Préparer les données pour CalendarEvent
    const eventDate = eventDetails.date_evenement;
    const eventTimeSlot = eventDetails.time_slots;
    const eventContent = `
      **Événement du club "${eventDetails.club_nom}": ${eventDetails.nom_evenement}**
      - **Lieu** : ${eventDetails.lieu}
      - **Capacité** : ${eventDetails.capacite} participants
      ${eventDetails.description_evenement ? `- **Description** : ${eventDetails.description_evenement}` : ''}
      -  <!-- Stocké pour référence future -->
    `.trim();

    // Vérifier que time_slots correspond à un créneau valide
    const validTimeSlots = ['08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50'];
    const timeSlotToUse = validTimeSlots.includes(eventTimeSlot) ? eventTimeSlot : '08:00 - 09:30'; // Par défaut si time_slots n'est pas valide

    // Ajouter l'événement à CalendarEvent
    await pool.query(
      'INSERT INTO CalendarEvent (matricule, title, content, event_date, time_slot) VALUES (?, ?, ?, ?, ?)',
      [matricule, eventTitle, eventContent, eventDate, timeSlotToUse]
    );

    res.status(200).json({ message: 'Événement ajouté au calendrier avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’ajout de l’événement au calendrier:', error);
    res.status(500).json({ error: 'Erreur lors de l’ajout de l’événement au calendrier' });
  }
};

// Récupérer les événements du calendrier d'un étudiant
const getStudentCalendarEvents = async (req, res) => {
  const { matricule } = req.params;

  if (!matricule) {
    return res.status(400).json({ error: 'Matricule requis' });
  }

  try {
    const [events] = await pool.query(
      'SELECT * FROM CalendarEvent WHERE matricule = ? ORDER BY event_date ASC, time_slot ASC',
      [matricule]
    );

    // Formater les événements pour le frontend
    const formattedEvents = events.map(event => ({
      ID_event: event.ID_event,
      title: event.title,
      content: event.content,
      event_date: event.event_date,
      time_slot: event.time_slot,
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements du calendrier:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des événements du calendrier' });
  }
};

module.exports = {
  createPublication: [upload.array('images', 5), createPublication],
  getPublicationsByClub,
  getPublicEventPublications,
  addLike,
  addComment,
  deletePublication,
  updatePublication: [upload.array('images', 5), updatePublication],
  addEventToCalendar,
  isEventInCalendar,
  getStudentCalendarEvents,
};