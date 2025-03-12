import Module from '../models/moduleModel.js';

export const getModules = async (req, res) => {
  try {
    const modules = await Module.getModules(req.query);
    res.json(modules);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const addModule = async (req, res) => {
  try {
    const result = await Module.addModule(req.body);
    res.status(201).json({ message: 'Module added successfully', moduleId: result.moduleId });
  } catch (error) {
    res.status(500).json({ error: 'Error adding module' });
  }
};

export const deleteModule = async (req, res) => {
  try {
    await Module.deleteModule(req.params.id);
    res.json({ message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting module' });
  }
}

export const getFacultes = async (req, res) => {
  try {
    const facultes = await Module.getFacultes();
    res.json(facultes);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}

export const getDepartements = async (req, res) => {
  try {
    const departements = await Module.getDepartements(req.query);
    res.json(departements);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}

export const getNiveaux = async (req, res) => {
  try {
    const niveaux = await Module.getNiveaux(req.query);
    res.json(niveaux);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}

export const getSpecialites = async (req, res) => {
  try {
    const specialites = await Module.getSpecialites(req.query);
    res.json(specialites);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}

export const getSections = async (req, res) => {
  try {
    const sections = await Module.getSections(req.query);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}

export const getSemestres = async (req, res) => {
  try {
    const semestres = await Module.getSemestres(req.query);
    res.json(semestres);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}


export const updateModule = async (req, res) => {
  try {
    await Module.updateModule(req.params.id, req.body);
    res.json({ message: 'Module updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating module' });
  }
}