const db = require('../config/db');

const authenticateProfessor = async (req, res, next) => {
    //console.log('authenticateProfessor middleware called');
    try {
        const matricule = req.headers['matricule'];
        //console.log('Matricule from headers:', matricule);
        if (!matricule) {
            console.error('Authentication Error: Matricule header is missing');
            return res.status(400).json({ error: 'Matricule header is required' });
        }

        const [rows] = await db.execute('SELECT * FROM Enseignant WHERE Matricule = ?', [matricule]);
        //console.log('Database query result:', rows);
        if (rows.length === 0) {
            console.error(`Authentication Error: No professor found with Matricule ${matricule}`);
            return res.status(403).json({ error: 'Unauthorized: Not a professor' });
        }

        req.professor = rows[0];
        //console.log(`Authenticated professor with Matricule ${matricule}`);
        next();
    } catch (error) {
        console.error('Authentication Error in middleware:', error.stack);
        res.status(500).json({ error: 'Failed to authenticate professor', details: error.message });
    }
};

module.exports = authenticateProfessor;