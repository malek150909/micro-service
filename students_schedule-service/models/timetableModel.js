import pool from '../config/db.js';

const Timetable = {
  // models/timetableModel.js
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
               sa.nom_salle AS room, g.num_groupe AS "group"  -- Remplacer s.ID_salle par sa.nom_salle
        FROM Seance s
        LEFT JOIN Module m ON s.ID_module = m.ID_module
        LEFT JOIN User u ON s.Matricule = u.Matricule
        LEFT JOIN Salle sa ON s.ID_salle = sa.ID_salle  -- Ajouter la jointure avec Salle
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

      // Passer ID_module à checkConflicts
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

      // Passer ID_module à checkConflicts
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

  // models/timetableModel.js
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
        WHERE m.ID_specialite = ?`,
        [specialiteId]
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
      // Récupérer nom_salle pour ID_salle
      const [salleInfo] = await pool.query(
        'SELECT nom_salle FROM Salle WHERE ID_salle = ?',
        [ID_salle]
      );
      const nomSalle = salleInfo.length > 0 ? salleInfo[0].nom_salle : ID_salle;

      // Récupérer nom et prenom pour Matricule
      const [enseignantInfo] = await pool.query(
        'SELECT nom, prenom FROM User WHERE Matricule = ?',
        [Matricule]
      );
      const nomEnseignant = enseignantInfo.length > 0 ? `${enseignantInfo[0].prenom} ${enseignantInfo[0].nom}` : Matricule;

      // Récupérer le semestre de la nouvelle séance (via ID_module et ID_section)
      const [newSessionSemestre] = await pool.query(
        'SELECT semestre FROM module_section WHERE ID_module = ? AND ID_section = ?',
        [ID_module, ID_section]
      );
      const semestreNew = newSessionSemestre.length > 0 ? parseInt(newSessionSemestre[0].semestre) : null;
      if (!semestreNew) {
        throw new Error('Semestre non trouvé pour ce module et cette section');
      }
      const isNewSemestreImpair = semestreNew % 2 !== 0; // Vrai pour 1, 3, 5

      // Vérifier conflit de salle
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

      // Vérifier conflit d'enseignant
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

      // Vérifier les séances existantes dans la case (pour type_seance et groupe)
      const existingSessionsQuery = `
        SELECT s.ID_seance, s.type_seance, s.ID_groupe, ms.semestre 
        FROM Seance s
        JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
        WHERE s.jour = ? AND s.time_slot = ? AND s.ID_section = ?
        ${excludeSessionId ? 'AND s.ID_seance != ?' : ''}
      `;
      const existingSessionsParams = excludeSessionId ? [jour, time_slot, ID_section, excludeSessionId] : [jour, time_slot, ID_section];
      const [existingSessions] = await pool.query(existingSessionsQuery, existingSessionsParams);

      if (type_seance === 'TD' || type_seance === 'TP') {
        const relevantSessions = existingSessions.filter(session => {
          const semestreExisting = parseInt(session.semestre);
          const isExistingSemestreImpair = semestreExisting % 2 !== 0;
          return isNewSemestreImpair === isExistingSemestreImpair;
        });

        if (relevantSessions.length >= 4) {
          return `Limite atteinte : maximum 4 séances TD/TP pour le créneau ${jour} ${time_slot}.`;
        }
        const hasCours = relevantSessions.some(session => session.type_seance === 'cours');
        if (hasCours) {
          return `Impossible d’ajouter un ${type_seance} dans une case contenant un cours (${jour} ${time_slot}).`;
        }
        if (ID_groupe) {
          const [groupeInfo] = await pool.query(
            'SELECT num_groupe FROM Groupe WHERE ID_groupe = ?',
            [ID_groupe]
          );
          const numGroupe = groupeInfo.length > 0 ? groupeInfo[0].num_groupe : ID_groupe;

          // Vérifier si le groupe est déjà assigné dans ce créneau
          const groupConflict = relevantSessions.some(session => {
            console.log(`Comparing ID_groupe: ${session.ID_groupe} with ${ID_groupe}`);
            return session.ID_groupe === ID_groupe;
          });
          if (groupConflict) {
            return `Le groupe ${numGroupe} est déjà assigné à une séance dans le créneau ${jour} ${time_slot}.`;
          }

          // Vérification supplémentaire : un seul TD/TP par jour pour le groupe
          const groupDayQuery = `
            SELECT s.ID_seance, ms.semestre 
            FROM Seance s
            JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
            WHERE s.ID_groupe = ? AND s.jour = ? AND s.type_seance IN ('TD', 'TP')
            ${excludeSessionId ? 'AND s.ID_seance != ?' : ''}
          `;
          const groupDayParams = excludeSessionId ? [ID_groupe, jour, excludeSessionId] : [ID_groupe, jour];
          const [groupDayRows] = await pool.query(groupDayQuery, groupDayParams);

          if (groupDayRows.length > 0) {
            const hasConflict = groupDayRows.some(row => {
              const semestreExisting = parseInt(row.semestre);
              const isExistingSemestreImpair = semestreExisting % 2 !== 0;
              return isNewSemestreImpair === isExistingSemestreImpair;
            });
            if (hasConflict) {
              return `Le groupe ${numGroupe} a déjà une séance TD ou TP le ${jour}.`;
            }
          }
        } else {
          return `ID_groupe est requis pour une séance de type ${type_seance}.`;
        }
      }

      if (type_seance === 'cours') {
        if (existingSessions.length > 0) {
          const hasConflict = existingSessions.some(session => {
            const semestreExisting = parseInt(session.semestre);
            const isExistingSemestreImpair = semestreExisting % 2 !== 0;
            return isNewSemestreImpair === isExistingSemestreImpair;
          });
          if (hasConflict) {
            return `Un cours ne peut pas être ajouté dans une case déjà occupée (${jour} ${time_slot}).`;
          }
        }
      }

      // Vérifier si l'enseignant peut enseigner ce module
      const moduleTeacherQuery = `
        SELECT COUNT(*) as count 
        FROM module_enseignant 
        WHERE ID_module = ? AND Matricule = ?
      `;
      const [moduleTeacherRows] = await pool.query(moduleTeacherQuery, [ID_module, Matricule]);
      if (moduleTeacherRows[0].count === 0) {
        return `L'enseignant ${nomEnseignant} n’est pas autorisé à enseigner ce module.`;
      }

      return null; // Pas de conflit
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

  generateTimetablesForAllSections: async (semestreGroup) => {
    try {
      console.log(`Starting automatic timetable generation for semestre group ${semestreGroup}`);

      // Définir les semestres cibles
      const targetSemestres = semestreGroup === '1' ? [1, 3, 5] : [2, 4, 6];
      console.log('Target semestres:', targetSemestres);

      // Étape 1 : Supprimer toutes les séances existantes
      await pool.query('DELETE FROM Seance');
      console.log('Toutes les séances existantes ont été supprimées');

      // Étape 2 : Récupérer toutes les sections
      const [sections] = await pool.query('SELECT ID_section, niveau FROM Section');
      if (!sections.length) {
        throw new Error('Aucune section trouvée');
      }

      // Étape 3 : Définir les jours et créneaux
      const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Samedi', 'Dimanche'];
      const timeSlots = [
        '08:00 - 09:30',
        '09:40 - 11:10',
        '11:20 - 12:50',
        '13:00 - 14:30',
        '14:40 - 16:10',
        '16:20 - 17:50'
      ];
      const morningSlots = timeSlots.slice(0, 3); // 08:00 - 12:50
      const afternoonSlots = timeSlots.slice(3);   // 13:00 - 17:50

      // Étape 4 : Récupérer toutes les salles disponibles
      const [salles] = await pool.query('SELECT ID_salle, type_salle FROM Salle WHERE disponible = 1');
      if (!salles.length) {
        throw new Error('Aucune salle disponible dans la base de données');
      }
      const hasTPSalles = salles.some(s => s.type_salle === 'TP' || s.type_salle === 'TP/TD');
      if (!hasTPSalles) {
        console.warn('Aucune salle de type TP ou TP/TD disponible, les séances TP ne pourront pas être planifiées');
      }

      // Étape 5 : Boucler sur chaque section
      for (const section of sections) {
        const sectionId = section.ID_section;

        // Récupérer les semestres associés à cette section, filtrés par le groupe cible
        const [semestres] = await pool.query(
          'SELECT DISTINCT semestre FROM module_section WHERE ID_section = ? AND semestre IN (?, ?, ?)',
          [sectionId, ...targetSemestres]
        );
        if (!semestres.length) {
          console.log(`Aucun semestre cible trouvé pour la section ${sectionId}, ignorée`);
          continue;
        }

        for (const { semestre } of semestres) {
          console.log(`Generating timetable for section ${sectionId}, semestre ${semestre}`);

          // Récupérer les modules pour cette section et ce semestre
          const [modules] = await pool.query(
            'SELECT m.ID_module, m.seances ' +
            'FROM Module m ' +
            'JOIN module_section ms ON m.ID_module = ms.ID_module ' +
            'WHERE ms.ID_section = ? AND ms.semestre = ?',
            [sectionId, semestre]
          );

          // Récupérer les groupes pour cette section
          const [groupes] = await pool.query(
            'SELECT ID_groupe FROM Groupe WHERE ID_section = ?',
            [sectionId]
          );
          if (groupes.length === 0) {
            console.warn(`Aucun groupe trouvé pour la section ${sectionId}, ignorée`);
            continue;
          }
          if (groupes.length < 4) {
            console.warn(`Section ${sectionId} a seulement ${groupes.length} groupes au lieu de 4 attendus`);
          }
          console.log(`Groupes pour section ${sectionId}: ${groupes.length}`);

          // Planification par jour et créneau
          const timetablePlan = {};
          days.forEach(day => {
            timetablePlan[day] = {};
            timeSlots.forEach(slot => {
              timetablePlan[day][slot] = [];
            });
          });

          // Étape 6 : Planifier les cours (1 par module)
          for (const module of modules) {
            const moduleId = module.ID_module;
            const seances = module.seances.split('/');

            const [enseignants] = await pool.query(
              'SELECT Matricule FROM module_enseignant WHERE ID_module = ?',
              [moduleId]
            );
            if (!enseignants.length) {
              console.warn(`Aucun enseignant trouvé pour le module ${moduleId}, ignoré`);
              continue;
            }

            if (seances.includes('Cour')) {
              let scheduled = false;
              const typeSeanceNormalized = 'cours';

              for (const day of days) {
                const slotsToTry = [...morningSlots, ...afternoonSlots];
                for (const timeSlot of slotsToTry) {
                  const enseignant = enseignants[Math.floor(Math.random() * enseignants.length)];
                  const salle = salles.find(s => s.type_salle === 'Cour');
                  if (!salle) {
                    console.warn(`Aucune salle disponible pour ${typeSeanceNormalized}, module ${moduleId}`);
                    break;
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
                    console.log(`Séance ajoutée: ${typeSeanceNormalized} pour module ${moduleId}, section ${sectionId}, semestre ${semestre}, groupe aucun`);
                    timetablePlan[day][timeSlot].push({ moduleId, typeSeanceNormalized, groupe: null });
                    break;
                  }
                }
                if (scheduled) break;
              }
              if (!scheduled) {
                console.warn(`Impossible de planifier ${typeSeanceNormalized} pour module ${moduleId}, section ${sectionId}, semestre ${semestre}`);
              }
            }
          }

          // Étape 7 : Collecter toutes les séances TD/TP à planifier
          const tdTpSessions = [];
          for (const module of modules) {
            const moduleId = module.ID_module;
            const seances = module.seances.split('/');

            const [enseignants] = await pool.query(
              'SELECT Matricule FROM module_enseignant WHERE ID_module = ?',
              [moduleId]
            );
            if (!enseignants.length) continue;

            for (const typeSeance of seances.filter(s => s === 'TD' || s === 'TP')) {
              const typeSeanceNormalized = typeSeance;
              for (const groupe of groupes.map(g => g.ID_groupe)) {
                tdTpSessions.push({ moduleId, typeSeanceNormalized, groupe, enseignants });
              }
            }
          }

          // Étape 8 : Regrouper les TD/TP dans les cases (2 à 4 par case si possible)
          while (tdTpSessions.length > 0) {
            let scheduledSome = false;

            for (const day of days) {
              const slotsToTry = [...morningSlots, ...afternoonSlots];
              for (const timeSlot of slotsToTry) {
                const currentCase = timetablePlan[day][timeSlot];
                if (currentCase.length >= 4 || currentCase.some(s => s.typeSeanceNormalized === 'cours')) continue;

                const maxToSchedule = Math.min(4 - currentCase.length, tdTpSessions.length);
                const sessionsToSchedule = tdTpSessions.splice(0, maxToSchedule);

                for (const session of sessionsToSchedule) {
                  const { moduleId, typeSeanceNormalized, groupe, enseignants } = session;
                  const enseignant = enseignants[Math.floor(Math.random() * enseignants.length)];
                  const salleOptions = salles.filter(s => 
                    (typeSeanceNormalized === 'TD' && (s.type_salle === 'TD' || s.type_salle === 'TP/TD')) ||
                    (typeSeanceNormalized === 'TP' && (s.type_salle === 'TP' || s.type_salle === 'TP/TD'))
                  );

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
                      console.log(`Séance ajoutée: ${typeSeanceNormalized} pour module ${moduleId}, section ${sectionId}, semestre ${semestre}, groupe ${groupe} (${day} ${timeSlot})`);
                      currentCase.push({ moduleId, typeSeanceNormalized, groupe });
                      scheduled = true;
                      scheduledSome = true;
                      break;
                    } else {
                      console.log(`Conflit détecté: ${conflict} pour ${typeSeanceNormalized}, module ${moduleId}, groupe ${groupe}`);
                    }
                  }
                  if (!scheduled) {
                    tdTpSessions.push(session); // Remettre dans la liste si échec
                  }
                }
              }
              if (scheduledSome) break;
            }

            if (!scheduledSome && tdTpSessions.length > 0) {
              console.warn(`Impossible de planifier les séances restantes: ${tdTpSessions.length} TD/TP non planifiées pour section ${sectionId}, semestre ${semestre}`);
              break;
            }
          }
        }
      }
      return { success: true, message: `Emplois du temps générés avec succès pour les semestres ${targetSemestres.join(', ')}` };
    }
     catch (err) {
    console.error('Error in generateTimetablesForAllSections:', err.message);
    return { success: false, error: err.message };
  }
}

};

export default Timetable;