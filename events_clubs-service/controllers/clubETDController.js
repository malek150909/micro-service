// club-evenement-service/backend/controllers/clubController.js
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de Multer pour l'upload des images
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

// Middleware pour gérer les erreurs de Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux (max 5MB)' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Vérifier l'étudiant et récupérer ses clubs (gérant ou membre)
const getEtudiantClubs = async (req, res) => {
  const { matricule } = req.params;

  try {
    console.log('Requête reçue pour getEtudiantClubs:', matricule);

    // Vérifier si l'étudiant existe
    const [etudiants] = await pool.query('SELECT * FROM User WHERE Matricule = ?', [matricule]);
    if (etudiants.length === 0) {
      return res.status(404).json({ error: 'Étudiant non trouvé' });
    }

    // Récupérer les clubs où l'étudiant est gérant
    const [clubsGerant] = await pool.query(
      `
      SELECT c.*, u.nom AS gerant_nom, u.prenom AS gerant_prenom
      FROM Club c
      JOIN User u ON c.gerant_matricule = u.Matricule
      WHERE c.gerant_matricule = ?
    `,
      [matricule]
    );

    console.log('Clubs Gerant:', clubsGerant);

    // Récupérer les clubs où l'étudiant est membre ordinaire
    const [clubsMembre] = await pool.query(
      `
      SELECT c.*, u.nom AS gerant_nom, u.prenom AS gerant_prenom
      FROM Club c
      JOIN MembreClub mc ON c.ID_club = mc.ID_club
      JOIN User u ON c.gerant_matricule = u.Matricule
      WHERE mc.matricule_etudiant = ?
    `,
      [matricule]
    );

    // Récupérer les clubs disponibles (ni gérant ni membre)
    const [clubsDisponibles] = await pool.query(
      `
      SELECT c.*, u.nom AS gerant_nom, u.prenom AS gerant_prenom
      FROM Club c
      JOIN User u ON c.gerant_matricule = u.Matricule
      WHERE c.ID_club NOT IN (
        SELECT ID_club FROM Club WHERE gerant_matricule = ?
        UNION
        SELECT ID_club FROM MembreClub WHERE matricule_etudiant = ?
      )
    `,
      [matricule, matricule]
    );

    res.json({ clubsGerant, clubsMembre, clubsDisponibles });
  } catch (error) {
    console.error('Erreur lors de la récupération des clubs:', error);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: `Table manquante: ${error.sqlMessage}` });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({ error: 'Erreur d’accès à la base de données: identifiants incorrects' });
    }
    res.status(500).json({ error: 'Erreur lors de la récupération des clubs' });
  }
};

// Mettre à jour la photo d’un club
const updateClubPhoto = async (req, res) => {
  const { clubId } = req.params;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!image) {
    return res.status(400).json({ error: 'Aucune image fournie' });
  }

  try {
    console.log('Requête reçue pour updateClubPhoto:', { clubId, image });

    // Vérifier si le club existe
    const [clubs] = await pool.query('SELECT * FROM Club WHERE ID_club = ?', [clubId]);
    if (clubs.length === 0) {
      // Supprimer le fichier uploadé si le club n'existe pas
      const imagePath = path.join(__dirname, '..', image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Image supprimée (club non trouvé):', imagePath);
      }
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    const club = clubs[0];

    // Supprimer l’ancienne photo si elle existe
    if (club.image_url) {
      const oldImagePath = path.join(__dirname, '..', club.image_url);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Ancienne photo supprimée:', oldImagePath);
        }
      } catch (unlinkError) {
        console.error('Erreur lors de la suppression de l’ancienne photo:', unlinkError);
        // Ne pas bloquer l'exécution si la suppression échoue
      }
    }

    // Mettre à jour l’URL de la nouvelle photo
    await pool.query('UPDATE Club SET image_url = ? WHERE ID_club = ?', [image, clubId]);

    res.json({ message: 'Photo mise à jour avec succès', image_url: image });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la photo du club:', error);
    // Supprimer le fichier uploadé en cas d'erreur
    const imagePath = path.join(__dirname, '..', image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('Image supprimée (erreur lors de la mise à jour):', imagePath);
    }
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'La table Club n’existe pas dans la base de données' });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({ error: 'Erreur d’accès à la base de données: identifiants incorrects' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la photo du club' });
  }
};

module.exports = {
  getEtudiantClubs,
  updateClubPhoto: [upload.single('image'), handleMulterError, updateClubPhoto],
};