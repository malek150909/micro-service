// cronCleaner.js
const cron = require('node-cron');
const pool = require('./config/db');

// Tâche : supprimer les messages de plus de 30 jours chaque nuit à 3h
cron.schedule('0 3 * * *', async () => {
  try {
    const [result] = await pool.query(`
      DELETE FROM MessageClub
      WHERE date_envoi < DATE_SUB(NOW(), INTERVAL 60 DAY)
    `);
    console.log(`[CRON] ${result.affectedRows} messages supprimés à ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('[CRON] Erreur lors du nettoyage des messages :', error.message);
  }
});

console.log('[CRON] Tâche de nettoyage des messages programmée.');