const promisePool = require('../config/db');
const bcrypt = require('bcrypt');

// Get all faculties
exports.getFaculties = async () => {
    const [rows] = await promisePool.query('SELECT ID_faculte, nom_faculte FROM faculte');
    return rows;
};

// Get all departments
exports.getDepartments = async () => {
    const [rows] = await promisePool.query('SELECT ID_departement, Nom_departement, ID_faculte FROM Departement');
    return rows;
};

// Get all specialties
exports.getSpecialties = async () => {
    const [rows] = await promisePool.query('SELECT ID_specialite, nom_specialite, ID_departement, ID_faculte FROM specialite');
    return rows;
};

// Get all modules
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

// Get modules by sections and specialty
exports.getModulesBySectionsAndSpecialty = async (sectionIds, specialtyId) => {
    if (!sectionIds || sectionIds.length === 0 || !specialtyId) {
        return [];
    }
    const [rows] = await promisePool.query(`
        SELECT DISTINCT 
            m.ID_module, 
            m.nom_module, 
            m.ID_specialite
        FROM Module m
        JOIN module_section ms ON m.ID_module = ms.ID_module
        JOIN section s ON ms.ID_section = s.ID_section
        WHERE ms.ID_section IN (?) 
        AND m.ID_specialite = ?
    `, [sectionIds, specialtyId]);
    return rows;
};

// Get all sections
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

// Get all teachers
exports.getTeachers = async () => {
    const [rows] = await promisePool.query(`
        SELECT u.Matricule, u.nom, u.prenom, u.email, e.annee_inscription, e.ID_faculte, e.ID_departement
        FROM User u
        JOIN enseignant e ON u.Matricule = e.Matricule
    `);
    return rows;
};

// Get teacher details
exports.getTeacherDetails = async (matricule) => {
    const connection = await promisePool.getConnection();
    try {
        const [teacherRows] = await connection.query(`
            SELECT 
                u.Matricule, 
                u.nom, 
                u.prenom, 
                u.email, 
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
            SELECT m.ID_module, m.nom_module, me.course_type, m.ID_specialite
            FROM Module_Enseignant me
            JOIN Module m ON me.ID_module = m.ID_module
            WHERE me.Matricule = ?
        `, [matricule]);

        const [sectionRows] = await connection.query(`
            SELECT s.ID_section, s.nom_section, s.niveau, s.ID_specialite
            FROM Enseignant_Section es
            JOIN section s ON es.ID_section = s.ID_section
            WHERE es.Matricule = ?
        `, [matricule]);

        return {
            matricule: teacherRows[0].Matricule,
            nom: teacherRows[0].nom,
            prenom: teacherRows[0].prenom,
            email: teacherRows[0].email,
            annee_inscription: teacherRows[0].annee_inscription,
            ID_faculte: teacherRows[0].ID_faculte,
            ID_departement: teacherRows[0].ID_departement,
            facultyName: teacherRows[0].facultyName || null,
            departmentName: teacherRows[0].departmentName || null,
            modules: moduleRows || [],
            sections: sectionRows || [],
        };
    } finally {
        connection.release();
    }
};

