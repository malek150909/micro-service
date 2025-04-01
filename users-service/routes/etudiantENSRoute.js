const express = require('express');
const router = express.Router();
const db = require('../config/db');
const PDFDocument = require('pdfkit');

// Route pour récupérer la liste des sections de l'enseignant
router.get('/:matricule/sections', async (req, res) => {
  const { matricule } = req.params;

  try {
    const [sections] = await db.query(`
      SELECT DISTINCT s.ID_section, s.niveau, sp.nom_specialite, d.Nom_departement, f.nom_faculte
      FROM Section s
      JOIN Enseignant_Section es ON s.ID_section = es.ID_section
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
      JOIN Faculte f ON sp.ID_faculte = f.ID_faculte
      WHERE es.Matricule = ?
    `, [matricule]);

    if (!sections.length) {
      return res.status(404).json({ error: 'Aucune section trouvée pour cet enseignant.' });
    }

    res.status(200).json(sections);
  } catch (err) {
    console.error('Erreur lors de la récupération des sections:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Route pour récupérer les étudiants d'une section spécifique (sans le niveau)
router.get('/:matricule/section/:sectionId/students', async (req, res) => {
  const { matricule, sectionId } = req.params;

  try {
    const [students] = await db.query(`
      SELECT e.Matricule, u.nom, u.prenom, e.etat, e.annee_inscription, g.num_groupe
      FROM Etudiant e
      JOIN User u ON e.Matricule = u.Matricule
      JOIN Etudiant_Section es ON e.Matricule = es.Matricule
      JOIN Section s ON es.ID_section = s.ID_section
      LEFT JOIN Groupe g ON e.ID_groupe = g.ID_groupe
      JOIN Enseignant_Section ens ON s.ID_section = ens.ID_section
      WHERE ens.Matricule = ? AND s.ID_section = ?
    `, [matricule, sectionId]);

    if (!students.length) {
      return res.status(404).json({ error: 'Aucun étudiant trouvé pour cette section.' });
    }

    res.status(200).json(students);
  } catch (err) {
    console.error('Erreur lors de la récupération des étudiants:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Route pour envoyer une notification (manuelle)
router.post('/notifications/send', async (req, res) => {
  const { contenu, expediteur, destinataire } = req.body;

  if (!contenu || !destinataire) {
    return res.status(400).json({ error: 'Contenu et destinataire sont requis.' });
  }

  try {
    await db.query(
      'INSERT INTO Notification (contenu, expediteur, destinataire, date_envoi) VALUES (?, ?, ?, NOW())',
      [contenu, expediteur || null, destinataire]
    );
    res.status(200).json({ message: 'Notification envoyée avec succès.' });
  } catch (err) {
    console.error('Erreur lors de l\'envoi de la notification:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Route pour récupérer les notifications non lues
router.get('/:matricule/section/:sectionId/notifications', async (req, res) => {
  const { matricule, sectionId } = req.params;

  try {
    const [notifications] = await db.query(`
      SELECT ID_notification, contenu, date_envoi
      FROM Notification
      WHERE destinataire = ? 
      AND contenu LIKE '%mise[aà]jour%'
    `, [matricule]);

    const relevantNotifications = notifications.filter(notification => 
      notification.contenu.includes(`section ${sectionId}`)
    );

    res.status(200).json(relevantNotifications);
  } catch (err) {
    console.error('Erreur lors de la récupération des notifications:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Route pour supprimer une notification
router.delete('/notifications/:notificationId', async (req, res) => {
  const { notificationId } = req.params;

  try {
    await db.query(`
      DELETE FROM Notification
      WHERE ID_notification = ?
    `, [notificationId]);

    res.status(200).json({ message: 'Notification supprimée.' });
  } catch (err) {
    console.error('Erreur lors de la suppression de la notification:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Route pour générer le PDF (sans le niveau)
router.get('/:matricule/section/:sectionId/pdf', async (req, res) => {
  const { matricule, sectionId } = req.params;

  try {
    const [section] = await db.query(`
      SELECT s.niveau, sp.nom_specialite, d.Nom_departement, f.nom_faculte
      FROM Section s
      JOIN Enseignant_Section es ON s.ID_section = es.ID_section
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      JOIN Departement d ON sp.ID_departement = d.ID_departement
      JOIN Faculte f ON sp.ID_faculte = f.ID_faculte
      WHERE es.Matricule = ? AND s.ID_section = ?
    `, [matricule, sectionId]);

    if (!section.length) {
      return res.status(404).json({ error: 'Section non trouvée.' });
    }

    const [students] = await db.query(`
      SELECT e.Matricule, u.nom, u.prenom, e.etat, g.num_groupe
      FROM Etudiant e
      JOIN User u ON e.Matricule = u.Matricule
      JOIN Etudiant_Section es ON e.Matricule = es.Matricule
      JOIN Section s ON es.ID_section = s.ID_section
      JOIN Enseignant_Section ens ON s.ID_section = ens.ID_section
      LEFT JOIN Groupe g ON e.ID_groupe = g.ID_groupe
      WHERE ens.Matricule = ? AND s.ID_section = ?
    `, [matricule, sectionId]);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-disposition', `attachment; filename=liste_etudiants_section_${sectionId}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    // En-tête du PDF
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#003087')
      .text('Université de la science et de la technologie', { align: 'center' });
    doc
      .fontSize(16)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Liste des etudiants', { align: 'center' });
    doc
      .fontSize(12)
      .text(`${section[0].niveau} - ${section[0].nom_specialite}`, { align: 'center' });
    doc
      .fontSize(10)
      .text(`Département: ${section[0].Nom_departement}, Faculté: ${section[0].nom_faculte}`, { align: 'center' });
    doc
      .fontSize(10)
      .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);

    // Dessiner une ligne de séparation
    doc
      .moveTo(40, doc.y)
      .lineTo(570, doc.y)
      .lineWidth(1)
      .strokeColor('#003087')
      .stroke();
    doc.moveDown(1);

    // En-têtes du tableau (sans la colonne Niveau)
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
    const startX = 40;
    let currentX = startX;
    const rowHeight = 20;
    let currentY = doc.y;

    // Ajuster la largeur totale du tableau (suppression de la colonne Niveau)
    const tableWidth = 530 - 60; // On retire 60 (largeur de la colonne Niveau)

    // Dessiner le fond de l'en-tête
    doc.rect(startX, currentY, tableWidth, rowHeight).fill('#e6e6e6').fillColor('black');

    doc.text('Matricule', currentX, currentY + 5, { width: 80, align: 'left' });
    currentX += 80;
    doc.text('Nom', currentX, currentY + 5, { width: 120, align: 'left' });
    currentX += 120;
    doc.text('Prénom', currentX, currentY + 5, { width: 120, align: 'left' });
    currentX += 120;
    doc.text('État', currentX, currentY + 5, { width: 90, align: 'left' });
    currentX += 90;
    doc.text('Groupe', currentX, currentY + 5, { width: 60, align: 'left' });

    doc.moveDown();
    currentY = doc.y;

    // Lignes du tableau (sans la colonne Niveau)
    doc.font('Helvetica').fontSize(10);
    students.forEach((student, index) => {
      currentX = startX;
      if (index % 2 === 0) {
        doc.rect(startX, currentY, tableWidth, rowHeight).fill('#f5f5f5').fillColor('black');
      }

      doc.text(String(student.Matricule), currentX, currentY + 5, { width: 80, align: 'left' });
      currentX += 80;
      doc.text(student.nom || 'Non défini', currentX, currentY + 5, { width: 120, align: 'left' });
      currentX += 120;
      doc.text(student.prenom || 'Non défini', currentX, currentY + 5, { width: 120, align: 'left' });
      currentX += 120;
      doc.text(student.etat || 'Non défini', currentX, currentY + 5, { width: 90, align: 'left' });
      currentX += 90;
      doc.text(student.num_groupe ? `Groupe ${student.num_groupe}` : 'Non assigné', currentX, currentY + 5, { width: 60, align: 'left' });

      // Dessiner les bordures de la ligne
      doc
        .rect(startX, currentY, tableWidth, rowHeight)
        .lineWidth(0.5)
        .strokeColor('#d3d3d3')
        .stroke();

      currentY += rowHeight;
      doc.y = currentY;
    });

    // Pied de page
    doc
      .fontSize(8)
      .fillColor('#666666')
      .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 40, doc.page.height - 50, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Erreur lors de la génération du PDF:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;