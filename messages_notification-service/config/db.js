const mysql = require('mysql2/promise');
require('dotenv').config();

// Création du pool de connexion
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Vérifier la connexion
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err);
        process.exit(1); // Quitter l'application en cas d'échec
    } else {
        console.log('✅ Connecté à la base de données MySQL');
        connection.release(); // Libérer la connexion après le test
    }
});

// Exporter le pool avec `.promise()` pour pouvoir utiliser async/await
module.exports = pool;