// Create a new teacher
exports.createTeacher = async ({ matricule, nom, prenom, email, motdepasse, annee_inscription, ID_faculte, ID_departement, assignedSections }) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        // Insert into User table
        await connection.query(`
            INSERT INTO User (Matricule, nom, prenom, email, motdepasse, Created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `, [matricule, nom, prenom, email, motdepasse]);

        // Insert into enseignant table
        await connection.query(`
            INSERT INTO enseignant (Matricule, annee_inscription, ID_faculte, ID_departement)
            VALUES (?, ?, ?, ?)
        `, [matricule, annee_inscription, ID_faculte, ID_departement]);

        // Insert section assignments into Enseignant_Section
        if (assignedSections && assignedSections.length > 0) {
            const sectionValues = assignedSections.map(sectionId => [matricule, sectionId]);
            await connection.query(`
                INSERT INTO Enseignant_Section (Matricule, ID_section)
                VALUES ?
            `, [sectionValues]);
        }

        await connection.commit();

        // Fetch created teacher details to return consistent data
        const [teacherRows] = await connection.query(`
            SELECT 
                u.Matricule, 
                u.nom, 
                u.prenom, 
                u.email, 
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
            SELECT m.ID_module, m.nom_module, me.course_type, m.ID_specialite
            FROM Module_Enseignant me
            JOIN Module m ON me.ID_module = m.ID_module
            WHERE me.Matricule = ?
        `, [matricule]);

        return {
            matricule: teacherRows[0].Matricule,
            nom: teacherRows[0].nom,
            prenom: teacherRows[0].prenom,
            email: teacherRows[0].email,
            annee_inscription: teacherRows[0].annee_inscription,
            ID_faculte: teacherRows[0].ID_faculte,
            ID_departement: teacherRows[0].ID_departement,
            facultyName: teacherRows[0].facultyName || null,
            departmentName: teacherRows[0].departmentName || null,
            modules: moduleRows || [],
            sections: sectionRows || [],
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Bulk create teachers
exports.bulkCreateTeachers = async (teachers) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        const createdTeachers = [];
        let count = 0;

        for (const teacher of teachers) {
            const { nom, prenom, email, motdepasse, annee_inscription, ID_faculte, ID_departement, assignedSections } = teacher;
            if (!nom || !prenom || !email || !motdepasse || !annee_inscription || !ID_faculte || !ID_departement) {
                console.warn(`Enseignant ignoré : champs manquants`, teacher);
                continue;
            }

            const matricule = Date.now() + count; // Ensure unique matricule
            const hashedPassword = await bcrypt.hash(motdepasse, 10);

            try {
                // Insert into User table
                await connection.query(`
                    INSERT INTO User (Matricule, nom, prenom, email, motdepasse, Created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [matricule, nom, prenom, email, hashedPassword]);

                // Insert into enseignant table
                await connection.query(`
                    INSERT INTO enseignant (Matricule, annee_inscription, ID_faculte, ID_departement)
                    VALUES (?, ?, ?, ?)
                `, [matricule, annee_inscription, ID_faculte, ID_departement]);

                // Insert section assignments
                if (assignedSections && assignedSections.length > 0) {
                    const sectionValues = assignedSections.map(sectionId => [matricule, sectionId]);
                    await connection.query(`
                        INSERT INTO Enseignant_Section (Matricule, ID_section)
                        VALUES ?
                    `, [sectionValues]);
                }

                // Fetch created teacher details
                const [teacherRows] = await connection.query(`
                    SELECT 
                        u.Matricule, 
                        u.nom, 
                        u.prenom, 
                        u.email, 
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
                    SELECT m.ID_module, m.nom_module, me.course_type, m.ID_specialite
                    FROM Module_Enseignant me
                    JOIN Module m ON me.ID_module = m.ID_module
                    WHERE me.Matricule = ?
                `, [matricule]);

                createdTeachers.push({
                    matricule: teacherRows[0].Matricule,
                    nom: teacherRows[0].nom,
                    prenom: teacherRows[0].prenom,
                    email: teacherRows[0].email,
                    annee_inscription: teacherRows[0].annee_inscription,
                    ID_faculte: teacherRows[0].ID_faculte,
                    ID_departement: teacherRows[0].ID_departement,
                    facultyName: teacherRows[0].facultyName || null,
                    departmentName: teacherRows[0].departmentName || null,
                    modules: moduleRows || [],
                    sections: sectionRows || [],
                });

                count++;
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    console.warn(`Email déjà utilisé, enseignant ignoré: ${email}`);
                    continue;
                }
                throw error; // Rethrow other errors
            }
        }

        await connection.commit();
        return { count, teachers: createdTeachers };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Update a teacher
exports.updateTeacher = async (matricule, { nom, prenom, email, ID_faculte, ID_departement, assignedModules, assignedSections }) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();

        // Update User table
        await connection.query(`
            UPDATE User
            SET nom = ?, prenom = ?, email = ?
            WHERE Matricule = ?
        `, [nom, prenom, email, matricule]);

        // Update enseignant table
        await connection.query(`
            UPDATE enseignant
            SET ID_faculte = ?, ID_departement = ?
            WHERE Matricule = ?
        `, [ID_faculte, ID_departement, matricule]);

        // Delete existing module assignments
        await connection.query(`
            DELETE FROM Module_Enseignant WHERE Matricule = ?
        `, [matricule]);

        // Insert new module assignments
        if (assignedModules && assignedModules.length > 0) {
            const moduleValues = assignedModules.map(moduleId => [moduleId, matricule, 'Cour', null]);
            await connection.query(`
                INSERT INTO Module_Enseignant (ID_module, Matricule, course_type, group_number)
                VALUES ?
            `, [moduleValues]);
        }

        // Delete existing section assignments
        await connection.query(`
            DELETE FROM Enseignant_Section WHERE Matricule = ?
        `, [matricule]);

        // Insert new section assignments
        if (assignedSections && assignedSections.length > 0) {
            const sectionValues = assignedSections.map(sectionId => [matricule, sectionId]);
            await connection.query(`
                INSERT INTO Enseignant_Section (Matricule, ID_section)
                VALUES ?
            `, [sectionValues]);
        }

        await connection.commit();

        // Fetch updated teacher details
        const [teacherRows] = await connection.query(`
            SELECT 
                u.Matricule, 
                u.nom, 
                u.prenom, 
                u.email, 
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
            SELECT m.ID_module, m.nom_module, me.course_type, m.ID_specialite
            FROM Module_Enseignant me
            JOIN Module m ON me.ID_module = m.ID_module
            WHERE me.Matricule = ?
        `, [matricule]);

        const [sectionRows] = await connection.query(`
            SELECT s.ID_section, s.nom_section, s.niveau, s.ID_specialite
            FROM Enseignant_Section es
            JOIN section s ON es.ID_section = s.ID_section
            WHERE es.Matricule = ?
        `, [matricule]);

        return {
            matricule: teacherRows[0].Matricule,
            nom: teacherRows[0].nom,
            prenom: teacherRows[0].prenom,
            email: teacherRows[0].email,
            annee_inscription: teacherRows[0].annee_inscription,
            ID_faculte: teacherRows[0].ID_faculte,
            ID_departement: teacherRows[0].ID_departement,
            facultyName: teacherRows[0].facultyName || null,
            departmentName: teacherRows[0].departmentName || null,
            modules: moduleRows || [],
            sections: sectionRows || [],
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Delete a teacher
exports.deleteTeacher = async (matricule) => {
    await promisePool.query('DELETE FROM User WHERE Matricule = ?', [matricule]);
    // Foreign keys with ON DELETE CASCADE handle related records in enseignant and Module_Enseignant
};
