// backend/server.js
const app = require('./app');
const Message = require('./models/messageModel');
const path = require('path');
const fs = require('fs');
const PORT = 8082;

// Tâche planifiée pour supprimer les messages anciens toutes les heures
setInterval(
  async () => {
    try {
      const result = await Message.deleteOldMessages();
      console.log(`${result.deletedCount} messages anciens supprimés`);
    } catch (error) {
      console.error("Erreur lors du nettoyage périodique des messages:", error);
    }
  },
  60 * 60 * 1000 // Exécuter toutes les heures (1 heure = 60 * 60 * 1000 ms)
);

app.listen(PORT, () => {
  console.log(`Server running on http://messaging.localhost`);
});