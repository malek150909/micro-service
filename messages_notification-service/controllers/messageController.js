const Message = require("../models/messageModel");
const db = require("../config/db");

const messageController = {
  getMessages: async (req, res) => {
    const { expediteur, destinataire } = req.query;
    try {
      const messages = await Message.findBetweenUsers(expediteur, destinataire);
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  getReceivedMessages: async (req, res) => {
    const destinataire = req.user.matricule;
    try {
      const [messages] = await db.query(
        `SELECT m.ID_message, m.expediteur, m.destinataire, m.contenu, m.date_envoi, m.isRead, u.nom, u.prenom 
         FROM Message m 
         JOIN User u ON m.expediteur = u.Matricule 
         WHERE m.destinataire = ? 
         ORDER BY m.date_envoi DESC`,
        [destinataire]
      );
      console.log("Messages reçus pour destinataire", destinataire, ":", messages);
      const filteredMessages = messages.filter(msg => msg.destinataire === destinataire);
      res.json(filteredMessages);
    } catch (error) {
      console.error("Erreur lors de la récupération des messages reçus :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  createMessage: async (req, res) => {
    const { expediteur, destinataire, contenu } = req.body;
    const filePath = req.file ? req.file.filename : null;
    const fileName = req.file ? req.file.originalname : null; // Récupérer le nom d'origine du fichier
    const messageData = {
      expediteur,
      destinataire,
      contenu,
      filePath,
      fileName, // Ajouter le nom d'origine
    };
    try {
      const newMessage = await Message.create(messageData);
      console.log("Message créé et renvoyé :", newMessage);
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Erreur lors de la création du message :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },

  markMessagesAsRead: async (req, res) => {
    const { expediteur, destinataire } = req.body;
    try {
      await Message.markAsRead(expediteur, destinataire);
      res.status(200).json({ message: "Messages marqués comme lus" });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de isRead :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
};

module.exports = messageController;