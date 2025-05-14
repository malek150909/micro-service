import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';
import styles from '../ADM_EDT.module.css';

function TimetableDisplay({ timetable, sectionId, semestre, onRefresh }) {
  console.log('Rendering timetable from Seance:', timetable);
  if (!timetable) {
    return <p className={styles['ADM-EDT-timetable-error']}>Veuillez sélectionner les filtres pour voir l'emploi du temps.</p>;
  }

  const days = ['Samedi', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
  const timeSlots = [
    '08:00 - 09:30',
    '09:40 - 11:10',
    '11:20 - 12:50',
    '13:00 - 14:30',
    '14:40 - 16:10',
    '16:20 - 17:50'
  ];

  const [selectedSession, setSelectedSession] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [options, setOptions] = useState({ salles: [], enseignants: [], modules: [], groupes: [] });
  const [error, setError] = useState(null);
  const [sectionDetails, setSectionDetails] = useState({});

  useEffect(() => {
    if (sectionId && semestre) {
      console.log('Fetching session options for sectionId:', sectionId, 'and semestre:', semestre);
      fetch(`http://courses.localhost/timetable/session-options?sectionId=${sectionId}&semestre=${semestre}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erreur réseau: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Options received:', data);
          if (data.success) {
            console.log('Modules dans options:', data.options.modules);
            setOptions(data.options);
            if (!data.options.modules.length) setError('Aucun module trouvé pour cette spécialité');
            else setError(null);
          } else {
            setError(data.error || 'Erreur lors du chargement des options');
          }
        })
        .catch(err => {
          console.error('Fetch error for session-options:', err);
          setError(err.message);
        });

      console.log('Fetching section details for sectionId:', sectionId);
      fetch(`http://courses.localhost/timetable/section-details?sectionId=${sectionId}`)
        .then(response => {
          console.log('Section details response status:', response.status);
          if (!response.ok) {
            throw new Error(`Erreur réseau: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Section details received:', data);
          if (data.success && data.details) {
            setSectionDetails(data.details);
          } else {
            console.warn('No valid section details received:', data);
            setSectionDetails({});
            setError(data.error || 'Aucun détail de section reçu');
          }
        })
        .catch(err => {
          console.error('Fetch error for section-details:', err);
          setError(err.message);
        });
    }
  }, [sectionId, semestre]);

  const getAvailableTypes = (seances) => {
    console.log('Appel de getAvailableTypes avec seances:', seances);
    if (!seances || typeof seances !== 'string') {
      console.log('Seances invalide ou absent, retour par défaut');
      return [];
    }
    
    const normalizedSeances = seances.toLowerCase().replace(/\s+/g, '');
    let result = [];
    
    if (normalizedSeances.includes('cour')) result.push('cours');
    if (normalizedSeances.includes('td')) result.push('TD');
    if (normalizedSeances.includes('tp')) result.push('TP');
    if (normalizedSeances.includes('enligne') || normalizedSeances.includes('en ligne')) result.push('En ligne');
    
    console.log('Types disponibles:', result);
    return result.length > 0 ? result : ['cours'];
  };

  const exportToPDF = () => {
    console.log('Exporting timetable to PDF with sectionDetails:', sectionDetails);
    const doc = new jsPDF();
    const { faculty, department, specialty, niveau, section } = sectionDetails;

    doc.setFontSize(16);
    doc.text('Emploi du Temps', 14, 20);
    doc.setFontSize(12);
    doc.text(`Faculté: ${faculty || ''}`, 14, 30);
    doc.text(`Département: ${department || ''}`, 14, 40);
    doc.text(`Spécialité: ${specialty || ''}`, 14, 50);
    doc.text(`Niveau: ${niveau || ''}`, 14, 60);
    doc.text(`Section: ${section || ''}`, 14, 70);

    const tableData = [];
    tableData.push(['Jour', ...timeSlots]);
    days.forEach(day => {
      const row = [day];
      timeSlots.forEach(slot => {
        const sessions = timetable[day]?.filter(s => s.time_slot === slot) || [];
        row.push(
          sessions.length > 0
            ? sessions.map(s => `${s.type_seance}: ${s.module} (${s.teacher}, ${s.room}${s.group ? `, ${s.group}` : ''})`).join('\n')
            : '-'
        );
      });
      tableData.push(row);
    });

    autoTable(doc, {
      startY: 80,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [84, 131, 179] },
    });

    const fileName = `emploi_du_temps_${niveau || 'unknown'}_${specialty || 'unknown'}_${section || 'unknown'}.pdf`;
    console.log('Saving PDF as:', fileName);
    doc.save(fileName);
  };

  const fetchFilteredEnseignants = async (moduleId) => {
    if (!moduleId) {
      setOptions(prev => ({ ...prev, enseignants: [] }));
      return;
    }
    try {
      const response = await fetch(`http://courses.localhost/timetable/module-enseignants?moduleId=${moduleId}`);
      const data = await response.json();
      console.log('Filtered enseignants for moduleId', moduleId, ':', data.enseignants);
      if (data.success) {
        setOptions(prev => ({ ...prev, enseignants: data.enseignants || [] }));
      } else {
        setError(data.error || 'Erreur lors du chargement des enseignants');
      }
    } catch (err) {
      console.error('Error fetching enseignants:', err);
      setError(err.message);
    }
  };

  const handleCellClick = (day, slot) => {
    const sessions = timetable[day]?.filter(s => s.time_slot === slot) || [];
    setSelectedSession({ jour: day, timeSlot: slot, sessions });
    setIsAdding(false);
    setIsEditing(false);
  };

  const handleDelete = async (sessionId) => {
    try {
      console.log('Received sessionId:', sessionId);
      if (!sessionId || typeof sessionId === 'object') {
        throw new Error('ID de séance invalide');
      }
      console.log('Deleting session with ID:', sessionId);
      const response = await fetch(`http://courses.localhost/timetable/session/${sessionId}`, {
        method: 'DELETE',
      });
      const text = await response.text();
      console.log('Raw response from DELETE /timetable/session:', text);
      const data = JSON.parse(text);
      if (data.success) {
        console.log('Session deleted successfully');
        setSelectedSession(null);
        setError(null);
        onRefresh();
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error during delete:', err.message);
      setError(`Erreur: ${err.message}`);
    }
  };

  const handleEdit = (session) => {
    setIsEditing(true);
    setIsAdding(false);
    setSelectedSession({ ...selectedSession, ID_seance: session.ID_seance });
    const initialForm = {
      ID_module: String(options.modules.find(m => m.nom_module === session.module)?.ID_module || ''),
      type_seance: session.type_seance,
      Matricule: options.enseignants.find(e => `${e.prenom} ${e.nom}` === session.teacher)?.Matricule || '',
      ID_salle: options.salles.find(s => s.nom_salle === session.room)?.ID_salle || '',
      ID_groupe: options.groupes.find(g => g.num_groupe === session.group)?.ID_groupe || '',
      jour: session.jour,
      time_slot: session.time_slot
    };
    console.log('Initial edit form:', initialForm);
    setEditForm(initialForm);
    fetchFilteredEnseignants(initialForm.ID_module);
  };

  const handleAdd = () => {
    setIsEditing(true);
    setIsAdding(true);
    setEditForm({
      ID_module: '',
      type_seance: '',
      Matricule: '',
      ID_salle: '',
      ID_groupe: null,
      jour: selectedSession.jour,
      time_slot: selectedSession.timeSlot,
      ID_section: sectionId
    });
    setOptions(prev => ({ ...prev, enseignants: [] }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      const newForm = { ...prev, [name]: value };
      console.log('Form change - name:', name, 'value:', value, 'newForm:', newForm);

      if (name === 'ID_module') {
        newForm.type_seance = '';
        newForm.Matricule = '';
        newForm.ID_salle = '';
        fetchFilteredEnseignants(value);
      }
      if (name === 'type_seance') {
        newForm.ID_salle = '';
      }
      return newForm;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form with data:', editForm);
    try {
      const formData = {
        ...editForm,
        ID_groupe: editForm.type_seance === 'cours' || editForm.type_seance === 'En ligne' ? null : editForm.ID_groupe
      };
      const url = isAdding
        ? 'http://courses.localhost/timetable/session'
        : `http://courses.localhost/timetable/session/${selectedSession.ID_seance}`;
      const method = isAdding ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setIsEditing(false);
        setIsAdding(false);
        setSelectedSession(null);
        setError(null);
        onRefresh();
      } else {
        setError(data.error || 'Erreur lors de la ' + (isAdding ? 'création' : 'mise à jour'));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClose = () => {
    setSelectedSession(null);
    setIsEditing(false);
    setIsAdding(false);
    setError(null);
  };

  const getFilteredSalles = (typeSeance) => {
    if (!typeSeance || typeSeance === 'En ligne') return [];
    return options.salles.filter(salle => {
      if (typeSeance === 'cours') return salle.type_salle === 'Cour';
      if (typeSeance === 'TD') return salle.type_salle === 'TD' || salle.type_salle === 'TP/TD';
      if (typeSeance === 'TP') return salle.type_salle === 'TP' || salle.type_salle === 'TP/TD';
      return false;
    });
  };

  const renderModal = () => {
    if (!selectedSession) return null;

    return ReactDOM.createPortal(
      <div className={styles['ADM-EDT-modal-overlay']}>
        <div className={styles['ADM-EDT-modal-content']}>
          {isEditing ? (
            <form onSubmit={handleFormSubmit} className={styles['ADM-EDT-session-form']}>
              <h3>{isAdding ? 'Ajouter une séance' : 'Modifier la séance'}</h3>
                <div className={styles['ADM-EDT-form-grid']}>
                  <div className={styles['ADM-EDT-form-group']}>
                    <label>Module</label>
                    <select
                      name="ID_module"
                      value={editForm.ID_module}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Sélectionner un module</option>
                      {options.modules.map(mod => (
                        <option key={mod.ID_module} value={String(mod.ID_module)}>{mod.nom_module}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['ADM-EDT-form-group']}>
                    <label>Type de séance</label>
                    <select
                      name="type_seance"
                      value={editForm.type_seance}
                      onChange={handleFormChange}
                      disabled={!editForm.ID_module}
                    >
                      <option value="">Sélectionner un type</option>
                      {editForm.ID_module && options.modules.length > 0 && (() => {
                        const selectedModule = options.modules.find(m => String(m.ID_module) === String(editForm.ID_module));
                        const seancesValue = selectedModule ? selectedModule.seances : null;
                        const types = getAvailableTypes(seancesValue);
                        console.log('Module sélectionné:', selectedModule, 'Seances:', seancesValue, 'Types:', types);
                        return types.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div className={styles['ADM-EDT-form-group']}>
                    <label>Enseignant</label>
                    <select
                      name="Matricule"
                      value={editForm.Matricule}
                      onChange={handleFormChange}
                      disabled={!editForm.ID_module}
                    >
                      <option value="">Sélectionner un enseignant</option>
                      {options.enseignants.map(ens => (
                        <option key={ens.Matricule} value={ens.Matricule}>{`${ens.prenom} ${ens.nom}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['ADM-EDT-form-group']}>
                    <label>Salle</label>
                    <select
                      name="ID_salle"
                      value={editForm.ID_salle}
                      onChange={handleFormChange}
                      disabled={!editForm.type_seance || editForm.type_seance === 'En ligne'}
                    >
                      <option value="">Sélectionner une salle</option>
                      {getFilteredSalles(editForm.type_seance).map(salle => (
                        <option key={salle.ID_salle} value={salle.ID_salle}>{salle.nom_salle}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['ADM-EDT-form-group']}>
                    <label>Groupe</label>
                    <select
                      name="ID_groupe"
                      value={editForm.ID_groupe}
                      onChange={handleFormChange}
                      disabled={editForm.type_seance === 'cours' || editForm.type_seance === 'En ligne' || !editForm.type_seance}
                    >
                      <option value="">Sélectionner un groupe</option>
                      {options.groupes.map(groupe => (
                        <option key={groupe.ID_groupe} value={groupe.ID_groupe}>{groupe.num_groupe}</option>
                      ))}
                    </select>
                  </div>
                  {isAdding && (
                    <>
                      <div className={styles['ADM-EDT-form-group']}>
                        <label>Jour</label>
                        <input type="text" name="jour" value={editForm.jour} readOnly />
                      </div>
                      <div className={styles['ADM-EDT-form-group']}>
                        <label>Créneau</label>
                        <input type="text" name="time_slot" value={editForm.time_slot} readOnly />
                      </div>
                    </>
                  )}
                </div>
                <div className={styles['ADM-EDT-form-actions']}>
                  <button type="submit" className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-save']}`} disabled={!editForm.ID_module}>
                    {isAdding ? 'Ajouter' : 'Enregistrer'}
                  </button>
                  <button type="button" onClick={() => { setIsEditing(false); setSelectedSession(null); setError(null); }} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-cancel']}`}>
                    Annuler
                  </button>
                </div>
            </form>
          ) : (
            <div className={styles['ADM-EDT-session-details']}>
              <h3>Détails de la case ({selectedSession.jour} {selectedSession.timeSlot})</h3>
              {selectedSession.sessions.length > 0 ? (
                <>
                  {selectedSession.sessions.map((session, index) => (
                    <div key={index} className={styles['ADM-EDT-details-card']}>
                      <div className={styles['ADM-EDT-detail-item']}>
                          <span className={styles['ADM-EDT-detail-label']}>Type :</span>
                          <span className={styles['ADM-EDT-detail-value']}>{session.type_seance}</span>
                        </div>
                        <div className={styles['ADM-EDT-detail-item']}>
                          <span className={styles['ADM-EDT-detail-label']}>Module :</span>
                          <span className={styles['ADM-EDT-detail-value']}>{session.module}</span>
                        </div>
                        <div className={styles['ADM-EDT-detail-item']}>
                          <span className={styles['ADM-EDT-detail-label']}>Enseignant :</span>
                          <span className={styles['ADM-EDT-detail-value']}>{session.teacher}</span>
                        </div>
                        <div className={styles['ADM-EDT-detail-item']}>
                          <span className={styles['ADM-EDT-detail-label']}>Salle :</span>
                          <span className={styles['ADM-EDT-detail-value']}>{session.room}</span>
                        </div>
                        {session.type_seance !== 'cours' && session.group && (
                          <div className={styles['ADM-EDT-detail-item']}>
                            <span className={styles['ADM-EDT-detail-label']}>Groupe :</span>
                            <span className={styles['ADM-EDT-detail-value']}>{session.group}</span>
                          </div>
                        )}
                        <div className={styles['ADM-EDT-detail-actions']}>
                          <button onClick={() => handleEdit(session)} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-edit']}`}>
                            Modifier
                          </button>
                          <button onClick={() => handleDelete(session.ID_seance)} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-delete']}`}>
                            Supprimer
                          </button>
                        </div>
                        {index < selectedSession.sessions.length - 1 && <hr />}
                    </div>
                  ))}
                  {selectedSession.sessions.length < 4 && !selectedSession.sessions.some(s => s.type_seance === 'cours') && (
                    <button onClick={handleAdd} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-add']}`}>
                      Ajouter une séance
                    </button>
                  )}
                </>
              ) : (
                <div className={styles['ADM-EDT-no-session']}>
                  <p>Aucune séance à cet emplacement.</p>
                  <button onClick={handleAdd} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-add']}`}>
                    Ajouter une séance
                  </button>
                </div>
              )}
              <button onClick={() => { setSelectedSession(null); setError(null); }} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-close-modal']}`}>
                Fermer
              </button>
            </div>
          )}
          {error && <p className={`${styles['ADM-EDT-timetable-error']} ${styles['ADM-EDT-modal-error']}`}>{error}</p>}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className={styles['ADM-EDT-timetable-container']}>
      <h2 className={styles['ADM-EDT-timetable-title']}>Emploi du Temps (Semestre {semestre})</h2>
      <div className={styles['ADM-EDT-export-buttons']}>
        <button onClick={exportToPDF} className={`${styles['ADM-EDT-timetable-btn']} ${styles['ADM-EDT-export-pdf']}`}>
          <FaFilePdf /> Exporter en PDF
        </button>
      </div>
      {error && <p className={styles['ADM-EDT-timetable-error']}>{error}</p>}
      <table className={styles['ADM-EDT-modern-timetable-table']}>
        <thead>
          <tr>
            <th className={styles['ADM-EDT-modern-th']}>Jour</th>
            {timeSlots.map(slot => (
              <th key={slot} className={styles['ADM-EDT-modern-th']}>{slot}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day} className={styles['ADM-EDT-modern-tr']}>
              <td className={styles['ADM-EDT-modern-day']}>{day}</td>
              {timeSlots.map(slot => {
                const sessions = timetable[day]?.filter(s => s.time_slot === slot) || [];
                return (
                  <td
                    key={`${day}-${slot}`}
                    onClick={() => handleCellClick(day, slot)}
                    className={styles['ADM-EDT-modern-td']}
                  >
                    {sessions.length > 0 ? (
                      sessions.map((session, index) => (
                        <div key={index} className={styles['ADM-EDT-session-card']}>
                          <span className={styles['ADM-EDT-session-type']}>{session.type_seance}</span>
                          <span className={styles['ADM-EDT-session-module']}>{session.module}</span>
                          <span className={styles['ADM-EDT-session-teacher']}>{session.teacher}</span>
                          <span className={styles['ADM-EDT-session-room']}>Salle: {session.room}</span>
                          {session.type_seance !== 'cours' && session.group && (
                            <span className={styles['ADM-EDT-session-group']}>Groupe: {session.group}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className={styles['ADM-EDT-empty-slot']}>-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {renderModal()}
    </div>
  );
}

export default TimetableDisplay;