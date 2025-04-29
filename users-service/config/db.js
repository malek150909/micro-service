const mysql = require('mysql2');

require('dotenv').config();


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

// Promisify pour utiliser async/await
const promisePool = pool.promise();

// verification de la connexion de BDD
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
    } else {
        console.log('✅ Connexion réussie à la base de données');
        connection.release(); // Libérer la connexion
    }
});

module.exports = promisePool;