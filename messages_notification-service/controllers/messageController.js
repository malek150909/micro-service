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
        const destinataire = req.user.matricule; // Récupéré via authMiddleware
        try {
            const [messages] = await db.query(
                `SELECT m.ID_message, m.expediteur, m.destinataire, m.contenu, m.date_envoi, u.nom, u.prenom 
                 FROM Message m 
                 JOIN User u ON m.expediteur = u.Matricule 
                 WHERE m.destinataire = ? 
                 ORDER BY m.date_envoi DESC`,
                [destinataire]
            );
            res.json(messages);
        } catch (error) {
            console.error("Erreur lors de la récupération des messages reçus :", error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },
    createMessage: async (req, res) => {
        const messageData = req.body;
        try {
            const newMessage = await Message.create(messageData);
            res.status(201).json(newMessage);
        } catch (error) {
            console.error("Erreur lors de la création du message :", error);
            res.status(500).json({ message: "Erreur serveur" });
        }
    },
    sendMessage: async (req, res) => {
        const { expediteur, destinataire, contenu } = req.body;
        try {
            const message = await Message.create({ expediteur, destinataire, contenu });
            res.status(201).json(message);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de l'envoi du message" });
        }
    },
};

module.exports = messageController;