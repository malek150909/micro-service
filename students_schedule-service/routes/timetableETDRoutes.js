// StudentTimetableRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js'; // Assurez-vous que ce chemin est correct

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

// Route pour récupérer les séances de l'étudiant
router.get('/seances', async (req, res) => {
  const matricule = req.user.matricule;
  try {
    const [seances] = await pool.query(
      `SELECT 
         s.ID_seance, 
         s.jour, 
         s.time_slot, 
         s.type_seance, 
         m.nom_module, 
         sa.nom_salle, 
         sec.nom_section, 
         sec.niveau, 
         sp.nom_specialite,
         g.num_groupe
       FROM Seance s
       JOIN Module m ON s.ID_module = m.ID_module
       JOIN Salle sa ON s.ID_salle = sa.ID_salle
       JOIN Section sec ON s.ID_section = sec.ID_section
       JOIN Specialite sp ON sec.ID_specialite = sp.ID_specialite
       LEFT JOIN Groupe g ON s.ID_groupe = g.ID_groupe
       JOIN Etudiant_Section es ON sec.ID_section = es.ID_section
       WHERE es.Matricule = ?
       AND (s.ID_groupe IS NULL OR s.ID_groupe IN (
         SELECT ID_groupe FROM Groupe 
         WHERE ID_section = sec.ID_section 
         AND ID_groupe IN (
           SELECT ID_groupe FROM Etudiant_Section 
           WHERE Matricule = ?
         )
       ))`,
      [matricule, matricule]
    );
    console.log('Séances de l\'étudiant :', seances);
    res.json(seances);
  } catch (error) {
    console.error('Erreur lors de la récupération des séances :', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des séances' });
  }
});

export default router;