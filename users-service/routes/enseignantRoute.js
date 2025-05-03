const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const XLSX = require('xlsx');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/enseignants', async (req, res) => {
    const { nom, prenom, email, idFaculte, idDepartement, idSection, modules } = req.body;

    if (!nom || !prenom || !email || !idFaculte || !Array.isArray(modules) || modules.length === 0) {
        console.log('Validation failed:', { nom, prenom, email, idFaculte, idDepartement, idSection, modules });
        return res.status(400).json({ error: 'Nom, prénom, email, faculté et au moins un module sont requis.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [faculteExists] = await connection.query('SELECT ID_faculte FROM faculte WHERE ID_faculte = ?', [idFaculte]);
        if (faculteExists.length === 0) {
            throw new Error(`La faculté avec ID ${idFaculte} n'existe pas.`);
        }

        if (idDepartement) {
            const [departementExists] = await connection.query('SELECT ID_departement FROM Departement WHERE ID_departement = ? AND ID_faculte = ?', [idDepartement, idFaculte]);
            if (departementExists.length === 0) {
                throw new Error(`Le département avec ID ${idDepartement} n'existe pas ou n'appartient pas à la faculté ${idFaculte}.`);
            }
        }

        if (idSection) {
            const [sectionExists] = await connection.query('SELECT ID_section FROM Section WHERE ID_section = ?', [idSection]);
            if (sectionExists.length === 0) {
                throw new Error(`La section avec ID ${idSection} n'existe pas.`);
            }
        }

        const [validModules] = await connection.query('SELECT ID_module FROM Module WHERE ID_module IN (?)', [modules]);
        const validModuleIds = validModules.map(module => module.ID_module);
        const invalidModules = modules.filter(id => !validModuleIds.includes(Number(id)));
        if (invalidModules.length > 0) {
            throw new Error(`Les modules avec ID ${invalidModules.join(', ')} n'existent pas.`);
        }

        const [latestMatricule] = await connection.query('SELECT Matricule FROM User WHERE Matricule >= 1000 ORDER BY Matricule DESC LIMIT 1');
        let matricule = 1000;
        if (latestMatricule.length > 0) {
            matricule = latestMatricule[0].Matricule + 1;
        }
        console.log('Generated Matricule:', matricule);

        const [existingEmail] = await connection.query('SELECT email FROM User WHERE email = ?', [email]);
        if (existingEmail.length > 0) {
            throw new Error('L\'email existe déjà.');
        }

        const hashedPassword = await bcrypt.hash('default_password', 10);

        await connection.query(
            'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?)',
            [matricule, nom, prenom, email, hashedPassword]
        );
        console.log('User inserted successfully for Matricule:', matricule);

        const annee_inscription = new Date().toISOString().split('T')[0];
        await connection.query(
            'INSERT INTO Enseignant (Matricule, ID_faculte, ID_departement, annee_inscription) VALUES (?, ?, ?, ?)',
            [matricule, idFaculte, idDepartement || null, annee_inscription]
        );
        console.log('Enseignant inserted with annee_inscription:', annee_inscription);

        const values = modules.map(moduleId => [moduleId, matricule, 'Cours', null]);
        await connection.query(
            'INSERT INTO Module_Enseignant (ID_module, Matricule, course_type, group_number) VALUES ? ON DUPLICATE KEY UPDATE course_type = VALUES(course_type), group_number = VALUES(group_number)',
            [values]
        );
        console.log('Modules assigned:', modules);

        // Associate modules with the selected section in Module_Section
        if (idSection) {
            const moduleSectionValues = modules.map(moduleId => [moduleId, idSection, '1']); // Default semestre to '1'
            await connection.query(
                'INSERT INTO Module_Section (ID_module, ID_section, semestre) VALUES ? ON DUPLICATE KEY UPDATE semestre = VALUES(semestre)',
                [moduleSectionValues]
            );
            console.log('Modules associated with section:', idSection);
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
router.post('/enseignants/bulk', upload.single('file'), async (req, res) => {
    const { idFaculte } = req.body;

    if (!idFaculte || !req.file) {
        return res.status(400).json({ error: 'Faculté et fichier Excel requis.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [faculteExists] = await connection.query('SELECT ID_faculte FROM faculte WHERE ID_faculte = ?', [idFaculte]);
        if (faculteExists.length === 0) {
            throw new Error(`La faculté avec ID ${idFaculte} n'existe pas.`);
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        if (!data.length) {
            throw new Error('Le fichier Excel est vide.');
        }

        const headers = Object.keys(data[0]);
        const emailColumn = headers.find(header => header.toLowerCase() === 'email');
        if (!emailColumn) {
            throw new Error('Le fichier Excel doit contenir une colonne "EMAIL".');
        }

        const nomColumn = headers.find(header => header.toLowerCase() === 'nom');
        if (!nomColumn) {
            throw new Error('Le fichier Excel doit contenir une colonne "NOM".');
        }

        const [latestMatricule] = await connection.query('SELECT Matricule FROM User WHERE Matricule >= 1000 ORDER BY Matricule DESC LIMIT 1');
        let matricule = latestMatricule.length > 0 ? latestMatricule[0].Matricule + 1 : 1000;

        const hashedPassword = await bcrypt.hash('default_password', 10);
        const annee_inscription = new Date().toISOString().split('T')[0];
        const failedEntries = [];

        for (const row of data) {
            const email = row[emailColumn];
            const fullName = row[nomColumn];

            if (!email || !fullName) {
                failedEntries.push({ email: email || 'N/A', error: 'Email ou nom manquant' });
                continue;
            }

            let nom = 'Unknown';
            let prenom = 'Unknown';
            const nameParts = fullName.split(',').map(part => part.trim());
            if (nameParts.length >= 2) {
                nom = nameParts[0] || 'Unknown';
                prenom = nameParts[1] || 'Unknown';
            } else {
                nom = fullName.trim();
                prenom = 'Unknown';
            }

            try {
                const [existingEmail] = await connection.query('SELECT email FROM User WHERE email = ?', [email]);
                if (existingEmail.length > 0) {
                    failedEntries.push({ email, error: 'Email déjà existant' });
                    continue;
                }

                await connection.query(
                    'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?)',
                    [matricule, nom, prenom, email, hashedPassword]
                );

                await connection.query(
                    'INSERT INTO Enseignant (Matricule, ID_faculte, ID_departement, annee_inscription) VALUES (?, ?, NULL, ?)',
                    [matricule, idFaculte, annee_inscription]
                );

                matricule++;
            } catch (err) {
                failedEntries.push({ email, error: err.message });
            }
        }

        await connection.commit();
        res.status(201).json({
            message: 'Importation terminée',
            successCount: data.length - failedEntries.length,
            failedEntries
        });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error during bulk upload:', err);
        res.status(500).json({ error: 'Erreur lors de l\'importation: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/enseignants/assign-modules', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Fichier Excel requis.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (data.length < 2) {
            throw new Error('Le fichier Excel doit contenir des données.');
        }

        const headers = data[0];
        const rows = data.slice(1);

        const expectedHeaders = ['SECTION', 'MODULE', 'Cours', 'TD1', 'TD2', 'TD3', 'TD4', 'TP1', 'TP2', 'TP3', 'TP4'];
        if (!expectedHeaders.every(header => headers.includes(header))) {
            throw new Error('Le fichier Excel doit contenir les colonnes: SECTION, MODULE, Cours, TD1, TD2, TD3, TD4, TP1, TP2, TP3, TP4');
        }

        const failedAssignments = [];
        let latestMatricule = (await connection.query('SELECT Matricule FROM User WHERE Matricule >= 1000 ORDER BY Matricule DESC LIMIT 1'))[0][0]?.Matricule || 999;
        const hashedPassword = await bcrypt.hash('default_password', 10);
        const annee_inscription = new Date().toISOString().split('T')[0];

        for (const row of rows) {
            const sectionName = row[headers.indexOf('SECTION')];
            const moduleName = row[headers.indexOf('MODULE')];
            if (!sectionName || !moduleName) {
                failedAssignments.push({ section: sectionName, module: moduleName, error: 'Section ou module manquant' });
                continue;
            }

            const [sections] = await connection.query(
                'SELECT ID_section FROM Section WHERE nom_section = ? OR niveau = ?',
                [sectionName, sectionName]
            );
            if (sections.length === 0) {
                failedAssignments.push({ section: sectionName, module: moduleName, error: `Section ${sectionName} non trouvée` });
                continue;
            }
            const sectionId = sections[0].ID_section;

            const [modules] = await connection.query(
                'SELECT ID_module FROM Module WHERE nom_module = ?',
                [moduleName]
            );
            console.log('Fetched modules:', modules);
            if (modules.length === 0) {
                failedAssignments.push({ section: sectionName, module: moduleName, error: `Module ${moduleName} non trouvé` });
                continue;
            }
            const moduleId = modules[0].ID_module;

            const assignTeacher = async (teacherName, courseType, groupNumber) => {
                if (!teacherName) return;
                let [teacher] = await connection.query(
                    'SELECT Matricule FROM User WHERE CONCAT(nom, ", ", prenom) = ?',
                    [teacherName]
                );
                let matricule;
                if (!teacher.length) {
                    latestMatricule++;
                    matricule = latestMatricule;
                    const nameParts = teacherName.split(',').map(part => part.trim());
                    const nom = nameParts[0] || 'Unknown';
                    const prenom = nameParts.length > 1 ? nameParts[1] : 'Unknown';
                    const email = `${nom.toLowerCase()}.${prenom.toLowerCase()}@uni.com`;
                    const [existingEmail] = await connection.query('SELECT email FROM User WHERE email = ?', [email]);
                    if (existingEmail.length > 0) {
                        failedAssignments.push({ section: sectionName, module: moduleName, teacher: teacherName, error: `Email ${email} déjà existant` });
                        return;
                    }
                    await connection.query(
                        'INSERT INTO User (Matricule, nom, prenom, email, motdepasse) VALUES (?, ?, ?, ?, ?)',
                        [matricule, nom, prenom, email, hashedPassword]
                    );
                    await connection.query(
                        'INSERT INTO Enseignant (Matricule, ID_faculte, ID_departement, annee_inscription) VALUES (?, ?, NULL, ?)',
                        [matricule, 1, annee_inscription]
                    );
                    console.log(`Created new teacher: ${teacherName}, Matricule: ${matricule}`);
                } else {
                    matricule = teacher[0].Matricule;
                }
                try {
                    await connection.query(
                        'INSERT INTO Module_Enseignant (ID_module, Matricule, course_type, group_number) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE course_type = ?, group_number = ?',
                        [moduleId, matricule, courseType, groupNumber, courseType, groupNumber]
                    );
                    await connection.query(
                        'INSERT INTO Module_Section (ID_module, ID_section, semestre) VALUES (?, ?, "1") ON DUPLICATE KEY UPDATE ID_section = ?, semestre = "1"',
                        [moduleId, sectionId, sectionId]
                    );
                } catch (err) {
                    failedAssignments.push({ section: sectionName, module: moduleName, teacher: teacherName, error: err.message });
                }
            };

            await assignTeacher(row[headers.indexOf('Cours')], 'Cours', null);

            for (let i = 1; i <= 4; i++) {
                await assignTeacher(row[headers.indexOf(`TD${i}`)], 'TD', i);
            }

            for (let i = 1; i <= 4; i++) {
                await assignTeacher(row[headers.indexOf(`TP${i}`)], 'TP', i);
            }
        }

        await connection.commit();
        res.status(200).json({ message: 'Modules attribués avec succès', failedAssignments });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error assigning modules:', err);
        res.status(500).json({ error: 'Erreur lors de l\'attribution des modules: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/enseignants', async (req, res) => {
    const { idFaculte, idDepartement, idSpecialite, idSection, niveau } = req.query;
    console.log('Fetching teachers with filters:', { idFaculte, idDepartement, idSpecialite, idSection, niveau });

    try {
        let query = `
            SELECT DISTINCT u.Matricule, u.nom, u.prenom, u.email, e.ID_faculte, e.ID_departement
            FROM Enseignant e
            JOIN User u ON e.Matricule = u.Matricule
            LEFT JOIN Module_Enseignant me ON e.Matricule = me.Matricule
            LEFT JOIN Module m ON me.ID_module = m.ID_module
            LEFT JOIN Module_Section ms ON m.ID_module = ms.ID_module
            LEFT JOIN Section s ON ms.ID_section = s.ID_section
            LEFT JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
            WHERE 1=1
        `;
        const params = [];

        if (idFaculte) {
            query += ' AND e.ID_faculte = ?';
            params.push(idFaculte);
        }
        if (idDepartement) {
            query += ' AND (e.ID_departement = ? OR e.ID_departement IS NULL)';
            params.push(idDepartement);
        }
        if (idSpecialite) {
            query += ' AND sp.ID_specialite = ?';
            params.push(idSpecialite);
        }
        if (idSection) {
            query += ' AND ms.ID_section = ?';
            params.push(idSection);
        }
        if (niveau) {
            const semestre = niveau.includes('1') ? '1' : '2';
            query += ' AND ms.semestre = ?';
            params.push(semestre);
        }

        const [teachers] = await db.query(query, params);
        console.log('Teachers found:', teachers);
        res.json(teachers);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des enseignants: ' + err.message });
    }
});

router.get('/enseignants/:matricule', async (req, res) => {
    const { matricule } = req.params;
    let connection;
    try {
        connection = await db.getConnection();

        const [enseignant] = await connection.query(`
            SELECT u.Matricule, u.nom, u.prenom, u.email, e.annee_inscription
            FROM Enseignant e
            JOIN User u ON e.Matricule = u.Matricule
            WHERE e.Matricule = ?
        `, [matricule]);

        if (enseignant.length === 0) {
            throw new Error('Enseignant non trouvé');
        }

        const [modules] = await connection.query(`
            SELECT m.ID_module, m.nom_module, 
                   COALESCE(me.course_type, 'Cours') AS course_type, 
                   me.group_number
            FROM Module_Enseignant me
            JOIN Module m ON me.ID_module = m.ID_module
            WHERE me.Matricule = ?
        `, [matricule]);

        console.log('Fetched teacher details:', enseignant[0]);
        console.log('Fetched modules:', modules);

        res.json({ enseignant: enseignant[0], modules });
    } catch (err) {
        console.error('Error fetching teacher details:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des détails de l\'enseignant: ' + err.message });
    } finally {
        if (connection) connection.release();
    }
});

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

            if (modules && Array.isArray(modules) && modules.length > 0) {
                console.log('Modules to insert:', modules);
                const values = modules.map(module => {
                    if (!module.ID_module) {
                        throw new Error('ID_module cannot be null');
                    }
                    return [module.ID_module, matricule, module.course_type || 'Cours', module.group_number || null];
                });
                await connection.query(
                    'INSERT INTO Module_Enseignant (ID_module, Matricule, course_type, group_number) VALUES ?',
                    [values]
                );
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

router.delete('/enseignants/:matricule', async (req, res) => {
    const { matricule } = req.params;
    try {
        await db.query('DELETE FROM Module_Enseignant WHERE Matricule = ?', [matricule]);
        await db.query('DELETE FROM Enseignant WHERE Matricule = ?', [matricule]);
        await db.query('DELETE FROM User WHERE Matricule = ?', [matricule]);
        res.json({ message: 'Enseignant supprimé avec succès' });
    } catch (err) {
        console.error('Error deleting teacher:', err);
        res.status(500).json({ error: 'Erreur lors de la suppression de l\'enseignant' });
    }
});

router.get('/facultes', async (req, res) => {
    try {
        const [facultes] = await db.query('SELECT * FROM faculte');
        res.json(facultes);
    } catch (err) {
        console.error('Error fetching facultes:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des facultés' });
    }
});

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

router.get('/sections/:idSpecialite', async (req, res) => {
    const { idSpecialite } = req.params;
    try {
        const [sections] = await db.query(`
            SELECT ID_section, niveau, nom_section 
            FROM Section 
            WHERE ID_specialite = ?
        `, [idSpecialite]);
        res.json(sections);
    } catch (err) {
        console.error('Error fetching sections:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des sections' });
    }
});

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
            const semestre = niveau.includes('1') ? '1' : '2';
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

router.get('/enseignants/:matricule/modules/:idModule/sections', async (req, res) => {
    const { matricule, idModule } = req.params;
    try {
        const [assignments] = await db.query(`
            SELECT DISTINCT s.ID_section, s.nom_section, s.niveau, me.course_type, me.group_number
            FROM Module_Section ms
            JOIN Section s ON ms.ID_section = s.ID_section
            JOIN Module_Enseignant me ON ms.ID_module = me.ID_module
            WHERE me.Matricule = ? AND ms.ID_module = ?
        `, [matricule, idModule]);
        console.log('Fetched sections with course types for module:', assignments);
        res.json(assignments);
    } catch (err) {
        console.error('Error fetching sections for module:', err);
        res.status(500).json({ error: 'Erreur lors de la récupération des sections du module' });
    }
});

module.exports = router;