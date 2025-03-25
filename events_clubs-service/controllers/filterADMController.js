// backend/controllers/filterController.js
const pool = require('../config/db');

const getFacultes = async (req, res) => {
  try {
    const [facultes] = await pool.query('SELECT * FROM faculte');
    res.json(facultes);
  } catch (error) {
    console.error('Erreur lors de la récupération des facultés:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des facultés: ' + error.message });
  }
};

const getDepartements = async (req, res) => {
  const { id_faculte } = req.query;
  try {
    let query = 'SELECT * FROM Departement';
    const params = [];
    if (id_faculte) {
      query += ' WHERE ID_faculte = ?';
      params.push(id_faculte);
    }
    const [departements] = await pool.query(query, params);
    res.json(departements);
  } catch (error) {
    console.error('Erreur lors de la récupération des départements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des départements: ' + error.message });
  }
};

const getSpecialites = async (req, res) => {
  const { id_departement } = req.query;
  try {
    let query = 'SELECT * FROM Specialite';
    const params = [];
    if (id_departement) {
      query += ' WHERE ID_departement = ?';
      params.push(id_departement);
    }
    const [specialites] = await pool.query(query, params);
    res.json(specialites);
  } catch (error) {
    console.error('Erreur lors de la récupération des spécialités:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des spécialités: ' + error.message });
  }
};

const getSections = async (req, res) => {
  const { id_specialite } = req.query;
  try {
    let query = 'SELECT * FROM Section';
    const params = [];
    if (id_specialite) {
      query += ' WHERE ID_specialite = ?';
      params.push(id_specialite);
    }
    const [sections] = await pool.query(query, params);
    res.json(sections);
  } catch (error) {
    console.error('Erreur lors de la récupération des sections:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des sections: ' + error.message });
  }
};

module.exports = {
  getFacultes,
  getDepartements,
  getSpecialites,
  getSections,
};