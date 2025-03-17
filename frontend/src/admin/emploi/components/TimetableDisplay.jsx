// src/components/TimetableDisplay.jsx
import { useState, useEffect } from 'react';

function TimetableDisplay({ timetable, sectionId, onRefresh }) {
  console.log('Rendering timetable from Seance:', timetable);
  if (!timetable) {
    return <p>Veuillez sélectionner les filtres pour voir l&apos;emploi du temps.</p>;
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

  useEffect(() => {
    if (sectionId) {
      console.log('Fetching session options for sectionId:', sectionId);
      fetch(`http://localhost:8083/api/session-options?sectionId=${sectionId}`)
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
          console.error('Fetch error:', err);
          setError(err.message);
        });
    }
  }, [sectionId]);

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
        ID_groupe: '',
        ID_module: '',
        jour: day,
        time_slot: slot,
        ID_section: sectionId
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedSession.ID_seance) return;
    try {
      const response = await fetch(`http://localhost:8083/api/session/${selectedSession.ID_seance}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setSelectedSession(null);
        onRefresh();
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsAdding(false);
    const initialForm = {
      ID_salle: selectedSession.room, // Correspond à ID_salle dans timetable
      Matricule: options.enseignants.find(e => `${e.prenom} ${e.nom}` === selectedSession.teacher)?.Matricule || '',
      type_seance: selectedSession.type_seance, // Changement : type_seance au lieu de type
      ID_groupe: options.groupes.find(g => g.num_groupe === selectedSession.group)?.ID_groupe || '',
      ID_module: options.modules.find(m => m.nom_module === selectedSession.module)?.ID_module || '',
      jour: selectedSession.jour, // Ajout pour cohérence
      time_slot: selectedSession.time_slot // Ajout pour cohérence
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
      const url = isAdding
        ? 'http://localhost:8083/api/session'
        : `http://localhost:8083/api/session/${selectedSession.ID_seance}`;
      const method = isAdding ? 'POST' : 'PUT';
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
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
        onRefresh();
      } else {
        setError('Erreur lors de la ' + (isAdding ? 'création' : 'mise à jour') + `: ${data.error}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClose = () => {
    setSelectedSession(null);
    setIsEditing(false);
    setIsAdding(false);
  };

  return (
    <div className="timetable-display">
      <h2>Emploi du Temps</h2>
      <table>
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
              <td>{day}</td>
              {timeSlots.map(slot => {
                const session = timetable[day] && timetable[day].find(s => s.time_slot === slot);
                return (
                  <td
                    key={`${day}-${slot}`}
                    onClick={() => handleCellClick(day, slot)}
                    style={{ cursor: 'pointer', backgroundColor: session ? '#e0e0e0' : '#f0f0f0' }}
                  >
                    {session ? (
                      <div>
                        <strong>{session.type_seance}</strong><br /> {/* Changement : type_seance au lieu de type */}
                        {session.module}<br />
                        {session.teacher}<br />
                        Salle: {session.room}<br />
                        Groupe: {session.group}
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
        <div className="session-details" style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
          {isEditing ? (
            <form onSubmit={handleFormSubmit}>
              <h3>{isAdding ? 'Ajouter une séance' : 'Modifier la séance'}</h3>
              <div>
                <label>Type de séance:</label>
                <select name="type_seance" value={editForm.type_seance} onChange={handleFormChange}>
                  <option value="cours">Cours</option>
                  <option value="TD">TD</option>
                  <option value="TP">TP</option>
                </select>
              </div>
              <div>
                <label>Module:</label>
                <select name="ID_module" value={editForm.ID_module} onChange={handleFormChange}>
                  <option value="">Sélectionner</option>
                  {options.modules.map(mod => (
                    <option key={mod.ID_module} value={mod.ID_module}>{mod.nom_module}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Enseignant:</label>
                <select name="Matricule" value={editForm.Matricule} onChange={handleFormChange}>
                  <option value="">Sélectionner</option>
                  {options.enseignants.map(ens => (
                    <option key={ens.Matricule} value={ens.Matricule}>{`${ens.prenom} ${ens.nom}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Salle:</label>
                <select name="ID_salle" value={editForm.ID_salle} onChange={handleFormChange}>
                  <option value="">Sélectionner</option>
                  {options.salles.map(salle => (
                    <option key={salle.ID_salle} value={salle.ID_salle}>{salle.ID_salle}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Groupe:</label>
                <select name="ID_groupe" value={editForm.ID_groupe} onChange={handleFormChange}>
                  <option value="">Sélectionner</option>
                  {options.groupes.map(groupe => (
                    <option key={groupe.ID_groupe} value={groupe.ID_groupe}>{groupe.num_groupe}</option>
                  ))}
                </select>
              </div>
              {isAdding && (
                <>
                  <div>
                    <label>Jour:</label>
                    <input type="text" name="jour" value={editForm.jour} readOnly />
                  </div>
                  <div>
                    <label>Créneau:</label>
                    <input type="text" name="time_slot" value={editForm.time_slot} readOnly />
                  </div>
                </>
              )}
              <button type="submit">{isAdding ? 'Ajouter' : 'Enregistrer'}</button>
              <button type="button" onClick={handleClose}>Annuler</button>
            </form>
          ) : (
            <>
              <h3>Détails de la séance</h3>
              {selectedSession.ID_seance ? (
                <>
                  <p><strong>Type:</strong> {selectedSession.type_seance}</p> {/* Changement : type_seance */}
                  <p><strong>Module:</strong> {selectedSession.module}</p>
                  <p><strong>Enseignant:</strong> {selectedSession.teacher}</p>
                  <p><strong>Salle:</strong> {selectedSession.room}</p>
                  <p><strong>Groupe:</strong> {selectedSession.group}</p>
                  <button onClick={handleEdit}>Modifier</button>
                  <button onClick={handleDelete}>Supprimer</button>
                </>
              ) : (
                <p>Aucune séance à cet emplacement. Voulez-vous en ajouter une ?</p>
              )}
              {!selectedSession.ID_seance && <button onClick={handleAdd}>Ajouter</button>}
              <button onClick={handleClose}>Fermer</button>
            </>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

export default TimetableDisplay;