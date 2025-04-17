import db from '../config/db.js';

class ProfModel {
  static normalizeTimeSlot(timeSlot) {
    if (!timeSlot) return null;
    return timeSlot.trim().replace(/[-\s–]+/g, ' - ');
  }

  static async getProfessorSections(matricule) {
    const [rows] = await db.query(`
      SELECT s.ID_section, s.nom_section, s.niveau, sp.nom_specialite
      FROM Enseignant_Section es
      JOIN Section s ON es.ID_section = s.ID_section
      JOIN Specialite sp ON s.ID_specialite = sp.ID_specialite
      WHERE es.Matricule = ?
    `, [matricule]);
    return rows;
  }

  static async getSectionTimetable(sectionId) {
    const [regularRows] = await db.query(`
      SELECT s.ID_seance, s.jour, s.time_slot, s.type_seance, m.nom_module, sa.nom_salle, g.num_groupe, u.nom AS prof_nom, u.prenom AS prof_prenom, 'presentiel' AS mode
      FROM Seance s
      JOIN Module m ON s.ID_module = m.ID_module
      JOIN Salle sa ON s.ID_salle = sa.ID_salle
      LEFT JOIN Groupe g ON s.ID_groupe = g.ID_groupe
      JOIN Enseignant e ON s.Matricule = e.Matricule
      JOIN User u ON e.Matricule = u.Matricule
      WHERE s.ID_section = ?
    `, [sectionId]);
    console.log('Raw regular rows for sectionId', sectionId, ':', regularRows);

    const [suppRows] = await db.query(`
      SELECT ss.ID_seance_supp AS ID_seance, DATE_FORMAT(ss.date_seance, '%Y-%m-%d') AS date_seance, ss.time_slot, ss.type_seance, m.nom_module, sa.nom_salle, GROUP_CONCAT(g.num_groupe) AS num_groupe, u.nom AS prof_nom, u.prenom AS prof_prenom, ss.mode
      FROM Seance_Supp ss
      JOIN Module m ON ss.ID_module = m.ID_module
      LEFT JOIN Salle sa ON ss.ID_salle = sa.ID_salle
      LEFT JOIN Seance_Supp_Groupe ssg ON ss.ID_seance_supp = ssg.ID_seance_supp
      LEFT JOIN Groupe g ON ssg.ID_groupe = g.ID_groupe
      JOIN Enseignant e ON ss.Matricule = e.Matricule
      JOIN User u ON e.Matricule = u.Matricule
      WHERE ss.ID_section = ?
      GROUP BY ss.ID_seance_supp
    `, [sectionId]);
    console.log('Raw supplementary rows for sectionId', sectionId, ':', suppRows);

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const formattedRegularRows = regularRows.map(row => ({
      ...row,
      time_slot: this.normalizeTimeSlot(row.time_slot),
    }));
    const formattedSuppRows = suppRows.map(row => {
      const localDate = new Date(row.date_seance);
      return {
        ...row,
        date_seance: row.date_seance,
        jour: dayNames[localDate.getDay()],
        time_slot: this.normalizeTimeSlot(row.time_slot),
      };
    });

    return { regular: formattedRegularRows, supplementary: formattedSuppRows };
  }

