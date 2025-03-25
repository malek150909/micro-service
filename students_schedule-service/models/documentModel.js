import pool from '../config/db.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Définir __dirname pour les modules ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DocumentModel = {
    getAllDocuments: async (faculteId) => {
        try {
            const [documents] = await pool.query('SELECT * FROM Documents WHERE ID_faculte = ?', [faculteId]);
            return documents;
        } catch (error) {
            console.error('Error in getAllDocuments:', error);
            throw error;
        }
    },

    createDocument: async (documentData) => {
        const { ID_faculte, titre, description, fichier_url } = documentData;
        const [existing] = await pool.query('SELECT * FROM Documents WHERE ID_faculte = ? AND titre = ?', [ID_faculte, titre]);
        if (existing.length > 0) throw new Error('Un document portant ce nom existe déjà dans cette faculté.');
        const [result] = await pool.query(
            'INSERT INTO Documents (ID_faculte, titre, description, fichier_url, date_upload) VALUES (?, ?, ?, ?, NOW())',
            [ID_faculte, titre, description, fichier_url]
        );
        return result.insertId;
    },

    updateDocument: async (documentId, documentData) => {
        const { ID_faculte, titre, description, fichier_url } = documentData;
        const [existing] = await pool.query('SELECT * FROM Documents WHERE ID_faculte = ? AND titre = ? AND ID_document != ?', [ID_faculte, titre, documentId]);
        if (existing.length > 0) throw new Error('Un document portant ce nom existe déjà dans cette faculté.');
        await pool.query(
            'UPDATE Documents SET ID_faculte = ?, titre = ?, description = ?, fichier_url = ? WHERE ID_document = ?',
            [ID_faculte, titre, description, fichier_url, documentId]
        );
    },

    deleteDocument: async (documentId) => {
        try {
            const [documents] = await pool.query('SELECT fichier_url FROM Documents WHERE ID_document = ?', [documentId]);
            if (documents.length === 0) throw new Error('Document not found');

            const fichier_url = documents[0].fichier_url;
            if (fichier_url) {
                const filename = fichier_url.replace('/uploads/', '');
                const filePath = path.join(__dirname, '..', 'uploads', filename);
                console.log('Attempting to delete file at:', filePath); // Log pour débogage
                try {
                    await fs.unlink(filePath);
                } catch (fileError) {
                    if (fileError.code !== 'ENOENT') throw new Error('Failed to delete file from uploads folder');
                    console.log('File not found on disk, proceeding with DB deletion');
                }
            }

            const [result] = await pool.query('DELETE FROM Documents WHERE ID_document = ?', [documentId]);
            if (result.affectedRows === 0) throw new Error('Document not found or already deleted');
        } catch (error) {
            console.error('Error in deleteDocument:', error);
            throw error;
        }
    }
};

export default DocumentModel;