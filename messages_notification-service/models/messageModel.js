const db = require("../config/db");

const Message = {
  findBetweenUsers: async (expediteur, destinataire) => {
    const [rows] = await db.query(
      `SELECT ID_message, expediteur, destinataire, contenu, date_envoi, filePath, fileName, isRead 
       FROM Message 
       WHERE (expediteur = ? AND destinataire = ?) OR (expediteur = ? AND destinataire = ?) 
       ORDER BY date_envoi ASC`,
      [expediteur, destinataire, destinataire, expediteur]
    );
    return rows;
  },

  create: async (messageData) => {
    const { expediteur, destinataire, contenu, filePath, fileName } = messageData;
    const [result] = await db.query(
      "INSERT INTO Message (expediteur, destinataire, contenu, filePath, fileName) VALUES (?, ?, ?, ?, ?)",
      [expediteur, destinataire, contenu, filePath || null, fileName || null]
    );
    return {
      ID_message: result.insertId,
      expediteur,
      destinataire,
      contenu,
      filePath: filePath || null,
      fileName: fileName || null,
      date_envoi: new Date(),
      isRead: 0,
    };
  },

  markAsRead: async (expediteur, destinataire) => {
    const [result] = await db.query(
      "UPDATE Message SET isRead = 1 WHERE expediteur = ? AND destinataire = ? AND isRead = 0",
      [expediteur, destinataire]
    );
    return result;
  },
};

module.exports = Message;