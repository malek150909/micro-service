// backend/routes/calendar.js
import express from 'express';
import {
    getCalendarEvents,
    addPersonalEvent,
    updatePersonalEvent,
    deletePersonalEvent,
    deleteSupplementarySession,
    deleteClubEvent,
} from '../controllers/calendarController.js';

const router = express.Router();

// Routes pour le calendrier
router.get('/:date', (req, res) => {
    const { date } = req.params;
    req.params.startDate = date;
    req.params.endDate = date;
    getCalendarEvents(req, res);
}); // Récupérer les événements pour une seule date
router.get('/:startDate/:endDate',  getCalendarEvents); // Récupérer les événements pour une plage de dates
router.post('/event',  addPersonalEvent);
router.put('/event/:id',  updatePersonalEvent);
router.delete('/event/:id',  deletePersonalEvent);
router.delete('/supp-session/:id',  deleteSupplementarySession);
router.delete('/club-event/:id',  deleteClubEvent);

export default router;