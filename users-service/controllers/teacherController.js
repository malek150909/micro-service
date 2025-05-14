
const teacherModel = require('../models/teacherModel');

exports.getFaculties = async (req, res) => {
    try {
        const faculties = await teacherModel.getFaculties();
        res.json(faculties);
    } catch (error) {
        console.error('Erreur lors de la récupération des facultés:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const departments = await teacherModel.getDepartments();
        res.json(departments);
    } catch (error) {
        console.error('Erreur lors de la récupération des départements:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getSpecialties = async (req, res) => {
    try {
        const specialties = await teacherModel.getSpecialties();
        res.json(specialties);
    } catch (error) {
        console.error('Erreur lors de la récupération des spécialités:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getModules = async (req, res) => {
    try {
        const modules = await teacherModel.getModules();
        res.json(modules);
    } catch (error) {
        console.error('Erreur lors de la récupération des modules:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getModulesBySectionsAndSpecialty = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { sectionIds, specialtyId } = req.body;
    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0 || !specialtyId) {
        return res.status(400).json({ error: 'Section IDs et ID de spécialité requis' });
    }
    try {
        const modules = await teacherModel.getModulesBySectionsAndSpecialty(sectionIds, specialtyId);
        res.json(modules);
    } catch (error) {
        console.error('Erreur lors de la récupération des modules par sections et spécialité:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getSections = async (req, res) => {
    try {
        const sections = await teacherModel.getSections();
        res.json(sections);
    } catch (error) {
        console.error('Erreur lors de la récupération des sections:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getGroups = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { sectionIds } = req.query;
    if (!sectionIds) {
        return res.status(400).json({ error: 'sectionIds parameter is required' });
    }
    try {
        const sectionIdArray = sectionIds.split(',').map(Number).filter(id => !isNaN(id));
        if (sectionIdArray.length === 0) {
            return res.status(400).json({ error: 'Invalid sectionIds format' });
        }
        const groups = await teacherModel.getGroupsBySections(sectionIdArray);
        res.json(groups);
    } catch (error) {
        console.error('Erreur lors de la récupération des groupes:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getTeachers = async (req, res) => {
    try {
        const teachers = await teacherModel.getTeachers();
        res.json(teachers);
    } catch (error) {
        console.error('Erreur lors de la récupération des enseignants:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.getTeacherDetails = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { matricule } = req.params;
    try {
        const teacher = await teacherModel.getTeacherDetails(String(matricule));
        if (!teacher) {
            return res.status(404).json({ error: 'Enseignant non trouvé' });
        }
        res.json(teacher);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'enseignant:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

exports.createTeacher = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { nom, prenom, email, motdepasse, annee_inscription, ID_faculte, ID_departement, assignedSections, assignedModules, moduleSessionTypes, assignedGroups } = req.body;
    if (!nom || !prenom || !email || !motdepasse || !annee_inscription || !ID_faculte || !ID_departement) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }
    try {
        const matricule = String(Date.now());
        const teacher = await teacherModel.createTeacher({
            matricule,
            nom,
            prenom,
            email,
            motdepasse,
            annee_inscription,
            ID_faculte,
            ID_departement,
            assignedSections,
            assignedModules,
            moduleSessionTypes,
            assignedGroups,
        });
        res.status(201).json(teacher);
    } catch (error) {
        console.error('Erreur lors de la création de l\'enseignant:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Cet email est déjà utilisé' });
        } else {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};

exports.bulkCreateTeachers = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { teachers } = req.body;
    if (!Array.isArray(teachers) || teachers.length === 0) {
        return res.status(400).json({ error: 'Liste d\'enseignants invalide ou vide' });
    }

    // Validate teacher data
    for (const teacher of teachers) {
        const { nom, prenom, email, motdepasse, annee_inscription, ID_faculte, ID_departement } = teacher;
        if (!nom || !prenom || !email || !motdepasse || !annee_inscription || !ID_faculte || !ID_departement) {
            return res.status(400).json({ error: `Données incomplètes pour l'enseignant: ${nom || 'inconnu'} ${prenom || ''}` });
        }
        if (isNaN(Number(ID_faculte)) || isNaN(Number(ID_departement))) {
            return res.status(400).json({ error: `ID_faculte ou ID_departement invalide pour l'enseignant: ${nom} ${prenom}` });
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: `Email invalide pour l'enseignant: ${nom} ${prenom}` });
        }
        // Validate annee_inscription format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(annee_inscription)) {
            return res.status(400).json({ error: `Format de date invalide pour l'enseignant: ${nom} ${prenom}` });
        }
    }

    try {
        // Validate faculty and department IDs exist
        const facultyIds = [...new Set(teachers.map(t => Number(t.ID_faculte)))];
        const departmentIds = [...new Set(teachers.map(t => Number(t.ID_departement)))];
        const validFaculties = await teacherModel.getFaculties();
        const validDepartments = await teacherModel.getDepartments();

        const invalidFaculty = facultyIds.find(id => !validFaculties.some(f => f.ID_faculte === id));
        if (invalidFaculty) {
            return res.status(400).json({ error: `ID_faculte invalide: ${invalidFaculty}` });
        }
        const invalidDepartment = departmentIds.find(id => !validDepartments.some(d => d.ID_departement === id));
        if (invalidDepartment) {
            return res.status(400).json({ error: `ID_departement invalide: ${invalidDepartment}` });
        }

        const result = await teacherModel.bulkCreateTeachers(teachers);
        res.status(201).json({ count: result.count, teachers: result.teachers });
    } catch (error) {
        console.error('Erreur lors de l\'importation des enseignants:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sql: error.sql
        });
        if (error.code === 'ER_DUP_ENTRY') {
            const emailMatch = error.sqlMessage?.match(/'([^']+)'/)?.[1];
            res.status(400).json({ error: `Email déjà utilisé: ${emailMatch || 'inconnu'}` });
        } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            res.status(400).json({ error: 'Faculté ou département référencé non trouvé' });
        } else {
            res.status(500).json({ error: `Erreur serveur: ${error.message}` });
        }
    }
};

exports.updateTeacher = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { matricule } = req.params;
    const { nom, prenom, email, ID_faculte, ID_departement, assignedModules, assignedSections, moduleSessionTypes, assignedGroups } = req.body;
    if (!nom || !prenom || !email || !ID_faculte || !ID_departement) {
        return res.status(400).json({ error: 'Nom, prénom, email, faculté et département sont requis' });
    }
    try {
        const teacher = await teacherModel.updateTeacher(String(matricule), {
            nom,
            prenom,
            email,
            ID_faculte,
            ID_departement,
            assignedModules,
            assignedSections,
            moduleSessionTypes,
            assignedGroups,
        });
        if (!teacher) {
            return res.status(404).json({ error: 'Enseignant non trouvé' });
        }
        res.json(teacher);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'enseignant:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Cet email est déjà utilisé' });
        } else {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};

exports.deleteTeacher = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { matricule } = req.params;
    try {
        await teacherModel.deleteTeacher(String(matricule));
        res.json({ message: 'Enseignant supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'enseignant:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};
