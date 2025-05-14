
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const authMiddleware = require('../middleware/auth');

// Get all faculties
router.get('/faculties', authMiddleware, teacherController.getFaculties);

// Get all departments
router.get('/departments', authMiddleware, teacherController.getDepartments);

// Get all specialties
router.get('/specialties', authMiddleware, teacherController.getSpecialties);

// Get all modules
router.get('/modules', authMiddleware, teacherController.getModules);

// Get modules by sections and specialty
router.post('/modules/by-sections-specialty', authMiddleware, teacherController.getModulesBySectionsAndSpecialty);

// Get all sections
router.get('/sections', authMiddleware, teacherController.getSections);

// Get all groups
router.get('/groups', authMiddleware, teacherController.getGroups);

// Get all teachers
router.get('/teachers', authMiddleware, teacherController.getTeachers);

// Get teacher details
router.get('/teachers/:matricule', authMiddleware, teacherController.getTeacherDetails);

// Create a new teacher (admin-only)
router.post('/teachers', authMiddleware, teacherController.createTeacher);

// Bulk create teachers (admin-only)
router.post('/teachers/bulk', authMiddleware, teacherController.bulkCreateTeachers);

// Update a teacher (admin-only)
router.put('/teachers/:matricule', authMiddleware, teacherController.updateTeacher);

// Delete a teacher (admin-only)
router.delete('/teachers/:matricule', authMiddleware, teacherController.deleteTeacher);

module.exports = router;
