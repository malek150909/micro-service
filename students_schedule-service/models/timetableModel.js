import pool from "../config/db.js"

// Définition des préférences pour les contraintes d'emploi du temps
const PREFERENCES = {
  PAUSE_DEJEUNER: {
    DEBUT: "11:20 - 12:50",
    FIN: "13:00 - 14:30"
  },
  MAX_COURS_CONSECUTIFS: 3,
  JOURS_PREFERES: ["Lundi", "Mardi", "Mercredi", "Jeudi"],
  JOURS_SECONDAIRES: ["Dimanche", "Samedi"],
  CRENEAUX_PREFERES: [
    "08:00 - 09:30",
    "09:40 - 11:10",
    "13:00 - 14:30",
    "14:40 - 16:10"
  ],
  CRENEAUX_SECONDAIRES: [
    "11:20 - 12:50", // Pause déjeuner idéale
    "16:20 - 17:50"  // Fin de journée
  ]
};

const getLeastLoadedEnseignant = async (enseignants, jour, pool, courseType, moduleId, groupeId = null) => {
  let minSeances = Number.POSITIVE_INFINITY
  let selectedEnseignant = null

  for (const enseignant of enseignants) {
    // Vérifier si l'enseignant peut enseigner ce type de cours
    if (courseType === "cours" && !enseignant.course_type.includes("Cour")) {
      continue
    } else if (courseType !== "cours" && !enseignant.course_type.includes(courseType)) {
      continue
    }

    // Pour TD/TP, vérifier l'assignation au groupe
    if (courseType !== "cours" && groupeId) {
      const [groupeAssignment] = await pool.query(
        "SELECT COUNT(*) as count FROM module_enseignant_groupe WHERE Matricule = ? AND ID_module = ? AND course_type = ? AND ID_groupe = ?",
        [enseignant.Matricule, moduleId, courseType, groupeId],
      )
      if (groupeAssignment[0].count === 0) continue
    }

    const [seances] = await pool.query("SELECT COUNT(*) as count FROM Seance WHERE Matricule = ? AND jour = ?", [
      enseignant.Matricule,
      jour,
    ])
    const count = seances[0].count
    if (count < minSeances) {
      minSeances = count
      selectedEnseignant = enseignant
    }
  }
  return selectedEnseignant
}

const filterModulesWithSectionEnseignants = (modules, enseignantsByModule, sectionEnseignants, report) => {
  return modules.filter((module) => {
    if (!enseignantsByModule[module.ID_module] || enseignantsByModule[module.ID_module].length === 0) {
      console.warn(`Module ${module.ID_module} ignoré : Aucun enseignant assigné dans module_enseignant`)
      report.warnings.push(`Module ${module.ID_module}: Aucun enseignant assigné dans module_enseignant`)
      return false
    }

    const hasValidEnseignant = enseignantsByModule[module.ID_module].some((enseignant) =>
      sectionEnseignants.some((sectionEnseignant) => sectionEnseignant.Matricule === enseignant.Matricule),
    )
    if (!hasValidEnseignant) {
      console.warn(`Module ${module.ID_module} ignoré : Aucun enseignant assigné dans enseignant_section`)
      report.warnings.push(
        `Module ${module.ID_module}: Aucun enseignant assigné dans enseignant_section pour la section`,
      )
    }
    return hasValidEnseignant
  })
}

const filterEnseignantsBySection = (moduleEnseignants, sectionEnseignants) => {
  return moduleEnseignants.filter((enseignant) =>
    sectionEnseignants.some((sectionEnseignant) => sectionEnseignant.Matricule === enseignant.Matricule),
  )
}

const allGroupsHaveSession = (plannedSessions, moduleId, typeSeance, groupIds) => {
  const groupsWithSessions = new Set()

  for (const session of plannedSessions) {
    if (session.moduleId === moduleId && session.typeSeanceNormalized === typeSeance) {
      groupsWithSessions.add(session.groupe)
    }
  }

  return groupIds.every((groupId) => groupsWithSessions.has(groupId))
}

