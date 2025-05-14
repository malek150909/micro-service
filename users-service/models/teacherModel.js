const promisePool = require('../config/db');

exports.getFaculties = async () => {
    const [rows] = await promisePool.query('SELECT ID_faculte, nom_faculte FROM faculte');
    return rows;
};

exports.getDepartments = async () => {
    const [rows] = await promisePool.query('SELECT ID_departement, Nom_departement, ID_faculte FROM Departement');
    return rows;
};

exports.getSpecialties = async () => {
    const [rows] = await promisePool.query('SELECT ID_specialite, nom_specialite, ID_departement, ID_faculte FROM specialite');
    return rows;
};

exports.getModules = async () => {
    const [rows] = await promisePool.query(`
        SELECT 
            m.ID_module, 
            m.nom_module, 
            s.ID_departement, 
            s.ID_faculte,
            s.ID_specialite
        FROM Module m
        JOIN specialite s ON m.ID_specialite = s.ID_specialite
    `);
    return rows;
};

exports.getModulesBySectionsAndSpecialty = async (sectionIds, specialtyId) => {
    if (!sectionIds || sectionIds.length === 0 || !specialtyId) {
        return [];
    }
    const [rows] = await promisePool.query(`
        SELECT DISTINCT 
            m.ID_module, 
            m.nom_module, 
            m.ID_specialite,
            ms.ID_section
        FROM Module m
        JOIN module_section ms ON m.ID_module = ms.ID_module
        JOIN section s ON ms.ID_section = s.ID_section
        WHERE ms.ID_section IN (?) 
        AND m.ID_specialite = ?
    `, [sectionIds, specialtyId]);
    return rows;
};

exports.getSections = async () => {
    const [rows] = await promisePool.query(`
        SELECT 
            s.ID_section, 
            s.nom_section, 
            s.niveau, 
            s.ID_specialite, 
            sp.nom_specialite, 
            sp.ID_departement, 
            sp.ID_faculte 
        FROM section s
        JOIN specialite sp ON s.ID_specialite = sp.ID_specialite
    `);
    return rows;
};

exports.getGroupsBySections = async (sectionIds) => {
    if (!sectionIds || sectionIds.length === 0) {
        return [];
    }
    const [rows] = await promisePool.query(`
        SELECT 
            g.ID_groupe, 
            g.num_groupe, 
            g.ID_section, 
            s.nom_section
        FROM groupe g
        JOIN section s ON g.ID_section = s.ID_section
        WHERE g.ID_section IN (?)
    `, [sectionIds]);
    return rows;
};

exports.getTeachers = async () => {
    const [rows] = await promisePool.query(`
        SELECT u.Matricule, u.nom, u.prenom, u.email, e.annee_inscription, e.ID_faculte, e.ID_departement
        FROM User u
        JOIN enseignant e ON u.Matricule = e.Matricule
    `);
    return rows;
};

exports.getTeacherDetails = async (matricule) => {
    const connection = await promisePool.getConnection();
    try {
        const [teacherRows] = await connection.query(`
            SELECT 
                u.Matricule, 
                u.nom, 
                u.prenom, 
                u.email, 
                u.motdepasse, 
                e.annee_inscription, 
                e.ID_faculte, 
                e.ID_departement,
                f.nom_faculte AS facultyName, 
                d.Nom_departement AS departmentName
            FROM User u
            JOIN enseignant e ON u.Matricule = e.Matricule
            LEFT JOIN faculte f ON e.ID_faculte = f.ID_faculte
            LEFT JOIN Departement d ON e.ID_departement = d.ID_departement
            WHERE u.Matricule = ?
        `, [matricule]);

        if (teacherRows.length === 0) return null;

        const [moduleRows] = await connection.query(`
            SELECT 
                m.ID_module, 
                m.nom_module, 
                me.course_type, 
                m.ID_specialite,
                s.ID_section, 
                s.nom_section, 
                s.niveau,
                sp.nom_specialite
            FROM Module_Enseignant me
            JOIN Module m ON me.ID_module = m.ID_module
            JOIN Enseignant_Section es ON es.Matricule = me.Matricule
            JOIN section s ON es.ID_section = s.ID_section
            JOIN specialite sp ON m.ID_specialite = sp.ID_specialite
            WHERE me.Matricule = ?
        `, [matricule]);

        const [sectionRows] = await connection.query(`
            SELECT s.ID_section, s.nom_section, s.niveau, s.ID_specialite
            FROM Enseignant_Section es
            JOIN section s ON es.ID_section = s.ID_section
            WHERE es.Matricule = ?
        `, [matricule]);

        const [groupRows] = await connection.query(`
            SELECT 
                meg.ID_module,
                meg.course_type,
                meg.ID_groupe,
                g.num_groupe,
                g.ID_section
            FROM module_enseignant_groupe meg
            JOIN groupe g ON meg.ID_groupe = g.ID_groupe
            WHERE meg.Matricule = ?
        `, [matricule]);

        return {
            matricule: teacherRows[0].Matricule,
            nom: teacherRows[0].nom,
            prenom: teacherRows[0].prenom,
            email: teacherRows[0].email,
            motdepasse: teacherRows[0].motdepasse,
            annee_inscription: teacherRows[0].annee_inscription,
            ID_faculte: teacherRows[0].ID_faculte,
            ID_departement: teacherRows[0].ID_departement,
            facultyName: teacherRows[0].facultyName || null,
            departmentName: teacherRows[0].departmentName || null,
            modules: moduleRows || [],
            sections: sectionRows || [],
            groups: groupRows || []
        };
    } finally {
        connection.release();
    }
};

