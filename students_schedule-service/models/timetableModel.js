import pool from '../config/db.js';

const getLeastLoadedEnseignant = async (enseignants, jour, pool) => {
  let minSeances = Infinity;
  let selectedEnseignant = null;

  for (const enseignant of enseignants) {
    const [seances] = await pool.query(
      'SELECT COUNT(*) as count FROM Seance WHERE Matricule = ? AND jour = ?',
      [enseignant.Matricule, jour]
    );
    const count = seances[0].count;
    if (count < minSeances) {
      minSeances = count;
      selectedEnseignant = enseignant;
    }
  }
  return selectedEnseignant;
};

// Fonction utilitaire pour filtrer les modules qui ont des enseignants associés à la section
const filterModulesWithSectionEnseignants = (modules, enseignantsByModule, sectionEnseignants) => {
  return modules.filter(module => {
    if (!enseignantsByModule[module.ID_module] || enseignantsByModule[module.ID_module].length === 0) {
      return false;
    }
    
    return enseignantsByModule[module.ID_module].some(enseignant => 
      sectionEnseignants.some(sectionEnseignant => 
        sectionEnseignant.Matricule === enseignant.Matricule
      )
    );
  });
};

// Fonction utilitaire pour filtrer les enseignants d'un module qui sont associés à une section
const filterEnseignantsBySection = (moduleEnseignants, sectionEnseignants) => {
  return moduleEnseignants.filter(enseignant => 
    sectionEnseignants.some(sectionEnseignant => 
      sectionEnseignant.Matricule === enseignant.Matricule
    )
  );
};

// Fonction utilitaire pour vérifier si tous les groupes ont une séance pour un module et type donné
const allGroupsHaveSession = (plannedSessions, moduleId, typeSeance, groupIds) => {
  const groupsWithSessions = new Set();
  
  for (const session of plannedSessions) {
    if (session.moduleId === moduleId && session.typeSeanceNormalized === typeSeance) {
      groupsWithSessions.add(session.groupe);
    }
  }
  
  return groupIds.every(groupId => groupsWithSessions.has(groupId));
};

