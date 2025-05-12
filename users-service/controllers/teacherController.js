const teacherModel = require('../models/teacherModel');
// Removed bcrypt import
// const bcrypt = require('bcrypt');

// Get all faculties
exports.getFaculties = async (req, res) => {
    try {
        const faculties = await teacherModel.getFaculties();
        res.json(faculties);
    } catch (error) {
        console.error('Erreur lors de la récupération des facultés:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Get all departments
exports.getDepartments = async (req, res) => {
    try {
        const departments = await teacherModel.getDepartments();
        res.json(departments);
    } catch (error) {
        console.error('Erreur lors de la récupération des départements:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Get all specialties
exports.getSpecialties = async (req, res) => {
    try {
        const specialties = await teacherModel.getSpecialties();
        res.json(specialties);
    } catch (error) {
        console.error('Erreur lors de la récupération des spécialités:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Get all modules
exports.getModules = async (req, res) => {
    try {
        const modules = await teacherModel.getModules();
        res.json(modules);
    } catch (error) {
        console.error('Erreur lors de la récupération des modules:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Get modules by sections and specialty
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

// Get all sections
exports.getSections = async (req, res) => {
    try {
        const sections = await teacherModel.getSections();
        res.json(sections);
    } catch (error) {
        console.error('Erreur lors de la récupération des sections:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Get all teachers
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await teacherModel.getTeachers();
        res.json(teachers);
    } catch (error) {
        console.error('Erreur lors de la récupération des enseignants:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

// Get teacher details
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

// Create a new teacher (admin-only)
exports.createTeacher = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { nom, prenom, email, motdepasse, annee_inscription, ID_faculte, ID_departement, assignedSections } = req.body;
    if (!nom || !prenom || !email || !motdepasse || !annee_inscription || !ID_faculte || !ID_departement) {
        return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }
    try {
        const matricule = String(Date.now());
        console.log('Creating teacher with matricule:', matricule);
        const teacher = await teacherModel.createTeacher({
            matricule,
            nom,
            prenom,
            email,
            motdepasse, // Pass plain-text password
            annee_inscription,
            ID_faculte,
            ID_departement,
            assignedSections,
        });
        console.log('Teacher created:', teacher);
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

// Bulk create teachers (admin-only)
exports.bulkCreateTeachers = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { teachers } = req.body;
    if (!Array.isArray(teachers) || teachers.length === 0) {
        return res.status(400).json({ error: 'Liste d\'enseignants invalide ou vide' });
    }
    try {
        const result = await teacherModel.bulkCreateTeachers(teachers);
        res.status(201).json({ count: result.count, teachers: result.teachers });
    } catch (error) {
        console.error('Erreur lors de l\'importation des enseignants:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Un ou plusieurs emails sont déjà utilisés' });
        } else {
            res.status(500).json({ error: 'Erreur serveur' });
        }
    }
};

// Update a teacher (admin-only)
exports.updateTeacher = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé : administrateur requis' });
    }
    const { matricule } = req.params;
    const { nom, prenom, email, ID_faculte, ID_departement, assignedModules, assignedSections, moduleSessionTypes } = req.body;
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

// Delete a teacher (admin-only)
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
