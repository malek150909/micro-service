const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt'); // Add bcrypt

router.post('/enseignants', async (req, res) => {
    const { nom, prenom, email, idFaculte, idDepartement, modules } = req.body;

    // Validate required fields
    if (!nom || !prenom || !email || !idFaculte || !idDepartement || !Array.isArray(modules) || modules.length === 0) {
        console.log('Validation failed:', { nom, prenom, email, idFaculte, idDepartement, modules });
        return res.status(400).json({ error: 'Tous les champs sont requis, y compris au moins un module.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Validate idFaculte
        const [faculteExists] = await connection.query('SELECT ID_faculte FROM faculte WHERE ID_faculte = ?', [idFaculte]);
        if (faculteExists.length === 0) {
            throw new Error(`La faculté avec ID ${idFaculte} n'existe pas.`);
        }

        // Validate idDepartement
        const [departementExists] = await connection.query('SELECT ID_departement FROM Departement WHERE ID_departement = ? AND ID_faculte = ?', [idDepartement, idFaculte]);
        if (departementExists.length === 0) {
            throw new Error(`Le département avec ID ${idDepartement} n'existe pas ou n'appartient pas à la faculté ${idFaculte}.`);
        }

        // Validate modules
        for (const moduleId of modules) {
            const [moduleExists] = await connection.query('SELECT ID_module FROM Module WHERE ID_module = ?', [moduleId]);
            if (moduleExists.length === 0) {
                throw new Error(`Le module avec ID ${moduleId} n'existe pas.`);
            }
        }

        // Generate a numeric Matricule by incrementing the latest one
        const [latestMatricule] = await connection.query('SELECT Matricule FROM User WHERE Matricule >= 1000 ORDER BY Matricule DESC LIMIT 1');
        let matricule = 1000; // Default starting Matricule
        if (latestMatricule.length > 0) {
            matricule = latestMatricule[0].Matricule + 1; // Increment numerically
        }
        console.log('Generated Matricule:', matricule);

        // Check if email already exists
        const [existingEmail] = await connection.query('SELECT email FROM User WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            throw new Error('L\'email existe déjà.');
        }

        // Hash the default password
        const hashedPassword = await bcrypt.hash('default_password', 10); // Hash with 10 salt rounds

        // Insert into User table with hashed password
        await connection.query(
            'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?)',
            [matricule, nom, prenom, email, hashedPassword]
        );
        console.log('User inserted successfully for Matricule:', matricule);

        // Insert into Enseignant table with annee_inscription (assuming DATE type)
        const annee_inscription = new Date().toISOString().split('T')[0]; // e.g., '2025-03-12'
        await connection.query(
            'INSERT INTO Enseignant (Matricule, ID_faculte, ID_departement, annee_inscription) VALUES (?, ?, ?, ?)',
            [matricule, idFaculte, idDepartement, annee_inscription]
        );
        console.log('Enseignant inserted with annee_inscription:', annee_inscription);

        // Insert into Module_Enseignant table
        for (const moduleId of modules) {
            await connection.query(
                'INSERT INTO Module_Enseignant (ID_module, Matricule) VALUES (?, ?)',
                [moduleId, matricule]
            );
            console.log('Module assigned:', moduleId);
        }

        await connection.commit();
        console.log('Teacher added successfully with Matricule:', matricule);
        res.status(201).json({ message: 'Enseignant ajouté avec succès', matricule });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Detailed error adding teacher:', err);
        res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'enseignant: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
});

// Route to get filters
router.get('/filters', async (req, res) => {
    try {
        const [facultes] = await db.query('SELECT * FROM faculte');
        res.json({ facultes });
    } catch (err) {
        console.error('Error fetching filters:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des filtres' });
    }
});

// Route to get departments by faculty
router.get('/departements/:idFaculte', async (req, res) => {
    const { idFaculte } = req.params;
    try {
        const [departements] = await db.query('SELECT * FROM Departement WHERE ID_faculte = ?', [idFaculte]);
        res.json(departements);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des départements' });
    }
});

// Route to filter teachers
router.post('/enseignants/filtrer', async (req, res) => {
    const { idFaculte, idDepartement } = req.body;
    try {
        const [enseignants] = await db.query(`
            SELECT e.Matricule, u.nom, u.prenom, u.email
            FROM Enseignant e
            JOIN User u ON e.Matricule = u.Matricule
            WHERE e.ID_faculte = ? AND e.ID_departement = ?
        `, [idFaculte, idDepartement]);
        res.json(enseignants);
    } catch (err) {
        console.error('Error filtering teachers:', err);
        res.status(500).json({ error: 'Erreur lors du filtrage des enseignants' });
    }
});

// Route to get teacher details
router.get('/enseignants/:matricule', async (req, res) => {
    const { matricule } = req.params;
    try {
        const [enseignant] = await db.query(`
            SELECT u.nom, u.prenom, u.email, e.annee_inscription
            FROM Enseignant e
            JOIN User u ON e.Matricule = u.Matricule
            WHERE e.Matricule = ?
        `, [matricule]);
        const [modules] = await db.query(`
            SELECT m.ID_module, m.nom_module
            FROM Module_Enseignant me
            JOIN Module m ON me.ID_module = m.ID_module
            WHERE me.Matricule = ?
        `, [matricule]);
        console.log('Fetched modules:', modules);
        res.json({ enseignant: enseignant[0], modules });
    } catch (err) {
        console.error('Error fetching teacher details:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des détails de l\'enseignant' });
    }
});

