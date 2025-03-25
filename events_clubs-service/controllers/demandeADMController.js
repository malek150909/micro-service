// backend/controllers/demandeController.js
const pool = require('../config/db');

// Récupérer uniquement les demandes en attente
const getAllDemandes = async (req, res) => {
  try {
    console.log('Requête reçue pour getAllDemandes');
    const [demandes] = await pool.query(`
      SELECT d.*, u.nom AS etudiant_nom, u.prenom AS etudiant_prenom
      FROM DemandeCreationClub d
      LEFT JOIN User u ON d.matricule_etudiant = u.Matricule
      WHERE d.etat = 'en_attente'
    `);
    console.log('Demandes récupérées:', demandes);
    res.json(demandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes: ' + error.message });
  }
};

// Accepter une demande
const accepterDemande = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('Requête reçue pour accepterDemande:', id);

    const [demandes] = await pool.query(
      'SELECT * FROM DemandeCreationClub WHERE ID_demande = ?',
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const demande = demandes[0];
    console.log('Demande récupérée:', demande);

    const [result] = await pool.query(
      'INSERT INTO Club (nom, description_club, gerant_matricule) VALUES (?, ?, ?)',
      [demande.nom_club, demande.description_club, demande.matricule_etudiant]
    );

    console.log('Club créé avec ID:', result.insertId);

    await pool.query(
      'UPDATE DemandeCreationClub SET etat = "acceptee" WHERE ID_demande = ?',
      [id]
    );

    const message = `Votre demande de création du club "${demande.nom_club}" a été acceptée.`;
    await pool.query(
      'INSERT INTO Notification (contenu, expediteur, destinataire) VALUES (?, ?, ?)',
      [message, null, demande.matricule_etudiant]
    );

    res.json({ message: 'Demande acceptée et club créé avec succès', clubId: result.insertId });
  } catch (error) {
    console.error('Erreur lors de l’acceptation de la demande:', error);
    res.status(500).json({ error: 'Erreur lors de l’acceptation de la demande: ' + error.message });
  }
};

// Refuser une demande
const refuserDemande = async (req, res) => {
  const { id } = req.params;

  try {
    console.log('Requête reçue pour refuserDemande:', id);

    const [demandes] = await pool.query(
      'SELECT * FROM DemandeCreationClub WHERE ID_demande = ?',
      [id]
    );

    if (demandes.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const demande = demandes[0];

    await pool.query(
      'UPDATE DemandeCreationClub SET etat = "refusee" WHERE ID_demande = ?',
      [id]
    );

    const message = `Votre demande de création du club "${demande.nom_club}" a été refusée.`;
    await pool.query(
      'INSERT INTO Notification (contenu, expediteur, destinataire) VALUES (?, ?, ?)',
      [message, null, demande.matricule_etudiant]
    );

    res.json({ message: 'Demande refusée avec succès' });
  } catch (error) {
    console.error('Erreur lors du refus de la demande:', error);
    res.status(500).json({ error: 'Erreur lors du refus de la demande: ' + error.message });
  }
};

// Créer une demande (pour les étudiants)
const createDemande = async (req, res) => {
  const { matricule_etudiant, nom_club, description_club } = req.body;

  try {
    console.log('Requête reçue pour createDemande:', { matricule_etudiant, nom_club, description_club });

    const [result] = await pool.query(
      'INSERT INTO DemandeCreationClub (matricule_etudiant, nom_club, description_club, etat) VALUES (?, ?, ?, ?)',
      [matricule_etudiant, nom_club, description_club, 'en_attente']
    );

    console.log('Demande créée avec ID:', result.insertId);
    res.status(201).json({ message: 'Demande envoyée avec succès', demandeId: result.insertId });
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la demande: ' + error.message });
  }
};

module.exports = {
  getAllDemandes,
  accepterDemande,
  refuserDemande,
  createDemande,
};