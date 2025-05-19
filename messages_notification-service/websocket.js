const WebSocket = require('ws');

const clients = new Map(); // matricule → ws

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  console.log("WebSocket server initialized at /ws");

  wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const matricule = urlParams.get('matricule');

    if (!matricule) {
      ws.close();
      return;
    }

    console.log(`WebSocket client connected: ${matricule}`);
    clients.set(matricule, ws);

    ws.on('close', () => {
      console.log(`WebSocket client disconnected: ${matricule}`);
      clients.delete(matricule);
    });

    ws.on('error', (err) => {
      console.error(`WebSocket error for ${matricule}:`, err);
      clients.delete(matricule);
    });
  });
}

function broadcastMessage(message) {
  const destinataire = message.destinataire;
  const client = clients.get(destinataire);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

module.exports = { setupWebSocketServer, broadcastMessage };
