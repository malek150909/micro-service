// models/Timetable.js
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
      let professor = this.getValidProfessor(course.ID_module);
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

export function crossover(parent1, parent2) {
  let split = Math.floor(parent1.schedule.length / 2);
  let childSchedule = [...parent1.schedule.slice(0, split), ...parent2.schedule.slice(split)];
  let child = new Timetable(parent1.courses, parent1.professors, parent1.classrooms, parent1.timeslots, 
    parent1.course_prof_map, parent1.room_availability, parent1.professor_availability, parent1.student_groups);
  child.schedule = childSchedule;
  child.fitness = child.calculateFitness(1);
  return child;
}

export function geneticAlgorithm(courses, professors, classrooms, timeslots, course_prof_map, room_availability, professor_availability, student_groups) {
  let population = Array.from({ length: 10 }, () => 
    new Timetable(courses, professors, classrooms, timeslots, course_prof_map, room_availability, professor_availability, student_groups)
  );

  for (let gen = 1; gen <= 20; gen++) {
    population.sort((a, b) => b.fitness - a.fitness);
    if (population[0].fitness >= courses.length) break;

    let newPopulation = population.slice(0, 2);
    while (newPopulation.length < 10) {
      let parent1 = population[Math.floor(Math.random() * population.length)];
      let parent2 = population[Math.floor(Math.random() * population.length)];
      let child = crossover(parent1, parent2);
      if (Math.random() < 0.2) child.mutate();
      child.fitness = child.calculateFitness(gen);
      newPopulation.push(child);
    }
    population = newPopulation;
  }

  return population[0];
}

export default Timetable;