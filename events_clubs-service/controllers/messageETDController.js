const pool = require('../config/db');
const { createNotification } = require('./notificationETDController');
const path = require('path');
const fs = require('fs');

const getMessagesForClub = async (req, res) => {
  const { clubId, userMatricule } = req.params;

  try {
    const [club] = await pool.query('SELECT * FROM Club WHERE ID_club = ?', [clubId]);
    if (club.length === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }

    const gerantMatricule = club[0].gerant_matricule;
    const [membres] = await pool.query(
      'SELECT matricule_etudiant FROM MembreClub WHERE ID_club = ?',
      [clubId]
    );
    const membreMatricules = membres.map(m => m.matricule_etudiant);

    const isGerant = String(userMatricule) === String(gerantMatricule);
    const isMembre = membreMatricules.includes(Number(userMatricule));

    if (!isGerant && !isMembre) {
      return res.status(403).json({ error: 'Vous n’êtes pas autorisé à accéder à cette messagerie' });
    }

    const sentMessagesQuery = `
      SELECT MIN(m.ID_message) AS ID_message, m.contenu, m.expediteur, NULL AS destinataire,
             m.date_envoi, m.filePath, m.fileName,
             sender.nom AS expediteur_nom, sender.prenom AS expediteur_prenom
      FROM MessageClub m
      JOIN User sender ON m.expediteur = sender.Matricule
      WHERE m.expediteur = ?
      AND m.contenu LIKE ?
      GROUP BY m.contenu, m.expediteur, m.date_envoi, m.filePath, m.fileName,
               sender.nom, sender.prenom
    `;

    const receivedMessagesQuery = `
      SELECT m.ID_message, m.contenu, m.expediteur, m.destinataire, 
             m.date_envoi, m.filePath, m.fileName,
             sender.nom AS expediteur_nom, sender.prenom AS expediteur_prenom
      FROM MessageClub m
      JOIN User sender ON m.expediteur = sender.Matricule
      WHERE m.destinataire = ?
      AND m.contenu LIKE ?
    `;

    const combinedQuery = `
      (${sentMessagesQuery})
      UNION
      (${receivedMessagesQuery})
      ORDER BY date_envoi ASC
    `;

    const [messages] = await pool.query(combinedQuery, [
      userMatricule,
      `[CLUB_${clubId}]%`,
      userMatricule,
      `[CLUB_${clubId}]%`,
    ]);

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

const sendMessage = async (req, res) => {
  const { clubId, expediteur, contenu } = req.body;
  const file = req.file;

  try {
    if (!contenu || !expediteur || !clubId) {
      return res.status(400).json({ error: 'Contenu, expéditeur et clubId sont requis' });
    }

    const [club] = await pool.query('SELECT * FROM Club WHERE ID_club = ?', [clubId]);
    if (club.length === 0) {
      return res.status(404).json({ error: 'Club non trouvé' });
    }
    const gerantMatricule = club[0].gerant_matricule;
    const clubName = club[0].nom;

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

    const prefixedContenu = `[CLUB_${clubId}] ${contenu}`;
    const destinataires = [...membreMatricules, gerantMatricule].filter(
      matricule => matricule !== Number(expediteur)
    );

    let filePath = null;
    let fileName = null;
    if (file) {
      filePath = `/uploads/messages/${file.filename}`;
      fileName = file.originalname;
    }

    const insertedMessages = [];

    // 🔥 Correction ici : si aucun destinataire (ex: premier message par gérant)
    if (destinataires.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO MessageClub (contenu, expediteur, destinataire, filePath, fileName) VALUES (?, ?, NULL, ?, ?)',
        [prefixedContenu, expediteur, filePath, fileName]
      );

      const [newMessage] = await pool.query(
        `
        SELECT m.*, 
               sender.nom AS expediteur_nom, sender.prenom AS expediteur_prenom
        FROM MessageClub m
        JOIN User sender ON m.expediteur = sender.Matricule
        WHERE m.ID_message = ?
        `,
        [result.insertId]
      );

      newMessage[0].contenu = newMessage[0].contenu.replace(`[CLUB_${clubId}] `, '');
      insertedMessages.push(newMessage[0]);
    }

    // 🔥 Continuer normalement si des membres existent
    for (const destinataire of destinataires) {
      const [result] = await pool.query(
        'INSERT INTO MessageClub (contenu, expediteur, destinataire, filePath, fileName) VALUES (?, ?, ?, ?, ?)',
        [prefixedContenu, expediteur, destinataire, filePath, fileName]
      );

      const [newMessage] = await pool.query(
        `
        SELECT m.*, 
               sender.nom AS expediteur_nom, sender.prenom AS expediteur_prenom
        FROM MessageClub m
        JOIN User sender ON m.expediteur = sender.Matricule
        WHERE m.ID_message = ?
        `,
        [result.insertId]
      );

      newMessage[0].contenu = newMessage[0].contenu.replace(`[CLUB_${clubId}] `, '');
      insertedMessages.push(newMessage[0]);

      const notificationContent = `Vous avez de nouveaux messages du club ${clubName}`;
      const [existingNotification] = await pool.query(
        'SELECT * FROM Notification WHERE destinataire = ? AND contenu = ? AND expediteur = ? AND date_envoi > DATE_SUB(NOW(), INTERVAL 1 MINUTE)',
        [destinataire, notificationContent, expediteur]
      );

      if (existingNotification.length === 0) {
        await createNotification(destinataire, notificationContent, expediteur);
      } else {
        console.log('Notification déjà existante pour:', { destinataire, contenu: notificationContent, expediteur });
      }
    }

    // 🔥 Émettre en temps réel via WebSocket
    const io = req.app.get('io');
    io.to(`club_${clubId}`).emit('newMessage', insertedMessages);

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