  static async getProfessorTimetable(matricule) {
    const [regularRows] = await db.query(`
      SELECT s.ID_seance, s.jour, s.time_slot, s.type_seance, m.nom_module, sa.nom_salle, sec.nom_section, g.num_groupe, 'presentiel' AS mode
      FROM Seance s
      JOIN Module m ON s.ID_module = m.ID_module
      JOIN Salle sa ON s.ID_salle = sa.ID_salle
      JOIN Section sec ON s.ID_section = sec.ID_section
      LEFT JOIN Groupe g ON s.ID_groupe = g.ID_groupe
      WHERE s.Matricule = ?
    `, [matricule]);
    console.log('Raw regular rows for matricule', matricule, ':', regularRows);

    const [suppRows] = await db.query(`
      SELECT 
        ss.ID_seance_supp AS ID_seance, 
        DATE_FORMAT(ss.date_seance, '%Y-%m-%d') AS date_seance, 
        ss.time_slot, 
        ss.type_seance, 
        m.ID_module, 
        m.nom_module, 
        sa.ID_salle, 
        sa.nom_salle, 
        sec.nom_section, 
        GROUP_CONCAT(g.num_groupe) AS num_groupe, 
        ss.mode
      FROM Seance_Supp ss
      JOIN Module m ON ss.ID_module = m.ID_module
      LEFT JOIN Salle sa ON ss.ID_salle = sa.ID_salle
      JOIN Section sec ON ss.ID_section = sec.ID_section
      LEFT JOIN Seance_Supp_Groupe ssg ON ss.ID_seance_supp = ssg.ID_seance_supp
      LEFT JOIN Groupe g ON ssg.ID_groupe = g.ID_groupe
      WHERE ss.Matricule = ?
      GROUP BY ss.ID_seance_supp
    `, [matricule]);
    console.log('Raw supplementary rows for matricule', matricule, ':', suppRows);

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const formattedRegularRows = regularRows.map(row => ({
      ...row,
      time_slot: this.normalizeTimeSlot(row.time_slot),
    }));
    const formattedSuppRows = suppRows.map(row => {
      const localDate = new Date(row.date_seance);
      return {
        ...row,
        date_seance: row.date_seance,
        jour: dayNames[localDate.getDay()],
        time_slot: this.normalizeTimeSlot(row.time_slot),
      };
    });

    return { regular: formattedRegularRows, supplementary: formattedSuppRows };
  }

  static async getProfessorModulesForSection(matricule, sectionId) {
    const [rows] = await db.query(`
      SELECT DISTINCT m.ID_module, m.nom_module, m.seances
      FROM Module m
      JOIN Module_Enseignant me ON m.ID_module = me.ID_module
      JOIN Module_Section ms ON m.ID_module = ms.ID_module
      WHERE me.Matricule = ? AND ms.ID_section = ?
    `, [matricule, sectionId]);
    return rows;
  }

  static async getGroupsForSection(sectionId) {
    const [rows] = await db.query(`
      SELECT ID_groupe, num_groupe
      FROM Groupe
      WHERE ID_section = ?
    `, [sectionId]);
    return rows;
  }

