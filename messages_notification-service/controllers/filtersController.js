const db = require('../config/db');

const getFacultes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT ID_faculte, nom_faculte FROM faculte');
    console.log('Facultés renvoyées :', rows);
    if (!rows || rows.length === 0) {
      console.warn('Aucune faculté trouvée dans la base de données');
      return res.status(404).json({ message: 'Aucune faculté trouvée' });
    }
    res.json(rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des facultés :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getDepartements = async (req, res) => {
  const { faculteId } = req.query;
  try {
    if (!faculteId) {
      return res.status(400).json({ message: 'faculteId est requis' });
    }
    const [rows] = await db.query('SELECT ID_departement, Nom_departement FROM Departement WHERE ID_faculte = ?', [faculteId]);
    console.log(`Départements renvoyés pour faculteId=${faculteId} :`, rows);
    if (!rows || rows.length === 0) {
      console.warn(`Aucun département trouvé pour faculteId=${faculteId}`);
      return res.status(404).json({ message: 'Aucun département trouvé' });
    }
    res.json(rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des départements :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

const getSpecialites = async (req, res) => {
  const { departementId } = req.query;
  try {
    if (!departementId) {
      return res.status(400).json({ message: 'departementId est requis' });
    }
    const [rows] = await db.query('SELECT ID_specialite, nom_specialite FROM Specialite WHERE ID_departement = ?', [departementId]);
    console.log(`Spécialités renvoyées pour departementId=${departementId} :`, rows);
    if (!rows || rows.length === 0) {
      console.warn(`Aucune spécialité trouvée pour departementId=${departementId}`);
      return res.status(404).json({ message: 'Aucune spécialité trouvée' });
    }
    res.json(rows);
  } catch (err) {
    console.error('Erreur lors de la récupération des spécialités :', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};

module.exports = { getFacultes, getDepartements, getSpecialites };