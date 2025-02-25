class Timetable {
    constructor(courses, professors, classrooms, timeslots) {
        this.courses = courses;
        this.professors = professors;
        this.classrooms = classrooms;
        this.timeslots = timeslots;
        this.schedule = this.generateRandomSchedule();
    }

    generateRandomSchedule() {
        return this.courses.map(course => ({
            course_id: course,
            professor: this.professors[Math.floor(Math.random() * this.professors.length)],
            classroom: this.classrooms[Math.floor(Math.random() * this.classrooms.length)],
            timeslot: this.timeslots[Math.floor(Math.random() * this.timeslots.length)]
        }));
    }

    calculateFitness() {
        let conflicts = 0;
        let seenSlots = {};

        this.schedule.forEach(entry => {
            let key = `${entry.classroom}-${entry.timeslot}`;
            if (seenSlots[key]) conflicts++; 
            else seenSlots[key] = true;

            let profKey = `${entry.professor}-${entry.timeslot}`;
            if (seenSlots[profKey]) conflicts++;
            else seenSlots[profKey] = true;
        });

        return this.courses.length - conflicts; // Higher is better
    }
}

class GeneticAlgorithm {
    constructor(courses, professors, classrooms, timeslots, populationSize, generations) {
        this.courses = courses;
        this.professors = professors;
        this.classrooms = classrooms;
        this.timeslots = timeslots;
        this.populationSize = populationSize;
        this.generations = generations;
        this.population = [];
    }

    initializePopulation() {
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push(new Timetable(this.courses, this.professors, this.classrooms, this.timeslots));
        }
    }

    selectParents() {
        return this.population.sort((a, b) => b.calculateFitness() - a.calculateFitness()).slice(0, 2);
    }

    crossover(parent1, parent2) {
        let split = Math.floor(parent1.schedule.length / 2);
        let childSchedule = parent1.schedule.slice(0, split).concat(parent2.schedule.slice(split));
        let child = new Timetable(this.courses, this.professors, this.classrooms, this.timeslots);
        child.schedule = childSchedule;
        return child;
    }

    mutate(timetable) {
        if (Math.random() < 0.2) { // 20% mutation rate
            let index = Math.floor(Math.random() * timetable.schedule.length);
            timetable.schedule[index].classroom = this.classrooms[Math.floor(Math.random() * this.classrooms.length)];
        }
    }

    run() {
        this.initializePopulation();

        for (let i = 0; i < this.generations; i++) {
            this.population = this.population.sort((a, b) => b.calculateFitness() - a.calculateFitness());

            let newPopulation = [this.population[0], this.population[1]]; // Keep best two

            while (newPopulation.length < this.populationSize) {
                let [parent1, parent2] = this.selectParents();
                let child = this.crossover(parent1, parent2);
                this.mutate(child);
                newPopulation.push(child);
            }

            this.population = newPopulation;
            console.log(`Generation ${i + 1}: Best fitness = ${this.population[0].calculateFitness()}`);
        }

        return this.population[0].schedule;
    }
}

// Example Data
const courses = ["CS101", "CS102", "CS103", "CS104"];
const professors = ["Prof A", "Prof B", "Prof C"];
const classrooms = ["Room 1", "Room 2"];
const timeslots = ["Monday 9 AM", "Monday 11 AM", "Tuesday 9 AM", "Tuesday 11 AM"];

// Run Genetic Algorithm
const ga = new GeneticAlgorithm(courses, professors, classrooms, timeslots, 10, 20);
const bestSchedule = ga.run();

console.log("\nBest Schedule:", bestSchedule);