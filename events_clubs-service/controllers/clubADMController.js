// backend/controllers/clubController.js
const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// Créer un club
const createClub = async (req, res) => {
  const { nom, description_club, gerant_matricule } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  try {
    console.log('Requête reçue pour createClub:', { nom, description_club, gerant_matricule, image });

    const gerantMatricule = gerant_matricule ? BigInt(gerant_matricule) : null;

    const [users] = await pool.query('SELECT * FROM User WHERE Matricule = ?', [gerantMatricule]);
    if (!gerantMatricule || users.length === 0) {
      return res.status(400).json({ error: 'Gérant invalide ou non trouvé' });
    }

    const [result] = await pool.query(
      'INSERT INTO Club (nom, description_club, gerant_matricule, image_url) VALUES (?, ?, ?, ?)',
      [nom, description_club, gerantMatricule, image]
    );
    console.log('Club créé avec ID:', result.insertId);
    res.status(201).json({ message: 'Club créé avec succès', clubId: result.insertId });
  } catch (error) {
    console.error('Erreur lors de la création du club:', error);
    res.status(500).json({ error: 'Erreur lors de la création du club: ' + error.message });
  }
};

// Récupérer tous les clubs
const getAllClubs = async (req, res) => {
  try {
    console.log('Requête reçue pour getAllClubs');
    const [clubs] = await pool.query(`
      SELECT c.*, u.nom AS gerant_nom, u.prenom AS gerant_prenom
      FROM Club c
      LEFT JOIN User u ON c.gerant_matricule = u.Matricule
    `);
    console.log('Clubs envoyés:', clubs);
    res.json(clubs);
  } catch (error) {
    console.error('Erreur lors de la récupération des clubs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des clubs: ' + error.message });
  }
};

