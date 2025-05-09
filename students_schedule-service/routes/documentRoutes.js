import express from 'express';
import { getDocuments, createDocument, updateDocument, deleteDocument, getFaculties, uploadMiddleware ,getStudentFaculty } from '../controllers/documentController.js';


const router = express.Router();

router.get('/faculte/:faculteId', getDocuments);
router.post('/', uploadMiddleware, createDocument);
router.put('/:id', uploadMiddleware, updateDocument);
router.delete('/:id', deleteDocument);
router.get('/faculties', getFaculties);
router.get('/student/faculty', getStudentFaculty);

export default router;
