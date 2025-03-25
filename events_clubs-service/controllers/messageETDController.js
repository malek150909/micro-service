// club-evenement-service/backend/Controllers/messageController.js
const pool = require('../config/db');

// Récupérer les messages pour un club (messagerie de groupe)
const getMessagesForClub = async (req, res) => {
  const { clubId, userMatricule } = req.params;

  console.log('Requête reçue pour clubId:', clubId, 'userMatricule:', userMatricule);

  try {
    const [club] = await pool.query('SELECT * FROM Club WHERE ID_club = ?', [clubId]);
    console.log('Résultat club:', club);
    if (club.length === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    const gerantMatricule = club[0].gerant_matricule;
    const [membres] = await pool.query(
      'SELECT matricule_etudiant FROM MembreClub WHERE ID_club = ?',
      [clubId]
    );
    console.log('Membres trouvés:', membres);
    const membreMatricules = membres.map(m => m.matricule_etudiant);

    const isGerant = String(userMatricule) === String(gerantMatricule);
    const isMembre = membreMatricules.includes(Number(userMatricule));
    console.log('isGerant:', isGerant, 'isMembre:', isMembre);

    if (!isGerant && !isMembre) {
      return res.status(403).json({ error: 'Vous n’êtes pas autorisé à accéder à cette messagerie' });
    }

    const [messages] = await pool.query(
      `
      SELECT m.*, 
             sender.nom AS expediteur_nom, sender.prenom AS expediteur_prenom
      FROM Message m
      JOIN User sender ON m.expediteur = sender.Matricule
      WHERE (m.expediteur = ? OR m.destinataire = ?)
      AND m.contenu LIKE ?
      ORDER BY m.date_envoi ASC
      `,
      [userMatricule, userMatricule, `[CLUB_${clubId}]%`]
    );
    console.log('Messages trouvés:', messages);

    const cleanedMessages = messages.map(msg => ({
      ...msg,
      contenu: msg.contenu.replace(`[CLUB_${clubId}] `, ''),
    }));

    res.json(cleanedMessages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
  }
};

// Envoyer un message dans la messagerie de groupe
const sendMessage = async (req, res) => {
  const { clubId, expediteur, contenu } = req.body;

  if (!contenu || !expediteur || !clubId) {
    return res.status(400).json({ error: 'Contenu, expéditeur et clubId sont requis' });
  }

  try {
    // Vérifier que l'expéditeur est le gérant ou un membre du club
    const [club] = await pool.query('SELECT gerant_matricule FROM Club WHERE ID_club = ?', [clubId]);
    if (club.length === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }
    const gerantMatricule = club[0].gerant_matricule;

    const [membres] = await pool.query(
      'SELECT matricule_etudiant FROM MembreClub WHERE ID_club = ?',
      [clubId]
    );
    const membreMatricules = membres.map(m => m.matricule_etudiant);

    const isGerant = String(expediteur) === String(gerantMatricule);
    const isMembre = membreMatricules.includes(Number(expediteur));

    if (!isGerant && !isMembre) {
      return res.status(403).json({ error: 'Vous n’êtes pas autorisé à envoyer un message dans ce club' });
    }

    // Ajouter un préfixe au contenu pour identifier le club
    const prefixedContenu = `[CLUB_${clubId}] ${contenu}`;

    // Liste des destinataires : tous les membres du club + le gérant (sauf l'expéditeur)
    const destinataires = [...membreMatricules, gerantMatricule].filter(
      matricule => matricule !== Number(expediteur)
    );

    // Insérer un message pour chaque destinataire
    const insertedMessages = [];
    for (const destinataire of destinataires) {
      const [result] = await pool.query(
        'INSERT INTO Message (contenu, expediteur, destinataire) VALUES (?, ?, ?)',
        [prefixedContenu, expediteur, destinataire]
      );

      // Récupérer le message inséré avec les informations de l'expéditeur
      const [newMessage] = await pool.query(
        `
        SELECT m.*, 
               sender.nom AS expediteur_nom, sender.prenom AS expediteur_prenom
        FROM Message m
        JOIN User sender ON m.expediteur = sender.Matricule
        WHERE m.ID_message = ?
        `,
        [result.insertId]
      );

      // Supprimer le préfixe avant de renvoyer le message
      newMessage[0].contenu = newMessage[0].contenu.replace(`[CLUB_${clubId}] `, '');
      insertedMessages.push(newMessage[0]);
    }

    res.status(201).json(insertedMessages);
  } catch (error) {
    console.error('Erreur lors de l’envoi du message:', error);
    res.status(500).json({ error: 'Erreur lors de l’envoi du message' });
  }
};

module.exports = {
  getMessagesForClub,
  sendMessage,
};