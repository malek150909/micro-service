import StudentPlanningModel from '../models/studentPlanningModel.js';

class StudentPlanningController {
  // Login Handler
  static async login(req, res) {
    const { matricule } = req.body;

    if (!matricule) {
      return res.status(400).json({ message: 'Matricule is required' });
    }

    try {
      const student = await StudentPlanningModel.login(matricule);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json({
        matricule: student.Matricule,
        niveau: student.niveau,
        sectionId: student.sectionId,
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Fetch Exams Handler
  static async getExams(req, res) {
    const { sectionId, semester } = req.query;

    if (!sectionId || !semester) {
      return res.status(400).json({ message: 'Section ID and semester are required' });
    }

    try {
      const result = await StudentPlanningModel.getExams(sectionId, semester);
      res.json(result);
    } catch (err) {
      console.error('Error fetching exams:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

export default StudentPlanningController;