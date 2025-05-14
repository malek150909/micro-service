const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Notification = require('../models/NotificationRessources');
const authMiddleware = require('../middleware/auth'); // Importer votre middleware

// Appliquer le middleware d'authentification à toutes les routes
router.use(authMiddleware);

// Récupérer les notifications d'un utilisateur
router.get('/', async (req, res) => {
  try {
    const matricule = req.user.matricule;
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

    // Normaliser les notifications
    const validNotifications = Array.isArray(notifications)
      ? notifications
          .filter((notif) => 
            notif.ID_notification != null && 
            typeof notif.contenu === 'string' && 
            notif.contenu.trim() !== ''
          )
          .map((notif) => ({
            ID_notification: notif.ID_notification,
            date_envoi: notif.date_envoi,
            contenu: notif.contenu,
            expediteur: notif.expediteur || null,
            destinataire: notif.destinataire,
            is_seen: Boolean(notif.is_seen), // Convertir 0/1 en true/false
          }))
      : [];

    console.log('Backend: Notifications envoyées:', validNotifications);
    res.json(validNotifications);
  } catch (error) {
    console.error('Backend: Erreur lors de la récupération des notifications:', error);
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

router.post('/multiple', authMiddleware, async (req, res) => {
  try {
    const { senderMatricule, recipientMatricules, message } = req.body;
    if (!senderMatricule || !recipientMatricules || !message || !Array.isArray(recipientMatricules)) {
      return res.status(400).json({ error: 'Invalid input: senderMatricule, recipientMatricules (array), and message are required' });
    }
    await Notification.createForMultipleRecipients(senderMatricule, recipientMatricules, message);
    res.status(201).json({ message: 'Notifications created successfully' });
  } catch (error) {
    console.error('Error creating notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;