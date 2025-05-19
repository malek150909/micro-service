const app = require('./app');
const http = require('http');
const { setupWebSocketServer } = require('./websocket');
const Message = require('./models/messageModel');
const PORT = 8082;

// Créer le serveur HTTP
const server = http.createServer(app);

// Attacher le WebSocket dessus (important : pas sur Express directement)
setupWebSocketServer(server);

// Nettoyage périodique
setInterval(async () => {
  try {
    const result = await Message.deleteOldMessages();
    console.log(`${result.deletedCount} messages anciens supprimés`);
  } catch (error) {
    console.error("Erreur lors du nettoyage périodique des messages:", error);
  }
}, 60 * 60 * 1000);

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`HTTP + WebSocket Server running on port ${PORT}`);
});
