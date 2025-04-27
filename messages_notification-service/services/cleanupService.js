const Message = require("../models/messageModel")
const fs = require("fs").promises
const path = require("path")
const db = require("../config/db") // Import the database connection

const uploadsDir = path.join(__dirname, "../uploads")

const cleanupService = {
  // Supprimer les messages de plus de 24 heures et leurs fichiers associés
  cleanupOldMessages: async () => {
    try {
      // Récupérer les messages à supprimer pour pouvoir supprimer les fichiers associés
      const [oldMessages] = await db.query(
        "SELECT filePath FROM Message WHERE date_envoi < DATE_SUB(NOW(), INTERVAL 24 HOUR) AND filePath IS NOT NULL",
      )

      // Supprimer les fichiers associés aux messages
      for (const message of oldMessages) {
        if (message.filePath) {
          try {
            const filePath = path.join(uploadsDir, message.filePath)
            await fs.unlink(filePath)
            console.log(`Fichier supprimé: ${filePath}`)
          } catch (fileError) {
            console.error(`Erreur lors de la suppression du fichier ${message.filePath}:`, fileError)
            // Continuer même si la suppression du fichier échoue
          }
        }
      }

      // Supprimer les messages de la base de données
      const result = await Message.deleteOldMessages()
      console.log(`${result.deletedCount} messages anciens supprimés`)
      return result
    } catch (error) {
      console.error("Erreur lors du nettoyage des messages anciens:", error)
      throw error
    }
  },
}

module.exports = cleanupService
