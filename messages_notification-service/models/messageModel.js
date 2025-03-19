const db = require("../config/db");

const Message = {
    findBetweenUsers: async (expediteur, destinataire) => {
        const [rows] = await db.query(
            `SELECT ID_message, expediteur, destinataire, contenu, date_envoi 
             FROM Message 
             WHERE (expediteur = ? AND destinataire = ?) OR (expediteur = ? AND destinataire = ?) 
             ORDER BY date_envoi ASC`,
            [expediteur, destinataire, destinataire, expediteur]
        );
        return rows;
    },
    create: async (messageData) => {
        const { expediteur, destinataire, contenu } = messageData;
        const [result] = await db.query(
            "INSERT INTO Message (expediteur, destinataire, contenu) VALUES (?, ?, ?)",
            [expediteur, destinataire, contenu]
        );
        return { ID_message: result.insertId, ...messageData, date_envoi: new Date() };
    },
};

module.exports = Message;