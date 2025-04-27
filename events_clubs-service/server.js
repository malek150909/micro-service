// backend/server.js
const app = require('./app');
require('dotenv').config();
const PORT = 8084;

app.listen(PORT, () => {
    console.log(`Server running on http://events.localhost:`);
});