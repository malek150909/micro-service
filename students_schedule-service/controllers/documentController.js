import DocumentModel from '../models/documentModel.js';
import multer from 'multer';
import path from 'path';
import pool from '../config/db.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`)
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => file.mimetype === 'application/pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'), false)
}).single('file');

export const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
};

export const getDocuments = async (req, res) => {
    try {
        const faculteId = Number(req.params.faculteId);
        if (isNaN(faculteId)) return res.status(400).json({ message: 'Invalid faculteId' });
        const documents = await DocumentModel.getAllDocuments(faculteId);
        res.json(documents);
    } catch (error) {
        console.error('Error in getDocuments:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createDocument = async (req, res) => {
    try {
        const { ID_faculte, titre, description } = req.body;
        const fichier_url = req.file ? `/uploads/${req.file.filename}` : null;
        if (!ID_faculte || !titre || !fichier_url) return res.status(400).json({ message: 'ID_faculte, titre, and file are required' });
        const documentData = { ID_faculte, titre, description, fichier_url };
        const documentId = await DocumentModel.createDocument(documentData);
        res.status(201).json({ id: documentId, message: 'Document created' });
    } catch (error) {
        console.error('Error in createDocument:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getFaculties = async (req, res) => {
    try {
        const [faculties] = await pool.query('SELECT * FROM faculte');
        res.json(faculties);
    } catch (error) {
        console.error('Error in getFaculties:', error);
        res.status(500).json({ error: error.message });
    }
};

export const updateDocument = async (req, res) => {
    try {
        const documentId = Number(req.params.id);
        const { ID_faculte, titre, description } = req.body;
        const fichier_url = req.file ? `/uploads/${req.file.filename}` : req.body.fichier_url;
        if (isNaN(documentId)) return res.status(400).json({ message: 'Invalid document ID' });
        if (!ID_faculte || !titre) return res.status(400).json({ message: 'ID_faculte and titre are required' });
        const documentData = { ID_faculte, titre, description, fichier_url };
        await DocumentModel.updateDocument(documentId, documentData);
        res.json({ message: 'Document updated' });
    } catch (error) {
        console.error('Error in updateDocument:', error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const documentId = Number(req.params.id);
        if (isNaN(documentId)) return res.status(400).json({ message: 'Invalid document ID' });
        await DocumentModel.deleteDocument(documentId);
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error in deleteDocument:', error);
        if (error.message === 'Document not found') return res.status(404).json({ error: 'Document not found' });
        res.status(500).json({ error: error.message });
    }
};

// Nouvelle fonction pour récupérer ID_faculte
export const getStudentFaculty = async (req, res) => {
    try {
        console.log('Received request to /documents/student/faculty');
        const matricule = Number(req.headers.matricule);
        console.log('Matricule from headers:', matricule);
        if (!matricule || isNaN(matricule)) {
            return res.status(400).json({ message: 'Matricule is required and must be a number' });
        }

        const [student] = await pool.query(
            'SELECT e.*, s.ID_faculte FROM Etudiant e JOIN specialite s ON e.ID_specialite = s.ID_specialite WHERE e.Matricule = ?',
            [matricule]
        );
        console.log('Student data:', student);

        if (student.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ ID_faculte: student[0].ID_faculte });
    } catch (error) {
        console.error('Error in getStudentFaculty:', error);
        res.status(500).json({ error: error.message });
    }
};