import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaCalendarAlt, FaPlusCircle, FaEdit, FaTrash, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import styles from "../css/seance_supp.module.css";

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function Timetable({ sectionTimetable, profTimetable, matricule, sectionId, onSessionModified }) {
  const days = ['Samedi', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
  const timeSlots = [
    '08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50',
    '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50',
  ];

  const [showSectionRegular, setShowSectionRegular] = useState(false);
  const [showSectionSupp, setShowSectionSupp] = useState(false);
  const [showProfRegular, setShowProfRegular] = useState(false);
  const [showProfSupp, setShowProfSupp] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [salles, setSalles] = useState([]);
  const [sallesError, setSallesError] = useState(null);
  const [modules, setModules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isSallesLoading, setIsSallesLoading] = useState(false);
  const [isModulesLoading, setIsModulesLoading] = useState(false);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const sectionRegularRef = useRef(null);
  const sectionSuppRef = useRef(null);
  const profRegularRef = useRef(null);
  const profSuppRef = useRef(null);
  const sessionRefs = useRef({});
  const modalRef = useRef(null);
  const deleteModalRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const initialSections = storedUser?.sections || [];
  const [sections, setSections] = useState(initialSections);

  const currentDate = new Date();

  useEffect(() => {
    if (editingSession && modalRef.current) {
      modalRef.current.focus(); // Améliore l'accessibilité
    }
    if (showDeleteModal && deleteModalRef.current) {
      deleteModalRef.current.focus();
    }
  }, [editingSession, showDeleteModal]);

  useEffect(() => {
    if (editingSession) {
      fetchModules();
    }
    if (showSectionRegular && sectionRegularRef.current) sectionRegularRef.current.classList.add(styles['ENS-SUPP-fade-in']);
    if (showSectionSupp && sectionSuppRef.current) sectionSuppRef.current.classList.add(styles['ENS-SUPP-fade-in']);
    if (showProfRegular && profRegularRef.current) profRegularRef.current.classList.add(styles['ENS-SUPP-fade-in']);
    if (showProfSupp && profSuppRef.current) profSuppRef.current.classList.add(styles['ENS-SUPP-fade-in']);
  }, [editingSession, showSectionRegular, showSectionSupp, showProfRegular, showProfSupp]);

  const debouncedFetchSalles = useCallback(
    debounce(async (date, timeSlot, sessionId, currentSalleId) => {
      setIsSallesLoading(true);
      try {
        const response = await fetch(
          `http://courses.localhost/SUPPprof/rooms?date=${date}&timeSlot=${timeSlot}&excludeSessionId=${sessionId}&currentSalleId=${currentSalleId}`
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Fetched salles:', data);

        let updatedSalles = (data || []).map(salle => ({
          ...salle,
          ID_salle: String(salle.ID_salle),
        }));

        if (editingSession.ID_salle && editingSession.nom_salle) {
          const currentSalleIdStr = String(editingSession.ID_salle);
          const currentSalleExists = updatedSalles.some(salle => salle.ID_salle === currentSalleIdStr);
          if (!currentSalleExists) {
            updatedSalles = [
              { ID_salle: currentSalleIdStr, nom_salle: editingSession.nom_salle },
              ...updatedSalles,
            ];
          }
        }

        const salleMap = new Map(updatedSalles.map(salle => [salle.ID_salle, salle]));
        updatedSalles = Array.from(salleMap.values());

        setSalles(updatedSalles);
        setSallesError(null);
      } catch (error) {
        console.error('Error fetching salles:', error);
        if (editingSession.ID_salle && editingSession.nom_salle) {
          setSalles([{ ID_salle: String(editingSession.ID_salle), nom_salle: editingSession.nom_salle }]);
        } else {
          setSalles([]);
        }
        setSallesError('Unable to load salles. Proceeding with current room if available.');
      } finally {
        setIsSallesLoading(false);
      }
    }, 300),
    [editingSession]
  );

  useEffect(() => {
    if (editingSession && editingSession.date_seance && editingSession.time_slot) {
      debouncedFetchSalles(
        editingSession.date_seance,
        editingSession.time_slot,
        editingSession.id,
        editingSession.ID_salle
      );
    }
  }, [editingSession?.date_seance, editingSession?.time_slot, debouncedFetchSalles]);

  const fetchModules = async () => {
    setIsModulesLoading(true);
    try {
      const response = await fetch(`http://courses.localhost/SUPPprof/modules?matricule=${matricule}&sectionId=${sectionId}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      console.log('Fetched modules:', data);

      const moduleMap = new Map(
        (data || []).map(module => ({
          ...module,
          ID_module: String(module.ID_module),
        })).map(module => [module.ID_module, module])
      );
      const updatedModules = Array.from(moduleMap.values());

      setModules(updatedModules);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setModules([]);
    } finally {
      setIsModulesLoading(false);
    }
  };

  const debouncedFetchGroups = useCallback(
    debounce(async (sectionId) => {
      setIsGroupsLoading(true);
      try {
        const response = await fetch(`http://courses.localhost/SUPPprof/groups?sectionId=${sectionId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        const formattedGroups = (data || []).map(group => ({
          ...group,
          ID_groupe: String(group.ID_groupe),
        }));
        console.log('Formatted groups:', formattedGroups);
        setGroups(formattedGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setGroups([]);
      } finally {
        setIsGroupsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (editingSession && (editingSession.type_seance === 'TD' || editingSession.type_seance === 'TP')) {
      debouncedFetchGroups(editingSession.sectionId);
    } else {
      setGroups([]);
      setIsGroupsLoading(false);
    }
  }, [editingSession?.sectionId, editingSession?.type_seance, debouncedFetchGroups]);

  const organizeTimetable = (timetable) => {
    const grid = {};
    days.forEach((day) => {
      grid[day] = {};
      timeSlots.forEach((slot) => (grid[day][slot] = null));
    });

    (timetable || []).forEach((entry) => {
      if (!entry || !entry.jour || !entry.time_slot) return;
      if (!days.includes(entry.jour) || !timeSlots.includes(entry.time_slot)) return;
      grid[entry.jour][entry.time_slot] = entry;
    });
    return grid;
  };

  const organizeSupplementaryByDate = (sessions, filterPassed = false) => {
    const sessionsByDate = {};
    (sessions || []).forEach((session) => {
      if (!session || !session.date_seance) return;
      const sessionDate = new Date(session.date_seance);
      if (filterPassed && sessionDate < currentDate) return;
      const dateKey = session.date_seance;
      if (!sessionsByDate[dateKey]) sessionsByDate[dateKey] = [];
      sessionsByDate[dateKey].push(session);
    });

    const sortedDates = Object.keys(sessionsByDate).sort((a, b) => new Date(a) - new Date(b));
    const sortedSessionsByDate = {};
    sortedDates.forEach((date) => {
      sortedSessionsByDate[date] = sessionsByDate[date].sort((a, b) =>
        a.time_slot.localeCompare(b.time_slot)
      );
    });
    return sortedSessionsByDate;
  };

  const hasSessionPassed = (dateSeance) => {
    const sessionDate = new Date(dateSeance);
    return sessionDate < currentDate;
  };

  const handleEditSession = async (session) => {
    console.log('Raw session object:', session);
    let sessionSectionId = session.ID_section;

    if (!sessionSectionId && session.nom_section) {
      const matchingSection = sections.find(
        (section) => section.nom_section === session.nom_section
      );
      if (matchingSection) {
        sessionSectionId = String(matchingSection.ID_section);
        console.log(`Inferred ID_section: ${sessionSectionId} from nom_section: ${session.nom_section}`);
      } else {
        console.error('Could not infer ID_section from nom_section:', session.nom_section);
        alert('Erreur: Impossible de déterminer la section de la séance.');
        return;
      }
    }

    if (!sessionSectionId) {
      console.error('Session does not have an ID_section and could not infer it:', session);
      alert('Erreur: La séance n’a pas de section associée.');
      return;
    }

    let groupeIds = [];
    if (session.groupe_ids) {
      groupeIds = session.groupe_ids.split(',').map(id => String(id).trim());
    } else if (session.num_groupe) {
      try {
        const response = await fetch(`http://courses.localhost/SUPPprof/groups?sectionId=${sessionSectionId}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const groups = await response.json();
        const numGroupeArray = session.num_groupe.split(',').map(num => num.trim());
        groupeIds = groups
          .filter(group => numGroupeArray.includes(String(group.num_groupe)))
          .map(group => String(group.ID_groupe));
      } catch (error) {
        console.error('Error fetching groups for mapping:', error);
      }
    }

    const updatedSession = {
      ...session,
      id: session.ID_seance,
      sectionId: String(sessionSectionId),
      ID_module: session.ID_module ? String(session.ID_module) : '',
      nom_module: session.nom_module || '',
      ID_salle: session.mode === 'presentiel' ? (session.ID_salle ? String(session.ID_salle) : '') : '',
      nom_salle: session.nom_salle || '',
      type_seance: session.type_seance || '',
      date_seance: session.date_seance || '',
      time_slot: session.time_slot || '',
      mode: session.mode || 'presentiel',
      groupeIds,
    };
    console.log('Set editingSession:', updatedSession);
    setEditingSession(updatedSession);
  };

  const handleGroupChange = (groupId) => {
    const currentGroupeIds = editingSession.groupeIds || [];
    const updatedGroupeIds = currentGroupeIds.includes(groupId)
      ? currentGroupeIds.filter((id) => id !== groupId)
      : [...currentGroupeIds, groupId];
    setEditingSession({ ...editingSession, groupeIds: updatedGroupeIds });
  };

  const handleModifySubmit = async (e) => {
    e.preventDefault();

    if (!editingSession.ID_module) {
      alert('Veuillez sélectionner un module.');
      return;
    }
    if (!editingSession.type_seance) {
      alert('Veuillez sélectionner un type de séance.');
      return;
    }
    if ((editingSession.type_seance === 'TD' || editingSession.type_seance === 'TP') && (!editingSession.groupeIds || editingSession.groupeIds.length === 0)) {
      alert('Veuillez sélectionner au moins un groupe pour les séances TD ou TP.');
      return;
    }
    if (!editingSession.date_seance) {
      alert('Veuillez sélectionner une date.');
      return;
    }
    if (!editingSession.time_slot) {
      alert('Veuillez sélectionner un créneau horaire.');
      return;
    }
    if (!editingSession.mode) {
      alert('Veuillez sélectionner un mode.');
      return;
    }
    if (editingSession.mode === 'presentiel' && !editingSession.ID_salle) {
      alert('Veuillez sélectionner une salle pour le mode présentiel.');
      return;
    }

    const payload = {
      id: editingSession.id,
      matricule,
      sectionId: editingSession.sectionId,
      salleId: editingSession.mode === 'presentiel' ? editingSession.ID_salle : null,
      moduleId: editingSession.ID_module,
      typeSeance: editingSession.type_seance,
      groupeIds: editingSession.groupeIds || [],
      date: editingSession.date_seance,
      timeSlot: editingSession.time_slot,
      mode: editingSession.mode,
    };
    console.log('Submitting modification payload:', payload);

    try {
      const response = await fetch('http://courses.localhost/SUPPprof/modify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setEditingSession(null);
        onSessionModified();
      } else {
        console.error('Modification failed:', data.message);
        alert(data.message || 'Failed to modify session');
      }
    } catch (error) {
      console.error('Error during modification:', error);
      alert('An error occurred while modifying the session.');
    }
  };

  const handleDeleteSession = (id) => {
    setSessionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteSession = async () => {
    if (sessionToDelete) {
      try {
        const response = await fetch(`http://courses.localhost/SUPPprof/delete-session/${sessionToDelete}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          onSessionModified();
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Une erreur est survenue lors de la suppression.');
      } finally {
        setShowDeleteModal(false);
        setSessionToDelete(null);
      }
    }
  };

  const cancelDeleteSession = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setEditingSession(null);
      setIsModalClosing(false);
    }, 400);
  };

  const sectionRegularGrid = organizeTimetable(sectionTimetable.regular);
  const sectionSuppByDate = organizeSupplementaryByDate(sectionTimetable.supplementary, true);
  const profRegularGrid = organizeTimetable(profTimetable.regular);
  const profSuppByDate = organizeSupplementaryByDate(profTimetable.supplementary);

  // Composant pour la modale d'édition
  const EditModal = () => (
    <div className={`${styles['ENS-SUPP-modal-overlay']} ${isModalClosing ? styles['ENS-SUPP-closing'] : ''}`}>
      <div className={`${styles['ENS-SUPP-modal-content']} ${isModalClosing ? styles['ENS-SUPP-closing'] : ''}`} ref={modalRef}>
        <h4>Modifier la séance</h4>
        {sallesError && <p className={styles['ENS-SUPP-error-message']}>{sallesError}</p>}
        {console.log('Modal editingSession:', editingSession)}
        <form onSubmit={handleModifySubmit} className={styles['ENS-SUPP-modal-form']}>
          <div className={styles['ENS-SUPP-form-group']}>
            <label>Section:</label>
            <select
              value={editingSession.sectionId || ''}
              onChange={(e) =>
                setEditingSession({ ...editingSession, sectionId: e.target.value })
              }
              required
            >
              {sections.map((section) => (
                <option key={section.ID_section} value={String(section.ID_section)}>
                  {`${section.nom_section} - ${section.niveau} - ${section.nom_specialite}`}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['ENS-SUPP-form-row']}>
            <div className={styles['ENS-SUPP-form-group']}>
              <label>Module:</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={editingSession.ID_module || ''}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      ID_module: e.target.value,
                      nom_module:
                        modules.find((m) => m.ID_module === e.target.value)?.nom_module ||
                        editingSession.nom_module,
                    })
                  }
                  required
                  disabled={isModulesLoading}
                >
                  {editingSession.ID_module && editingSession.nom_module && (
                    <option value={editingSession.ID_module}>
                      {editingSession.nom_module}
                    </option>
                  )}
                  {modules
                    .filter((module) => module.ID_module !== editingSession.ID_module)
                    .map((module) => (
                      <option key={module.ID_module} value={String(module.ID_module)}>
                        {module.nom_module}
                      </option>
                    ))}
                </select>
                {isModulesLoading && (
                  <FaSpinner className={styles['ENS-SUPP-spinner']} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                )}
              </div>
            </div>
            <div className={styles['ENS-SUPP-form-group']}>
              <label>Type de séance:</label>
              <select
                value={editingSession.type_seance || ''}
                onChange={(e) => {
                  const newType = e.target.value;
                  setEditingSession((prev) => ({
                    ...prev,
                    type_seance: newType,
                    groupeIds: newType === 'cours' ? [] : prev.groupeIds,
                  }));
                }}
                required
              >
                <option value="">Sélectionner un type</option>
                <option value="cours">Cours</option>
                <option value="TD">TD</option>
                <option value="TP">TP</option>
              </select>
            </div>
          </div>
          {(editingSession.type_seance === 'TD' || editingSession.type_seance === 'TP') && (
            <div className={styles['ENS-SUPP-form-group']}>
              <label>Groupes:</label>
              {isGroupsLoading ? (
                <p>Chargement des groupes... <FaSpinner className={styles['ENS-SUPP-spinner']} /></p>
              ) : groups.length > 0 ? (
                <div
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    background: '#fff',
                    maxHeight: '100px',
                    overflowY: 'auto',
                  }}
                >
                  {groups.map((group) => (
                    <div
                      key={group.ID_groupe}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px 0',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editingSession.groupeIds?.includes(String(group.ID_groupe)) || false}
                        onChange={() => handleGroupChange(String(group.ID_groupe))}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px' }}>
                        Groupe {group.num_groupe}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Aucun groupe disponible.</p>
              )}
            </div>
          )}
          <div className={styles['ENS-SUPP-form-row']}>
            <div className={styles['ENS-SUPP-form-group']}>
              <label>Date:</label>
              <input
                type="date"
                value={editingSession.date_seance || ''}
                onChange={(e) =>
                  setEditingSession((prev) => ({
                    ...prev,
                    date_seance: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className={styles['ENS-SUPP-form-group']}>
              <label>Créneau horaire:</label>
              <select
                value={editingSession.time_slot || ''}
                onChange={(e) =>
                  setEditingSession((prev) => ({
                    ...prev,
                    time_slot: e.target.value,
                  }))
                }
                required
              >
                <option value="">Sélectionner un créneau</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles['ENS-SUPP-form-row']}>
            <div className={styles['ENS-SUPP-form-group']}>
              <label>Mode:</label>
              <select
                value={editingSession.mode || 'presentiel'}
                onChange={(e) => {
                  const newMode = e.target.value;
                  setEditingSession((prev) => ({
                    ...prev,
                    mode: newMode,
                    ID_salle: newMode === 'en ligne' ? '' : prev.ID_salle,
                    nom_salle: newMode === 'en ligne' ? '' : prev.nom_salle,
                  }));
                }}
                required
              >
                <option value="presentiel">Présentiel</option>
                <option value="en ligne">En ligne</option>
              </select>
            </div>
            {editingSession.mode === 'presentiel' && (
              <div className={styles['ENS-SUPP-form-group']}>
                <label>Salle:</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={editingSession.ID_salle || ''}
                    onChange={(e) =>
                      setEditingSession((prev) => ({
                        ...prev,
                        ID_salle: e.target.value,
                        nom_salle:
                          salles.find((s) => s.ID_salle === e.target.value)?.nom_salle ||
                          prev.nom_salle,
                      }))
                    }
                    required
                    disabled={isSallesLoading}
                  >
                    <option value="">Sélectionner une salle</option>
                    {salles.map((salle) => (
                      <option key={salle.ID_salle} value={String(salle.ID_salle)}>
                        {salle.nom_salle}
                      </option>
                    ))}
                  </select>
                  {isSallesLoading && (
                    <FaSpinner className={styles['ENS-SUPP-spinner']} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={styles['ENS-SUPP-modal-actions']}>
            <button type="submit" className={`${styles['ENS-SUPP-modern-btn']} ${styles['ENS-SUPP-save-btn']}`}>
              <FaSave /> Enregistrer
            </button>
            <button
              type="button"
              className={`${styles['ENS-SUPP-modern-btn']} ${styles['ENS-SUPP-cancel-btn']}`}
              onClick={handleCloseModal}
            >
              <FaTimes /> Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Composant pour la modale de suppression
  const DeleteModal = () => (
    <div className={styles['ENS-SUPP-modal-overlay']}>
      <div className={styles['ENS-SUPP-modal-content']} ref={deleteModalRef}>
        <h4>Confirmation de suppression</h4>
        <p>Voulez-vous vraiment supprimer cette séance ?</p>
        <div className={styles['ENS-SUPP-modal-actions']} style={{ marginTop: '20px' }}>
          <button
            className={`${styles['ENS-SUPP-modern-btn']} ${styles['ENS-SUPP-delete-btn']}`}
            onClick={confirmDeleteSession}
            style={{ marginRight: '10px' }}
          >
            Oui, Supprimer
          </button>
          <button
            className={`${styles['ENS-SUPP-modern-btn']} ${styles['ENS-SUPP-cancel-btn']}`}
            onClick={cancelDeleteSession}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles['ENS-SUPP-timetable-wrapper']}>
      <div className={`${styles['ENS-SUPP-main-content-container']} ${editingSession || showDeleteModal ? styles['ENS-SUPP-blur-background'] : ''}`}>
        <div className={styles['ENS-SUPP-toggle-section']}>
          <button
            className={styles['ENS-SUPP-toggle-table-btn']}
            onClick={() => setShowSectionRegular(!showSectionRegular)}
          >
            <FaCalendarAlt />{' '}
            {showSectionRegular ? 'Masquer EDT Section (Régulier)' : 'Voir EDT Section (Régulier)'}
          </button>
          {showSectionRegular && (
            <div className={styles['ENS-SUPP-timetable-container']} ref={sectionRegularRef}>
              <h3 className={styles['ENS-SUPP-timetable-title']}>Emploi du temps de la section (Régulier)</h3>
              <table className={styles['ENS-SUPP-timetable-table']}>
                <thead>
                  <tr>
                    <th>Jour</th>
                    {timeSlots.map((slot) => (
                      <th key={slot}>{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day}>
                      <td>{day}</td>
                      {timeSlots.map((slot) => (
                        <td
                          key={`${day}-${slot}`}
                          className={sectionRegularGrid[day][slot] ? styles['ENS-SUPP-session-occupied'] : ''}
                        >
                          {sectionRegularGrid[day][slot] ? (
                            <div className={styles['ENS-SUPP-session-details']}>
                              <span className={styles['ENS-SUPP-session-type']}>
                                {sectionRegularGrid[day][slot].type_seance.toUpperCase()}
                              </span>
                              <br />
                              {sectionRegularGrid[day][slot].nom_module}
                              <br />
                              {sectionRegularGrid[day][slot].mode === 'presentiel' ? (
                                <>Salle: {sectionRegularGrid[day][slot].nom_salle}</>
                              ) : (
                                sectionRegularGrid[day][slot].mode === 'en ligne' && 'En ligne'
                              )}
                              <br />
                              Prof: {sectionRegularGrid[day][slot].prof_prenom}{' '}
                              {sectionRegularGrid[day][slot].prof_nom}
                              {sectionRegularGrid[day][slot].num_groupe && (
                                <>
                                  <br />
                                  Groupe: {sectionRegularGrid[day][slot].num_groupe}
                                </>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles['ENS-SUPP-toggle-section']}>
          <button className={styles['ENS-SUPP-toggle-table-btn']} onClick={() => setShowSectionSupp(!showSectionSupp)}>
            <FaPlusCircle />{' '}
            {showSectionSupp ? 'Masquer Séances Supp Section' : 'Voir Séances Supp Section'}
          </button>
          {showSectionSupp && (
            <div className={styles['ENS-SUPP-timetable-container']} ref={sectionSuppRef}>
              <h3 className={styles['ENS-SUPP-timetable-title']}>Séances supplémentaires de la section</h3>
              <div className={styles['ENS-SUPP-supplementary-sessions']}>
                {Object.keys(sectionSuppByDate).length > 0 ? (
                  Object.entries(sectionSuppByDate).map(([date, sessions]) => (
                    <div key={date} className={styles['ENS-SUPP-supplementary-date-block']}>
                      <h4>
                        {new Date(date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h4>
                      <div className={styles['ENS-SUPP-sessions-list']}>
                        {sessions.map((session, index) => (
                          <div
                            key={`${date}-${index}`}
                            className={`${styles['ENS-SUPP-session-card']} ${styles['ENS-SUPP-supplementary-session']} ${
                              hasSessionPassed(session.date_seance) ? styles['ENS-SUPP-passed-session'] : ''
                            }`}
                            ref={(el) => (sessionRefs.current[session.ID_seance] = el)}
                          >
                            <strong>{session.time_slot}</strong>
                            <br />
                            <strong className={styles['ENS-SUPP-session-type']}>{session.type_seance.toUpperCase()}</strong>
                            <br />
                            {session.nom_module}
                            <br />
                            {session.mode === 'presentiel' ? (
                              <>Salle: {session.nom_salle}</>
                            ) : (
                              session.mode === 'en ligne' && 'En ligne'
                            )}
                            <br />
                            Prof: {session.prof_prenom} {session.prof_nom}
                            {session.num_groupe && (
                              <>
                                <br />
                                Groupes: {session.num_groupe}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles['ENS-SUPP-no-session']}>
                    Aucune séance supplémentaire à venir pour cette section.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className={styles['ENS-SUPP-toggle-section']}>
          <button
            className={styles['ENS-SUPP-toggle-table-btn']}
            onClick={() => setShowProfRegular(!showProfRegular)}
          >
            <FaCalendarAlt />{' '}
            {showProfRegular ? 'Masquer Votre EDT (Régulier)' : 'Voir Votre EDT (Régulier)'}
          </button>
          {showProfRegular && (
            <div className={styles['ENS-SUPP-timetable-container']} ref={profRegularRef}>
              <h3 className={styles['ENS-SUPP-timetable-title']}>Votre emploi du temps (Régulier)</h3>
              <table className={styles['ENS-SUPP-timetable-table']}>
                <thead>
                  <tr>
                    <th>Jour</th>
                    {timeSlots.map((slot) => (
                      <th key={slot}>{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day}>
                      <td>{day}</td>
                      {timeSlots.map((slot) => (
                        <td
                          key={`${day}-${slot}`}
                          className={profRegularGrid[day][slot] ? styles['ENS-SUPP-session-occupied'] : ''}
                        >
                          {profRegularGrid[day][slot] ? (
                            <div className={styles['ENS-SUPP-session-details']}>
                              <span className={styles['ENS-SUPP-session-type']}>
                                {profRegularGrid[day][slot].type_seance.toUpperCase()}
                              </span>
                              <br />
                              {profRegularGrid[day][slot].nom_module}
                              <br />
                              {profRegularGrid[day][slot].mode === 'presentiel' ? (
                                <>Salle: {profRegularGrid[day][slot].nom_salle}</>
                              ) : (
                                profRegularGrid[day][slot].mode === 'en ligne' && 'En ligne'
                              )}
                              <br />
                              Section: {profRegularGrid[day][slot].nom_section}
                              {profRegularGrid[day][slot].num_groupe && (
                                <>
                                  <br />
                                  Groupe: {profRegularGrid[day][slot].num_groupe}
                                </>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles['ENS-SUPP-toggle-section']}>
          <button className={styles['ENS-SUPP-toggle-table-btn']} onClick={() => setShowProfSupp(!showProfSupp)}>
            <FaPlusCircle /> {showProfSupp ? 'Masquer Vos Séances Supp' : 'Voir Vos Séances Supp'}
          </button>
          {showProfSupp && (
            <div className={styles['ENS-SUPP-timetable-container']} ref={profSuppRef}>
              <h3 className={styles['ENS-SUPP-timetable-title']}>Vos séances supplémentaires</h3>
              <div className={`${styles['ENS-SUPP-supplementary-sessions']} ${styles['ENS-SUPP-scrollable-section']}`}>
                {Object.keys(profSuppByDate).length > 0 ? (
                  Object.entries(profSuppByDate).map(([date, sessions]) => (
                    <div key={date} className={styles['ENS-SUPP-supplementary-date-block']}>
                      <h4>
                        {new Date(date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h4>
                      <div className={styles['ENS-SUPP-sessions-list']}>
                        {sessions.map((session, index) => (
                          <div
                            key={`${date}-${index}`}
                            className={`${styles['ENS-SUPP-session-card']} ${styles['ENS-SUPP-supplementary-session']} ${
                              hasSessionPassed(session.date_seance) ? styles['ENS-SUPP-passed-session'] : ''
                            }`}
                            ref={(el) => (sessionRefs.current[session.ID_seance] = el)}
                          >
                            <strong>{session.time_slot}</strong>
                            <br />
                            <strong className={styles['ENS-SUPP-session-type']}>{session.type_seance.toUpperCase()}</strong>
                            <br />
                            {session.nom_module}
                            <br />
                            {session.mode === 'presentiel' ? (
                              <>Salle: {session.nom_salle}</>
                            ) : (
                              session.mode === 'en ligne' && 'En ligne'
                            )}
                            <br />
                            Section: {session.nom_section}
                            {session.num_groupe && (
                              <>
                                <br />
                                Groupes: {session.num_groupe}
                              </>
                            )}
                            <div className={styles['ENS-SUPP-session-actions']}>
                              {!hasSessionPassed(session.date_seance) && (
                                <button
                                  className={`${styles['ENS-SUPP-modern-btn']} ${styles['ENS-SUPP-edit-btn']}`}
                                  onClick={() => handleEditSession(session)}
                                >
                                  <FaEdit /> Modifier
                                </button>
                              )}
                              <button
                                className={`${styles['ENS-SUPP-modern-btn']} ${styles['ENS-SUPP-delete-btn']}`}
                                onClick={() => handleDeleteSession(session.ID_seance)}
                              >
                                <FaTrash /> Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles['ENS-SUPP-no-session']}>Aucune séance supplémentaire pour vous.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {editingSession && createPortal(<EditModal />, document.body)}
      {showDeleteModal && createPortal(<DeleteModal />, document.body)}
    </div>
  );
}

export default Timetable;