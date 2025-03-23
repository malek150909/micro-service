// backend/controllers/authController.js
const pool = require('../config/db');

const loginTeacher = async (req, res) => {
    const { matricule } = req.body;
    try {
        const [teacher] = await pool.query(`
            SELECT e.Matricule, u.nom, u.prenom
            FROM Enseignant e
            JOIN User u ON e.Matricule = u.Matricule
            WHERE e.Matricule = ?
        `, [matricule]);

        if (teacher.length === 0) {
            return res.status(404).json({ error: 'Enseignant non trouvé' });
        }

        res.json(teacher[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { loginTeacher };