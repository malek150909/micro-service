// backend/server.js
const { app, server } = require('./app'); // << récupérer server
require('./cronCleaner');

const PORT = 8084;

server.listen(PORT, () => {
    console.log(`🚀 Server + WebSocket écoutant sur http://events.localhost`);
});