exports.createTeacher = async ({ nom, prenom, email, motdepasse, annee_inscription, ID_faculte, ID_departement, assignedSections, assignedModules, moduleSessionTypes, assignedGroups }) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        // Validate foreign keys
        const [facultyRows] = await connection.query('SELECT ID_faculte FROM faculte WHERE ID_faculte = ?', [ID_faculte]);
        if (facultyRows.length === 0) {
            throw new Error(`Faculté avec ID ${ID_faculte} n'existe pas`);
        }
        const [deptRows] = await connection.query('SELECT ID_departement FROM Departement WHERE ID_departement = ?', [ID_departement]);
        if (deptRows.length === 0) {
            throw new Error(`Département avec ID ${ID_departement} n'existe pas`);
        }

        // Check for duplicate email
        const [emailRows] = await connection.query('SELECT Matricule FROM User WHERE email = ?', [email]);
        if (emailRows.length > 0) {
            throw new Error(`L'email ${email} est déjà utilisé`);
        }

        // Generate incremental matricule
        const [maxMatriculeRows] = await connection.query('SELECT MAX(Matricule) AS maxMatricule FROM enseignant');
        const matricule = maxMatriculeRows[0].maxMatricule ? String(parseInt(maxMatriculeRows[0].maxMatricule, 10) + 1) : '1';

        console.log(`Creating teacher: ${nom} ${prenom}`, {
            matricule,
            email,
            ID_faculte,
            ID_departement
        });

        // Insert into User table
        const [userResult] = await connection.query(`
            INSERT INTO User (Matricule, nom, prenom, email, motdepasse, Created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [matricule, nom, prenom, email, motdepasse]);
        if (userResult.affectedRows !== 1) {
            throw new Error(`Échec de l'insertion dans la table User pour ${nom} ${prenom}`);
        }

        // Insert into enseignant table
        const [enseignantResult] = await connection.query(`
            INSERT INTO enseignant (Matricule, annee_inscription, ID_faculte, ID_departement)
            VALUES (?, ?, ?, ?)
        `, [matricule, annee_inscription, ID_faculte, ID_departement]);
        if (enseignantResult.affectedRows !== 1) {
            throw new Error(`Échec de l'insertion dans la table enseignant pour ${nom} ${prenom}`);
        }

        // Insert section assignments
        if (assignedSections && assignedSections.length > 0) {
            const sectionValues = assignedSections.map(sectionId => [matricule, sectionId]);
            await connection.query(`
                INSERT INTO Enseignant_Section (Matricule, ID_section)
                VALUES ?
            `, [sectionValues]);
        }

        // Insert module and group assignments
        if (assignedModules && assignedModules.length > 0) {
            const moduleValues = assignedModules.map(moduleId => [
                matricule,
                moduleId,
                moduleSessionTypes[moduleId] || 'Cour'
            ]);
            await connection.query(`
                INSERT INTO Module_Enseignant (Matricule, ID_module, course_type)
                VALUES ?
            `, [moduleValues]);

            // Insert group assignments for TD/TP
            if (assignedGroups) {
                const groupValues = [];
                for (const moduleId of assignedModules) {
                    const courseType = moduleSessionTypes[moduleId] || 'Cour';
                    if (courseType.includes('TD') || courseType.includes('TP')) {
                        const groupsForModule = assignedGroups[moduleId] || {};
                        const tdGroups = groupsForModule.TD || [];
                        const tpGroups = groupsForModule.TP || [];

                        // Validate groups belong to assigned sections
                        const [validGroups] = await connection.query(`
                            SELECT g.ID_groupe
                            FROM groupe g
                            WHERE g.ID_section IN (?) AND g.ID_groupe IN (?)
                        `, [assignedSections, [...tdGroups, ...tpGroups]]);

                        const validGroupIds = new Set(validGroups.map(g => g.ID_groupe));

                        if (courseType.includes('TD')) {
                            for (const groupId of tdGroups) {
                                if (validGroupIds.has(groupId)) {
                                    groupValues.push([moduleId, matricule, 'TD', groupId]);
                                } else {
                                    throw new Error(`Groupe ${groupId} n'est pas valide pour le module ${moduleId} et l'enseignant ${nom} ${prenom}`);
                                }
                            }
                        }
                        if (courseType.includes('TP')) {
                            for (const groupId of tpGroups) {
                                if (validGroupIds.has(groupId)) {
                                    groupValues.push([moduleId, matricule, 'TP', groupId]);
                                } else {
                                    throw new Error(`Groupe ${groupId} n'est pas valide pour le module ${moduleId} et l'enseignant ${nom} ${prenom}`);
                                }
                            }
                        }
                    }
                }
                if (groupValues.length > 0) {
                    console.log(`Inserting group assignments for ${matricule}:`, groupValues);
                    await connection.query(`
                        INSERT INTO module_enseignant_groupe (ID_module, Matricule, course_type, ID_groupe)
                        VALUES ?
                    `, [groupValues]);
                }
            }

            // Insert section assignments from module sections
            const [moduleSections] = await connection.query(`
                SELECT ID_section
                FROM Module_Section
                WHERE ID_module IN (?)
            `, [assignedModules]);
            const sectionIds = moduleSections.map(row => row.ID_section);
            if (sectionIds.length > 0) {
                const sectionValues = sectionIds.map(sectionId => [matricule, sectionId]);
                await connection.query(`
                    INSERT IGNORE INTO Enseignant_Section (Matricule, ID_section)
                    VALUES ?
                `, [sectionValues]);
            }
        }

        // Fetch created teacher details
        const [teacherRows] = await connection.query(`
            SELECT 
                u.Matricule, 
                u.nom, 
                u.prenom, 
                u.email, 
                u.motdepasse, 
                e.annee_inscription, 
                e.ID_faculte, 
                e.ID_departement,
                f.nom_faculte AS facultyName, 
                d.Nom_departement AS departmentName
            FROM User u
            JOIN enseignant e ON u.Matricule = e.Matricule
            LEFT JOIN faculte f ON e.ID_faculte = f.ID_faculte
            LEFT JOIN Departement d ON e.ID_departement = d.ID_departement
            WHERE u.Matricule = ?
        `, [matricule]);

        if (!teacherRows || teacherRows.length === 0) {
            throw new Error(`Enseignant non trouvé après insertion pour ${nom} ${prenom}, matricule: ${matricule}`);
        }

        const [sectionRows] = await connection.query(`
            SELECT s.ID_section, s.nom_section, s.niveau, s.ID_specialite
            FROM Enseignant_Section es
            JOIN section s ON es.ID_section = s.ID_section
            WHERE es.Matricule = ?
        `, [matricule]);

        const [moduleRows] = await connection.query(`
            SELECT 
                m.ID_module, 
                m.nom_module, 
                me.course_type, 
                m.ID_specialite,
                ms.ID_section
            FROM Module_Enseignant me
            JOIN Module m ON me.ID_module = m.ID_module
            LEFT JOIN Module_Section ms ON m.ID_module = ms.ID_module
            WHERE me.Matricule = ?
        `, [matricule]);

        const [groupRows] = await connection.query(`
            SELECT 
                meg.ID_module,
                meg.course_type,
                meg.ID_groupe,
                g.num_groupe,
                g.ID_section
            FROM module_enseignant_groupe meg
            JOIN groupe g ON meg.ID_groupe = g.ID_groupe
            WHERE meg.Matricule = ?
        `, [matricule]);

        await connection.commit();

        return {
            matricule: teacherRows[0].Matricule,
            nom: teacherRows[0].nom,
            prenom: teacherRows[0].prenom,
            email: teacherRows[0].email,
            motdepasse: teacherRows[0].motdepasse,
            annee_inscription: teacherRows[0].annee_inscription,
            ID_faculte: teacherRows[0].ID_faculte,
            ID_departement: teacherRows[0].ID_departement,
            facultyName: teacherRows[0].facultyName || null,
            departmentName: teacherRows[0].departmentName || null,
            modules: moduleRows || [],
            sections: sectionRows || [],
            groups: groupRows || []
        };
    } catch (error) {
        await connection.rollback();
        console.error(`Erreur dans createTeacher pour ${nom} ${prenom}:`, {
            message: error.message,
            stack: error.stack,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        throw error;
    } finally {
        connection.release();
    }
};

exports.bulkCreateTeachers = async (teachers) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        const createdTeachers = [];

        // Get the highest existing Matricule
        const [maxMatriculeRows] = await connection.query('SELECT MAX(Matricule) AS maxMatricule FROM enseignant');
        let currentMatricule = maxMatriculeRows[0].maxMatricule ? parseInt(maxMatriculeRows[0].maxMatricule, 10) : 0;

        for (const teacher of teachers) {
            const { nom, prenom, email, motdepasse, annee_inscription, ID_faculte, ID_departement, assignedSections, assignedModules, moduleSessionTypes, assignedGroups } = teacher;

            // Sanitize and validate data
            if (!nom || typeof nom !== 'string' || !prenom || typeof prenom !== 'string' || !email || typeof email !== 'string') {
                throw new Error(`Données invalides pour l'enseignant: ${nom || 'inconnu'} ${prenom || ''}`);
            }
            if (!motdepasse || !annee_inscription || !ID_faculte || !ID_departement) {
                throw new Error(`Champs requis manquants pour l'enseignant: ${nom} ${prenom}`);
            }

            // Validate foreign keys
            const [facultyRows] = await connection.query('SELECT ID_faculte FROM faculte WHERE ID_faculte = ?', [ID_faculte]);
            if (facultyRows.length === 0) {
                throw new Error(`Faculté avec ID ${ID_faculte} n'existe pas pour ${nom} ${prenom}`);
            }
            const [deptRows] = await connection.query('SELECT ID_departement FROM Departement WHERE ID_departement = ?', [ID_departement]);
            if (deptRows.length === 0) {
                throw new Error(`Département avec ID ${ID_departement} n'existe pas pour ${nom} ${prenom}`);
            }

            // Check for duplicate email
            const [emailRows] = await connection.query('SELECT Matricule FROM User WHERE email = ?', [email]);
            if (emailRows.length > 0) {
                throw new Error(`L'email ${email} est déjà utilisé pour ${nom} ${prenom}`);
            }

            // Increment matricule
            currentMatricule += 1;
            const matricule = String(currentMatricule);

            const sanitizedTeacher = {
                matricule,
                nom: nom.trim(),
                prenom: prenom.trim(),
                email: email.trim(),
                motdepasse: motdepasse.trim(),
                annee_inscription: annee_inscription.trim(),
                ID_faculte: Number(ID_faculte),
                ID_departement: Number(ID_departement),
                assignedSections: Array.isArray(assignedSections) ? assignedSections.map(Number).filter(id => !isNaN(id)) : [],
                assignedModules: Array.isArray(assignedModules) ? assignedModules.map(Number).filter(id => !isNaN(id)) : [],
                moduleSessionTypes: moduleSessionTypes || {},
                assignedGroups: assignedGroups || {}
            };

            console.log(`Inserting teacher: ${sanitizedTeacher.nom} ${sanitizedTeacher.prenom}`, {
                matricule: sanitizedTeacher.matricule,
                email: sanitizedTeacher.email,
                ID_faculte: sanitizedTeacher.ID_faculte,
                ID_departement: sanitizedTeacher.ID_departement
            });

            // Insert into User table
            const [userResult] = await connection.query(`
                INSERT INTO User (Matricule, nom, prenom, email, motdepasse, Created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [
                sanitizedTeacher.matricule,
                sanitizedTeacher.nom,
                sanitizedTeacher.prenom,
                sanitizedTeacher.email,
                sanitizedTeacher.motdepasse
            ]);
            if (userResult.affectedRows !== 1) {
                throw new Error(`Échec de l'insertion dans la table User pour ${sanitizedTeacher.nom} ${sanitizedTeacher.prenom}`);
            }
            console.log(`Inserted into User for matricule: ${sanitizedTeacher.matricule}`);

            // Insert into enseignant table
            const [enseignantResult] = await connection.query(`
                INSERT INTO enseignant (Matricule, annee_inscription, ID_faculte, ID_departement)
                VALUES (?, ?, ?, ?)
            `, [
                sanitizedTeacher.matricule,
                sanitizedTeacher.annee_inscription,
                sanitizedTeacher.ID_faculte,
                sanitizedTeacher.ID_departement
            ]);
            if (enseignantResult.affectedRows !== 1) {
                throw new Error(`Échec de l'insertion dans la table enseignant pour ${sanitizedTeacher.nom} ${sanitizedTeacher.prenom}`);
            }
            console.log(`Inserted into enseignant for matricule: ${sanitizedTeacher.matricule}`);

            // Insert section assignments
            if (sanitizedTeacher.assignedSections.length > 0) {
                const sectionValues = sanitizedTeacher.assignedSections.map(sectionId => [sanitizedTeacher.matricule, sectionId]);
                console.log(`Inserting sections for ${sanitizedTeacher.matricule}:`, sectionValues);
                await connection.query(`
                    INSERT INTO Enseignant_Section (Matricule, ID_section)
                    VALUES ?
                `, [sectionValues]);
            }

            // Insert module and group assignments
            if (sanitizedTeacher.assignedModules.length > 0) {
                const moduleValues = sanitizedTeacher.assignedModules.map(moduleId => [
                    sanitizedTeacher.matricule,
                    moduleId,
                    sanitizedTeacher.moduleSessionTypes[moduleId] || 'Cour'
                ]);
                console.log(`Inserting modules for ${sanitizedTeacher.matricule}:`, moduleValues);
                await connection.query(`
                    INSERT INTO Module_Enseignant (Matricule, ID_module, course_type)
                    VALUES ?
                `, [moduleValues]);

                // Insert group assignments for TD/TP
                if (sanitizedTeacher.assignedGroups) {
                    const groupValues = [];
                    for (const moduleId of sanitizedTeacher.assignedModules) {
                        const courseType = sanitizedTeacher.moduleSessionTypes[moduleId] || 'Cour';
                        if (courseType.includes('TD') || courseType.includes('TP')) {
                            const groupsForModule = sanitizedTeacher.assignedGroups[moduleId] || {};
                            const tdGroups = groupsForModule.TD || [];
                            const tpGroups = groupsForModule.TP || [];

                            // Validate groups belong to assigned sections
                            const [validGroups] = await connection.query(`
                                SELECT g.ID_groupe
                                FROM groupe g
                                WHERE g.ID_section IN (?) AND g.ID_groupe IN (?)
                            `, [sanitizedTeacher.assignedSections, [...tdGroups, ...tpGroups]]);

                            const validGroupIds = new Set(validGroups.map(g => g.ID_groupe));

                            if (courseType.includes('TD')) {
                                for (const groupId of tdGroups) {
                                    if (validGroupIds.has(groupId)) {
                                        groupValues.push([moduleId, sanitizedTeacher.matricule, 'TD', groupId]);
                                    } else {
                                        throw new Error(`Groupe ${groupId} n'est pas valide pour le module ${moduleId} et l'enseignant ${sanitizedTeacher.nom} ${sanitizedTeacher.prenom}`);
                                    }
                                }
                            }
                            if (courseType.includes('TP')) {
                                for (const groupId of tpGroups) {
                                    if (validGroupIds.has(groupId)) {
                                        groupValues.push([moduleId, sanitizedTeacher.matricule, 'TP', groupId]);
                                    } else {
                                        throw new Error(`Groupe ${groupId} n'est pas valide pour le module ${moduleId} et l'enseignant ${sanitizedTeacher.nom} ${sanitizedTeacher.prenom}`);
                                    }
                                }
                            }
                        }
                    }
                    if (groupValues.length > 0) {
                        console.log(`Inserting group assignments for ${sanitizedTeacher.matricule}:`, groupValues);
                        await connection.query(`
                            INSERT INTO module_enseignant_groupe (ID_module, Matricule, course_type, ID_groupe)
                            VALUES ?
                        `, [groupValues]);
                    }
                }

                // Insert section assignments from module sections
                const [moduleSections] = await connection.query(`
                    SELECT ID_section
                    FROM Module_Section
                    WHERE ID_module IN (?)
                `, [sanitizedTeacher.assignedModules]);
                const sectionIds = moduleSections.map(row => row.ID_section);
                if (sectionIds.length > 0) {
                    const sectionValues = sectionIds.map(sectionId => [sanitizedTeacher.matricule, sectionId]);
                    console.log(`Inserting module sections for ${sanitizedTeacher.matricule}:`, sectionValues);
                    await connection.query(`
                        INSERT IGNORE INTO Enseignant_Section (Matricule, ID_section)
                        VALUES ?
                    `, [sectionValues]);
                }
            }

            // Fetch created teacher details
            console.log(`Fetching teacher with matricule: ${sanitizedTeacher.matricule}`);
            const [teacherRows] = await connection.query(`
                SELECT 
                    u.Matricule, 
                    u.nom, 
                    u.prenom, 
                    u.email, 
                    u.motdepasse, 
                    e.annee_inscription, 
                    e.ID_faculte, 
                    e.ID_departement,
                    f.nom_faculte AS facultyName, 
                    d.Nom_departement AS departmentName
                FROM User u
                JOIN enseignant e ON u.Matricule = e.Matricule
                LEFT JOIN faculte f ON e.ID_faculte = f.ID_faculte
                LEFT JOIN Departement d ON e.ID_departement = d.ID_departement
                WHERE u.Matricule = ?
            `, [sanitizedTeacher.matricule]);
            console.log(`Teacher rows fetched:`, teacherRows);

            if (!teacherRows || teacherRows.length === 0) {
                throw new Error(`Enseignant non trouvé après insertion pour ${sanitizedTeacher.nom} ${sanitizedTeacher.prenom}, matricule: ${sanitizedTeacher.matricule}`);
            }

            const [sectionRows] = await connection.query(`
                SELECT s.ID_section, s.nom_section, s.niveau, s.ID_specialite
                FROM Enseignant_Section es
                JOIN section s ON es.ID_section = s.ID_section
                WHERE es.Matricule = ?
            `, [sanitizedTeacher.matricule]);

            const [moduleRows] = await connection.query(`
                SELECT 
                    m.ID_module, 
                    m.nom_module, 
                    me.course_type, 
                    m.ID_specialite,
                    ms.ID_section
                FROM Module_Enseignant me
                JOIN Module m ON me.ID_module = m.ID_module
                LEFT JOIN Module_Section ms ON m.ID_module = ms.ID_module
                WHERE me.Matricule = ?
            `, [sanitizedTeacher.matricule]);

            const [groupRows] = await connection.query(`
                SELECT 
                    meg.ID_module,
                    meg.course_type,
                    meg.ID_groupe,
                    g.num_groupe,
                    g.ID_section
                FROM module_enseignant_groupe meg
                JOIN groupe g ON meg.ID_groupe = g.ID_groupe
                WHERE meg.Matricule = ?
            `, [sanitizedTeacher.matricule]);

            createdTeachers.push({
                matricule: teacherRows[0].Matricule,
                nom: teacherRows[0].nom,
                prenom: teacherRows[0].prenom,
                email: teacherRows[0].email,
                motdepasse: teacherRows[0].motdepasse,
                annee_inscription: teacherRows[0].annee_inscription,
                ID_faculte: teacherRows[0].ID_faculte,
                ID_departement: teacherRows[0].ID_departement,
                facultyName: teacherRows[0].facultyName || null,
                departmentName: teacherRows[0].departmentName || null,
                modules: moduleRows || [],
                sections: sectionRows || [],
                groups: groupRows || []
            });
        }

        await connection.commit();
        return { count: createdTeachers.length, teachers: createdTeachers };
    } catch (error) {
        await connection.rollback();
        console.error('Erreur dans bulkCreateTeachers:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        throw error;
    } finally {
        connection.release();
    }
};

