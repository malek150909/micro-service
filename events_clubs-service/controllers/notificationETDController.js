// club-evenement-service/backend/controllers/notificationController.js
const pool = require('../config/db');

// Créer une notification
const createNotification = async (destinataire, contenu, expediteur) => {
  try {
    console.log('Appel de createNotification avec:', { destinataire, contenu, expediteur });
    const [result] = await pool.query(
      'INSERT INTO Notification (destinataire, contenu, expediteur, date_envoi) VALUES (?, ?, ?, NOW())',
      [destinataire, contenu, expediteur]
    );
    console.log('Notification insérée avec ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

// Récupérer les notifications d'un utilisateur
const getNotificationsByUser = async (req, res) => {
  const { matricule } = req.params;

  try {
    const [notifications] = await pool.query(
      `
      SELECT n.*, u.nom AS expediteur_nom, u.prenom AS expediteur_prenom
      FROM Notification n
      JOIN User u ON n.expediteur = u.Matricule
      WHERE n.destinataire = ?
      ORDER BY n.date_envoi DESC
      `,
      [matricule]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
  }
};

module.exports = {
  createNotification,
  getNotificationsByUser,
};