// Import Express to create a router
import express from 'express';
// Import the studentController to handle route logic
import studentController from '../controllers/ETDressourcesController.js';

// Create a new router instance
const router = express.Router();

// Define the POST route for student login
router.post('/login', studentController.login);
// Define the GET route to fetch modules for a semester
router.get('/modules', studentController.getModules);
// Define the GET route to fetch resources for a module and type
router.get('/resources', studentController.getResources);

// Export the router for use in the main server file
export default router;