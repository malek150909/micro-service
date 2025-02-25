const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getUserByMatricule } = require('../services/users'); 

const router = express.Router();


router.post('/login', async (req, res) => {
    const { matricule, password } = req.body;

    try {
        
        const user = await getUserByMatricule(matricule);

        if (!user) {
            return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }

        
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Mot de passe incorrect' });
        }

        
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET,          
            { expiresIn: '1h' }                
        );

        res.json({ message: 'Connexion réussie', token });
    } catch (error) {
        res.status(500).json({ error: 'Erreur de connexion', details: error.message });
    }
});

module.exports = router;
