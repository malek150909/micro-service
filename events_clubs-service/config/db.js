// backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',           // Replace with your MySQL host
    user: 'root',               // Replace with your MySQL username
    password: '15092003Malek@', // Replace with your MySQL password
    database: 'uni_db',         // Replace with your database name
    waitForConnections: true,   // Si toutes les connexions sont utilisées, attendre au lieu de rejeter
    connectionLimit: 10,        // Nombre maximum de connexions dans le pool
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