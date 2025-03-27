import express from 'express';
import Seance from '../models/ENSemploiModel.js';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Accès non autorisé' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user;
    next();
  });
};

router.use(authenticateToken);

// Salles filtrées par type_seance
router.get('/salles', async (req, res) => {
  const { type_seance } = req.query;
  if (!type_seance) return res.json([]);
  try {
    const [rows] = await pool.query(
      'SELECT ID_salle, nom_salle FROM Salle WHERE type_salle = ?',
      [type_seance]
    );
    console.log('Salles filtrées par type :', rows);
    res.json(rows);
  } catch (error) {
    console.error('Erreur salles :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des salles' });
  }
});

// Modules filtrés par section et professeur
router.get('/modules', async (req, res) => {
  const { section_id } = req.query;
  const matricule = req.user.matricule;
  if (!section_id) return res.json([]);
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT m.ID_module, m.nom_module 
       FROM Module m
       JOIN Module_Enseignant me ON m.ID_module = me.ID_module
       WHERE me.Matricule = ? AND m.ID_specialite IN (
         SELECT ID_specialite FROM Section WHERE ID_section = ?
       )`,
      [matricule, section_id]
    );
    console.log('Modules filtrés :', rows);
    res.json(rows);
  } catch (error) {
    console.error('Erreur modules :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des modules' });
  }
});

// Groupes filtrés par section
router.get('/groupes', async (req, res) => {
  const { section_id } = req.query;
  if (!section_id) return res.json([]);
  try {
    const [rows] = await pool.query(
      'SELECT ID_groupe, num_groupe FROM Groupe WHERE ID_section = ?',
      [section_id]
    );
    console.log('Groupes filtrés :', rows);
    res.json(rows);
  } catch (error) {
    console.error('Erreur groupes :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des groupes' });
  }
});

// Spécialités de l'enseignant
router.get('/specialites', async (req, res) => {
  const matricule = req.user.matricule;
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT sp.ID_specialite, sp.nom_specialite
       FROM Specialite sp
       JOIN Module m ON sp.ID_specialite = m.ID_specialite
       JOIN Module_Enseignant me ON m.ID_module = me.ID_module
       WHERE me.Matricule = ?`,
      [matricule]
    );
    console.log('Spécialités de l\'enseignant :', rows);
    res.json(rows);
  } catch (error) {
    console.error('Erreur spécialités :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des spécialités' });
  }
});

// Sections filtrées par spécialité et réellement enseignées par l'enseignant
router.get('/sections', async (req, res) => {
  const { specialite_id } = req.query;
  const matricule = req.user.matricule;
  if (!specialite_id) return res.json([]);
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT s.ID_section, s.nom_section 
       FROM Section s
       JOIN Seance se ON s.ID_section = se.ID_section
       JOIN Module m ON se.ID_module = m.ID_module
       WHERE se.Matricule = ? AND m.ID_specialite = ?`,
      [matricule, specialite_id]
    );
    console.log('Sections filtrées (enseignées) :', rows);
    res.json(rows);
  } catch (error) {
    console.error('Erreur sections :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sections' });
  }
});

// Routes génériques
router.get('/:matricule', async (req, res) => {
  try {
    const seances = await Seance.getTeacherTimetable(req.params.matricule);
    res.json(seances);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des séances' });
  }
});

router.post('/', async (req, res) => {
  try {
    const seanceId = await Seance.addSeance(req.body);
    res.status(201).json({ id: seanceId, message: 'Séance ajoutée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l’ajout de la séance' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const affectedRows = await Seance.updateSeance(req.params.id, req.body);
    if (affectedRows > 0) {
      res.json({ message: 'Séance modifiée avec succès' });
    } else {
      res.status(404).json({ error: 'Séance non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la modification de la séance' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const affectedRows = await Seance.deleteSeance(req.params.id);
    if (affectedRows > 0) {
      res.json({ message: 'Séance supprimée avec succès' });
    } else {
      res.status(404).json({ error: 'Séance non trouvée' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la séance' });
  }
});

export default router;