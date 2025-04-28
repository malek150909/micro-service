const User = require("../models/userModel")
const db = require("../config/db")
const Message = require("../models/messageModel")
const emailService = require("../services/emailService")
const path = require("path")
const fs = require("fs")
const { broadcastMessage } = require("../websocket") // Adjust path if websocket.js is elsewhere

// Créer un répertoire pour les fichiers si nécessaire
const uploadsDir = path.join(__dirname, "../Uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const messageController = {
  // Récupérer les messages entre deux utilisateurs
  getMessages: async (req, res) => {
    const { expediteur, destinataire } = req.query
    try {
      const messages = await Message.findBetweenUsers(expediteur, destinataire)
      res.json(messages)
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  getUnreadMessagesCount: async (req, res) => {
    const destinataire = req.user.matricule;
    try {
        const [rows] = await db.query(
            "SELECT COUNT(*) as unreadCount FROM Message WHERE destinataire = ? AND isRead = 0",
            [destinataire]
        );
        res.json({ unreadCount: rows[0].unreadCount });
    } catch (error) {
        console.error("Erreur lors de la récupération du nombre de messages non lus:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
},

  // Récupérer les messages reçus par un utilisateur
  getReceivedMessages: async (req, res) => {
    const destinataire = req.user.matricule
    try {
      const messages = await Message.getReceivedMessages(destinataire)
      res.json(messages)
    } catch (error) {
      console.error("Erreur lors de la récupération des messages reçus:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  // Récupérer les derniers messages par contact
  getLastMessagesByContact: async (req, res) => {
    const matricule = req.user.matricule
    try {
      const messages = await Message.getLastMessagesByContact(matricule)
      res.json(messages)
    } catch (error) {
      console.error("Erreur lors de la récupération des derniers messages:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  // Créer un nouveau message et envoyer une notification par email
  createMessage: async (req, res) => {
    const { expediteur, destinataire, contenu } = req.body
    const file = req.file

    try {
      const [expediteurInfo] = await User.findByMatricule(expediteur)
      const [destinataireInfo] = await User.findByMatricule(destinataire)

      if (!expediteurInfo || !destinataireInfo) {
        return res.status(404).json({ message: "Utilisateur non trouvé" })
      }

      let filePath = null
      let fileName = null

      if (file) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        fileName = file.originalname
        filePath = `${uniqueSuffix}-${fileName}`
        const targetPath = path.join(uploadsDir, filePath)
        fs.copyFileSync(file.path, targetPath)
        fs.unlinkSync(file.path)
      }

      const messageData = {
        expediteur,
        destinataire,
        contenu,
        filePath,
        fileName,
      }

      const newMessage = await Message.create(messageData)

      // Broadcast message via WebSocket
      broadcastMessage({
        type: "new_message",
        ID_message: newMessage.ID_message,
        expediteur,
        destinataire,
        contenu,
        date_envoi: newMessage.date_envoi,
        filePath: newMessage.filePath,
        fileName: newMessage.fileName,
        nom: expediteurInfo.nom,
        prenom: expediteurInfo.prenom,
        email: expediteurInfo.email,
      })

      const attachments = []
      if (file) {
        attachments.push({
          filename: fileName,
          path: path.join(uploadsDir, filePath),
        })
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #052659; border-radius: 5px;">
          <div style="background-color: #052659; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h2 style="margin: 0;">Plateforme Universitaire - Nouveau Message</h2>
          </div>
          <div style="padding: 20px;">
            <p>Bonjour,</p>
            <p>Vous avez reçu un nouveau message de <strong>${expediteurInfo.nom} ${expediteurInfo.prenom}</strong> (${expediteurInfo.email}).</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; border-left: 4px solid #052659;">
              ${contenu}
            </div>
            ${file ? `<p><strong>Pièce jointe:</strong> ${fileName}</p>` : ""}
            <p>Pour répondre à ce message, veuillez vous connecter à la plateforme universitaire.</p>
            <p><strong>Note:</strong> Ce message sera automatiquement supprimé après 24 heures.</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
            <p>Ce message a été envoyé automatiquement par la Plateforme Universitaire.</p>
            <p>© ${new Date().getFullYear()} Plateforme Universitaire. Tous droits réservés.</p>
          </div>
        </div>
      `

      try {
        await emailService.sendEmail({
          to: destinataireInfo.email,
          subject: `Nouveau message de ${expediteurInfo.nom} ${expediteurInfo.prenom}`,
          text: contenu,
          html: htmlContent,
          attachments,
        })
        console.log("Email de notification envoyé avec succès")
      } catch (emailError) {
        console.error("Erreur lors de l'envoi de l'email de notification:", emailError)
      }

      res.status(201).json(newMessage)
    } catch (error) {
      console.error("Erreur lors de la création du message:", error)
      res.status(500).json({ message: "Erreur serveur", error: error.message })
    }
  },

  // Marquer les messages comme lus
  markMessagesAsRead: async (req, res) => {
    const { expediteur, destinataire } = req.body
    try {
      await Message.markAsRead(expediteur, destinataire)
      res.status(200).json({ message: "Messages marqués comme lus" })
    } catch (error) {
      console.error("Erreur lors de la mise à jour de isRead:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },
}

module.exports = messageController