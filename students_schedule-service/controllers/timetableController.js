// controllers/timetableController.js
import Timetable from '../models/timetableModel.js';
import pool from '../config/db.js';

export const getTimetable = async (req, res) => {
  try {
    const { sectionId, semestre } = req.query;
    const results = await Timetable.getTimetable({ sectionId, semestre });
    console.log('Sending timetable from Seance:', results);
    res.json({ success: true, timetable: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    const { niveau, faculte, departement, specialite } = req.query;
    console.log('getFilterOptions called with query:', req.query);
    const results = await Timetable.getFilterOptions({ niveau, faculte, departement, specialite });
    console.log('getFilterOptions results:', results);
    res.json({ success: true, options: results });
  } catch (err) {
    console.error('Error in getFilterOptions:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('deleteSession called with ID:', id);
    const result = await Timetable.deleteSession(id);
    console.log('deleteSession result:', result);
    res.json(result);
  } catch (err) {
    console.error('Error in deleteSession:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// controllers/timetableController.js
export const updateSession = async (req, res) => {
  try {
    const { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot } = req.body;
    console.log('Controller: updateSession called with id:', req.params.id, 'and body:', req.body);
    if (!ID_salle || !Matricule || !type_seance || !ID_module || !jour || !time_slot) {
      return res.status(400).json({ success: false, error: 'Tous les champs sont requis' });
    }
    const result = await Timetable.updateSession(req.params.id, { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot });
    if (!result.success) {
      return res.status(400).json(result); // Renvoie l'erreur de conflit
    }
    res.json(result);
  } catch (err) {
    console.error('Controller error in updateSession:', err.message);
    res.status(500).json({ success: false, error: `Erreur lors de la mise à jour: ${err.message}` });
  }
};

// controllers/timetableController.js
export const getSessionOptions = async (req, res) => {
  try {
    const { sectionId, semestre } = req.query; // Remplacer niveau par semestre
    const options = await Timetable.getSessionOptions(sectionId, semestre);
    res.json({ success: true, options });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// controllers/timetableController.js
export const createSession = async (req, res) => {
  try {
    const { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section } = req.body;
    console.log('Controller: Received createSession with body:', req.body);
    if (!ID_salle || !Matricule || !type_seance || !ID_module || !jour || !time_slot || !ID_section) {
      return res.status(400).json({ success: false, error: 'Tous les champs sont requis' });
    }
    if (type_seance !== 'cours' && (ID_groupe === null || ID_groupe === undefined)) {
      return res.status(400).json({ success: false, error: 'ID_groupe est requis pour TD ou TP' });
    }
    const result = await Timetable.createSession(req.body);
    if (!result.success) {
      return res.status(400).json(result); // Renvoie l'erreur de conflit
    }
    console.log('Controller: Sending response:', result);
    res.json(result);
  } catch (err) {
    console.error('Controller error in createSession:', err.message);
    res.status(500).json({ success: false, error: `Erreur lors de la création de la séance: ${err.message}` });
  }
};

export const getSectionDetails = async (req, res) => {
  try {
    const { sectionId } = req.query;
    if (!sectionId) {
      return res.status(400).json({ success: false, error: 'sectionId est requis' });
    }

    const query = `
      SELECT 
        f.nom_faculte AS faculty,
        d.Nom_departement AS department,
        s.nom_specialite AS specialty,
        sec.niveau AS niveau,
        sec.nom_section AS section
      FROM Section sec
      JOIN Specialite s ON sec.ID_specialite = s.ID_specialite
      JOIN Departement d ON s.ID_departement = d.ID_departement
      JOIN faculte f ON s.ID_faculte = f.ID_faculte
      WHERE sec.ID_section = ?
    `;
    const [rows] = await pool.query(query, [sectionId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Section non trouvée' });
    }

    res.json({ success: true, details: rows[0] });
  } catch (err) {
    console.error('Error in getSectionDetails:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
// controllers/timetableController.js
export const getModuleEnseignants = async (req, res) => {
  try {
    const { moduleId } = req.query;
    console.log('Controller: getModuleEnseignants called with moduleId:', moduleId);
    if (!moduleId) {
      return res.status(400).json({ success: false, error: 'moduleId est requis' });
    }
    const enseignants = await Timetable.getModuleEnseignants(moduleId);
    res.json({ success: true, enseignants });
  } catch (err) {
    console.error('Controller error in getModuleEnseignants:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// controllers/timetableController.js
// controllers/timetableController.js
export const generateTimetables = async (req, res) => {
  try {
    const { semestreGroup } = req.body; // Récupérer le choix du frontend ("1" ou "2")
    if (!semestreGroup || !['1', '2'].includes(semestreGroup)) {
      return res.status(400).json({ success: false, error: 'semestreGroup doit être "1" ou "2"' });
    }
    console.log(`Generating timetables for semestre group ${semestreGroup}`);
    const result = await Timetable.generateTimetablesForAllSections(semestreGroup);
    res.json(result);
  } catch (err) {
    console.error('Controller error in generateTimetables:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
