import studentModel from '../models/ETDressourcesModel.js';

const studentController = {
  login: async (req, res) => {
    const { matricule } = req.body;
    if (!matricule) {
      return res.status(400).json({ message: 'Matricule is required' });
    }

    try {
      const results = await studentModel.validateMatricule(matricule);
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid matricule' });
      }
      res.status(200).json({
        matricule: results[0].Matricule,
        sectionId: results[0].ID_section,
        niveau: results[0].niveau
      });
    } catch (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
  },

  getModules: async (req, res) => {
    const { sectionId, semester } = req.query;
    if (!sectionId || !semester) {
      return res.status(400).json({ message: 'Section ID and semester are required' });
    }

    try {
      const results = await studentModel.getModulesBySemester(sectionId, semester);
      res.status(200).json(results);
    } catch (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
  },

  getResources: async (req, res) => {
    const { moduleId, sectionId, type } = req.query;
    if (!moduleId || !sectionId || !type) {
      return res.status(400).json({ message: 'Module ID, section ID, and type are required' });
    }

    try {
      const results = await studentModel.getResources(moduleId, sectionId, type);
      res.status(200).json(results);
    } catch (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
  },
};

export default studentController;