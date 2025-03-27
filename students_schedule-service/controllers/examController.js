import pool from '../config/db.js';
import Exam from '../models/examModel.js';

export const getExams = async (req, res) => {
  try {
    const results = await Exam.getExams(req.query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addExam = async (req, res) => {
  try {
    const result = await Exam.addExam(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    res.status(201).json({
      message: 'Examen ajouté avec succès',
      examId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExam = async (req, res) => {
  try {
    const result = await Exam.updateExam(req.params.id, req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    res.json({ message: 'Examen mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const result = await Exam.deleteExam(req.params.id);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    res.json({ message: 'Examen supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getModulesBySection = async (req, res) => {
  const { sectionId } = req.params;
  const { ID_semestre } = req.query;
  try {
    const results = await Exam.getModulesBySection(sectionId, ID_semestre);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSalles = async (req, res) => {
  const { exam_date, time_slot } = req.query;
  try {
    const results = await Exam.getSalles(exam_date, time_slot);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSemestres = async (req, res) => {
  const { niveau } = req.query; // Added back the niveau parameter
  try {
    const results = await Exam.getSemestres(niveau); // Pass niveau to the model
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFacultes = async (req, res) => {
  try {
    const [results] = await pool.query('SELECT ID_faculte, nom_faculte FROM Faculte');
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getDepartements = async (req, res) => {
  const { faculte } = req.query;
  let sql = 'SELECT ID_departement, Nom_departement FROM Departement';
  const params = [];
  if (faculte) {
    sql += ' WHERE ID_faculte = ?';
    params.push(faculte);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getNiveaux = async (req, res) => {
  const { departement } = req.query;
  let sql = 'SELECT DISTINCT niveau AS id, niveau AS name FROM Section';
  const params = [];
  if (departement) {
    sql += ' JOIN Specialite sp ON Section.ID_specialite = sp.ID_specialite JOIN Departement d ON sp.ID_departement = d.ID_departement WHERE d.ID_departement = ?';
    params.push(departement);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getSpecialites = async (req, res) => {
  const { departement, niveau } = req.query;
  let sql = 'SELECT ID_specialite, nom_specialite FROM Specialite';
  const params = [];
  if (departement) {
    sql += ' WHERE ID_departement = ?';
    params.push(departement);
  }
  if (niveau) {
    sql += ' AND (SELECT COUNT(*) FROM Section WHERE ID_specialite = Specialite.ID_specialite AND niveau = ?) > 0';
    params.push(niveau);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getSections = async (req, res) => {
  const { specialite, niveau } = req.query;
  let sql = 'SELECT ID_section, nom_section, num_etudiant FROM Section'; // Added back num_etudiant
  const params = [];
  if (specialite) {
    sql += ' WHERE ID_specialite = ?';
    params.push(specialite);
  }
  if (niveau) {
    sql += ' AND niveau = ?';
    params.push(niveau);
  }
  try {
    const [results] = await pool.query(sql, params);
    res.json(results);
  } catch (err) {
    console.error('Query Error:', err);
    res.status(500).json({ error: err.message });
  }
};