const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();


router.get('/', async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs', details: error.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const [user] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(user[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération de l’utilisateur', details: error.message });
    }
});


router.post('/', async (req, res) => {
    const { nom, prenom, matricule, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10); 
        const [result] = await db.query(
            'INSERT INTO users (nom, prenom, matricule, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [nom, prenom, matricule, email, hashedPassword, role]
        );
        res.status(201).json({ message: 'Utilisateur ajouté', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de l’ajout de l’utilisateur', details: error.message });
    }
});


router.put('/:id', async (req, res) => {
    const { nom, prenom, matricule, email, password, role } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE users SET nom=?, prenom=?, matricule=?, email=?, password=?, role=? WHERE id=?',
            [nom, prenom, matricule, email, password, role, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json({ message: 'Utilisateur mis à jour' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour', details: error.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression', details: error.message });
    }
});

module.exports = router;
