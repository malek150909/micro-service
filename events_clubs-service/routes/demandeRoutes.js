// club-evenement-service/backend/routes/demandeRoutes.js
const express = require('express');
const router = express.Router();
const demandeController = require('../Controllers/demandeETDController');

router.post('/creation', demandeController.createDemandeCreation);
router.post('/rejoindre', demandeController.createDemandeRejoindre);
router.get('/rejoindre/club/:clubId', demandeController.getDemandesRejoindre);
router.get('/creation', demandeController.getDemandesCreation);
router.put('/creation/accepter/:demandeId', demandeController.accepterDemandeCreation);
router.put('/creation/refuser/:demandeId', demandeController.refuserDemandeCreation);
router.put('/rejoindre/accepter/:demandeId', demandeController.accepterDemandeRejoindre);
router.put('/rejoindre/refuser/:demandeId', demandeController.refuserDemandeRejoindre);

module.exports = router;