import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moduleRoutes from './routes/moduleRoutes.js';
import examRoutes from './routes/examRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import db from './config/db.js';
import documentRoutes from './routes/documentRoutes.js';

dotenv.config();
process.env.TZ = 'UTC';

const app = express();
app.use(express.json());
app.use(cors());

app.use('/modules', moduleRoutes);
app.use('/exams', examRoutes);
app.use('/timetable', timetableRoutes);
app.use('/grades', gradeRoutes);
app.use('/uploads', express.static('uploads')); // Serve uploaded files
app.use('/documents', documentRoutes);

class Timetable {
  constructor(courses, professors, classrooms, timeslots, course_prof_map, room_availability, professor_availability, student_groups) {
    this.courses = courses;
    this.professors = professors;
    this.classrooms = classrooms;
    this.timeslots = timeslots;
    this.course_prof_map = course_prof_map;
    this.room_availability = room_availability;
    this.professor_availability = professor_availability;
    this.student_groups = student_groups;
    this.schedule = this.generateRandomSchedule();
    this.fitness = this.calculateFitness(1);
  }

  generateRandomSchedule() {
    return this.courses.map(course => {
      let professor = this.getValidProfessor(course.module);
      let validTimeslots = this.professor_availability[professor].filter(ts => 
        this.timeslots.includes(ts) && Object.values(this.room_availability).some(room => room.includes(ts))
      );
      let [jour, time_slot] = validTimeslots[Math.floor(Math.random() * validTimeslots.length)]?.split('|') || this.timeslots[0].split('|');
      let validRooms = Object.keys(this.room_availability).filter(room => 
        this.room_availability[room].includes(`${jour}|${time_slot}`)
      );
      let classroom = validRooms[Math.floor(Math.random() * validRooms.length)] || this.classrooms[0];
      return {
        ID_module: course.ID_module,
        ID_groupe: course.ID_groupe,
        type_seance: course.type_seance,
        Matricule: professor,
        ID_salle: classroom,
        jour: jour,
        time_slot: time_slot
      };
    });
  }

  getValidProfessor(module) {
    let validProfessors = this.course_prof_map[module];
    return validProfessors[Math.floor(Math.random() * validProfessors.length)];
  }

  calculateFitness(generation) {
    let conflicts = 0;
    let seenSlots = {};
    let groupDays = {};

    const availabilityWeight = generation < 10 ? 10 : 5;
    const singleSessionWeight = 3;
    const gapWeight = 1;

    this.schedule.forEach(entry => {
      let roomKey = `${entry.ID_salle}-${entry.jour}|${entry.time_slot}`;
      if (seenSlots[roomKey]) conflicts += availabilityWeight;
      seenSlots[roomKey] = true;

      let profKey = `${entry.Matricule}-${entry.jour}|${entry.time_slot}`;
      if (seenSlots[profKey]) conflicts += availabilityWeight;
      seenSlots[profKey] = true;

      if (!this.room_availability[entry.ID_salle].includes(`${entry.jour}|${entry.time_slot}`)) 
        conflicts += availabilityWeight;
      if (!this.professor_availability[entry.Matricule].includes(`${entry.jour}|${entry.time_slot}`)) 
        conflicts += availabilityWeight;

      let group = this.student_groups[entry.ID_module];
      groupDays[group] = groupDays[group] || {};
      groupDays[group][entry.jour] = (groupDays[group][entry.jour] || []).concat(entry.time_slot);
    });

    Object.keys(groupDays).forEach(group => {
      Object.keys(groupDays[group]).forEach(day => {
        let slots = groupDays[group][day];
        slots.sort();
        if (slots.length === 1) conflicts += singleSessionWeight;
        if (slots.length > 1) {
          for (let i = 1; i < slots.length; i++) {
            if (!this.areConsecutive(slots[i-1], slots[i])) conflicts += gapWeight;
          }
        }
      });
    });

    return this.courses.length - conflicts;
  }

  areConsecutive(slot1, slot2) {
    const timeOrder = ['08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50', '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50'];
    return Math.abs(timeOrder.indexOf(slot1) - timeOrder.indexOf(slot2)) === 1;
  }

  mutate() {
    let index = Math.floor(Math.random() * this.schedule.length);
    let entry = this.schedule[index];
    let validTimeslots = this.professor_availability[entry.Matricule].filter(ts => 
      this.room_availability[entry.ID_salle].includes(ts)
    );
    let [jour, time_slot] = validTimeslots[Math.floor(Math.random() * validTimeslots.length)]?.split('|') || this.timeslots[0].split('|');
    entry.jour = jour;
    entry.time_slot = time_slot;
    this.fitness = this.calculateFitness(1);
  }
}

function crossover(parent1, parent2) {
  let split = Math.floor(parent1.schedule.length / 2);
  let childSchedule = [...parent1.schedule.slice(0, split), ...parent2.schedule.slice(split)];
  let child = new Timetable(parent1.courses, parent1.professors, parent1.classrooms, parent1.timeslots, 
    parent1.course_prof_map, parent1.room_availability, parent1.professor_availability, parent1.student_groups);
  child.schedule = childSchedule;
  child.fitness = child.calculateFitness(1);
  return child;
}

// Route pour générer l’emploi du temps
app.post('/api/generate-schedule', async (req, res) => {
  const { sectionId } = req.query;
  console.log('Generating schedule for sectionId:', sectionId);

  try {
    // Récupérer les données
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

    // Vérifier si les données sont vides
    if (!modules.length || !enseignants.length || !salles.length) {
      return res.status(400).json({ success: false, error: 'Aucune donnée disponible pour générer l’emploi' });
    }

    // Générer l’emploi (code inchangé jusqu’à l’insertion)
    const bestSchedule = geneticAlgorithmLogic(modules, enseignants, salles); // Simplifié pour clarté
    console.log('Best schedule:', bestSchedule);

    // Insérer dans Seance
    await db.query('DELETE FROM Seance WHERE ID_groupe IN (SELECT ID_groupe FROM Groupe WHERE ID_section = ?)', [sectionId]);
    for (const session of bestSchedule) {
      console.log('Inserting session:', session);
      await db.query(`
        INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [session.ID_salle, session.Matricule, session.type_seance, session.ID_groupe, session.ID_module, session.jour, session.time_slot]);
    }

    res.json({ success: true, message: 'Emploi généré avec succès' });
  } catch (error) {
    console.error('Error in /api/generate-schedule:', error);
    res.status(500).json({ success: false, error: `Erreur serveur: ${error.message}` });
  }
});

const PORT = 8083;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});