// Route to update a teacher
router.put('/enseignants/:matricule', async (req, res) => {
    const { matricule } = req.params;
    const { nom, prenom, email, modules } = req.body;

    console.log('Updating teacher:', { matricule, nom, prenom, email, modules });

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.query(
                'UPDATE User SET nom = ?, prenom = ?, email = ? WHERE Matricule = ?',
                [nom, prenom, email, matricule]
            );
            console.log('User update result:', result);

            await connection.query(
                'DELETE FROM Module_Enseignant WHERE Matricule = ?',
                [matricule]
            );

            if (modules && modules.length > 0) {
                console.log('Modules to insert:', modules);
                for (const moduleId of modules) {
                    if (!moduleId) {
                        throw new Error('ID_module cannot be null');
                    }
                    await connection.query(
                        'INSERT INTO Module_Enseignant (ID_module, Matricule) VALUES (?, ?)',
                        [moduleId, matricule]
                    );
                }
            }

            await connection.commit();
            console.log('Teacher updated successfully');
            res.json({ message: 'Enseignant mis à jour avec succès' });
        } catch (err) {
            await connection.rollback();
            console.error('Transaction error:', err);
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error updating teacher:', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'enseignant: ' + err.message });
    }
});

// Route to delete a teacher
router.delete('/enseignants/:matricule', async (req, res) => {
    const { matricule } = req.params;
    try {
        await db.query('DELETE FROM Module_Enseignant WHERE Matricule = ?', [matricule]); // Clean up modules first
        await db.query('DELETE FROM Enseignant WHERE Matricule = ?', [matricule]);
        await db.query('DELETE FROM User WHERE Matricule = ?', [matricule]);
        res.json({ message: 'Enseignant supprimé avec succès' });
    } catch (err) {
        console.error('Error deleting teacher:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'enseignant' });
    }
});

// Route to get all facultes
router.get('/facultes', async (req, res) => {
    try {
        const [facultes] = await db.query('SELECT * FROM faculte');
        res.json(facultes);
    } catch (err) {
        console.error('Error fetching facultes:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des facultés' });
    }
});

// Route to get departments by faculty
router.get('/departements/:idFaculte', async (req, res) => {
    const { idFaculte } = req.params;
    try {
        const [departements] = await db.query('SELECT * FROM Departement WHERE ID_faculte = ?', [idFaculte]);
        res.json(departements);
    } catch (err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des départements' });
    }
});

// Route to get specialites by department
router.get('/specialites/:idDepartement', async (req, res) => {
    const { idDepartement } = req.params;
    try {
        const [specialites] = await db.query('SELECT * FROM Specialite WHERE ID_departement = ?', [idDepartement]);
        res.json(specialites);
    } catch (err) {
        console.error('Error fetching specialites:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des spécialités' });
    }
});

// Route to get sections by specialite
router.get('/sections/:idSpecialite', async (req, res) => {
    const { idSpecialite } = req.params;
    try {
        const [sections] = await db.query(`
            SELECT ID_section, niveau 
            FROM Section 
            WHERE ID_specialite = ?
        `, [idSpecialite]);
        res.json(sections);
    } catch (err) {
        console.error('Error fetching sections:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des sections' });
    }
});

// Route to get filtered modules
router.get('/modules/filtered', async (req, res) => {
    const { idFaculte, idDepartement, idSpecialite, niveau, idSection } = req.query;
    console.log('Fetching modules with filters:', { idFaculte, idDepartement, idSpecialite, niveau, idSection });

    try {
        let query = `
            SELECT DISTINCT m.*
            FROM Module m
            JOIN Specialite s ON m.ID_specialite = s.ID_specialite
            JOIN Departement d ON s.ID_departement = d.ID_departement
            JOIN faculte f ON d.ID_faculte = f.ID_faculte
            LEFT JOIN Module_Section ms ON m.ID_module = ms.ID_module
            WHERE 1=1
        `;
        const params = [];

        if (idFaculte) {
            query += ' AND f.ID_faculte = ?';
            params.push(idFaculte);
        }
        if (idDepartement) {
            query += ' AND d.ID_departement = ?';
            params.push(idDepartement);
        }
        if (idSpecialite) {
            query += ' AND s.ID_specialite = ?';
            params.push(idSpecialite);
        }
        if (idSection) {
            query += ' AND ms.ID_section = ?';
            params.push(idSection);
        }
        if (niveau) {
            const semestre = niveau.includes('1') ? '1' : '2'; // Adjust this mapping as needed
            query += ' AND ms.semestre = ?';
            params.push(semestre);
        }

        const [modules] = await db.query(query, params);
        console.log('Modules found:', modules);
        res.json(modules);
    } catch (err) {
        console.error('Error fetching modules:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des modules filtrés' });
    }
});

module.exports = router;