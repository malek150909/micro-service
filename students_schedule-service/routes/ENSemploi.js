// routes/teacherRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Accès refusé' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};

// Récupérer les séances de l'enseignant avec détails (noms inclus)
router.get('/sessions/:matricule', authenticateToken, async (req, res) => {
  const { matricule } = req.params;

  if (req.user.role !== 'enseignant' || req.user.matricule !== parseInt(matricule)) {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    const [sessions] = await pool.query(
      `SELECT s.ID_seance, s.ID_module, s.jour, s.time_slot, s.ID_salle, s.type_seance, s.ID_groupe,
              m.nom_module, sp.nom_specialite, sec.nom_section, sal.nom_salle, g.num_groupe
       FROM Seance s
       JOIN Module m ON s.ID_module = m.ID_module
       JOIN Module_Section ms ON m.ID_module = ms.ID_module
       JOIN Section sec ON ms.ID_section = sec.ID_section
       JOIN Specialite sp ON sec.ID_specialite = sp.ID_specialite
       LEFT JOIN Salle sal ON s.ID_salle = sal.ID_salle
       LEFT JOIN Groupe g ON s.ID_groupe = g.ID_groupe
       WHERE s.Matricule = ?`,
      [matricule]
    );
    res.json(sessions);
  } catch (err) {
    console.error('Erreur lors de la récupération des séances:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier les conflits
router.post('/check-conflict', authenticateToken, async (req, res) => {
    const { moduleId, day, timeSlot, salleId, matricule, idSeance } = req.body;
  
    try {
      const query = idSeance
        ? 'SELECT ID_seance FROM Seance WHERE (ID_salle = ? OR Matricule = ?) AND jour = ? AND time_slot = ? AND ID_seance != ?'
        : 'SELECT ID_seance FROM Seance WHERE (ID_salle = ? OR Matricule = ?) AND jour = ? AND time_slot = ?';
      const params = idSeance
        ? [salleId, matricule, day, timeSlot, idSeance]
        : [salleId, matricule, day, timeSlot];
  
      const [conflicts] = await pool.query(query, params);
  
      if (conflicts.length > 0) {
        return res.json({ conflict: true, message: 'Conflit détecté : salle ou enseignant déjà occupé.' });
      }
      res.json({ conflict: false });
    } catch (err) {
      console.error('Erreur lors de la vérification des conflits:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

// Ajouter une séance
router.post('/add-session', authenticateToken, async (req, res) => {
  const { moduleId, day, timeSlot, salleId, type, matricule, groupeId } = req.body;

  if (req.user.role !== 'enseignant') {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    await pool.query(
      'INSERT INTO Seance (ID_module, jour, time_slot, ID_salle, type_seance, Matricule, ID_groupe) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)',
      [moduleId, day, timeSlot, salleId, type, matricule, groupeId || null]
    );
    res.status(200).json({ message: 'Séance ajoutée avec succès' });
  } catch (err) {
    console.error('Erreur lors de l’ajout de la séance:', err);
    res.status(500).json({ error: 'Erreur lors de l’ajout' });
  }
});

// Modifier une séance
router.put('/edit-session/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { moduleId, day, timeSlot, salleId, type, groupeId } = req.body;

  if (req.user.role !== 'enseignant') {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    await pool.query(
      'UPDATE Seance SET ID_module = ?, jour = ?, time_slot = ?, ID_salle = ?, type_seance = ?, ID_groupe = ? ' +
      'WHERE ID_seance = ? AND Matricule = ?',
      [moduleId, day, timeSlot, salleId, type, groupeId || null, id, req.user.Matricule]
    );
    res.status(200).json({ message: 'Séance modifiée avec succès' });
  } catch (err) {
    console.error('Erreur lors de la modification de la séance:', err);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
});

// Récupérer la liste des salles
router.get('/salles', authenticateToken, async (req, res) => {
  if (req.user.role !== 'enseignant') {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    const [salles] = await pool.query('SELECT ID_salle, nom_salle FROM Salle');
    res.json(salles);
  } catch (err) {
    console.error('Erreur lors de la récupération des salles:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer la liste des modules (accessibles à l'enseignant)
router.get('/modules', authenticateToken, async (req, res) => {
  if (req.user.role !== 'enseignant') {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    const [modules] = await pool.query(
      `SELECT DISTINCT m.ID_module, m.nom_module
       FROM Module m
       JOIN module_enseignant em ON m.ID_module = em.ID_module
       WHERE em.Matricule = ?`,
      [req.user.matricule]
    );
    res.json(modules);
  } catch (err) {
    console.error('Erreur lors de la récupération des modules:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer la liste des groupes
router.get('/groupes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'enseignant') {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  try {
    const [groupes] = await pool.query('SELECT ID_groupe, num_groupe FROM Groupe');
    res.json(groupes);
  } catch (err) {
    console.error('Erreur lors de la récupération des groupes:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;