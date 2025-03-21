// controllers/resourceController.js
const db = require('../config/db');
const authenticateProfessor = require('../middleware/authenticateProfessor');
const conditionalUpload = require('../config/conditionalUpload');
const Ressource = require('../models/Ressource');
const Notification = require('../models/NotificationRessources');

exports.getSections = async (req, res) => {
    try {
        const [sections] = await db.execute(`
            SELECT s.ID_section, s.niveau, sp.nom_specialite
            FROM Section s
            JOIN Enseignant_Section es ON s.ID_section = es.ID_section
            JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
            WHERE es.Matricule = ?
        `, [req.professor.Matricule]);
        res.json(sections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getModules = async (req, res) => {
    try {
        const sectionId = req.params.sectionId;
        const [modules] = await db.execute(`
            SELECT m.ID_module, m.nom_module
            FROM Module m
            JOIN Module_Section ms ON m.ID_module = ms.ID_module
            JOIN Module_Enseignant me ON m.ID_module = me.ID_module
            WHERE ms.ID_section = ? AND me.Matricule = ?
        `, [sectionId, req.professor.Matricule]);
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.uploadResource = [
    authenticateProfessor,
    conditionalUpload,
    async (req, res) => {
        try {
            const { ID_module, ID_section, nom_ressource, type_ressource, description } = req.body;
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const fichier_url = `/uploads/${req.file.filename}`;
            const matricule = req.professor.Matricule;

            // Fetch the module name
            const [moduleResult] = await db.execute(
                'SELECT nom_module FROM Module WHERE ID_module = ?',
                [ID_module]
            );
            if (moduleResult.length === 0) {
                return res.status(404).json({ error: 'Module not found' });
            }
            const nom_module = moduleResult[0].nom_module;

            // Fetch the professor's name from the user table
            const [professorResult] = await db.execute(
                'SELECT nom, prenom FROM user WHERE Matricule = ?',
                [matricule]
            );
            if (professorResult.length === 0) {
                return res.status(404).json({ error: 'Professor not found in user table' });
            }
            const professorName = `${professorResult[0].prenom} ${professorResult[0].nom}`; // e.g., "John Doe"

            // Insert the resource
            const [result] = await db.execute(
                'INSERT INTO Ressource (ID_module, ID_section, Matricule, nom_ressource, type_ressource, fichier_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [ID_module, ID_section, matricule, nom_ressource, type_ressource, fichier_url, description]
            );

            // Fetch all students in the section
            // console.log(`Fetching students for section ID: ${ID_section}`);
            const [students] = await db.execute(
                'SELECT Matricule FROM Etudiant_Section WHERE ID_section = ?',
                [ID_section]
            );
            // console.log(`Found ${students.length} students in section ${ID_section}:`, students);

            // If there are students in the section, send notifications
            if (students.length > 0) {
                const studentMatricules = students.map(student => student.Matricule);
                const notificationMessage = `Une nouvelle ressource a été téléchargée pour le module ${nom_module} par ${professorName} : ${nom_ressource} (${type_ressource})`;
                await Notification.createForMultipleRecipients(matricule, studentMatricules, notificationMessage);
            } else {
                // console.log(`No students found in section ${ID_section}. No notifications sent.`);
            }

            res.status(201).json({ message: 'Resource uploaded', fichier_url, ID_ressource: result.insertId });
        } catch (error) {
            console.error('Error in uploadResource:', error);
            res.status(500).json({ error: error.message });
        }
    }
];



exports.getResources = async (req, res) => {
    try {
        const resources = await Ressource.findByProfessor(req.professor.Matricule);
        res.json(resources);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await Ressource.deleteById(id);
        if (success) {
            res.json({ message: 'Resource deleted successfully' });
        } else {
            res.status(404).json({ error: 'Resource not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateResource = [
    authenticateProfessor,
    conditionalUpload,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { ID_module, ID_section, nom_ressource, type_ressource, description } = req.body;

            if (!ID_module || !ID_section || !nom_ressource || !type_ressource) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Fetch the module name
            const [moduleResult] = await db.execute(
                'SELECT nom_module FROM Module WHERE ID_module = ?',
                [ID_module]
            );
            if (moduleResult.length === 0) {
                return res.status(404).json({ error: 'Module not found' });
            }
            const nom_module = moduleResult[0].nom_module;

            // Fetch the professor's name from the user table
            const matricule = req.professor.Matricule;
            const [professorResult] = await db.execute(
                'SELECT nom, prenom FROM user WHERE Matricule = ?',
                [matricule]
            );
            if (professorResult.length === 0) {
                return res.status(404).json({ error: 'Professor not found in user table' });
            }
            const professorName = `${professorResult[0].prenom} ${professorResult[0].nom}`; // e.g., "John Doe"

            let fichier_url;
            if (req.file) {
                fichier_url = `/uploads/${req.file.filename}`;
            } else {
                const [existingResource] = await db.execute(
                    'SELECT fichier_url FROM Ressource WHERE ID_ressource = ?',
                    [id]
                );
                if (existingResource.length === 0) {
                    return res.status(404).json({ error: 'Resource not found' });
                }
                fichier_url = existingResource[0].fichier_url;
            }

            const updates = { ID_module, ID_section, nom_ressource, type_ressource, description, fichier_url };

            // console.log('Updates object:', updates);

            const success = await Ressource.updateById(id, updates);
            if (success) {
                // Fetch all students in the section
                // console.log(`Fetching students for section ID: ${ID_section} after updating resource`);
                const [students] = await db.execute(
                    'SELECT Matricule FROM Etudiant_Section WHERE ID_section = ?',
                    [ID_section]
                );
                // console.log(`Found ${students.length} students in section ${ID_section}:`, students);

                // If there are students in the section, send notifications
                if (students.length > 0) {
                    const studentMatricules = students.map(student => student.Matricule);
                    const notificationMessage = `Une ressource a été mise à jour pour le module ${nom_module} par ${professorName} : ${nom_ressource} (${type_ressource})`;
                    await Notification.createForMultipleRecipients(req.professor.Matricule, studentMatricules, notificationMessage);
                } else {
                    // console.log(`No students found in section ${ID_section}. No notifications sent after update.`);
                }

                res.json({ message: 'Resource updated successfully' });
            } else {
                res.status(404).json({ error: 'Resource not found' });
            }
        } catch (error) {
            console.error('Error in updateResource:', error);
            res.status(500).json({ error: 'Failed to update resource', details: error.message });
        }
    }
];

exports.validateMatricule = async (req, res) => {
    try {
        const matricule = req.headers['matricule'];
        if (!matricule) {
            return res.status(400).json({ error: 'Matricule header is required' });
        }

        const [rows] = await db.execute('SELECT * FROM Enseignant WHERE Matricule = ?', [matricule]);
        if (rows.length === 0) {
            return res.status(403).json({ error: 'Unauthorized: Not a professor' });
        }

        res.json({ message: 'Matricule valid', professor: rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};