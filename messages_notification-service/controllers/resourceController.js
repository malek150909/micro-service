const db = require('../config/db');
const conditionalUpload = require('../config/conditionalUpload');
const Ressource = require('../models/Ressource');
const Notification = require('../models/NotificationRessources');
const authenticateProfessor = require('../middleware/authenticateProfessor'); // Middleware ajouté
const fs = require('fs').promises;
const path = require('path');

exports.getSections = [
    authenticateProfessor,
    async (req, res) => {
      try {
        console.log('Fetching sections for matricule:', req.professor.Matricule);
        const [sections] = await db.execute(`
          SELECT s.ID_section, s.nom_section, s.niveau, sp.nom_specialite
          FROM Section s
          JOIN Enseignant_Section es ON s.ID_section = es.ID_section
          JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
          WHERE es.Matricule = ?
        `, [req.professor.Matricule]);
        console.log('Sections fetched:', sections);
        res.json(sections);
      } catch (error) {
        console.error('Error fetching sections:', error);
        res.status(500).json({ error: error.message });
      }
    }
  ];

exports.getModules = [
    authenticateProfessor,
    async (req, res) => {
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
    }
];

exports.uploadResource = [
    authenticateProfessor,
    conditionalUpload,
    async (req, res) => {
        try {
            const { ID_module, ID_section, nom_ressource, type_ressource, description } = req.body;
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }
            const tempFilePath = req.file.path;
            const fichier_url = `/uploads/${req.file.filename}`;
            const matricule = req.professor.Matricule;

            const [existing] = await db.execute(
                'SELECT ID_ressource FROM Ressource WHERE ID_module = ? AND ID_section = ? AND nom_ressource = ?',
                [ID_module, ID_section, nom_ressource]
            );
            if (existing.length > 0) {
                await fs.unlink(tempFilePath);
                return res.status(400).json({ error: 'Une ressource avec ce nom existe déjà pour ce module et cette section.' });
            }

            const [moduleResult] = await db.execute('SELECT nom_module FROM Module WHERE ID_module = ?', [ID_module]);
            if (moduleResult.length === 0) {
                await fs.unlink(tempFilePath);
                return res.status(404).json({ error: 'Module not found' });
            }
            const nom_module = moduleResult[0].nom_module;

            const [professorResult] = await db.execute('SELECT nom, prenom FROM User WHERE Matricule = ?', [matricule]);
            if (professorResult.length === 0) {
                await fs.unlink(tempFilePath);
                return res.status(404).json({ error: 'Professor not found in user table' });
            }
            const professorName = `${professorResult[0].prenom} ${professorResult[0].nom}`;

            const [result] = await db.execute(
                'INSERT INTO Ressource (ID_module, ID_section, Matricule, nom_ressource, type_ressource, fichier_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [ID_module, ID_section, matricule, nom_ressource, type_ressource, fichier_url, description]
            );

            const [students] = await db.execute('SELECT Matricule FROM Etudiant_Section WHERE ID_section = ?', [ID_section]);
            if (students.length > 0) {
                const studentMatricules = students.map(student => student.Matricule);
                const notificationMessage = `Une nouvelle ressource a été téléchargée pour le module ${nom_module} par ${professorName} : ${nom_ressource} (${type_ressource})`;
                await Notification.createForMultipleRecipients(matricule, studentMatricules, notificationMessage);
            }

            res.status(201).json({ message: 'Resource uploaded', fichier_url, ID_ressource: result.insertId });
        } catch (error) {
            console.error('Error in uploadResource:', error);
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error('Failed to delete file:', err));
            }
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'Une ressource avec ce nom existe déjà pour ce module et cette section.' });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }
];

exports.getResources = [
    authenticateProfessor,
    async (req, res) => {
        try {
            const resources = await Ressource.findByProfessor(req.professor.Matricule);
            res.json(resources);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
];

exports.deleteResource = [
    authenticateProfessor,
    async (req, res) => {
        try {
            const { id } = req.params;

            const [resource] = await db.execute(
                'SELECT fichier_url FROM Ressource WHERE ID_ressource = ? AND Matricule = ?',
                [id, req.professor.Matricule]
            );
            if (resource.length === 0) {
                return res.status(404).json({ error: 'Resource not found or unauthorized' });
            }

            const fichier_url = resource[0].fichier_url;
            const filePath = path.join(__dirname, '..', fichier_url.replace('/uploads/', 'uploads/'));

            const success = await Ressource.deleteById(id);
            if (!success) {
                return res.status(404).json({ error: 'Resource not found in database' });
            }

            try {
                await fs.unlink(filePath);
                console.log(`Deleted file: ${filePath}`);
            } catch (fileError) {
                console.error(`Failed to delete file ${filePath}:`, fileError.message);
            }

            res.json({ message: 'Resource deleted successfully' });
        } catch (error) {
            console.error('Error in deleteResource:', error);
            res.status(500).json({ error: error.message });
        }
    }
];

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

            const [moduleResult] = await db.execute(
                'SELECT nom_module FROM Module WHERE ID_module = ?',
                [ID_module]
            );
            if (moduleResult.length === 0) {
                return res.status(404).json({ error: 'Module not found' });
            }
            const nom_module = moduleResult[0].nom_module;

            const matricule = req.professor.Matricule;
            const [professorResult] = await db.execute(
                'SELECT nom, prenom FROM user WHERE Matricule = ?',
                [matricule]
            );
            if (professorResult.length === 0) {
                return res.status(404).json({ error: 'Professor not found in user table' });
            }
            const professorName = `${professorResult[0].prenom} ${professorResult[0].nom}`;

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
            const success = await Ressource.updateById(id, updates);

            if (success) {
                const [students] = await db.execute(
                    'SELECT Matricule FROM Etudiant_Section WHERE ID_section = ?',
                    [ID_section]
                );
                if (students.length > 0) {
                    const studentMatricules = students.map(student => student.Matricule);
                    const notificationMessage = `Une ressource a été mise à jour pour le module ${nom_module} par ${professorName} : ${nom_ressource} (${type_ressource})`;
                    await Notification.createForMultipleRecipients(req.professor.Matricule, studentMatricules, notificationMessage);
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

exports.validateMatricule = [
    authenticateProfessor,
    async (req, res) => {
        try {
            res.json({ message: 'Matricule valid', professor: req.professor });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
];
