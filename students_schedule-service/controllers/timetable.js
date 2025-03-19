// controllers/timetable.js
import db from '../config/db.js';
import { geneticAlgorithm } from '../models/Timetable.js';

async function getEnumValues(table, column) {
  const [result] = await db.query(`SHOW COLUMNS FROM ${table} WHERE Field = ?`, [column]);
  const enumStr = result[0].Type;
  const values = enumStr.replace(/^enum\('/, '').replace(/'\)$/, '').split("','");
  return values;
}

async function getTimeslots() {
  const days = await getEnumValues('Seance', 'jour');
  const timeSlots = await getEnumValues('Seance', 'time_slot');
  const timeslots = [];
  days.forEach(day => timeSlots.forEach(slot => timeslots.push(`${day}|${slot}`)));
  return timeslots;
}

export const generateSchedule = async (req, res) => {
  const { sectionId } = req.query;
  console.log('Generating schedule for sectionId:', sectionId);
  console.log('Type of sectionId:', typeof sectionId); // Vérifier le type

  if (!sectionId) {
    return res.status(400).json({ success: false, error: 'sectionId requis' });
  }

  try {
    const [modules] = await db.query(`
      SELECT m.ID_module, m.nom_module, g.ID_groupe, 'cours' as type_seance
      FROM Module m
      JOIN Module_Section ms ON m.ID_module = ms.ID_module
      JOIN Groupe g ON g.ID_section = ms.ID_section
      WHERE ms.ID_section = ?
    `, [sectionId]);
    console.log('Modules fetched:', modules);

    const [enseignants] = await db.query(`
      SELECT DISTINCT e.Matricule
      FROM Enseignant e
      JOIN Module_Enseignant me ON e.Matricule = me.Matricule
      JOIN Module_Section ms ON me.ID_module = ms.ID_module
      WHERE ms.ID_section = ?
    `, [sectionId]);
    console.log('Enseignants fetched:', enseignants);

    const [salles] = await db.query('SELECT ID_salle FROM Salle WHERE disponible = TRUE');
    console.log('Salles fetched:', salles);

    const missingData = [];
    if (!modules.length) missingData.push('modules');
    if (!enseignants.length) missingData.push('enseignants');
    if (!salles.length) missingData.push('salles disponibles');

    if (missingData.length > 0) {
      console.log('Missing data detected:', missingData);
      return res.status(400).json({
        success: false,
        error: `Données insuffisantes pour générer l’emploi : ${missingData.join(', ')} manquant(s)`
      });
    }

    // ... reste du code (timeslots, geneticAlgorithm, insertion dans Seance)
    const timeslots = await getTimeslots();
    let course_prof_map = {};
    const [courseProfMap] = await db.query(`
      SELECT me.ID_module, e.Matricule
      FROM Module_Enseignant me
      JOIN Enseignant e ON me.Matricule = e.Matricule
      WHERE EXISTS (
        SELECT 1 FROM Module_Section ms 
        WHERE ms.ID_module = me.ID_module AND ms.ID_section = ?
      )
    `, [sectionId]);
    courseProfMap.forEach(row => {
      course_prof_map[row.ID_module] = course_prof_map[row.ID_module] || [];
      course_prof_map[row.ID_module].push(row.Matricule);
    });

    let room_availability = {};
    salles.forEach(salle => room_availability[salle.ID_salle] = timeslots);

    let professor_availability = {};
    enseignants.forEach(ens => professor_availability[ens.Matricule] = timeslots);

    let student_groups = {};
    modules.forEach(mod => student_groups[mod.ID_module] = mod.ID_groupe);

    const bestSchedule = geneticAlgorithm(
      modules,
      enseignants.map(e => e.Matricule),
      salles.map(s => s.ID_salle),
      timeslots,
      course_prof_map,
      room_availability,
      professor_availability,
      student_groups
    ).schedule;

    await db.query('DELETE FROM Seance WHERE ID_groupe IN (SELECT ID_groupe FROM Groupe WHERE ID_section = ?)', [sectionId]);
    for (const session of bestSchedule) {
      await db.query(`
        INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [session.ID_salle, session.Matricule, session.type_seance, session.ID_groupe, session.ID_module, session.jour, session.time_slot]);
    }

    res.json({ success: true, message: 'Emploi généré avec succès' });
  } catch (error) {
    console.error('Error in generateSchedule:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};