import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

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

async function testConnection() {
  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const connection = await pool.getConnection();
      console.log('✅ Connexion réussie à la base de données');
      connection.release();
      return;
    } catch (err) {
      attempts++;
      console.error(`❌ Tentative ${attempts}/${maxRetries} - Erreur de connexion:`, err.message);
      if (attempts === maxRetries) {
        console.error('❌ Impossible de se connecter à la base de données après plusieurs tentatives');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre 5 secondes
    }
  }
}

testConnection();

export default pool;