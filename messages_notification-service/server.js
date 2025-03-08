// backend/server.js
const app = require('./app');
const PORT = 8082;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});