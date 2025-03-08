import pool from '../config/db.js';

// Get all faculties
export const getFaculties = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM faculte');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get departments by faculty
export const getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Departement WHERE ID_faculte = ?',
      [req.params.facultyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get specialities by department
export const getSpecialities = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Specialite WHERE ID_departement = ?',
      [req.params.departmentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get sections by speciality
// Updated getSections controller
export const getSections = async (req, res) => {
  try {
    const { specialityId, niveau } = req.query;

    if (!specialityId || !niveau) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const [rows] = await pool.query(
      'SELECT * FROM Section WHERE ID_specialite = ? AND niveau = ?',
      [specialityId, niveau]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// New controller for getting academic levels
export const getNiveaux = async (req, res) => {
  try {
    const { specialityId } = req.params;

    if (!specialityId || isNaN(specialityId)) {
      return res.status(400).json({ error: "Invalid speciality ID" });
    }

    const [rows] = await pool.query(
      'SELECT DISTINCT niveau FROM Section WHERE ID_specialite = ?',
      [specialityId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get exams by section
export const getExams = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, m.nom_module 
       FROM Exam e
       JOIN Module m ON e.ID_module = m.ID_module
       WHERE e.ID_section = ?`,
      [req.params.sectionId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new exam
export const createExam = async (req, res) => {
  try {
    const { ID_module, ID_section, exam_date, time_slot, ID_salle, ID_semestre } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO Exam 
       (ID_module, ID_section, exam_date, time_slot, ID_salle, ID_semestre)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ID_module, ID_section, exam_date, time_slot, ID_salle, ID_semestre]
    );
    
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add these new controller functions
export const getRooms = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Salle');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getModulesBySpeciality = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Module WHERE ID_specialite = ?',
      [req.params.specialityId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBulkExams = async (req, res) => {
  let connection;
  try {
    const { sectionId, semester, schedule } = req.body;
    
    // Get a connection from the pool
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Validate semester exists
    const [sem] = await connection.query(
      'SELECT ID_semestre FROM Semestre WHERE YEAR(date_debut) = ?', 
      [semester] // Expects a 4-digit year like "2024"
    );

    if (!sem.length) {
      throw new Error('Semestre non trouvé');
    }

    // Insert exams using the same connection
    for (const exam of schedule) {
      await connection.query(
        `INSERT INTO Exam 
        (ID_module, ID_section, exam_date, time_slot, ID_salle, ID_semestre)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [exam.ID_module, sectionId, exam.exam_date, exam.time_slot, exam.ID_salle, sem[0].ID_semestre]
      );
    }
    
    await connection.commit();
    res.status(201).json({ message: 'Planning créé avec succès' });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    res.status(400).json({ error: err.message });
  } finally {
    if (connection) {
      connection.release(); // Always release the connection
    }
  }
};



// Add these new controller functions
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { exam_date, time_slot, status, ID_salle, ID_module } = req.body;

    if (!id || !exam_date || !time_slot || !status || !ID_salle || !ID_module) {
      return res.status(400).json({ message: "Tous les champs sont requis" });
    }

    const [result] = await pool.query(
      `UPDATE Exam 
       SET exam_date = ?, time_slot = ?, status = ?, ID_salle = ?, ID_module = ?
       WHERE ID_exam = ?`,
      [exam_date, time_slot, status, ID_salle, ID_module, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Aucun examen trouvé avec cet ID" });
    }

    res.json({ message: "Examen mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM Exam WHERE ID_exam = ?',
      [req.params.id]
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const testRoute = async (req, res) => {
  try {
    const [specialities] = await pool.query('SELECT * FROM Specialite');
    res.json(specialities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};