exports.updateTeacher = async (matricule, { nom, prenom, email, ID_faculte, ID_departement, assignedModules, assignedSections, moduleSessionTypes, assignedGroups, moduleSections }) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        // Validate foreign keys
        const [facultyRows] = await connection.query('SELECT ID_faculte FROM faculte WHERE ID_faculte = ?', [ID_faculte]);
        if (facultyRows.length === 0) {
            throw new Error(`Faculté avec ID ${ID_faculte} n'existe pas`);
        }
        const [deptRows] = await connection.query('SELECT ID_departement FROM Departement WHERE ID_departement = ?', [ID_departement]);
        if (deptRows.length === 0) {
            throw new Error(`Département avec ID ${ID_departement} n'existe pas`);
        }

        // Check for duplicate email (excluding current teacher)
        const [emailRows] = await connection.query('SELECT Matricule FROM User WHERE email = ? AND Matricule != ?', [email, matricule]);
        if (emailRows.length > 0) {
            throw new Error(`L'email ${email} est déjà utilisé`);
        }

        await connection.query(`
            UPDATE User 
            SET nom = ?, prenom = ?, email = ?
            WHERE Matricule = ?
        `, [nom, prenom, email, matricule]);

        await connection.query(`
            UPDATE enseignant 
            SET ID_faculte = ?, ID_departement = ?
            WHERE Matricule = ?
        `, [ID_faculte, ID_departement, matricule]);

        await connection.query(`
            DELETE FROM Module_Enseignant 
            WHERE Matricule = ?
        `, [matricule]);

        await connection.query(`
            DELETE FROM module_enseignant_groupe 
            WHERE Matricule = ?
        `, [matricule]);

        await connection.query(`
            DELETE FROM Enseignant_Section 
            WHERE Matricule = ?
        `, [matricule]);

        // Insert module and group assignments
        if (assignedModules && assignedModules.length > 0) {
            const moduleValues = assignedModules.map(moduleId => [
                matricule,
                moduleId,
                moduleSessionTypes[moduleId] || 'Cour'
            ]);
            await connection.query(`
                INSERT INTO Module_Enseignant (Matricule, ID_module, course_type)
                VALUES ?
            `, [moduleValues]);

            // Insert group assignments for TD/TP
            if (assignedGroups) {
                const groupValues = [];
                for (const moduleId of assignedModules) {
                    const courseType = moduleSessionTypes[moduleId] || 'Cour';
                    if (courseType.includes('TD') || courseType.includes('TP')) {
                        const groupsForModule = assignedGroups[moduleId] || {};
                        const tdGroups = groupsForModule.TD || [];
                        const tpGroups = groupsForModule.TP || [];

                        // Validate groups belong to assigned sections
                        const [validGroups] = await connection.query(`
                            SELECT g.ID_groupe
                            FROM groupe g
                            WHERE g.ID_section IN (?) AND g.ID_groupe IN (?)
                        `, [assignedSections, [...tdGroups, ...tpGroups]]);

                        const validGroupIds = new Set(validGroups.map(g => g.ID_groupe));

                        if (courseType.includes('TD')) {
                            for (const groupId of tdGroups) {
                                if (validGroupIds.has(groupId)) {
                                    groupValues.push([moduleId, matricule, 'TD', groupId]);
                                } else {
                                    throw new Error(`Groupe ${groupId} n'est pas valide pour le module ${moduleId} et l'enseignant ${nom} ${prenom}`);
                                }
                            }
                        }
                        if (courseType.includes('TP')) {
                            for (const groupId of tpGroups) {
                                if (validGroupIds.has(groupId)) {
                                    groupValues.push([moduleId, matricule, 'TP', groupId]);
                                } else {
                                    throw new Error(`Groupe ${groupId} n'est pas valide pour le module ${moduleId} et l'enseignant ${nom} ${prenom}`);
                                }
                            }
                        }
                    }
                }
                if (groupValues.length > 0) {
                    console.log(`Inserting group assignments for ${matricule}:`, groupValues);
                    await connection.query(`
                        INSERT INTO module_enseignant_groupe (ID_module, Matricule, course_type, ID_groupe)
                        VALUES ?
                    `, [groupValues]);
                }
            }
        }

        // Insert section assignments
        const allSectionIds = new Set();
        if (assignedSections && assignedSections.length > 0) {
            assignedSections.forEach(sectionId => allSectionIds.add(Number(sectionId)));
        }
        if (moduleSections) {
            Object.values(moduleSections).forEach(sectionId => {
                if (sectionId) allSectionIds.add(Number(sectionId));
            });
        }

        console.log(`All section IDs for Matricule ${matricule}:`, Array.from(allSectionIds));

        if (allSectionIds.size > 0) {
            const [validSections] = await connection.query(`
                SELECT ID_section FROM section WHERE ID_section IN (?)
            `, [Array.from(allSectionIds)]);
            const validSectionIds = new Set(validSections.map(row => row.ID_section));

            const sectionValues = Array.from(allSectionIds)
                .filter(sectionId => validSectionIds.has(sectionId))
                .map(sectionId => [matricule, sectionId]);

            console.log(`Section values to insert for Matricule ${matricule}:`, sectionValues);

            if (sectionValues.length > 0) {
                await connection.query(`
                    INSERT INTO Enseignant_Section (Matricule, ID_section)
                    VALUES ?
                `, [sectionValues]);
            } else {
                console.log(`No valid sections to insert for Matricule ${matricule}`);
            }
        } else {
            console.log(`No sections assigned for Matricule ${matricule}`);
        }

        await connection.commit();

        const [teacherRows] = await connection.query(`
            SELECT 
                u.Matricule, 
                u.nom, 
                u.prenom, 
                u.email, 
                u.motdepasse, 
                e.annee_inscription, 
                e.ID_faculte, 
                e.ID_departement,
                f.nom_faculte AS facultyName, 
                d.Nom_departement AS departmentName
            FROM User u
            JOIN enseignant e ON u.Matricule = e.Matricule
            LEFT JOIN faculte f ON e.ID_faculte = f.ID_faculte
            LEFT JOIN Departement d ON e.ID_departement = d.ID_departement
            WHERE u.Matricule = ?
        `, [matricule]);

        const [sectionRows] = await connection.query(`
            SELECT s.ID_section, s.nom_section, s.niveau, s.ID_specialite
            FROM Enseignant_Section es
            JOIN section s ON es.ID_section = s.ID_section
            WHERE es.Matricule = ?
        `, [matricule]);

        const [moduleRows] = await connection.query(`
            SELECT 
                m.ID_module, 
                m.nom_module, 
                me.course_type, 
                m.ID_specialite,
                s.ID_section, 
                s.nom_section, 
                s.niveau,
                sp.nom_specialite
            FROM Module_Enseignant me
            JOIN Module m ON me.ID_module = m.ID_module
            JOIN Enseignant_Section es ON es.Matricule = me.Matricule
            JOIN section s ON es.ID_section = s.ID_section
            JOIN specialite sp ON m.ID_specialite = sp.ID_specialite
            WHERE me.Matricule = ?
        `, [matricule]);

        const [groupRows] = await connection.query(`
            SELECT 
                meg.ID_module,
                meg.course_type,
                meg.ID_groupe,
                g.num_groupe,
                g.ID_section
            FROM module_enseignant_groupe meg
            JOIN groupe g ON meg.ID_groupe = g.ID_groupe
            WHERE meg.Matricule = ?
        `, [matricule]);

        return {
            matricule: teacherRows[0].Matricule,
            nom: teacherRows[0].nom,
            prenom: teacherRows[0].prenom,
            email: teacherRows[0].email,
            motdepasse: teacherRows[0].motdepasse,
            annee_inscription: teacherRows[0].annee_inscription,
            ID_faculte: teacherRows[0].ID_faculte,
            ID_departement: teacherRows[0].ID_departement,
            facultyName: teacherRows[0].facultyName || null,
            departmentName: teacherRows[0].departmentName || null,
            modules: moduleRows || [],
            sections: sectionRows || [],
            groups: groupRows || []
        };
    } catch (error) {
        await connection.rollback();
        console.error(`Error updating teacher ${matricule}:`, error);
        throw error;
    } finally {
        connection.release();
    }
};

exports.deleteTeacher = async (matricule) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(`
            DELETE FROM Module_Enseignant 
            WHERE Matricule = ?
        `, [matricule]);

        await connection.query(`
            DELETE FROM module_enseignant_groupe 
            WHERE Matricule = ?
        `, [matricule]);

        await connection.query(`
            DELETE FROM Enseignant_Section 
            WHERE Matricule = ?
        `, [matricule]);

        await connection.query(`
            DELETE FROM enseignant 
            WHERE Matricule = ?
        `, [matricule]);

        await connection.query(`
            DELETE FROM User 
            WHERE Matricule = ?
        `, [matricule]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
