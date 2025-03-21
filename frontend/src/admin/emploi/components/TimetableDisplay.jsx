// src/components/TimetableDisplay.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../admin_css_files/TimetableDisplay.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function TimetableDisplay({ timetable, sectionId, onRefresh }) {
  console.log('Rendering timetable from Seance:', timetable);
  if (!timetable) {
    return <p className="timetable-error">Veuillez sélectionner les filtres pour voir l'emploi du temps.</p>;
  }

  const navigate = useNavigate();

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
    if (sectionId) {
      console.log('Fetching session options for sectionId:', sectionId);
      fetch(`http://localhost:8083/timetable/session-options?sectionId=${sectionId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Erreur réseau: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Options received:', data);
          if (data.success) {
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
      fetch(`http://localhost:8083/timetable/section-details?sectionId=${sectionId}`)
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
  }, [sectionId]);

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
        const session = timetable[day]?.find(s => s.time_slot === slot);
        row.push(
          session
            ? `${session.type_seance}: ${session.module} (${session.teacher}, ${session.room}${
                session.type_seance !== 'cours' && session.group ? `, ${session.group}` : ''
              })`
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
      headStyles: { fillColor: [0, 102, 204] },
    });

    const fileName = `emploi_du_temps_${niveau || 'unknown'}_${specialty || 'unknown'}_${section || 'unknown'}.pdf`;
    console.log('Saving PDF as:', fileName);
    doc.save(fileName);
  };

  const exportToExcel = () => {
    console.log('Exporting timetable to Excel with sectionDetails:', sectionDetails);
    const { faculty, department, specialty, niveau, section } = sectionDetails;

    const headerData = [
      ['Emploi du Temps'],
      [`Faculté: ${faculty || ''}`],
      [`Département: ${department || ''}`],
      [`Spécialité: ${specialty || ''}`],
      [`Niveau: ${niveau || ''}`],
      [`Section: ${section || ''}`],
      [],
    ];

    const tableData = [['Jour', ...timeSlots]];
    days.forEach(day => {
      const row = [day];
      timeSlots.forEach(slot => {
        const session = timetable[day]?.find(s => s.time_slot === slot);
        row.push(
          session
            ? `${session.type_seance}: ${session.module} (${session.teacher}, ${session.room}${
                session.type_seance !== 'cours' && session.group ? `, ${session.group}` : ''
              })`
            : '-'
        );
      });
      tableData.push(row);
    });

    const worksheetData = [...headerData, ...tableData];
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Emploi du Temps');
    const fileName = `emploi_du_temps_${niveau || 'unknown'}_${specialty || 'unknown'}_${section || 'unknown'}.xlsx`;
    console.log('Saving Excel as:', fileName);
    XLSX.writeFile(wb, fileName);
  };

  const handleCellClick = (day, slot) => {
    const session = timetable[day] && timetable[day].find(s => s.time_slot === slot);
    if (session) {
      setSelectedSession(session);
      setIsAdding(false);
    } else {
      setSelectedSession({ jour: day, timeSlot: slot });
      setIsAdding(true);
      setEditForm({
        ID_salle: '',
        Matricule: '',
        type_seance: 'cours',
        ID_groupe: null,
        ID_module: '',
        jour: day,
        time_slot: slot,
        ID_section: sectionId
      });
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      console.log('Received sessionId:', sessionId);
      if (!sessionId || typeof sessionId === 'object') {
        throw new Error('ID de séance invalide');
      }
      console.log('Deleting session with ID:', sessionId);
      const response = await fetch(`http://localhost:8083/timetable/session/${sessionId}`, {
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

  const handleEdit = () => {
    setIsEditing(true);
    setIsAdding(false);
    const initialForm = {
      ID_salle: selectedSession.room,
      Matricule: options.enseignants.find(e => `${e.prenom} ${e.nom}` === selectedSession.teacher)?.Matricule || '',
      type_seance: selectedSession.type_seance,
      ID_groupe: options.groupes.find(g => g.num_groupe === selectedSession.group)?.ID_groupe || '',
      ID_module: options.modules.find(m => m.nom_module === selectedSession.module)?.ID_module || '',
      jour: selectedSession.jour,
      time_slot: selectedSession.time_slot
    };
    console.log('Initial edit form:', initialForm);
    setEditForm(initialForm);
  };

  const handleAdd = () => {
    setIsEditing(true);
    setIsAdding(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form:', editForm);
    try {
      const formData = {
        ...editForm,
        ID_groupe: editForm.type_seance === 'cours' ? null : editForm.ID_groupe
      };
      console.log('Form data after adjustment:', formData);

      const url = isAdding
        ? 'http://localhost:8083/timetable/session'
        : `http://localhost:8083/timetable/session/${selectedSession.ID_seance}`;
      const method = isAdding ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Response text:', text);

      let data;
      try {
        data = JSON.parse(text);
        console.log('Parsed JSON:', data);
      } catch (jsonErr) {
        console.error('JSON parse error:', jsonErr.message, 'Raw text:', text);
        throw new Error('Réponse serveur invalide');
      }

      if (data.success) {
        console.log('Operation successful, calling onRefresh');
        setIsEditing(false);
        setIsAdding(false);
        setSelectedSession(null);
        setError(null); // Réinitialiser l'erreur en cas de succès
        onRefresh();
      } else {
        // Afficher le message d'erreur spécifique renvoyé par le backend (ex. conflit)
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
    setError(null); // Réinitialiser l'erreur lors de la fermeture
  };

  const handleBackToHome = () => {
    navigate('/admin');
  };

  console.log('Current selectedSession:', selectedSession);

  return (
    <div className="timetable-container">
      <h2 className="timetable-title">Emploi du Temps</h2>
      <div className="export-buttons">
        <button onClick={exportToPDF} className="timetable-btn export-pdf">Exporter en PDF</button>
        <button onClick={exportToExcel} className="timetable-btn export-excel">Exporter en Excel</button>
        <button onClick={handleBackToHome} className="timetable-btn back">Retour à l'accueil</button>
      </div>
      {error && <p className="timetable-error">{error}</p>}
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Jour</th>
            {timeSlots.map(slot => (
              <th key={slot}>{slot}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td style={{ fontWeight: '500' }}>{day}</td>
              {timeSlots.map(slot => {
                const session = timetable[day] && timetable[day].find(s => s.time_slot === slot);
                return (
                  <td
                    key={`${day}-${slot}`}
                    onClick={() => handleCellClick(day, slot)}
                    className={session ? 'session-occupied' : ''}
                  >
                    {session ? (
                      <div>
                        <strong>{session.type_seance}</strong><br />
                        {session.module}<br />
                        {session.teacher}<br />
                        Salle: {session.room}<br />
                        {session.type_seance !== 'cours' && session.group && (
                          <>Groupe: {session.group}</>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSession && (
        <div className="modal-overlay">
          <div className="modal-content">
            {isEditing ? (
              <form onSubmit={handleFormSubmit} className="session-form">
                <h3>{isAdding ? 'Ajouter une séance' : 'Modifier la séance'}</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Type de séance</label>
                    <select name="type_seance" value={editForm.type_seance} onChange={handleFormChange}>
                      <option value="cours">Cours</option>
                      <option value="TD">TD</option>
                      <option value="TP">TP</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Module</label>
                    <select name="ID_module" value={editForm.ID_module} onChange={handleFormChange}>
                      <option value="">Sélectionner un module</option>
                      {options.modules.map(mod => (
                        <option key={mod.ID_module} value={mod.ID_module}>{mod.nom_module}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Enseignant</label>
                    <select name="Matricule" value={editForm.Matricule} onChange={handleFormChange}>
                      <option value="">Sélectionner un enseignant</option>
                      {options.enseignants.map(ens => (
                        <option key={ens.Matricule} value={ens.Matricule}>{`${ens.prenom} ${ens.nom}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Salle</label>
                    <select name="ID_salle" value={editForm.ID_salle} onChange={handleFormChange}>
                      <option value="">Sélectionner une salle</option>
                      {options.salles.map(salle => (
                        <option key={salle.ID_salle} value={salle.ID_salle}>{salle.ID_salle}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Groupe</label>
                    <select
                      name="ID_groupe"
                      value={editForm.ID_groupe}
                      onChange={handleFormChange}
                      disabled={editForm.type_seance === 'cours'}
                    >
                      <option value="">Sélectionner un groupe</option>
                      {options.groupes.map(groupe => (
                        <option key={groupe.ID_groupe} value={groupe.ID_groupe}>{groupe.num_groupe}</option>
                      ))}
                    </select>
                  </div>
                  {isAdding && (
                    <>
                      <div className="form-group">
                        <label>Jour</label>
                        <input type="text" name="jour" value={editForm.jour} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Créneau</label>
                        <input type="text" name="time_slot" value={editForm.time_slot} readOnly />
                      </div>
                    </>
                  )}
                </div>
                <div className="form-actions">
                  <button type="submit" className="timetable-btn save">
                    {isAdding ? 'Ajouter' : 'Enregistrer'}
                  </button>
                  <button type="button" onClick={handleClose} className="timetable-btn cancel">
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="session-details">
                <h3>Détails de la séance</h3>
                {selectedSession.ID_seance ? (
                  <div className="details-card">
                    <div className="detail-item">
                      <span className="detail-label">Type :</span>
                      <span className="detail-value">{selectedSession.type_seance}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Module :</span>
                      <span className="detail-value">{selectedSession.module}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Enseignant :</span>
                      <span className="detail-value">{selectedSession.teacher}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Salle :</span>
                      <span className="detail-value">{selectedSession.room}</span>
                    </div>
                    {selectedSession.type_seance !== 'cours' && selectedSession.group && (
                      <div className="detail-item">
                        <span className="detail-label">Groupe :</span>
                        <span className="detail-value">{selectedSession.group}</span>
                      </div>
                    )}
                    <div className="detail-actions">
                      <button onClick={handleEdit} className="timetable-btn edit">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(selectedSession.ID_seance)} className="timetable-btn delete">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-session">
                    <p>Aucune séance à cet emplacement.</p>
                    <button onClick={handleAdd} className="timetable-btn add">
                      Ajouter une séance
                    </button>
                  </div>
                )}
                <button onClick={handleClose} className="timetable-btn close-modal">
                  Fermer
                </button>
              </div>
            )}
            {error && <p className="timetable-error modal-error">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimetableDisplay;