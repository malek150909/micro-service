const express = require('express');
const router = express.Router();
const publicationController = require('../Controllers/publicationETDController');

// Routes pour les publications
router.post('/', publicationController.createPublication); // Créer une publication
router.get('/club/:clubId', publicationController.getPublicationsByClub); // Récupérer les publications d'un club
router.post('/:id/like', publicationController.addLike); // Ajouter ou retirer un like
router.post('/:id/comment', publicationController.addComment); // Ajouter un commentaire
router.delete('/:publicationId', publicationController.deletePublication); // Supprimer une publication
router.put('/:publicationId', publicationController.updatePublication); // Mettre à jour une publication

module.exports = router;