// Fonction pour regrouper les séances TD/TP par module et type
const groupSessionsByModuleAndType = (tdTpSessions) => {
  const grouped = {};
  
  for (const session of tdTpSessions) {
    const key = `${session.moduleId}_${session.typeSeanceNormalized}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(session);
  }
  
  return grouped;
};

const Timetable = {
  getTimetable: async (filters) => {
    try {
      const { sectionId, semestre } = filters;
      console.log('Filters received:', filters);

      if (!sectionId || !semestre) {
        throw new Error('sectionId et semestre sont requis');
      }

      const query = `
        SELECT s.ID_seance, s.jour, s.time_slot, s.type_seance,
               m.nom_module AS module, CONCAT(u.prenom, ' ', u.nom) AS teacher,
               sa.nom_salle AS room, g.num_groupe AS "group"
        FROM Seance s
        LEFT JOIN Module m ON s.ID_module = m.ID_module
        LEFT JOIN User u ON s.Matricule = u.Matricule
        LEFT JOIN Salle sa ON s.ID_salle = sa.ID_salle
        LEFT JOIN Groupe g ON s.ID_groupe = g.ID_groupe
        JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
        WHERE s.ID_section = ? AND ms.semestre = ?
      `;
      const params = [sectionId, semestre];
      console.log('Executing query:', query);
      console.log('With params:', params);

      const [rows] = await pool.query(query, params);
      console.log('Query result:', rows);

      const timetable = {};
      rows.forEach(row => {
        if (!timetable[row.jour]) timetable[row.jour] = [];
        timetable[row.jour].push(row);
      });

      console.log('Fetched timetable from Seance:', timetable);
      return timetable;
    } catch (err) {
      console.error('Error in getTimetable:', err.message);
      throw err;
    }
  },

  getFilterOptions: async ({ niveau = null, faculte = null, departement = null, specialite = null } = {}) => {
    try {
      const [niveaux] = await pool.query('SELECT DISTINCT niveau FROM Section ORDER BY niveau');
      
      let facultesQuery = 'SELECT ID_faculte, nom_faculte FROM faculte';
      const facultesParams = [];
      if (niveau) {
        facultesQuery = `
          SELECT DISTINCT f.ID_faculte, f.nom_faculte 
          FROM faculte f
          JOIN Departement d ON f.ID_faculte = d.ID_faculte
          JOIN Specialite sp ON d.ID_departement = sp.ID_departement
          JOIN Section s ON sp.ID_specialite = s.ID_specialite
          WHERE s.niveau = ?
        `;
        facultesParams.push(niveau);
      }
      facultesQuery += ' ORDER BY nom_faculte';
      const [facultes] = await pool.query(facultesQuery, facultesParams);

      let departementsQuery = 'SELECT ID_departement, Nom_departement FROM Departement';
      const departementsParams = [];
      if (niveau) {
        departementsQuery = `
          SELECT DISTINCT d.ID_departement, d.Nom_departement 
          FROM Departement d
          JOIN Specialite sp ON d.ID_departement = sp.ID_departement
          JOIN Section s ON sp.ID_specialite = s.ID_specialite
          WHERE s.niveau = ?
        `;
        departementsParams.push(niveau);
        if (faculte) {
          departementsQuery += ' AND d.ID_faculte = ?';
          departementsParams.push(faculte);
        }
      } else if (faculte) {
        departementsQuery += ' WHERE ID_faculte = ?';
        departementsParams.push(faculte);
      }
      departementsQuery += ' ORDER BY Nom_departement';
      const [departements] = await pool.query(departementsQuery, departementsParams);

      let specialitesQuery = 'SELECT ID_specialite, nom_specialite FROM Specialite';
      const specialitesParams = [];
      if (niveau) {
        specialitesQuery = `
          SELECT DISTINCT sp.ID_specialite, sp.nom_specialite 
          FROM Specialite sp
          JOIN Section s ON sp.ID_specialite = s.ID_specialite
          WHERE s.niveau = ?
        `;
        specialitesParams.push(niveau);
        if (departement) {
          specialitesQuery += ' AND sp.ID_departement = ?';
          specialitesParams.push(departement);
        }
      } else if (departement) {
        specialitesQuery += ' WHERE ID_departement = ?';
        specialitesParams.push(departement);
      }
      specialitesQuery += ' ORDER BY nom_specialite';
      const [specialites] = await pool.query(specialitesQuery, specialitesParams);

      let sectionsQuery = 'SELECT ID_section, nom_section FROM Section';
      const sectionsParams = [];
      if (niveau) {
        sectionsQuery += ' WHERE niveau = ?';
        sectionsParams.push(niveau);
        if (specialite) {
          sectionsQuery += ' AND ID_specialite = ?';
          sectionsParams.push(specialite);
        }
      } else if (specialite) {
        sectionsQuery += ' WHERE ID_specialite = ?';
        sectionsParams.push(specialite);
      }
      sectionsQuery += ' ORDER BY nom_section';
      const [sections] = await pool.query(sectionsQuery, sectionsParams);

      return {
        niveaux: niveaux.map(n => n.niveau),
        facultes,
        departements,
        specialites,
        sections
      };
    } catch (err) {
      console.error('Error in getFilterOptions:', err.message);
      throw err;
    }
  },

  deleteSession: async (id) => {
    try {
      if (!id) {
        throw new Error('ID_seance est requis');
      }
      console.log('Executing DELETE for ID_seance:', id);
      const [result] = await pool.query('DELETE FROM Seance WHERE ID_seance = ?', [id]);
      console.log('DELETE result:', result);
      if (result.affectedRows === 0) {
        throw new Error('Aucune séance trouvée avec cet ID');
      }
      return { success: true, message: 'Séance supprimée avec succès' };
    } catch (err) {
      console.error('Error in deleteSession:', err.message);
      throw err;
    }
  },

  createSession: async ({ ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section }) => {
    try {
      console.log('Creating session with data:', { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section });
      if (!ID_section) {
        throw new Error('ID_section est requis');
      }

      const conflict = await Timetable.checkConflicts(ID_salle, Matricule, jour, time_slot, type_seance, ID_groupe, ID_section, ID_module);
      if (conflict) {
        return { success: false, error: conflict };
      }

      const groupeToInsert = type_seance === 'cours' ? null : (ID_groupe || null);
      const [result] = await pool.query(
        'INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ID_salle, Matricule, type_seance, groupeToInsert, ID_module, jour, time_slot, ID_section]
      );
      return { success: true, ID_seance: result.insertId, message: 'Séance ajoutée avec succès' };
    } catch (err) {
      console.error('Error in createSession:', err.message);
      throw err;
    }
  },

  updateSession: async (id, { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot }) => {
    try {
      const [existingSession] = await pool.query('SELECT ID_section FROM Seance WHERE ID_seance = ?', [id]);
      if (!existingSession.length) {
        throw new Error('Séance non trouvée');
      }
      const ID_section = existingSession[0].ID_section;

      const conflict = await Timetable.checkConflicts(ID_salle, Matricule, jour, time_slot, type_seance, ID_groupe, ID_section, ID_module, id);
      if (conflict) {
        return { success: false, error: conflict };
      }

      const groupeToUpdate = type_seance === 'cours' ? null : (ID_groupe || null);
      await pool.query(
        'UPDATE Seance SET ID_salle = ?, Matricule = ?, type_seance = ?, ID_groupe = ?, ID_module = ?, jour = ?, time_slot = ? WHERE ID_seance = ?',
        [ID_salle, Matricule, type_seance, groupeToUpdate, ID_module, jour, time_slot, id]
      );
      return { success: true, message: 'Séance mise à jour avec succès' };
    } catch (err) {
      throw err;
    }
  },

  getSessionOptions: async (sectionId, semestre) => {
    try {
      console.log('Fetching session options for sectionId:', sectionId, 'and semestre:', semestre);

      const [section] = await pool.query(
        'SELECT ID_specialite, niveau FROM Section WHERE ID_section = ?',
        [sectionId]
      );
      if (!section.length) {
        console.log('No section found for sectionId:', sectionId);
        return { salles: [], groupes: [], modules: [], enseignants: [] };
      }
      const specialiteId = section[0].ID_specialite;
      console.log('Specialite ID:', specialiteId);

      if (!specialiteId || !semestre) {
        console.log('specialiteId or semestre is null or undefined');
        return { salles: [], groupes: [], modules: [], enseignants: [] };
      }

      const [salles] = await pool.query(
        'SELECT ID_salle, nom_salle, type_salle FROM Salle WHERE disponible = 1'
      );
      console.log('Salles récupérées:', salles);

      const [groupes] = await pool.query(
        'SELECT ID_groupe, num_groupe FROM Groupe WHERE ID_section = ?',
        [sectionId]
      );
      console.log('Groupes récupérés pour sectionId', sectionId, ':', groupes);

      const [modules] = await pool.query(
        'SELECT m.ID_module, m.nom_module, m.seances ' +
        'FROM Module m ' +
        'JOIN module_section ms ON m.ID_module = ms.ID_module ' +
        'WHERE ms.ID_section = ? AND ms.semestre = ?',
        [sectionId, semestre]
      );
      console.log('Modules récupérés pour sectionId', sectionId, 'et semestre', semestre, ':', modules);

      const [enseignants] = await pool.query(`
        SELECT DISTINCT u.Matricule, u.nom, u.prenom 
        FROM User u
        JOIN Enseignant e ON u.Matricule = e.Matricule
        JOIN Module_Enseignant me ON e.Matricule = me.Matricule
        JOIN Module m ON me.ID_module = m.ID_module
        JOIN enseignant_section es ON e.Matricule = es.Matricule
        WHERE m.ID_specialite = ? AND es.ID_section = ?`,
        [specialiteId, sectionId]
      );
      console.log('Enseignants récupérés:', enseignants);

      return {
        salles: salles || [],
        groupes: groupes || [],
        modules: modules || [],
        enseignants: enseignants || []
      };
    } catch (err) {
      console.error('Error in getSessionOptions:', err.message);
      return { salles: [], groupes: [], modules: [], enseignants: [] };
    }
  },

  checkConflicts: async (ID_salle, Matricule, jour, time_slot, type_seance, ID_groupe, ID_section, ID_module, excludeSessionId = null) => {
    try {
      const [enseignantSection] = await pool.query(
        'SELECT COUNT(*) as count FROM enseignant_section WHERE Matricule = ? AND ID_section = ?',
        [Matricule, ID_section]
      );
      if (enseignantSection[0].count === 0) {
        const [enseignantInfo] = await pool.query(
          'SELECT nom, prenom FROM User WHERE Matricule = ?',
          [Matricule]
        );
        const nomEnseignant = enseignantInfo.length > 0 ? `${enseignantInfo[0].prenom} ${enseignantInfo[0].nom}` : Matricule;
        return `L'enseignant ${nomEnseignant} n'est pas associé à cette section.`;
      }

      const [salleInfo] = await pool.query(
        'SELECT nom_salle FROM Salle WHERE ID_salle = ?',
        [ID_salle]
      );
      const nomSalle = salleInfo.length > 0 ? salleInfo[0].nom_salle : ID_salle;

      const [enseignantInfo] = await pool.query(
        'SELECT nom, prenom FROM User WHERE Matricule = ?',
        [Matricule]
      );
      const nomEnseignant = enseignantInfo.length > 0 ? `${enseignantInfo[0].prenom} ${enseignantInfo[0].nom}` : Matricule;

      const [newSessionSemestre] = await pool.query(
        'SELECT semestre FROM module_section WHERE ID_module = ? AND ID_section = ?',
        [ID_module, ID_section]
      );
      const semestreNew = newSessionSemestre.length > 0 ? parseInt(newSessionSemestre[0].semestre) : null;
      if (!semestreNew) {
        throw new Error('Semestre non trouvé pour ce module et cette section');
      }
      const isNewSemestreImpair = semestreNew % 2 !== 0;

      const salleQuery = `
        SELECT s.ID_seance, ms.semestre 
        FROM Seance s
        JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
        WHERE s.ID_salle = ? AND s.jour = ? AND s.time_slot = ? 
        ${excludeSessionId ? 'AND s.ID_seance != ?' : ''}
      `;
      const salleParams = excludeSessionId ? [ID_salle, jour, time_slot, excludeSessionId] : [ID_salle, jour, time_slot];
      const [salleRows] = await pool.query(salleQuery, salleParams);
      if (salleRows.length > 0) {
        const hasConflict = salleRows.some(row => {
          const semestreExisting = parseInt(row.semestre);
          const isExistingSemestreImpair = semestreExisting % 2 !== 0;
          return isNewSemestreImpair === isExistingSemestreImpair;
        });
        if (hasConflict) {
          return `La salle ${nomSalle} est déjà utilisée pour le créneau ${jour} ${time_slot}.`;
        }
      }

      const teacherQuery = `
        SELECT s.ID_seance, ms.semestre 
        FROM Seance s
        JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
        WHERE s.Matricule = ? AND s.jour = ? AND s.time_slot = ? 
        ${excludeSessionId ? 'AND s.ID_seance != ?' : ''}
      `;
      const teacherParams = excludeSessionId ? [Matricule, jour, time_slot, excludeSessionId] : [Matricule, jour, time_slot];
      const [teacherRows] = await pool.query(teacherQuery, teacherParams);
      if (teacherRows.length > 0) {
        const hasConflict = teacherRows.some(row => {
          const semestreExisting = parseInt(row.semestre);
          const isExistingSemestreImpair = semestreExisting % 2 !== 0;
          return isNewSemestreImpair === isExistingSemestreImpair;
        });
        if (hasConflict) {
          return `L'enseignant ${nomEnseignant} est déjà affecté à une autre séance pour le créneau ${jour} ${time_slot}.`;
        }
      }

      const existingSessionsQuery = `
        SELECT s.ID_seance, s.type_seance, s.ID_groupe, s.ID_module, ms.semestre 
        FROM Seance s
        JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
        WHERE s.jour = ? AND s.time_slot = ? AND s.ID_section = ?
        ${excludeSessionId ? 'AND s.ID_seance != ?' : ''}
      `;
      const existingSessionsParams = excludeSessionId ? [jour, time_slot, ID_section, excludeSessionId] : [jour, time_slot, ID_section];
      const [existingSessions] = await pool.query(existingSessionsQuery, existingSessionsParams);
      console.log('Existing sessions for', jour, time_slot, ID_section, ':', existingSessions);

      const relevantSessions = existingSessions.filter(session => {
        const semestreExisting = parseInt(session.semestre);
        const isExistingSemestreImpair = semestreExisting % 2 !== 0;
        return isNewSemestreImpair === isExistingSemestreImpair;
      });
      console.log('Relevant sessions (same semestre parity):', relevantSessions);

      if (type_seance === 'TD' || type_seance === 'TP') {
        const hasCours = relevantSessions.some(session => session.type_seance === 'cours');
        if (hasCours) {
          return `Impossible d'ajouter un ${type_seance} dans une case contenant un cours (${jour} ${time_slot}).`;
        }

        if (ID_groupe) {
          const parsedGroupId = parseInt(ID_groupe);
          console.log('Parsed ID_groupe:', parsedGroupId, 'Original ID_groupe:', ID_groupe);

          const [groupeInfo] = await pool.query(
            'SELECT num_groupe FROM Groupe WHERE ID_groupe = ?',
            [parsedGroupId]
          );
          const numGroupe = groupeInfo.length > 0 ? groupeInfo[0].num_groupe : parsedGroupId;
          console.log('Checking group conflict for group:', numGroupe, 'ID_groupe:', parsedGroupId);

          const groupConflict = existingSessions.some(session => {
            const isSameGroup = parseInt(session.ID_groupe) === parsedGroupId;
            const isTDorTP = session.type_seance === 'TD' || session.type_seance === 'TP';
            console.log('Session:', session, 'isSameGroup:', isSameGroup, 'isTDorTP:', isTDorTP);
            return isSameGroup && isTDorTP;
          });
          if (groupConflict) {
            console.log('Group conflict detected for group', numGroupe, 'in', jour, time_slot);
            return `Le groupe ${numGroupe} a déjà une séance TD ou TP dans le créneau ${jour} ${time_slot}.`;
          }

          const moduleTypeConflict = relevantSessions.some(session => 
            session.ID_module === ID_module && 
            session.type_seance === type_seance && 
            parseInt(session.ID_groupe) === parsedGroupId
          );
          if (moduleTypeConflict) {
            return `Le groupe ${numGroupe} a déjà une séance de ${type_seance} pour ce module dans le créneau ${jour} ${time_slot}.`;
          }
        } else {
          return `ID_groupe est requis pour une séance de type ${type_seance}.`;
        }
      }

      if (type_seance === 'cours') {
        if (relevantSessions.length > 0) {
          return `Un cours ne peut pas être ajouté dans une case déjà occupée par des TD/TP (${jour} ${time_slot}).`;
        }
      }

      const moduleTeacherQuery = `
        SELECT COUNT(*) as count 
        FROM module_enseignant 
        WHERE ID_module = ? AND Matricule = ?
      `;
      const [moduleTeacherRows] = await pool.query(moduleTeacherQuery, [ID_module, Matricule]);
      if (moduleTeacherRows[0].count === 0) {
        return `L'enseignant ${nomEnseignant} n'est pas autorisé à enseigner ce module.`;
      }

      console.log('No conflicts found for', jour, time_slot, 'group', ID_groupe);
      return null;
    } catch (err) {
      console.error('Error in checkConflicts:', err.message);
      throw err;
    }
  },

  getModuleEnseignants: async (moduleId) => {
    try {
      console.log('Fetching enseignants for moduleId:', moduleId);
      const [enseignants] = await pool.query(`
        SELECT DISTINCT u.Matricule, u.nom, u.prenom 
        FROM User u
        JOIN Module_Enseignant me ON u.Matricule = me.Matricule
        WHERE me.ID_module = ?
      `, [moduleId]);
      console.log('Enseignants found for moduleId', moduleId, ':', enseignants);
      return enseignants;
    } catch (err) {
      console.error('Error in getModuleEnseignants:', err.message);
      throw err;
    }
  },

  generateTimetablesForAllSections: async (semestreGroup, preserveExisting = false) => {
    try {
      console.log(`Starting automatic timetable generation for semestre group ${semestreGroup}`);

      const targetSemestres = semestreGroup === '1' ? [1, 3, 5] : [2, 4, 6];
      console.log('Target semestres:', targetSemestres);

      if (!preserveExisting) {
        await pool.query('DELETE FROM Seance WHERE ID_section IN (SELECT ID_section FROM module_section WHERE semestre IN (?, ?, ?))', [...targetSemestres]);
        console.log('Séances existantes supprimées pour les semestres ciblés');
      } else {
        console.log('Préservation des séances existantes activée');
      }

      const [sections] = await pool.query('SELECT ID_section, niveau FROM Section');
      if (!sections.length) {
        throw new Error('Aucune section trouvée');
      }

      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Samedi', 'Dimanche'];
      const timeSlots = [
        '08:00 - 09:30',
        '09:40 - 11:10',
        '11:20 - 12:50',
        '13:00 - 14:30',
        '14:40 - 16:10', // Utilisé en dernier recours
        '16:20 - 17:50'  // Utilisé en dernier recours
      ];
      const preferredSlots = timeSlots.slice(0, 4); // Créneaux préférés : 08:00 - 13:00
      const fallbackSlots = timeSlots.slice(4); // Créneaux à éviter : 14:40 - 17:50

      const [salles] = await pool.query('SELECT ID_salle, type_salle FROM Salle WHERE disponible = 1');
      if (!salles.length) {
        throw new Error('Aucune salle disponible dans la base de données');
      }
      const hasTPSalles = salles.some(s => s.type_salle === 'TP' || s.type_salle === 'TP/TD');
      if (!hasTPSalles) {
        console.warn('Aucune salle de type TP ou TP/TD disponible, les séances TP ne pourront pas être planifiées');
      }

      const report = {
        success: true,
        plannedSessions: 0,
        failedSessions: [],
        warnings: [],
        ignoredSections: [],
        ignoredModules: []
      };

      for (const section of sections) {
        const sectionId = section.ID_section;

        const [sectionEnseignants] = await pool.query(
          'SELECT Matricule FROM enseignant_section WHERE ID_section = ?',
          [sectionId]
        );
        
        if (sectionEnseignants.length === 0) {
          console.log(`Aucun enseignant associé à la section ${sectionId}, ignorée`);
          report.ignoredSections.push(`${sectionId} (pas d'enseignants associés)`);
          continue;
        }

        const [semestres] = await pool.query(
          'SELECT DISTINCT semestre FROM module_section WHERE ID_section = ? AND semestre IN (?, ?, ?)',
          [sectionId, ...targetSemestres]
        );
        if (!semestres.length) {
          console.log(`Aucun semestre cible trouvé pour la section ${sectionId}, ignorée`);
          report.ignoredSections.push(sectionId);
          continue;
        }

        for (const { semestre } of semestres) {
          console.log(`Generating timetable for section ${sectionId}, semestre ${semestre}`);

          const [modules] = await pool.query(
            'SELECT m.ID_module, m.nom_module, m.seances ' +
            'FROM Module m ' +
            'JOIN module_section ms ON m.ID_module = ms.ID_module ' +
            'WHERE ms.ID_section = ? AND ms.semestre = ?',
            [sectionId, semestre]
          );

          if (modules.length === 0) {
            console.log(`Aucun module trouvé pour la section ${sectionId}, semestre ${semestre}, ignorée`);
            report.ignoredSections.push(`${sectionId} (semestre ${semestre})`);
            continue;
          }

          const [groupes] = await pool.query(
            'SELECT ID_groupe FROM Groupe WHERE ID_section = ?',
            [sectionId]
          );
          if (groupes.length === 0) {
            console.warn(`Aucun groupe trouvé pour la section ${sectionId}, ignorée`);
            report.ignoredSections.push(`${sectionId} (pas de groupes)`);
            continue;
          }

          if (groupes.length !== 4) {
            console.warn(`La section ${sectionId} a ${groupes.length} groupes au lieu de 4 attendus`);
            report.warnings.push(`Section ${sectionId}: ${groupes.length} groupes au lieu de 4`);
          }

          const [moduleEnseignants] = await pool.query(
            'SELECT me.ID_module, me.Matricule ' +
            'FROM module_enseignant me ' +
            'WHERE me.ID_module IN (SELECT ID_module FROM module_section WHERE ID_section = ? AND semestre = ?)',
            [sectionId, semestre]
          );
          const enseignantsByModule = {};
          moduleEnseignants.forEach(({ ID_module, Matricule }) => {
            if (!enseignantsByModule[ID_module]) enseignantsByModule[ID_module] = [];
            enseignantsByModule[ID_module].push({ Matricule });
          });

          const modulesWithSectionEnseignants = filterModulesWithSectionEnseignants(
            modules, 
            enseignantsByModule, 
            sectionEnseignants
          );
          
          const ignoredModules = modules.filter(module => 
            !modulesWithSectionEnseignants.includes(module)
          );
          
          if (ignoredModules.length > 0) {
            console.log(`${ignoredModules.length} modules ignorés pour la section ${sectionId}, semestre ${semestre} (pas d'enseignants associés à la section)`);
            ignoredModules.forEach(module => {
              report.ignoredModules.push(`Module ${module.ID_module} (section ${sectionId}, semestre ${semestre})`);
            });
          }
          
          if (modulesWithSectionEnseignants.length === 0) {
            console.warn(`Aucun module avec enseignants associés à la section ${sectionId}, semestre ${semestre}, ignorée`);
            report.ignoredSections.push(`${sectionId} (semestre ${semestre}, pas d'enseignants associés)`);
            continue;
          }

          const timetablePlan = {};
          days.forEach(day => {
            timetablePlan[day] = {};
            timeSlots.forEach(slot => {
              timetablePlan[day][slot] = [];
            });
          });

          // Étape 6 : Planifier les cours (1 par module, max 3 par jour)
          for (const module of modulesWithSectionEnseignants) {
            const moduleId = module.ID_module;
            const seances = module.seances.split('/');

            if (seances.includes('Cour')) {
              let scheduled = false;
              const typeSeanceNormalized = 'cours';

              const moduleEnseignantsForSection = filterEnseignantsBySection(
                enseignantsByModule[moduleId] || [], 
                sectionEnseignants
              );
              
              if (moduleEnseignantsForSection.length === 0) {
                console.warn(`Aucun enseignant associé à la section pour le module ${moduleId}, cours ignoré`);
                report.ignoredModules.push(`Module ${moduleId} (section ${sectionId}, semestre ${semestre}, pas d'enseignants associés)`);
                continue;
              }

              // Essayer d'abord les créneaux préférés
              const slotsToTry = [...preferredSlots, ...fallbackSlots];

              for (const day of days) {
                // Compter les cours déjà planifiés ce jour
                let coursCount = 0;
                timeSlots.forEach(slot => {
                  coursCount += timetablePlan[day][slot].filter(s => s.typeSeanceNormalized === 'cours').length;
                });
                if (coursCount >= 3) {
                  console.log(`Maximum de 3 cours atteint pour ${day}, passant au jour suivant`);
                  continue; // Passer au jour suivant
                }

                for (const timeSlot of slotsToTry) {
                  if (timetablePlan[day][timeSlot].length > 0) {
                    continue;
                  }

                  const enseignant = await getLeastLoadedEnseignant(moduleEnseignantsForSection, day, pool);
                  if (!enseignant) {
                    console.warn(`Aucun enseignant disponible pour ${typeSeanceNormalized}, module ${moduleId}`);
                    continue;
                  }

                  const salle = salles.find(s => s.type_salle === 'Cour');
                  if (!salle) {
                    console.warn(`Aucune salle disponible pour ${typeSeanceNormalized}, module ${moduleId}`);
                    continue;
                  }

                  const conflict = await Timetable.checkConflicts(
                    salle.ID_salle,
                    enseignant.Matricule,
                    day,
                    timeSlot,
                    typeSeanceNormalized,
                    null,
                    sectionId,
                    moduleId
                  );

                  if (!conflict) {
                    await pool.query(
                      'INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section) ' +
                      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                      [salle.ID_salle, enseignant.Matricule, typeSeanceNormalized, null, moduleId, day, timeSlot, sectionId]
                    );
                    scheduled = true;
                    report.plannedSessions += 1;
                    console.log(`Séance ajoutée: ${typeSeanceNormalized} pour module ${moduleId}, section ${sectionId}, semestre ${semestre}, groupe aucun`);
                    timetablePlan[day][timeSlot].push({ moduleId, typeSeanceNormalized, groupe: null });
                    break;
                  } else {
                    console.log(`Conflit pour ${typeSeanceNormalized}, module ${moduleId}: ${conflict}`);
                  }
                }
                if (scheduled) break;
              }
              if (!scheduled) {
                console.warn(`Impossible de planifier ${typeSeanceNormalized} pour module ${moduleId}, section ${sectionId}, semestre ${semestre}`);
                report.failedSessions.push(`Cours pour module ${moduleId}, section ${sectionId}: Impossible à planifier`);
              }
            }
          }

          // Étape 7 : Collecter toutes les séances TD/TP à planifier
          const tdTpSessions = [];
          for (const module of modulesWithSectionEnseignants) {
            const moduleId = module.ID_module;
            const seances = module.seances.split('/');

            const moduleEnseignantsForSection = filterEnseignantsBySection(
              enseignantsByModule[moduleId] || [], 
              sectionEnseignants
            );
            
            if (moduleEnseignantsForSection.length === 0) {
              continue;
            }

            for (const typeSeance of seances.filter(s => s === 'TD' || s === 'TP')) {
              const typeSeanceNormalized = typeSeance;
              for (const groupe of groupes.map(g => g.ID_groupe)) {
                tdTpSessions.push({ 
                  moduleId, 
                  typeSeanceNormalized, 
                  groupe, 
                  enseignants: moduleEnseignantsForSection 
                });
              }
            }
          }

          // Étape 8 : Planifier les TD/TP en regroupant les 4 groupes par créneau
          const groupedSessions = groupSessionsByModuleAndType(tdTpSessions);
          
          // Créer une liste de toutes les séances TD/TP à planifier
          const allTdTpSessions = Object.values(groupedSessions).flat();
          
          // Planifier par groupes de 4 séances (pour 4 groupes différents)
          const groupIds = groupes.map(g => g.ID_groupe);
          
          // Mélanger les séances pour éviter de favoriser un module
          const shuffledSessions = allTdTpSessions.sort(() => Math.random() - 0.5);
          
          const sessionsToSchedule = [];
          for (const session of shuffledSessions) {
            const alreadyScheduled = Object.values(timetablePlan).some(daySlots => 
              Object.values(daySlots).some(slotSessions => 
                slotSessions.some(s => 
                  s.moduleId === session.moduleId && 
                  s.typeSeanceNormalized === session.typeSeanceNormalized && 
                  s.groupe === session.groupe
                )
              )
            );
            if (!alreadyScheduled) {
              sessionsToSchedule.push(session);
            }
          }

          // Essayer de planifier les séances par groupes de 4
          let attempts = 0;
          const maxAttempts = days.length * preferredSlots.length * 2; // Limiter les tentatives

          while (sessionsToSchedule.length > 0 && attempts < maxAttempts) {
            attempts++;
            
            // Essayer d'abord les créneaux préférés
            const slotsToTry = [...preferredSlots, ...fallbackSlots];
            const day = days[Math.floor(Math.random() * days.length)];
            const timeSlot = slotsToTry[Math.floor(Math.random() * slotsToTry.length)];

            // Vérifier si le créneau contient un cours
            if (timetablePlan[day][timeSlot].some(s => s.typeSeanceNormalized === 'cours')) {
              continue;
            }

            // Vérifier si le créneau a encore de la place pour 4 séances
            if (timetablePlan[day][timeSlot].length > 0) {
              continue; // Créneau déjà occupé
            }

            // Sélectionner jusqu'à 4 séances pour différents groupes et modules
            const availableSessions = sessionsToSchedule.filter(session => {
              // Vérifier si le groupe n'a pas déjà une séance dans ce créneau
              return !timetablePlan[day][timeSlot].some(s => s.groupe === session.groupe);
            });

            if (availableSessions.length < 4 && sessionsToSchedule.length >= 4) {
              continue; // Pas assez de séances pour remplir le créneau
            }

            const sessionsToPlan = [];
            const usedGroups = new Set();
            const usedModules = new Set();

            // Sélectionner jusqu'à 4 séances (1 par groupe, modules différents si possible)
            for (const session of availableSessions) {
              if (
                !usedGroups.has(session.groupe) && 
                sessionsToPlan.length < 4 && 
                !usedModules.has(session.moduleId)
              ) {
                sessionsToPlan.push(session);
                usedGroups.add(session.groupe);
                usedModules.add(session.moduleId);
              }
            }

            // Si moins de 4 séances disponibles, utiliser ce qui reste
            if (sessionsToPlan.length < 4 && sessionsToSchedule.length < 4) {
              sessionsToPlan.push(...availableSessions.slice(0, 4 - sessionsToPlan.length));
            }

            if (sessionsToPlan.length === 0) {
              continue;
            }

            // Tenter de planifier les séances sélectionnées
            let allScheduled = true;
            for (const session of sessionsToPlan) {
              const { moduleId, typeSeanceNormalized, groupe, enseignants } = session;

              const enseignant = await getLeastLoadedEnseignant(enseignants, day, pool);
              if (!enseignant) {
                allScheduled = false;
                continue;
              }

              const salleOptions = salles.filter(s => 
                (typeSeanceNormalized === 'TD' && (s.type_salle === 'TD' || s.type_salle === 'TP/TD')) ||
                (typeSeanceNormalized === 'TP' && (s.type_salle === 'TP' || s.type_salle === 'TP/TD'))
              );

              if (salleOptions.length === 0) {
                allScheduled = false;
                continue;
              }

              let scheduled = false;
              for (const salle of salleOptions) {
                const conflict = await Timetable.checkConflicts(
                  salle.ID_salle,
                  enseignant.Matricule,
                  day,
                  timeSlot,
                  typeSeanceNormalized,
                  groupe,
                  sectionId,
                  moduleId
                );

                if (!conflict) {
                  await pool.query(
                    'INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section) ' +
                    'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [salle.ID_salle, enseignant.Matricule, typeSeanceNormalized, groupe, moduleId, day, timeSlot, sectionId]
                  );

                  timetablePlan[day][timeSlot].push({ 
                    moduleId, 
                    typeSeanceNormalized, 
                    groupe 
                  });

                  report.plannedSessions++;
                  scheduled = true;
                  console.log(`Séance ajoutée: ${typeSeanceNormalized} pour module ${moduleId}, section ${sectionId}, groupe ${groupe} (${day} ${timeSlot})`);

                  // Retirer la séance planifiée
                  const index = sessionsToSchedule.findIndex(s => 
                    s.moduleId === moduleId && 
                    s.typeSeanceNormalized === typeSeanceNormalized && 
                    s.groupe === groupe
                  );
                  if (index !== -1) {
                    sessionsToSchedule.splice(index, 1);
                  }
                  break;
                }
              }

              if (!scheduled) {
                allScheduled = false;
                console.log(`Impossible de planifier ${typeSeanceNormalized} pour module ${moduleId}, groupe ${groupe} dans ce créneau`);
              }
            }

            if (!allScheduled) {
              // Annuler les séances planifiées dans ce créneau si toutes ne peuvent pas être planifiées
              timetablePlan[day][timeSlot] = [];
              console.log(`Créneau ${day} ${timeSlot} annulé car toutes les séances n'ont pas pu être planifiées`);
            }
          }

          // Étape 9 : Planifier les séances restantes (si moins de 4)
          for (const session of sessionsToSchedule) {
            const { moduleId, typeSeanceNormalized, groupe, enseignants } = session;
            let scheduled = false;

            for (const day of days) {
              for (const timeSlot of preferredSlots) {
                if (timetablePlan[day][timeSlot].some(s => s.typeSeanceNormalized === 'cours')) {
                  continue;
                }

                const enseignant = await getLeastLoadedEnseignant(enseignants, day, pool);
                if (!enseignant) continue;

                const salleOptions = salles.filter(s => 
                  (typeSeanceNormalized === 'TD' && (s.type_salle === 'TD' || s.type_salle === 'TP/TD')) ||
                  (typeSeanceNormalized === 'TP' && (s.type_salle === 'TP' || s.type_salle === 'TP/TD'))
                );

                if (salleOptions.length === 0) continue;

                for (const salle of salleOptions) {
                  const conflict = await Timetable.checkConflicts(
                    salle.ID_salle,
                    enseignant.Matricule,
                    day,
                    timeSlot,
                    typeSeanceNormalized,
                    groupe,
                    sectionId,
                    moduleId
                  );

                  if (!conflict) {
                    await pool.query(
                      'INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section) ' +
                      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                      [salle.ID_salle, enseignant.Matricule, typeSeanceNormalized, groupe, moduleId, day, timeSlot, sectionId]
                    );

                    timetablePlan[day][timeSlot].push({ 
                      moduleId, 
                      typeSeanceNormalized, 
                      groupe 
                    });

                    report.plannedSessions++;
                    scheduled = true;
                    console.log(`Séance ajoutée (reste): ${typeSeanceNormalized} pour module ${moduleId}, section ${sectionId}, groupe ${groupe} (${day} ${timeSlot})`);
                    break;
                  }
                }
                if (scheduled) break;
              }
              if (scheduled) break;
            }

            if (!scheduled) {
              console.warn(`Impossible de planifier ${typeSeanceNormalized} pour module ${moduleId}, groupe ${groupe}`);
              report.warnings.push(`Module ${moduleId}, type ${typeSeanceNormalized}, groupe ${groupe}: Impossible à planifier`);
            }
          }
        }
      }

      console.log(`Rapport final: ${report.plannedSessions} séances planifiées, ${report.failedSessions.length} échecs, ${report.warnings.length} avertissements`);
      console.log(`Sections ignorées: ${report.ignoredSections.length}, Modules ignorés: ${report.ignoredModules.length}`);
      
      if (report.failedSessions.length || report.warnings.length) {
        report.success = report.plannedSessions > 0;
        report.message = `Génération partielle: ${report.plannedSessions} séances planifiées. ` +
                         `Problèmes: ${report.failedSessions.length} échecs, ${report.warnings.length} avertissements. ` +
                         `Sections ignorées: ${report.ignoredSections.length}, Modules ignorés: ${report.ignoredModules.length}`;
      } else {
        report.message = `Emplois du temps générés avec succès pour les semestres ${targetSemestres.join(', ')}`;
      }
      return report;
    } catch (err) {
      console.error('Error in generateTimetablesForAllSections:', err.message);
      return { 
        success: false, 
        error: err.message, 
        warnings: [], 
        failedSessions: [], 
        plannedSessions: 0,
        ignoredSections: [],
        ignoredModules: []
      };
    }
  }
};

export default Timetable;
