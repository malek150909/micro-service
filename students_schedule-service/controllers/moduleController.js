// controllers/moduleController.js
import Module from '../models/moduleModel.js';

export const getModules = async (req, res) => {
  try {
    const results = await Module.getModules(req.query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de base de données' });
  }
};

export const addModule = async (req, res) => {
  try {
    const result = await Module.addModule(req.body);
    res.status(201).json({ message: 'Module ajouté avec succès', moduleId: result.insertId });
  } catch (err) {
    if (err.message === 'Un module avec ce nom existe déjà dans cette section.') {
      return res.status(400).json({ 
        error: 'Un module avec ce nom existe déjà dans cette section.' 
      });
    }
    res.status(400).json({ error: err.message });
  }
};

export const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Module.deleteModule(id);
    res.json({ message: 'Module supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFacultes = async (req, res) => {
  try {
    const results = await Module.getFacultes();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de base de données' });
  }
};

export const getDepartements = async (req, res) => {
  try {
    const results = await Module.getDepartements(req.query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de base de données' });
  }
};

export const getNiveaux = async (req, res) => {
  try {
    const results = await Module.getNiveaux(req.query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de base de données' });
  }
};

export const getSpecialites = async (req, res) => {
  try {
    const results = await Module.getSpecialites(req.query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de base de données' });
  }
};

export const getSections = async (req, res) => {
  try {
    const results = await Module.getSections(req.query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de base de données' });
  }
};

export const getSemestres = async (req, res) => {
  try {
    const results = await Module.getSemestres();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Erreur de base de données' });
  }
};

export const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const moduleData = req.body;
    const result = await Module.updateModule(id, moduleData);
    res.json({ message: 'Module mis à jour avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