  static async getAvailableRooms(date, timeSlot, excludeSessionId = null, currentSalleId = null) {
    const dateObj = new Date(date);
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[dateObj.getDay()];
    const normalizedTimeSlot = this.normalizeTimeSlot(timeSlot);
    let query = `
      SELECT s.*
      FROM Salle s
      WHERE s.ID_salle NOT IN (
        SELECT ID_salle FROM Seance_Supp 
        WHERE date_seance = ? AND time_slot = ? AND ID_salle IS NOT NULL
        ${excludeSessionId ? 'AND ID_seance_supp != ?' : ''}
      ) AND s.ID_salle NOT IN (
        SELECT ID_salle FROM Seance 
        WHERE jour = ? AND time_slot = ?
      )
    `;
    let params = [date, normalizedTimeSlot];
    if (excludeSessionId) params.push(excludeSessionId);
    params.push(dayName, normalizedTimeSlot);
    
    if (currentSalleId) {
      query += ` OR s.ID_salle = ?`;
      params.push(currentSalleId);
    }

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async addSupplementarySession(data) {
    const { matricule, sectionId, salleId, moduleId, typeSeance, groupeIds, date, timeSlot, mode } = data;
    const localDate = new Date(date);
    const formattedDate = localDate.toISOString().split('T')[0];
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[localDate.getDay()];
    const normalizedTimeSlot = this.normalizeTimeSlot(timeSlot);

    const [module] = await db.query(`SELECT seances, nom_module FROM Module WHERE ID_module = ?`, [moduleId]);
    if (!module.length) throw new Error('Module invalide');
    const seances = module[0].seances;
    const validTypes = {
      'Cours': ['cours'],
      'Cour/TD': ['cours', 'TD'],
      'Cour/TP': ['cours', 'TP'],
      'Cour/TD/TP': ['cours', 'TD', 'TP'],
    }[seances];
    if (!validTypes.includes(typeSeance)) throw new Error(`Le type ${typeSeance} n'est pas autorisé pour ce module (${seances})`);

    let selectedGroups = [];
    if (typeSeance === 'TD' || typeSeance === 'TP') {
      if (!groupeIds || groupeIds.length === 0) throw new Error('Au moins un groupe doit être sélectionné pour les séances TD ou TP');
      selectedGroups = Array.isArray(groupeIds) ? groupeIds : [groupeIds];
    }

    await this.checkConflicts(matricule, sectionId, formattedDate, normalizedTimeSlot, dayName, salleId, selectedGroups, mode);

    const [result] = await db.query(`
      INSERT INTO Seance_Supp (Matricule, ID_section, ID_salle, ID_module, type_seance, date_seance, time_slot, mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [matricule, sectionId, mode === 'presentiel' ? salleId : null, moduleId, typeSeance, formattedDate, normalizedTimeSlot, mode]);

    const seanceSuppId = result.insertId;

    if (selectedGroups.length > 0) {
      const groupValues = selectedGroups.map(groupId => [seanceSuppId, groupId]);
      await db.query(`INSERT INTO Seance_Supp_Groupe (ID_seance_supp, ID_groupe) VALUES ?`, [groupValues]);
    }

    await this.sendNotification(matricule, sectionId, module[0].nom_module, typeSeance, mode, 'ajoutée');
    return result;
  }

  static async modifySupplementarySession(data) {
    const { id, matricule, sectionId, salleId, moduleId, typeSeance, groupeIds, date, timeSlot, mode } = data;
    const localDate = new Date(date);
    const formattedDate = localDate.toISOString().split('T')[0];
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[localDate.getDay()];
    const normalizedTimeSlot = this.normalizeTimeSlot(timeSlot);

    const [session] = await db.query(`SELECT date_seance FROM Seance_Supp WHERE ID_seance_supp = ?`, [id]);
    if (!session.length) throw new Error('Séance introuvable');
    if (new Date(session[0].date_seance) < new Date()) throw new Error('Impossible de modifier une séance passée');

    const [module] = await db.query(`SELECT seances, nom_module FROM Module WHERE ID_module = ?`, [moduleId]);
    if (!module.length) throw new Error('Module invalide');
    const seances = module[0].seances;
    const validTypes = {
      'Cours': ['cours'],
      'Cour/TD': ['cours', 'TD'],
      'Cour/TP': ['cours', 'TP'],
      'Cour/TD/TP': ['cours', 'TD', 'TP'],
    }[seances];
    if (!validTypes.includes(typeSeance)) throw new Error(`Le type ${typeSeance} n'est pas autorisé pour ce module (${seances})`);

    let selectedGroups = [];
    if (typeSeance === 'TD' || typeSeance === 'TP') {
      if (!groupeIds || groupeIds.length === 0) throw new Error('Au moins un groupe doit être sélectionné pour les séances TD ou TP');
      selectedGroups = Array.isArray(groupeIds) ? groupeIds : [groupeIds];
    }

    await this.checkConflicts(matricule, sectionId, formattedDate, normalizedTimeSlot, dayName, salleId, selectedGroups, mode, id);

    await db.query(`
      UPDATE Seance_Supp SET Matricule = ?, ID_section = ?, ID_salle = ?, ID_module = ?, type_seance = ?, date_seance = ?, time_slot = ?, mode = ?
      WHERE ID_seance_supp = ?
    `, [matricule, sectionId, mode === 'presentiel' ? salleId : null, moduleId, typeSeance, formattedDate, normalizedTimeSlot, mode, id]);

    await db.query(`DELETE FROM Seance_Supp_Groupe WHERE ID_seance_supp = ?`, [id]);
    if (selectedGroups.length > 0) {
      const groupValues = selectedGroups.map(groupId => [id, groupId]);
      await db.query(`INSERT INTO Seance_Supp_Groupe (ID_seance_supp, ID_groupe) VALUES ?`, [groupValues]);
    }

    await this.sendNotification(matricule, sectionId, module[0].nom_module, typeSeance, mode, 'modifiée');
    return { affectedRows: 1 };
  }

  static async deleteSupplementarySession(id) {
    const [session] = await db.query(`SELECT Matricule, ID_section, ID_module, type_seance, mode FROM Seance_Supp WHERE ID_seance_supp = ?`, [id]);
    if (!session.length) throw new Error('Séance introuvable');

    const [module] = await db.query(`SELECT nom_module FROM Module WHERE ID_module = ?`, [session[0].ID_module]);
    await db.query(`DELETE FROM Seance_Supp_Groupe WHERE ID_seance_supp = ?`, [id]);
    await db.query(`DELETE FROM Seance_Supp WHERE ID_seance_supp = ?`, [id]);

    await this.sendNotification(session[0].Matricule, session[0].ID_section, module[0].nom_module, session[0].type_seance, session[0].mode, 'supprimée');
    return { affectedRows: 1 };
  }

  static async checkConflicts(matricule, sectionId, date, timeSlot, dayName, salleId, groupeIds, mode, excludeId = null) {
    const conditions = excludeId ? `AND ID_seance_supp != ?` : '';
    const params = excludeId ? [matricule, date, timeSlot, excludeId] : [matricule, date, timeSlot];

    const [profConflictSeance] = await db.query(`SELECT * FROM Seance WHERE Matricule = ? AND jour = ? AND time_slot = ?`, [matricule, dayName, timeSlot]);
    const [profConflictSupp] = await db.query(`SELECT * FROM Seance_Supp WHERE Matricule = ? AND date_seance = ? AND time_slot = ? ${conditions}`, params);
    if (profConflictSeance.length > 0 || profConflictSupp.length > 0) throw new Error('Vous êtes déjà programmé pour une séance à cette date et heure');

    const [sectionConflictSeance] = await db.query(`SELECT * FROM Seance WHERE ID_section = ? AND jour = ? AND time_slot = ?`, [sectionId, dayName, timeSlot]);
    const [sectionConflictSupp] = await db.query(`SELECT * FROM Seance_Supp WHERE ID_section = ? AND date_seance = ? AND time_slot = ? ${conditions}`, excludeId ? [sectionId, date, timeSlot, excludeId] : [sectionId, date, timeSlot]);
    if (sectionConflictSeance.length > 0 || sectionConflictSupp.length > 0) throw new Error('La section a déjà une séance à cette date et heure');

    if (groupeIds && groupeIds.length > 0) {
      const conflictingGroups = [];
      for (const groupId of groupeIds) {
        const [groupConflictSeance] = await db.query(`SELECT * FROM Seance WHERE ID_groupe = ? AND jour = ? AND time_slot = ?`, [groupId, dayName, timeSlot]);
        const [groupConflictSupp] = await db.query(
          `SELECT ssg.ID_groupe, g.num_groupe 
           FROM Seance_Supp_Groupe ssg 
           JOIN Seance_Supp ss ON ssg.ID_seance_supp = ss.ID_seance_supp 
           JOIN Groupe g ON ssg.ID_groupe = g.ID_groupe 
           WHERE ssg.ID_groupe = ? AND ss.date_seance = ? AND ss.time_slot = ? ${conditions ? 'AND ss.ID_seance_supp != ?' : ''}`,
          excludeId ? [groupId, date, timeSlot, excludeId] : [groupId, date, timeSlot]
        );
        if (groupConflictSeance.length > 0 || groupConflictSupp.length > 0) {
          const [group] = await db.query(`SELECT num_groupe FROM Groupe WHERE ID_groupe = ?`, [groupId]);
          conflictingGroups.push(`Groupe ${group[0].num_groupe}`);
        }
      }
      if (conflictingGroups.length > 0) throw new Error(`Les groupes suivants ont déjà une séance à cette date et heure : ${conflictingGroups.join(', ')}`);
    }

    if (mode === 'presentiel' && salleId) {
      const [roomConflictSeance] = await db.query(`SELECT * FROM Seance WHERE ID_salle = ? AND jour = ? AND time_slot = ?`, [salleId, dayName, timeSlot]);
      const [roomConflictSupp] = await db.query(`SELECT * FROM Seance_Supp WHERE ID_salle = ? AND date_seance = ? AND time_slot = ? ${conditions}`, excludeId ? [salleId, date, timeSlot, excludeId] : [salleId, date, timeSlot]);
      if (roomConflictSeance.length > 0 || roomConflictSupp.length > 0) throw new Error('La salle est déjà réservée à cette date et heure');
    }
  }

  static async sendNotification(matricule, sectionId, nomModule, typeSeance, mode, action) {
    const [students] = await db.query(`SELECT Matricule FROM Etudiant_Section WHERE ID_section = ?`, [sectionId]);
    if (students.length > 0) {
      await db.query(`
        INSERT INTO Notification (contenu, expediteur, destinataire)
        SELECT CONCAT('Séance supplémentaire ', ?, ' : ', ?, ' (', ?, ', ', ?, ')'), ?, Matricule
        FROM Etudiant_Section WHERE ID_section = ?
      `, [action, nomModule, typeSeance, mode, matricule, sectionId]);
    }
  }
}

export default ProfModel;