// Récupérer un club par ID
const getClubById = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('Requête reçue pour getClubById:', id);
    const [clubs] = await pool.query(
      `
      SELECT c.*, u.nom AS gerant_nom, u.prenom AS gerant_prenom
      FROM Club c
      LEFT JOIN User u ON c.gerant_matricule = u.Matricule
      WHERE c.ID_club = ?
    `,
      [id]
    );

    if (clubs.length === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    console.log('Club envoyé:', clubs[0]);
    res.json(clubs[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du club:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du club: ' + error.message });
  }
};

// Mettre à jour un club
const updateClub = async (req, res) => {
  const { id } = req.params;
  const { nom, description_club, gerant_matricule } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : req.body.image_url;

  try {
    console.log('Requête reçue pour updateClub:', { id, nom, description_club, gerant_matricule, image });

    const [clubs] = await pool.query('SELECT * FROM Club WHERE ID_club = ?', [id]);
    if (clubs.length === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    const existingClub = clubs[0];

    const updatedNom = nom || existingClub.nom;
    const updatedDescription = description_club !== undefined ? description_club : existingClub.description_club;
    // Ne pas mettre à jour gerant_matricule si non fourni ou vide
    let updatedGerantMatricule = existingClub.gerant_matricule;
    if (gerant_matricule && gerant_matricule !== '') {
      updatedGerantMatricule = BigInt(gerant_matricule);
      const [users] = await pool.query('SELECT * FROM User WHERE Matricule = ?', [updatedGerantMatricule]);
      if (users.length === 0) {
        return res.status(400).json({ error: 'Gérant invalide ou non trouvé' });
      }
    }
    const updatedImage = image || existingClub.image_url;

    if (req.file && existingClub.image_url) {
      const oldImagePath = path.join(__dirname, '..', existingClub.image_url);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('Ancienne image supprimée:', oldImagePath);
        }
      } catch (unlinkError) {
        console.error('Erreur lors de la suppression de l’ancienne image:', unlinkError);
      }
    }

    const [result] = await pool.query(
      'UPDATE Club SET nom = ?, description_club = ?, gerant_matricule = ?, image_url = ? WHERE ID_club = ?',
      [updatedNom, updatedDescription, updatedGerantMatricule, updatedImage, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    console.log('Club mis à jour:', id);
    res.json({ message: 'Club mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du club:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du club: ' + error.message });
  }
};

// Supprimer un club
const deleteClub = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('Requête reçue pour deleteClub:', id);

    // Récupérer le club pour obtenir l'image_url
    const [clubs] = await pool.query('SELECT image_url FROM Club WHERE ID_club = ?', [id]);
    if (clubs.length === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    const club = clubs[0];

    // Récupérer toutes les publications du club
    const [publications] = await pool.query('SELECT ID_publication FROM Publication WHERE ID_club = ?', [id]);

    // Supprimer les dépendances des publications (commentaires, likes, notifications, etc.)
    for (const publication of publications) {
      // Supprimer les commentaires associés à la publication
      await pool.query('DELETE FROM Commentaire WHERE ID_publication = ?', [publication.ID_publication]);

      // Supprimer les likes ou réactions associés à la publication (si une table existe)
      await pool.query('DELETE FROM Like WHERE ID_publication = ?', [publication.ID_publication]).catch(err => {
        console.warn('Table Like introuvable ou pas de dépendance:', err.message);
      });

      // Supprimer les notifications associées à la publication (si une table existe)
      await pool.query('DELETE FROM Notification WHERE ID_publication = ?', [publication.ID_publication]).catch(err => {
        console.warn('Table Notification introuvable ou pas de dépendance:', err.message);
      });
    }

    // Supprimer les publications du club
    await pool.query('DELETE FROM Publication WHERE ID_club = ?', [id]);

    // Supprimer les autres dépendances du club
    await pool.query('DELETE FROM MembreClub WHERE ID_club = ?', [id]);
    await pool.query('DELETE FROM DemandeRejoindreClub WHERE ID_club = ?', [id]);

    // Supprimer les notifications associées au club (si une table existe)
    await pool.query('DELETE FROM Notification WHERE ID_club = ?', [id]).catch(err => {
      console.warn('Table Notification introuvable ou pas de dépendance:', err.message);
    });

    // Supprimer le club
    const [result] = await pool.query('DELETE FROM Club WHERE ID_club = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    // Supprimer l'image associée si elle existe
    if (club.image_url) {
      const imagePath = path.join(__dirname, '..', club.image_url);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('Image du club supprimée:', imagePath);
        }
      } catch (unlinkError) {
        console.error('Erreur lors de la suppression de l’image du club:', unlinkError);
      }
    }

    console.log('Club supprimé avec succès:', id);
    res.json({ message: 'Club supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du club:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du club: ' + error.message });
  }
};

// Récupérer les étudiants avec filtres
const getEtudiantsWithFilters = async (req, res) => {
  const { id_faculte, id_departement, id_specialite, id_section } = req.query;

  try {
    console.log('Requête reçue pour getEtudiantsWithFilters:', req.query);

    let query = `
      SELECT DISTINCT u.Matricule, u.nom, u.prenom
      FROM User u
      JOIN Etudiant e ON u.Matricule = e.Matricule
      JOIN Etudiant_Section es ON e.Matricule = es.Matricule
      JOIN Section s ON es.ID_section = s.ID_section
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
      JOIN faculte f ON d.ID_faculte = f.ID_faculte
      WHERE 1=1
    `;
    const params = [];

    if (id_faculte) {
      query += ' AND f.ID_faculte = ?';
      params.push(id_faculte);
    }
    if (id_departement) {
      query += ' AND d.ID_departement = ?';
      params.push(id_departement);
    }
    if (id_specialite) {
      query += ' AND sp.ID_specialite = ?';
      params.push(id_specialite);
    }
    if (id_section) {
      query += ' AND es.ID_section = ?';
      params.push(id_section);
    }

    console.log('Requête SQL:', query, params);
    const [etudiants] = await pool.query(query, params);
    console.log('Étudiants envoyés:', etudiants);
    res.json(etudiants);
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des étudiants: ' + error.message });
  }
};

module.exports = {
  createClub,
  getAllClubs,
  getClubById,
  updateClub,
  deleteClub,
  getEtudiantsWithFilters,
};