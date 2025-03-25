// club-evenement-service/backend/controllers/demandeController.js
const pool = require('../config/db');
const { createNotification } = require('./notificationETDController'); // Importer la fonction de création de notification

// Créer une demande de création de club
const createDemandeCreation = async (req, res) => {
  console.log('Requête brute reçue:', req.body);

  const { matricule_etudiant, nom_club, description_club } = req.body;

  if (!matricule_etudiant || !nom_club) {
    return res.status(400).json({ error: 'Les champs matricule_etudiant et nom_club sont requis' });
  }

  try {
    console.log('Requête reçue pour createDemandeCreation:', { matricule_etudiant, nom_club, description_club });
    const [result] = await pool.query(
      'INSERT INTO DemandeCreationClub (matricule_etudiant, nom_club, description_club) VALUES (?, ?, ?)',
      [matricule_etudiant, nom_club, description_club || null]
    );

    res.status(201).json({ message: 'Demande de création envoyée avec succès', demandeId: result.insertId });
  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'La table DemandeCreationClub n’existe pas dans la base de données' });
    } else if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Une demande pour ce club existe déjà' });
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({ error: 'Erreur d’accès à la base de données: identifiants incorrects' });
    }
    res.status(500).json({ error: 'Erreur lors de la création de la demande' });
  }
};

// Créer une demande pour rejoindre un club
const createDemandeRejoindre = async (req, res) => {
  const { matricule_etudiant, clubId } = req.body;

  if (!matricule_etudiant || !clubId) {
    return res.status(400).json({ error: 'Les champs matricule_etudiant et clubId sont requis' });
  }

  try {
    const [existingDemande] = await pool.query(
      'SELECT * FROM DemandeRejoindreClub WHERE matricule_etudiant = ? AND ID_club = ? AND etat = ?',
      [matricule_etudiant, clubId, 'en_attente']
    );

    if (existingDemande.length > 0) {
      return res.status(400).json({ error: 'Vous avez déjà une demande en attente pour ce club' });
    }

    const [result] = await pool.query(
      'INSERT INTO DemandeRejoindreClub (matricule_etudiant, ID_club, etat, date_demande) VALUES (?, ?, ?, NOW())',
      [matricule_etudiant, clubId, 'en_attente']
    );

    res.json({ message: 'Demande pour rejoindre le club envoyée avec succès', demandeId: result.insertId });
  } catch (error) {
    console.error('Erreur lors de la création de la demande de rejoindre:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la demande de rejoindre' });
  }
};

