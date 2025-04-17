import ProfModel from '../models/profModel.js';

class ProfController {
  static async login(req, res) {
    const { matricule } = req.body;
    try {
      const sections = await ProfModel.getProfessorSections(matricule);
      res.json({ success: true, sections });
    } catch (error) {
      res.status(401).json({ success: false, message: 'Matricule invalide' });
    }
  }

  static async getSections(req, res) {
    const { matricule } = req.params;
    try {
      const sections = await ProfModel.getProfessorSections(matricule);
      res.json(sections);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getTimetables(req, res) {
    const { matricule, sectionId } = req.query;
    try {
      const sectionTimetable = await ProfModel.getSectionTimetable(sectionId);
      const profTimetable = await ProfModel.getProfessorTimetable(matricule);
      res.json({ sectionTimetable, profTimetable });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getModules(req, res) {
    const { matricule, sectionId } = req.query;
    try {
      const modules = await ProfModel.getProfessorModulesForSection(matricule, sectionId);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getGroups(req, res) {
    const { sectionId } = req.query;
    try {
      const groups = await ProfModel.getGroupsForSection(sectionId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRooms(req, res) {
    const { date, timeSlot } = req.query;
    try {
      const rooms = await ProfModel.getAvailableRooms(date, timeSlot);
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async addSession(req, res) {
    console.log('Corps de la requête:', req.body);
    try {
      const result = await ProfModel.addSupplementarySession(req.body);
      res.json({ success: true, message: 'Séance ajoutée avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la séance:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async modifySession(req, res) {
    console.log('Corps de la requête (modify):', req.body);
    try {
      const result = await ProfModel.modifySupplementarySession(req.body);
      res.json({ success: true, message: 'Séance modifiée avec succès' });
    } catch (error) {
      console.error('Erreur lors de la modification de la séance:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteSession(req, res) {
    const { id } = req.params;
    try {
      const result = await ProfModel.deleteSupplementarySession(id);
      res.json({ success: true, message: 'Séance supprimée avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la séance:', error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default ProfController;