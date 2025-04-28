import express from 'express';
import jwt from 'jsonwebtoken';
import {
    getCalendarEvents,
    addPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
    
} from '../controllers/calendarController.js';

const router = express.Router();

// Middleware pour vérifier l'authentification
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { matricule: decoded.matricule };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

// Routes pour le calendrier
router.get('/:date', authMiddleware, (req, res) => {
    const { date } = req.params;
    req.params.startDate = date;
    req.params.endDate = date;
    getCalendarEvents(req, res);
}); // Récupérer les événements pour une seule date
router.get('/:startDate/:endDate', authMiddleware, getCalendarEvents); // Récupérer les événements pour une plage de dates
router.post('/event', authMiddleware, addPersonalEvent);
router.put('/event/:id', authMiddleware, updatePersonalEvent);
router.delete('/event/:id', authMiddleware, deletePersonalEvent);


export default router;