const groupSessionsByModuleAndType = (tdTpSessions) => {
  const grouped = {}

  for (const session of tdTpSessions) {
    const key = `${session.moduleId}_${session.typeSeanceNormalized}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(session)
  }

  return grouped
}

const Timetable = {
  getTimetable: async (filters) => {
    try {
      const { sectionId, semestre } = filters
      console.log("Filters received:", filters)

      if (!sectionId || !semestre) {
        throw new Error("sectionId et semestre sont requis")
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
      `
      const params = [sectionId, semestre]
      console.log("Executing query:", query)
      console.log("With params:", params)

      const [rows] = await pool.query(query, params)
      console.log("Query result:", rows)

      const timetable = {}
      rows.forEach((row) => {
        if (!timetable[row.jour]) timetable[row.jour] = []
        timetable[row.jour].push(row)
      })

      console.log("Fetched timetable from Seance:", timetable)
      return timetable
    } catch (err) {
      console.error("Error in getTimetable:", err.message)
      throw err
    }
  },

  getFilterOptions: async ({ niveau = null, faculte = null, departement = null, specialite = null } = {}) => {
    try {
      const [niveaux] = await pool.query("SELECT DISTINCT niveau FROM Section ORDER BY niveau")

      let facultesQuery = "SELECT ID_faculte, nom_faculte FROM faculte"
      const facultesParams = []
      if (niveau) {
        facultesQuery = `
          SELECT DISTINCT f.ID_faculte, f.nom_faculte 
          FROM faculte f
          JOIN Departement d ON f.ID_faculte = d.ID_faculte
          JOIN Specialite sp ON d.ID_departement = sp.ID_departement
          JOIN Section s ON sp.ID_specialite = s.ID_specialite
          WHERE s.niveau = ?
        `
        facultesParams.push(niveau)
      }
      facultesQuery += " ORDER BY nom_faculte"
      const [facultes] = await pool.query(facultesQuery, facultesParams)

      let departementsQuery = "SELECT ID_departement, Nom_departement FROM Departement"
      const departementsParams = []
      if (niveau) {
        departementsQuery = `
          SELECT DISTINCT d.ID_departement, d.Nom_departement 
          FROM Departement d
          JOIN Specialite sp ON d.ID_departement = sp.ID_departement
          JOIN Section s ON sp.ID_specialite = s.ID_specialite
          WHERE s.niveau = ?
        `
        departementsParams.push(niveau)
        if (faculte) {
          departementsQuery += " AND d.ID_faculte = ?"
          departementsParams.push(faculte)
        }
      } else if (faculte) {
        departementsQuery += " WHERE ID_faculte = ?"
        departementsParams.push(faculte)
      }
      departementsQuery += " ORDER BY Nom_departement"
      const [departements] = await pool.query(departementsQuery, departementsParams)

      let specialitesQuery = "SELECT ID_specialite, nom_specialite FROM Specialite"
      const specialitesParams = []
      if (niveau) {
        specialitesQuery = `
          SELECT DISTINCT sp.ID_specialite, sp.nom_specialite 
          FROM Specialite sp
          JOIN Section s ON sp.ID_specialite = s.ID_specialite
          WHERE s.niveau = ?
        `
        specialitesParams.push(niveau)
        if (departement) {
          specialitesQuery += " AND sp.ID_departement = ?"
          specialitesParams.push(departement)
        }
      } else if (departement) {
        specialitesQuery += " WHERE ID_departement = ?"
        specialitesParams.push(departement)
      }
      specialitesQuery += " ORDER BY nom_specialite"
      const [specialites] = await pool.query(specialitesQuery, specialitesParams)

      let sectionsQuery = "SELECT ID_section, nom_section FROM Section"
      const sectionsParams = []
      if (niveau) {
        sectionsQuery += " WHERE niveau = ?"
        sectionsParams.push(niveau)
        if (specialite) {
          sectionsQuery += " AND ID_specialite = ?"
          sectionsParams.push(specialite)
        }
      } else if (specialite) {
        sectionsQuery += " WHERE ID_specialite = ?"
        sectionsParams.push(specialite)
      }
      sectionsQuery += " ORDER BY nom_section"
      const [sections] = await pool.query(sectionsQuery, sectionsParams)

      return {
        niveaux: niveaux.map((n) => n.niveau),
        facultes,
        departements,
        specialites,
        sections,
      }
    } catch (err) {
      console.error("Error in getFilterOptions:", err.message)
      throw err
    }
  },

  deleteSession: async (id) => {
    try {
      if (!id) {
        throw new Error("ID_seance est requis")
      }
      console.log("Executing DELETE for ID_seance:", id)
      const [result] = await pool.query("DELETE FROM Seance WHERE ID_seance = ?", [id])
      console.log("DELETE result:", result)
      if (result.affectedRows === 0) {
        throw new Error("Aucune séance trouvée avec cet ID")
      }
      return { success: true, message: "Séance supprimée avec succès" }
    } catch (err) {
      console.error("Error in deleteSession:", err.message)
      throw err
    }
  },

  createSession: async ({ ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section }) => {
    try {
      console.log("Creating session with data:", {
        ID_salle,
        Matricule,
        type_seance,
        ID_groupe,
        ID_module,
        jour,
        time_slot,
        ID_section,
      })
      if (!ID_section) {
        throw new Error("ID_section est requis")
      }

      const conflict = await Timetable.checkConflicts(
        ID_salle,
        Matricule,
        jour,
        time_slot,
        type_seance,
        ID_groupe,
        ID_section,
        ID_module,
      )
      if (conflict) {
        return { success: false, error: conflict }
      }

      const groupeToInsert = type_seance === "cours" ? null : ID_groupe || null
      const [result] = await pool.query(
        "INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [ID_salle, Matricule, type_seance, groupeToInsert, ID_module, jour, time_slot, ID_section],
      )
      return { success: true, ID_seance: result.insertId, message: "Séance ajoutée avec succès" }
    } catch (err) {
      console.error("Error in createSession:", err.message)
      throw err
    }
  },

  updateSession: async (id, { ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot }) => {
    try {
      const [existingSession] = await pool.query("SELECT ID_section FROM Seance WHERE ID_seance = ?", [id])
      if (!existingSession.length) {
        throw new Error("Séance non trouvée")
      }
      const ID_section = existingSession[0].ID_section

      const conflict = await Timetable.checkConflicts(
        ID_salle,
        Matricule,
        jour,
        time_slot,
        type_seance,
        ID_groupe,
        ID_section,
        ID_module,
        id,
      )
      if (conflict) {
        return { success: false, error: conflict }
      }

      const groupeToUpdate = type_seance === "cours" ? null : ID_groupe || null
      await pool.query(
        "UPDATE Seance SET ID_salle = ?, Matricule = ?, type_seance = ?, ID_groupe = ?, ID_module = ?, jour = ?, time_slot = ? WHERE ID_seance = ?",
        [ID_salle, Matricule, type_seance, groupeToUpdate, ID_module, jour, time_slot, id],
      )
      return { success: true, message: "Séance mise à jour avec succès" }
    } catch (err) {
      throw err
    }
  },

  getSessionOptions: async (sectionId, semestre) => {
    try {
      console.log("Fetching session options for sectionId:", sectionId, "and semestre:", semestre)

      const [section] = await pool.query("SELECT ID_specialite, niveau FROM Section WHERE ID_section = ?", [sectionId])
      if (!section.length) {
        console.log("No section found for sectionId:", sectionId)
        return { salles: [], groupes: [], modules: [], enseignants: [] }
      }
      const specialiteId = section[0].ID_specialite
      console.log("Specialite ID:", specialiteId)

      if (!specialiteId || !semestre) {
        console.log("specialiteId or semestre is null or undefined")
        return { salles: [], groupes: [], modules: [], enseignants: [] }
      }

      const [salles] = await pool.query("SELECT ID_salle, nom_salle, type_salle FROM Salle WHERE disponible = 1")
      console.log("Salles récupérées:", salles)

      const [groupes] = await pool.query("SELECT ID_groupe, num_groupe FROM Groupe WHERE ID_section = ?", [sectionId])
      console.log("Groupes récupérés pour sectionId", sectionId, ":", groupes)

      const [modules] = await pool.query(
        "SELECT m.ID_module, m.nom_module, m.seances " +
          "FROM Module m " +
          "JOIN module_section ms ON m.ID_module = ms.ID_module " +
          "WHERE ms.ID_section = ? AND ms.semestre = ?",
        [sectionId, semestre],
      )
      console.log("Modules récupérés pour sectionId", sectionId, "et semestre", semestre, ":", modules)

      const [enseignants] = await pool.query(
        `
        SELECT DISTINCT u.Matricule, u.nom, u.prenom 
        FROM User u
        JOIN Enseignant e ON u.Matricule = e.Matricule
        JOIN Module_Enseignant me ON e.Matricule = me.Matricule
        JOIN Module m ON me.ID_module = m.ID_module
        JOIN enseignant_section es ON e.Matricule = es.Matricule
        WHERE m.ID_specialite = ? AND es.ID_section = ?`,
        [specialiteId, sectionId],
      )
      console.log("Enseignants récupérés:", enseignants)

      return {
        salles: salles || [],
        groupes: groupes || [],
        modules: modules || [],
        enseignants: enseignants || [],
      }
    } catch (err) {
      console.error("Error in getSessionOptions:", err.message)
      return { salles: [], groupes: [], modules: [], enseignants: [] }
    }
  },

  checkConflicts: async (
    ID_salle,
    Matricule,
    jour,
    time_slot,
    type_seance,
    ID_groupe,
    ID_section,
    ID_module,
    excludeSessionId = null,
  ) => {
    try {
      const [enseignantSection] = await pool.query(
        "SELECT COUNT(*) as count FROM enseignant_section WHERE Matricule = ? AND ID_section = ?",
        [Matricule, ID_section],
      )
      if (enseignantSection[0].count === 0) {
        const [enseignantInfo] = await pool.query("SELECT nom, prenom FROM User WHERE Matricule = ?", [Matricule])
        const nomEnseignant =
          enseignantInfo.length > 0 ? `${enseignantInfo[0].prenom} ${enseignantInfo[0].nom}` : Matricule
        return `L'enseignant ${nomEnseignant} n'est pas associé à cette section.`
      }

      const [moduleTeacherRows] = await pool.query(
        "SELECT course_type FROM module_enseignant WHERE ID_module = ? AND Matricule = ?",
        [ID_module, Matricule],
      )
      if (moduleTeacherRows.length === 0) {
        const [enseignantInfo] = await pool.query("SELECT nom, prenom FROM User WHERE Matricule = ?", [Matricule])
        const nomEnseignant =
          enseignantInfo.length > 0 ? `${enseignantInfo[0].prenom} ${enseignantInfo[0].nom}` : Matricule
        return `L'enseignant ${nomEnseignant} n'est pas autorisé à enseigner ce module.`
      }

      // Vérifier si l'enseignant est autorisé pour ce type de séance
      const courseTypes = moduleTeacherRows.map((row) => row.course_type)
      const isAuthorized = courseTypes.some((ct) => {
        if (type_seance === "cours") return ct.includes("Cour")
        return ct.includes(type_seance)
      })

      if (!isAuthorized) {
        const [enseignantInfo] = await pool.query("SELECT nom, prenom FROM User WHERE Matricule = ?", [Matricule])
        const nomEnseignant =
          enseignantInfo.length > 0 ? `${enseignantInfo[0].prenom} ${enseignantInfo[0].nom}` : Matricule
        return `L'enseignant ${nomEnseignant} n'est pas autorisé à enseigner des séances de type ${type_seance} pour ce module.`
      }

      if (type_seance === "TD" || type_seance === "TP") {
        if (!ID_groupe) {
          return `ID_groupe est requis pour une séance de type ${type_seance}.`
        }
        const [groupeAssignment] = await pool.query(
          "SELECT COUNT(*) as count FROM module_enseignant_groupe WHERE Matricule = ? AND ID_module = ? AND course_type = ? AND ID_groupe = ?",
          [Matricule, ID_module, type_seance, ID_groupe],
        )
        if (groupeAssignment[0].count === 0) {
          const [enseignantInfo] = await pool.query("SELECT nom, prenom FROM User WHERE Matricule = ?", [Matricule])
          const nomEnseignant =
            enseignantInfo.length > 0 ? `${enseignantInfo[0].prenom} ${enseignantInfo[0].nom}` : Matricule
          const [groupeInfo] = await pool.query("SELECT num_groupe FROM Groupe WHERE ID_groupe = ?", [ID_groupe])
          const numGroupe = groupeInfo.length > 0 ? groupeInfo[0].num_groupe : ID_groupe
          return `L'enseignant ${nomEnseignant} n'est pas assigné au groupe ${numGroupe} pour ${type_seance} dans ce module.`
        }
      }

      const [salleInfo] = await pool.query("SELECT nom_salle, type_salle FROM Salle WHERE ID_salle = ?", [ID_salle])
      const nomSalle = salleInfo.length > 0 ? salleInfo[0].nom_salle : ID_salle
      const salleType = salleInfo.length > 0 ? salleInfo[0].type_salle : null

      // Assouplir les contraintes de type de salle pour TD
      if (type_seance === "TD" && salleType !== "TD" && salleType !== "TP/TD") {
        return `La salle ${nomSalle} n'est pas adaptée pour une séance TD (type requis : TD ou TP/TD).`
      }
      if (type_seance === "TP" && salleType !== "TP" && salleType !== "TP/TD") {
        return `La salle ${nomSalle} n'est pas adaptée pour une séance TP (type requis : TP ou TP/TD).`
      }
      if (type_seance === "cours" && salleType !== "Cour") {
        return `La salle ${nomSalle} n'est pas adaptée pour une séance cours (type requis : Cour).`
      }

      const [enseignantInfo] = await pool.query("SELECT nom, prenom FROM User WHERE Matricule = ?", [Matricule])
      const nomEnseignant =
        enseignantInfo.length > 0 ? `${enseignantInfo[0].prenom} ${enseignantInfo[0].nom}` : Matricule

      const [newSessionSemestre] = await pool.query(
        "SELECT semestre FROM module_section WHERE ID_module = ? AND ID_section = ?",
        [ID_module, ID_section],
      )
      const semestreNew = newSessionSemestre.length > 0 ? Number.parseInt(newSessionSemestre[0].semestre) : null
      if (!semestreNew) {
        throw new Error("Semestre non trouvé pour ce module et cette section")
      }
      const isNewSemestreImpair = semestreNew % 2 !== 0

      const salleQuery = `
        SELECT s.ID_seance, ms.semestre 
        FROM Seance s
        JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
        WHERE s.ID_salle = ? AND s.jour = ? AND s.time_slot = ? 
        ${excludeSessionId ? "AND s.ID_seance != ?" : ""}
      `
      const salleParams = excludeSessionId ? [ID_salle, jour, time_slot, excludeSessionId] : [ID_salle, jour, time_slot]
      const [salleRows] = await pool.query(salleQuery, salleParams)
      if (salleRows.length > 0) {
        const hasConflict = salleRows.some((row) => {
          const semestreExisting = Number.parseInt(row.semestre)
          const isExistingSemestreImpair = semestreExisting % 2 !== 0
          return isNewSemestreImpair === isExistingSemestreImpair
        })
        if (hasConflict) {
          return `La salle ${nomSalle} est déjà utilisée pour le créneau ${jour} ${time_slot}.`
        }
      }

      const teacherQuery = `
        SELECT s.ID_seance, ms.semestre 
        FROM Seance s
        JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
        WHERE s.Matricule = ? AND s.jour = ? AND s.time_slot = ? 
        ${excludeSessionId ? "AND s.ID_seance != ?" : ""}
      `
      const teacherParams = excludeSessionId
        ? [Matricule, jour, time_slot, excludeSessionId]
        : [Matricule, jour, time_slot]
      const [teacherRows] = await pool.query(teacherQuery, teacherParams)
      if (teacherRows.length > 0) {
        const hasConflict = teacherRows.some((row) => {
          const semestreExisting = Number.parseInt(row.semestre)
          const isExistingSemestreImpair = semestreExisting % 2 !== 0
          return isNewSemestreImpair === isExistingSemestreImpair
        })
        if (hasConflict) {
          return `L'enseignant ${nomEnseignant} est déjà affecté à une autre séance pour le créneau ${jour} ${time_slot}.`
        }
      }

      const existingSessionsQuery = `
        SELECT s.ID_seance, s.type_seance, s.ID_groupe, s.ID_module, ms.semestre 
        FROM Seance s
        JOIN module_section ms ON s.ID_module = ms.ID_module AND s.ID_section = ms.ID_section
        WHERE s.jour = ? AND s.time_slot = ? AND s.ID_section = ?
        ${excludeSessionId ? "AND s.ID_seance != ?" : ""}
      `
      const existingSessionsParams = excludeSessionId
        ? [jour, time_slot, ID_section, excludeSessionId]
        : [jour, time_slot, ID_section]
      const [existingSessions] = await pool.query(existingSessionsQuery, existingSessionsParams)

      const relevantSessions = existingSessions.filter((session) => {
        const semestreExisting = Number.parseInt(session.semestre)
        const isExistingSemestreImpair = semestreExisting % 2 !== 0
        return isNewSemestreImpair === isExistingSemestreImpair
      })

      if (type_seance === "TD" || type_seance === "TP") {
        const hasCours = relevantSessions.some((session) => session.type_seance === "cours")
        if (hasCours) {
          return `Impossible d'ajouter un ${type_seance} dans une case contenant un cours (${jour} ${time_slot}).`
        }

        const parsedGroupId = Number.parseInt(ID_groupe)
        const [groupeInfo] = await pool.query("SELECT num_groupe FROM Groupe WHERE ID_groupe = ?", [parsedGroupId])
        const numGroupe = groupeInfo.length > 0 ? groupeInfo[0].num_groupe : parsedGroupId

        const groupConflict = existingSessions.some((session) => {
          const isSameGroup = Number.parseInt(session.ID_groupe) === parsedGroupId
          const isTDorTP = session.type_seance === "TD" || session.type_seance === "TP"
          return isSameGroup && isTDorTP
        })
        if (groupConflict) {
          return `Le groupe ${numGroupe} a déjà une séance TD ou TP dans le créneau ${jour} ${time_slot}.`
        }

        const moduleTypeConflict = relevantSessions.some(
          (session) =>
            session.ID_module === ID_module &&
            session.type_seance === type_seance &&
            Number.parseInt(session.ID_groupe) === parsedGroupId,
        )
        if (moduleTypeConflict) {
          return `Le groupe ${numGroupe} a déjà une séance de ${type_seance} pour ce module dans le créneau ${jour} ${time_slot}.`
        }
      }

      if (type_seance === "cours") {
        if (relevantSessions.length > 0) {
          return `Un cours ne peut pas être ajouté dans une case déjà occupée par des TD/TP (${jour} ${time_slot}).`
        }
      }

      return null
    } catch (err) {
      console.error("Error in checkConflicts:", err.message)
      throw err
    }
  },

  getModuleEnseignants: async (moduleId) => {
    try {
      console.log("Fetching enseignants for moduleId:", moduleId)
      const [enseignants] = await pool.query(
        `
        SELECT DISTINCT u.Matricule, u.nom, u.prenom, me.course_type 
        FROM User u
        JOIN Module_Enseignant me ON u.Matricule = me.Matricule
        WHERE me.ID_module = ?
      `,
        [moduleId],
      )
      console.log("Enseignants found for moduleId", moduleId, ":", enseignants)
      return enseignants
    } catch (err) {
      console.error("Error in getModuleEnseignants:", err.message)
      throw err
    }
  },

  getModuleEnseignantGroupe: async (moduleId, courseType, groupeId) => {
    try {
      console.log(`Fetching enseignants for moduleId: ${moduleId}, courseType: ${courseType}, groupeId: ${groupeId}`)
      const [enseignants] = await pool.query(
        `
        SELECT DISTINCT u.Matricule, u.nom, u.prenom, meg.course_type 
        FROM User u
        JOIN module_enseignant_groupe meg ON u.Matricule = meg.Matricule
        WHERE meg.ID_module = ? AND meg.course_type = ? AND meg.ID_groupe = ?
      `,
        [moduleId, courseType, groupeId],
      )
      console.log(`Enseignants found:`, enseignants)
      return enseignants
    } catch (err) {
      console.error("Error in getModuleEnseignantGroupe:", err.message)
      throw err
    }
  },

  // Fonction utilitaire pour vérifier les contraintes de séances par groupe et jour
 checkSessionConstraints: async (groupeId, jour, typeSeance, pool) => {
    const [existingSessions] = await pool.query(
      `SELECT type_seance, time_slot FROM Seance WHERE ID_groupe = ? AND jour = ?`,
      [groupeId, jour]
    );

    let coursCount = 0;
    let tdTpCount = 0;
    let totalCount = existingSessions.length;

    // Vérifier les sessions consécutives
    const timeSlots = [
      "08:00 - 09:30",
      "09:40 - 11:10",
      "11:20 - 12:50",
      "13:00 - 14:30",
      "14:40 - 16:10",
      "16:20 - 17:50",
    ];
    let consecutiveCount = 0;
    let maxConsecutive = 0;
    for (let i = 0; i < timeSlots.length; i++) {
      const hasSession = existingSessions.some((s) => s.time_slot === timeSlots[i]);
      if (hasSession) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
      } else {
        consecutiveCount = 0;
      }
    }

    for (const session of existingSessions) {
      if (session.type_seance === "cours") coursCount++;
      else if (session.type_seance === "TD" || session.type_seance === "TP") tdTpCount++;
    }

    if (typeSeance === "cours" && coursCount >= 3) {
      return { valid: false, reason: `Maximum 3 cours atteint pour le jour ${jour}` };
    }
    if ((typeSeance === "TD" || typeSeance === "TP") && tdTpCount >= 3) {
      return {
        valid: false,
        reason: `Maximum 3 TD/TP atteint pour le groupe ${groupeId} le jour ${jour}`,
      };
    }
    if (totalCount >= 5) {
      return {
        valid: false,
        reason: `Maximum 5 séances atteint pour le groupe ${groupeId} le jour ${jour}`,
      };
    }
    if (maxConsecutive >= PREFERENCES.MAX_COURS_CONSECUTIFS) {
      return {
        valid: false,
        reason: `Maximum ${PREFERENCES.MAX_COURS_CONSECUTIFS} séances consécutives atteint pour le groupe ${groupeId} le jour ${jour}`,
      };
    }

    return { valid: true };
  },

  generateTimetablesForAllSections: async (semestreGroup, preserveExisting = false) => {
    try {
      console.log(`Starting automatic timetable generation for semestre group ${semestreGroup}`);

      const targetSemestres = semestreGroup === "1" ? [1, 3, 5] : [2, 4, 6];
      console.log("Target semestres:", targetSemestres);

      if (!preserveExisting) {
        await pool.query(
          "DELETE FROM Seance WHERE ID_section IN (SELECT ID_section FROM module_section WHERE semestre IN (?, ?, ?))",
          [...targetSemestres]
        );
        console.log("Séances existantes supprimées pour les semestres ciblés");
      } else {
        console.log("Préservation des séances existantes activée");
      }

      // Utiliser les jours préférés et secondaires
      const days = [...PREFERENCES.JOURS_PREFERES, ...PREFERENCES.JOURS_SECONDAIRES];
      // Utiliser les créneaux préférés et secondaires, en excluant la pause déjeuner sauf si nécessaire
      const timeSlots = [
        ...PREFERENCES.CRENEAUX_PREFERES.filter(
          (slot) => slot !== PREFERENCES.PAUSE_DEJEUNER.DEBUT && slot !== PREFERENCES.PAUSE_DEJEUNER.FIN
        ),
        ...PREFERENCES.CRENEAUX_SECONDAIRES,
      ];
      const preferredSlots = PREFERENCES.CRENEAUX_PREFERES.filter(
        (slot) => slot !== PREFERENCES.PAUSE_DEJEUNER.DEBUT && slot !== PREFERENCES.PAUSE_DEJEUNER.FIN
      );
      const fallbackSlots = PREFERENCES.CRENEAUX_SECONDAIRES;

      const [salles] = await pool.query("SELECT ID_salle, type_salle FROM Salle WHERE disponible = 1");
      if (!salles.length) {
        throw new Error("Aucune salle disponible dans la base de données");
      }
      const hasTPSalles = salles.some((s) => s.type_salle === "TP" || s.type_salle === "TP/TD");
      if (!hasTPSalles) {
        console.warn("Aucune salle de type TP ou TP/TD disponible, les séances TP ne pourront pas être planifiées");
        report.warnings.push("Aucune salle de type TP ou TP/TD disponible");
      }

      const report = {
        success: true,
        plannedSessions: 0,
        failedSessions: [],
        warnings: [],
        ignoredSections: [],
        ignoredModules: [],
      };

      const [sections] = await pool.query("SELECT ID_section, niveau FROM Section");
      if (!sections.length) {
        throw new Error("Aucune section trouvée");
      }

      for (const section of sections) {
        const sectionId = section.ID_section;

        const [sectionEnseignants] = await pool.query("SELECT Matricule FROM enseignant_section WHERE ID_section = ?", [
          sectionId,
        ]);

        if (sectionEnseignants.length === 0) {
          console.log(`Aucun enseignant associé à la section ${sectionId}, ignorée`);
          report.ignoredSections.push(`${sectionId} (pas d'enseignants associés)`);
          continue;
        }

        const [semestres] = await pool.query(
          "SELECT DISTINCT semestre FROM module_section WHERE ID_section = ? AND semestre IN (?, ?, ?)",
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
            "SELECT m.ID_module, m.nom_module, m.seances " +
              "FROM Module m " +
              "JOIN module_section ms ON m.ID_module = ms.ID_module " +
              "WHERE ms.ID_section = ? AND ms.semestre = ?",
            [sectionId, semestre]
          );

          if (modules.length === 0) {
            console.log(`Aucun module trouvé pour la section ${sectionId}, semestre ${semestre}, ignorée`);
            report.ignoredSections.push(`${sectionId} (semestre ${semestre})`);
            continue;
          }

          const [groupes] = await pool.query("SELECT ID_groupe FROM Groupe WHERE ID_section = ?", [sectionId]);
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
            "SELECT me.ID_module, me.Matricule, me.course_type " +
              "FROM module_enseignant me " +
              "WHERE me.ID_module IN (SELECT ID_module FROM module_section WHERE ID_section = ? AND semestre = ?)",
            [sectionId, semestre]
          );
          const enseignantsByModule = {};
          moduleEnseignants.forEach(({ ID_module, Matricule, course_type }) => {
            if (!enseignantsByModule[ID_module]) enseignantsByModule[ID_module] = [];
            enseignantsByModule[ID_module].push({ Matricule, course_type });
          });

          const modulesWithSectionEnseignants = filterModulesWithSectionEnseignants(
            modules,
            enseignantsByModule,
            sectionEnseignants,
            report
          );

          const ignoredModules = modules.filter((module) => !modulesWithSectionEnseignants.includes(module));

          if (ignoredModules.length > 0) {
            console.log(
              `${ignoredModules.length} modules ignorés pour la section ${sectionId}, semestre ${semestre} (pas d'enseignants associés à la section)`
            );
            ignoredModules.forEach((module) => {
              report.ignoredModules.push(
                `Module ${module.ID_module} (${module.nom_module}, section ${sectionId}, semestre ${semestre})`
              );
            });
          }

          if (modulesWithSectionEnseignants.length === 0) {
            console.warn(
              `Aucun module avec enseignants associés à la section ${sectionId}, semestre ${semestre}, ignorée`
            );
            report.ignoredSections.push(`${sectionId} (semestre ${semestre}, pas d'enseignants associés)`);
            continue;
          }

          const timetablePlan = {};
          days.forEach((day) => {
            timetablePlan[day] = {};
            timeSlots.forEach((slot) => {
              timetablePlan[day][slot] = [];
            });
          });

          // Collecter les séances TD/TP
          const tdTpSessions = [];
          for (const module of modulesWithSectionEnseignants) {
            const moduleId = module.ID_module;
            const expectedSeances = module.seances.split("/");

            if (expectedSeances.includes("En ligne")) {
              console.log(`Module ${moduleId} (${module.nom_module}) est en ligne, ignoré`);
              report.ignoredModules.push(`Module ${moduleId} (${module.nom_module}): En ligne`);
              continue;
            }

            const allSeanceTypes = expectedSeances.filter((type) => type === "TD" || type === "TP");

            if (allSeanceTypes.length === 0) {
              console.log(`Module ${moduleId} (${module.nom_module}) n'a pas de séances TD/TP, ignoré pour cette phase`);
              continue;
            }

            for (const typeSeance of allSeanceTypes) {
              const [moduleEnseignantTypes] = await pool.query(
                "SELECT DISTINCT me.Matricule, me.course_type FROM module_enseignant me WHERE me.ID_module = ? AND me.course_type LIKE ?",
                [moduleId, `%${typeSeance}%`]
              );

              if (moduleEnseignantTypes.length === 0) {
                console.warn(`Aucun enseignant assigné pour ${typeSeance}, module ${moduleId} (${module.nom_module})`);
                report.warnings.push(
                  `Module ${moduleId} (${module.nom_module}), type ${typeSeance}: Aucun enseignant assigné dans module_enseignant`
                );
                continue;
              }

              for (const groupe of groupes.map((g) => g.ID_groupe)) {
                const enseignants = await Timetable.getModuleEnseignantGroupe(moduleId, typeSeance, groupe);

                if (enseignants.length === 0) {
                  console.warn(
                    `Aucun enseignant assigné pour ${typeSeance}, module ${moduleId} (${module.nom_module}), groupe ${groupe}`
                  );
                  report.warnings.push(
                    `Module ${moduleId} (${module.nom_module}), type ${typeSeance}, groupe ${groupe}: Aucun enseignant assigné dans module_enseignant_groupe`
                  );
                  continue;
                }

                const validEnseignants = enseignants.filter((enseignant) => {
                  const moduleEnseignant = moduleEnseignantTypes.find((me) => me.Matricule === enseignant.Matricule);
                  return moduleEnseignant !== undefined;
                });

                if (validEnseignants.length === 0) {
                  console.warn(
                    `Aucun enseignant valide pour ${typeSeance}, module ${moduleId} (${module.nom_module}), groupe ${groupe} (incohérence avec module_enseignant)`
                  );
                  report.warnings.push(
                    `Module ${moduleId} (${module.nom_module}), type ${typeSeance}, groupe ${groupe}: Incohérence entre module_enseignant et module_enseignant_groupe`
                  );
                  continue;
                }

                tdTpSessions.push({
                  moduleId,
                  typeSeanceNormalized: typeSeance,
                  groupe,
                  enseignants: validEnseignants,
                });
                console.log(
                  `Séance collectée: ${typeSeance} pour module ${moduleId} (${module.nom_module}), groupe ${groupe}, enseignants: ${validEnseignants.length}`
                );
              }
            }
          }

          // Planifier les TD/TP en premier
          const groupedSessions = groupSessionsByModuleAndType(tdTpSessions);
          const allTdTpSessions = Object.values(groupedSessions).flat();
          const sessionsToSchedule = allTdTpSessions.filter((session) => {
            const alreadyScheduled = Object.values(timetablePlan).some((daySlots) =>
              Object.values(daySlots).some((slotSessions) =>
                slotSessions.some(
                  (s) =>
                    s.moduleId === session.moduleId &&
                    s.typeSeanceNormalized === session.typeSeanceNormalized &&
                    s.groupe === session.groupe
                )
              )
            );
            return !alreadyScheduled;
          });

          for (const session of sessionsToSchedule) {
            const { moduleId, typeSeanceNormalized, groupe, enseignants } = session;
            let scheduled = false;

            for (const day of days) {
              // Vérifier les contraintes pour le groupe et le jour
              const constraints = await Timetable.checkSessionConstraints(groupe, day, typeSeanceNormalized, pool);
              if (!constraints.valid) {
                console.log(
                  `Contrainte non respectée pour ${typeSeanceNormalized}, module ${moduleId}, groupe ${groupe}: ${constraints.reason}`
                );
                continue;
              }

              for (const timeSlot of [...preferredSlots, ...fallbackSlots]) {
                // Éviter la pause déjeuner sauf si absolument nécessaire
                if (
                  [PREFERENCES.PAUSE_DEJEUNER.DEBUT, PREFERENCES.PAUSE_DEJEUNER.FIN].includes(timeSlot) &&
                  preferredSlots.some((slot) => !timetablePlan[day][slot].some((s) => s.groupe === groupe))
                ) {
                  continue;
                }

                if (timetablePlan[day][timeSlot].some((s) => s.typeSeanceNormalized === "cours")) {
                  continue;
                }

                if (timetablePlan[day][timeSlot].some((s) => s.groupe === groupe)) {
                  continue;
                }

                const salleOptions = salles.filter(
                  (s) =>
                    (typeSeanceNormalized === "TD" && (s.type_salle === "TD" || s.type_salle === "TP/TD")) ||
                    (typeSeanceNormalized === "TP" && (s.type_salle === "TP" || s.type_salle === "TP/TD"))
                );

                if (salleOptions.length === 0) {
                  console.warn(
                    `Aucune salle disponible pour ${typeSeanceNormalized}, module ${moduleId}, groupe ${groupe}`
                  );
                  report.warnings.push(
                    `Module ${moduleId}, type ${typeSeanceNormalized}, groupe ${groupe}: Aucune salle disponible`
                  );
                  break;
                }

                for (const enseignant of enseignants) {
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
                        "INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section) " +
                          "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [
                          salle.ID_salle,
                          enseignant.Matricule,
                          typeSeanceNormalized,
                          groupe,
                          moduleId,
                          day,
                          timeSlot,
                          sectionId,
                        ]
                      );

                      timetablePlan[day][timeSlot].push({
                        moduleId,
                        typeSeanceNormalized,
                        groupe,
                      });

                      report.plannedSessions++;
                      scheduled = true;
                      console.log(
                        `Séance ajoutée: ${typeSeanceNormalized} pour module ${moduleId}, section ${sectionId}, groupe ${groupe} (${day} ${timeSlot})`
                      );
                      break;
                    } else {
                      console.log(
                        `Conflit pour ${typeSeanceNormalized}, module ${moduleId}, groupe ${groupe}: ${conflict}`
                      );
                    }
                  }
                  if (scheduled) break;
                }
                if (scheduled) break;
              }
              if (scheduled) break;
            }

            if (!scheduled) {
              console.warn(`Impossible de planifier ${typeSeanceNormalized} pour module ${moduleId}, groupe ${groupe}`);
              report.warnings.push(
                `Module ${moduleId}, type ${typeSeanceNormalized}, groupe ${groupe}: Impossible à planifier`
              );
              report.failedSessions.push(`Séance ${typeSeanceNormalized} pour module ${moduleId}, groupe ${groupe}`);
            }
          }

          // Planifier les cours après les TD/TP
          for (const module of modulesWithSectionEnseignants) {
            const moduleId = module.ID_module;
            const seances = module.seances.split("/");

            if (seances.includes("Cour")) {
              let scheduled = false;
              const typeSeanceNormalized = "cours";

              const moduleEnseignantsForSection = filterEnseignantsBySection(
                await Timetable.getModuleEnseignants(moduleId),
                sectionEnseignants
              ).filter((enseignant) => enseignant.course_type.includes("Cour"));

              if (moduleEnseignantsForSection.length === 0) {
                console.warn(
                  `Aucun enseignant associé à la section pour le module ${moduleId} (${module.nom_module}) (cours), ignoré`
                );
                report.warnings.push(
                  `Module ${moduleId} (${module.nom_module}): Aucun enseignant pour cours dans module_enseignant`
                );
                report.ignoredModules.push(
                  `Module ${moduleId} (${module.nom_module}, section ${sectionId}, semestre ${semestre}, pas d'enseignants pour cours)`
                );
                continue;
              }

              for (const day of days) {
                // Vérifier les contraintes pour les cours (pas de groupe spécifique, vérifier au niveau section)
                const constraints = await Timetable.checkSessionConstraints(null, day, typeSeanceNormalized, pool);
                if (!constraints.valid) {
                  console.log(
                    `Contrainte non respectée pour ${typeSeanceNormalized}, module ${moduleId}: ${constraints.reason}`
                  );
                  continue;
                }

                for (const timeSlot of [...preferredSlots, ...fallbackSlots]) {
                  // Éviter la pause déjeuner sauf si absolument nécessaire
                  if (
                    [PREFERENCES.PAUSE_DEJEUNER.DEBUT, PREFERENCES.PAUSE_DEJEUNER.FIN].includes(timeSlot) &&
                    preferredSlots.some((slot) => !timetablePlan[day][slot].length)
                  ) {
                    continue;
                  }

                  if (timetablePlan[day][timeSlot].length > 0) {
                    continue;
                  }

                  for (const enseignant of moduleEnseignantsForSection) {
                    const salle = salles.find((s) => s.type_salle === "Cour");
                    if (!salle) {
                      console.warn(
                        `Aucune salle disponible pour ${typeSeanceNormalized}, module ${moduleId} (${module.nom_module})`
                      );
                      report.warnings.push(
                        `Module ${moduleId} (${module.nom_module}): Aucune salle de type Cour disponible`
                      );
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
                        "INSERT INTO Seance (ID_salle, Matricule, type_seance, ID_groupe, ID_module, jour, time_slot, ID_section) " +
                          "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                        [
                          salle.ID_salle,
                          enseignant.Matricule,
                          typeSeanceNormalized,
                          null,
                          moduleId,
                          day,
                          timeSlot,
                          sectionId,
                        ]
                      );
                      scheduled = true;
                      report.plannedSessions += 1;
                      console.log(
                        `Séance ajoutée: ${typeSeanceNormalized} pour module ${moduleId} (${module.nom_module}), section ${sectionId}, semestre ${semestre}, groupe aucun`
                      );
                      timetablePlan[day][timeSlot].push({ moduleId, typeSeanceNormalized, groupe: null });
                      break;
                    } else {
                      console.log(
                        `Conflit pour ${typeSeanceNormalized}, module ${moduleId} (${module.nom_module}): ${conflict}`
                      );
                    }
                  }
                  if (scheduled) break;
                }
                if (scheduled) break;
              }
              if (!scheduled) {
                console.warn(
                  `Impossible de planifier ${typeSeanceNormalized} pour module ${moduleId} (${module.nom_module}), section ${sectionId}, semestre ${semestre}`
                );
                report.warnings.push(`Module ${moduleId} (${module.nom_module}): Impossible de planifier cours`);
                report.failedSessions.push(`Cours pour module ${moduleId} (${module.nom_module}), section ${sectionId}`);
              }
            }
          }
        }
      }

      console.log(
        `Rapport final: ${report.plannedSessions} séances planifiées, ${report.failedSessions.length} échecs, ${report.warnings.length} avertissements`
      );
      console.log(
        `Sections ignorées: ${report.ignoredSections.length}, Modules ignorés: ${report.ignoredModules.length}`
      );

      if (report.failedSessions.length || report.warnings.length) {
        report.success = report.plannedSessions > 0;
        report.message =
          `Génération partielle: ${report.plannedSessions} séances planifiées. ` +
          `Problèmes: ${report.failedSessions.length} échecs, ${report.warnings.length} avertissements. ` +
          `Sections ignorées: ${report.ignoredSections.length}, Modules ignorés: ${report.ignoredModules.length}`;
      } else {
        report.message = `Emplois du temps générés avec succès pour les semestres ${targetSemestres.join(", ")}`;
      }
      return report;
    } catch (err) {
      console.error("Error in generateTimetablesForAllSections:", err.message);
      return {
        success: false,
        error: err.message,
        warnings: [],
        failedSessions: [],
        plannedSessions: 0,
        ignoredSections: [],
        ignoredModules: [],
      };
    }
  },
}

export default Timetable;