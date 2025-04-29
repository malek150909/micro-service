// backend/config/db.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME ,
    port: process.env.DB_PORT, // Utilise le port 3306 par défaut si DB_PORT n'est pas défini
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

// Vérifier la connexion immédiatement après la création du pool
(async () => {
    try {
        const connection = await pool.getConnection();
        await connection.ping(); // Vérifie la connexion
        console.log('✅ Connexion réussie à la base de données');
        connection.release(); // Libère la connexion
    } catch (err) {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
        process.exit(1); // Quitte avec une erreur
    }
})();

module.exports = pool;