// Récupérer les demandes pour rejoindre un club
const getDemandesRejoindre = async (req, res) => {
  const { clubId } = req.params;

  try {
    const [demandes] = await pool.query(
      `
      SELECT d.ID_demande, d.matricule_etudiant, d.etat, d.date_demande, u.nom, u.prenom
      FROM DemandeRejoindreClub d
      JOIN User u ON d.matricule_etudiant = u.Matricule
      WHERE d.ID_club = ? AND d.etat = ?
    `,
      [clubId, 'en_attente']
    );

    res.json(demandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
};

// Récupérer toutes les demandes de création de club en attente
const getDemandesCreation = async (req, res) => {
  try {
    const [demandes] = await pool.query(
      `
      SELECT d.ID_demande, d.matricule_etudiant, d.nom_club, d.description_club, d.date_demande, u.nom, u.prenom
      FROM DemandeCreationClub d
      JOIN User u ON d.matricule_etudiant = u.Matricule
      WHERE d.etat = ?
    `,
      ['en_attente']
    );
    res.json(demandes);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de création:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes de création' });
  }
};

// Accepter une demande de création de club
const accepterDemandeCreation = async (req, res) => {
  const { demandeId } = req.params;

  try {
    const [demande] = await pool.query(
      'SELECT * FROM DemandeCreationClub WHERE ID_demande = ? AND etat = ?',
      [demandeId, 'en_attente']
    );

    if (demande.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée ou déjà traitée' });
    }

    const { matricule_etudiant, nom_club, description_club } = demande[0];

    // Créer le club
    await pool.query(
      'INSERT INTO Club (nom, description_club, gerant_matricule) VALUES (?, ?, ?)',
      [nom_club, description_club, matricule_etudiant]
    );

    const [club] = await pool.query('SELECT LAST_INSERT_ID() as ID_club');
    const clubId = club[0].ID_club;

    // Ajouter l'étudiant comme membre du club
    await pool.query(
      'INSERT INTO MembreClub (ID_club, matricule_etudiant) VALUES (?, ?)',
      [clubId, matricule_etudiant]
    );

    // Mettre à jour le statut de la demande
    await pool.query(
      'UPDATE DemandeCreationClub SET etat = ? WHERE ID_demande = ?',
      ['acceptee', demandeId]
    );

    // Envoyer une notification à l'étudiant
    const message = `Votre demande de création du club "${nom_club}" a été acceptée !`;
    await createNotification(matricule_etudiant, message);

    res.json({ message: 'Demande acceptée et club créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’acceptation de la demande de création:', error);
    res.status(500).json({ error: 'Erreur lors de l’acceptation de la demande de création' });
  }
};

// Refuser une demande de création de club
const refuserDemandeCreation = async (req, res) => {
  const { demandeId } = req.params;

  try {
    const [demande] = await pool.query(
      'SELECT * FROM DemandeCreationClub WHERE ID_demande = ? AND etat = ?',
      [demandeId, 'en_attente']
    );

    if (demande.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée ou déjà traitée' });
    }

    const { matricule_etudiant, nom_club } = demande[0];

    // Mettre à jour le statut de la demande
    await pool.query(
      'UPDATE DemandeCreationClub SET etat = ? WHERE ID_demande = ?',
      ['refusee', demandeId]
    );

    // Envoyer une notification à l'étudiant
    const message = `Votre demande de création du club "${nom_club}" a été refusée.`;
    await createNotification(matricule_etudiant, message);

    res.json({ message: 'Demande refusée avec succès' });
  } catch (error) {
    console.error('Erreur lors du refus de la demande de création:', error);
    res.status(500).json({ error: 'Erreur lors du refus de la demande de création' });
  }
};

// Accepter une demande pour rejoindre un club
const accepterDemandeRejoindre = async (req, res) => {
  const { demandeId } = req.params;

  try {
    const [demande] = await pool.query('SELECT * FROM DemandeRejoindreClub WHERE ID_demande = ?', [demandeId]);
    if (demande.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    await pool.query('UPDATE DemandeRejoindreClub SET etat = ? WHERE ID_demande = ?', ['acceptee', demandeId]);
    await pool.query('INSERT INTO MembreClub (ID_club, matricule_etudiant) VALUES (?, ?)', [demande[0].ID_club, demande[0].matricule_etudiant]);

    res.json({ message: 'Demande acceptée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’acceptation de la demande:', error);
    res.status(500).json({ error: 'Erreur lors de l’acceptation de la demande' });
  }
};

// Refuser une demande pour rejoindre un club
const refuserDemandeRejoindre = async (req, res) => {
  const { demandeId } = req.params;

  try {
    const [demande] = await pool.query('SELECT * FROM DemandeRejoindreClub WHERE ID_demande = ?', [demandeId]);
    if (demande.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    await pool.query('UPDATE DemandeRejoindreClub SET etat = ? WHERE ID_demande = ?', ['refusee', demandeId]);

    res.json({ message: 'Demande refusée avec succès' });
  } catch (error) {
    console.error('Erreur lors du refus de la demande:', error);
    res.status(500).json({ error: 'Erreur lors du refus de la demande' });
  }
};

module.exports = {
  createDemandeCreation,
  createDemandeRejoindre,
  getDemandesRejoindre,
  getDemandesCreation,
  accepterDemandeCreation,
  refuserDemandeCreation,
  accepterDemandeRejoindre,
  refuserDemandeRejoindre,
};