const db = require("../config/db")
const path = require('path');
const fs = require('fs');

const Message = {
  // Trouver les messages entre deux utilisateurs
  findBetweenUsers: async (expediteur, destinataire) => {
    const [rows] = await db.query(
      `SELECT ID_message, expediteur, destinataire, contenu, date_envoi, filePath, fileName, isRead 
       FROM Message 
       WHERE (expediteur = ? AND destinataire = ?) OR (expediteur = ? AND destinataire = ?) 
       ORDER BY date_envoi ASC`,
      [expediteur, destinataire, destinataire, expediteur],
    )
    return rows
  },

  // Créer un nouveau message
  create: async (messageData) => {
    const { expediteur, destinataire, contenu, filePath, fileName } = messageData
    const [result] = await db.query(
      "INSERT INTO Message (expediteur, destinataire, contenu, filePath, fileName, date_envoi) VALUES (?, ?, ?, ?, ?, NOW())",
      [expediteur, destinataire, contenu, filePath || null, fileName || null]
    )
    return {
      ID_message: result.insertId,
      expediteur,
      destinataire,
      contenu,
      filePath: filePath || null,
      fileName: fileName || null,
      date_envoi: new Date(),
      isRead: 0,
    }
  },

  // Marquer les messages comme lus
  markAsRead: async (expediteur, destinataire) => {
    const [result] = await db.query(
      "UPDATE Message SET isRead = 1 WHERE expediteur = ? AND destinataire = ? AND isRead = 0",
      [expediteur, destinataire],
    )
    return result
  },

  // Récupérer les messages reçus par un utilisateur
  getReceivedMessages: async (destinataire) => {
    const [rows] = await db.query(
      `SELECT m.ID_message, m.expediteur, m.destinataire, m.contenu, m.date_envoi, m.isRead, 
              m.filePath, m.fileName, u.nom, u.prenom, u.email
       FROM Message m 
       JOIN User u ON m.expediteur = u.Matricule 
       WHERE m.destinataire = ? 
       ORDER BY m.date_envoi DESC`,
      [destinataire],
    )
    return rows
  },

  // Récupérer les derniers messages par contact
  getLastMessagesByContact: async (matricule) => {
    const [rows] = await db.query(
      `WITH RankedMessages AS (
         SELECT 
           m.*,
           u.nom, 
           u.prenom, 
           u.email,
           ROW_NUMBER() OVER (
             PARTITION BY 
               CASE 
                 WHEN m.expediteur = ? THEN m.destinataire 
                 ELSE m.expediteur 
               END
             ORDER BY m.date_envoi DESC
           ) as rn
         FROM Message m
         JOIN User u ON (
           CASE 
             WHEN m.expediteur = ? THEN u.Matricule = m.destinataire
             ELSE u.Matricule = m.expediteur
           END
         )
         WHERE m.expediteur = ? OR m.destinataire = ?
       )
       SELECT * FROM RankedMessages WHERE rn = 1
       ORDER BY date_envoi DESC`,
      [matricule, matricule, matricule, matricule],
    )
    return rows
  },

  // Supprimer automatiquement les messages de plus de 7 jours
  deleteOldMessages: async () => {
    try {
      // Récupérer les filePath des messages à supprimer
      const [messages] = await db.query(
        "SELECT filePath FROM Message WHERE date_envoi < DATE_SUB(NOW(), INTERVAL 7 DAY) AND filePath IS NOT NULL"
      );

      // Supprimer les fichiers joints
      const uploadsDir = path.resolve(__dirname, '../Uploads');
      messages.forEach((msg) => {
        if (msg.filePath) {
          const filePath = path.join(uploadsDir, msg.filePath);
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Fichier supprimé : ${filePath}`);
            }
          } catch (err) {
            console.error(`Erreur lors de la suppression du fichier ${filePath}:`, err);
          }
        }
      });

      // Supprimer les messages de la base de données
      const [result] = await db.query(
        "DELETE FROM Message WHERE date_envoi < DATE_SUB(NOW(), INTERVAL 7 DAY)"
      );
      return { deletedCount: result.affectedRows };
    } catch (err) {
      console.error("Erreur lors de la suppression des messages anciens:", err);
      throw err;
    }
  },
}

module.exports = Message
