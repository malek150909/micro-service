// controllers/timetableController.js
import Timetable from '../models/timetableModel.js';

export const getTimetable = async (req, res) => {
  try {
    const results = await Timetable.getTimetable(req.query);
    console.log('Sending timetable from Seance:', results);
    res.json({ success: true, timetable: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    const { faculte, departement, specialite } = req.query;
    const results = await Timetable.getFilterOptions({ faculte, departement, specialite });
    res.json({ success: true, options: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const result = await Timetable.deleteSession(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const result = await Timetable.updateSession(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSessionOptions = async (req, res) => {
  try {
    const { sectionId } = req.query;
    const options = await Timetable.getSessionOptions(sectionId);
    res.json({ success: true, options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSession = async (req, res) => {
  try {
    const { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section } = req.body;
    console.log('Controller: Received createSession with body:', req.body);
    if (!ID_salle || !Matricule || !type_seance || !ID_groupe || !ID_module || !jour || !time_slot || !ID_section) {
      return res.status(400).json({ success: false, error: 'Tous les champs sont requis' });
    }
    const result = await Timetable.createSession(req.body);
    console.log('Controller: Sending response:', result);
    res.json(result);
  } catch (err) {
    console.error('Controller error in createSession:', err.message);
    res.status(500).json({ success: false, error: `Erreur lors de la création de la séance: ${err.message}` });
  }
};