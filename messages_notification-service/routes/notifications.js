const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/auth'); // Importer votre middleware

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Récupérer les notifications d'un utilisateur
router.get('/', async (req, res) => {
  try {
    const matricule = req.user.matricule; // Extraire le matricule du token via authMiddleware
    const [notifications] = await db.query(`
      SELECT n.*, 
             IFNULL(seen.status, 0) as is_seen
      FROM Notification n
      LEFT JOIN (
        SELECT ID_notification, 1 as status 
        FROM Notification_seen 
        WHERE matricule = ?
      ) seen ON n.ID_notification = seen.ID_notification
      WHERE n.destinataire = ?
      ORDER BY n.date_envoi DESC
    `, [matricule, matricule]);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une notification
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Notification WHERE ID_notification = ?', [req.params.id]);
    res.json({ message: 'Notification supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer toutes les notifications
router.delete('/all', async (req, res) => {
  try {
    const matricule = req.user.matricule; // Extraire le matricule du token
    await db.query('DELETE FROM Notification WHERE destinataire = ?', [matricule]);
    res.json({ message: 'Toutes les notifications ont été supprimées' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer une notification comme lue
router.post('/seen/:id', async (req, res) => {
  try {
    const matricule = req.user.matricule; // Extraire le matricule du token
    await db.query(
      'INSERT INTO Notification_seen (ID_notification, matricule) VALUES (?, ?)',
      [req.params.id, matricule]
    );
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;