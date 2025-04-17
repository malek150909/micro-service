import { useState, useEffect, useRef } from 'react';
import styles from "../css/seance_supp.module.css";

function AddSession({ sectionId, onSessionAdded }) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [typeSeance, setTypeSeance] = useState('');
  const [groupeIds, setGroupeIds] = useState([]);
  const [mode, setMode] = useState('presentiel');
  const [modules, setModules] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [salleId, setSalleId] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const errorModalRef = useRef(null);
  const addSessionRef = useRef(null);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  const timeSlots = [
    '08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50',
    '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50',
  ];

  useEffect(() => {
    const fetchModules = async () => {
      try {
        console.log('Fetching modules with matricule:', matricule, 'and sectionId:', sectionId);
        const response = await fetch(`http://localhost:8083/SUPPprof/modules?matricule=${matricule}&sectionId=${sectionId}`);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Modules response:', data);
        setModules(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des modules:', error);
        setError('Erreur lors de la récupération des modules');
      }
    };

    fetchModules();
  }, [matricule, sectionId]);

  useEffect(() => {
    if (moduleId) {
      const selectedModule = modules.find((m) => m.ID_module === parseInt(moduleId));
      if (selectedModule) {
        const typeMap = {
          'Cours': ['cours'],
          'Cour/TD': ['cours', 'TD'],
          'Cour/TP': ['cours', 'TP'],
          'Cour/TD/TP': ['cours', 'TD', 'TP'],
        };
        setAvailableTypes(typeMap[selectedModule.seances] || []);
        setTypeSeance('');
        setGroupeIds([]);
        setMode('presentiel');
      }
    } else {
      setAvailableTypes([]);
      setTypeSeance('');
      setGroupeIds([]);
      setMode('presentiel');
    }
  }, [moduleId, modules]);

  useEffect(() => {
    if (mode === 'en ligne') {
      setSalleId('');
    }
  }, [mode]);

  useEffect(() => {
    if (typeSeance === 'TD' || typeSeance === 'TP') {
      fetch(`http://localhost:8083/SUPPprof/groups?sectionId=${sectionId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log('Groups response:', data);
          setGroups(data);
        })
        .catch((error) => {
          console.error('Erreur lors de la récupération des groupes:', error);
          setError('Erreur lors de la récupération des groupes');
        });
    } else {
      setGroups([]);
      setGroupeIds([]);
    }
  }, [typeSeance, sectionId]);

  useEffect(() => {
    if (date && timeSlot && mode === 'presentiel') {
      fetch(`http://localhost:8083/SUPPprof/rooms?date=${date}&timeSlot=${timeSlot}`)
        .then((res) => res.json())
        .then((data) => {
          console.log('Rooms response:', data);
          setRooms(data);
        })
        .catch((error) => {
          console.error('Erreur lors de la récupération des salles:', error);
          setError('Erreur lors de la récupération des salles');
        });
    } else {
      setRooms([]);
      setSalleId('');
    }
  }, [date, timeSlot, mode]);

  useEffect(() => {
    if (error && errorModalRef.current && addSessionRef.current) {
      const modal = errorModalRef.current;
      modal.style.display = 'flex';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.zIndex = '1000';
      modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.body.classList.add(styles['ENS-SUPP-blur-background']);
    } else {
      document.body.classList.remove(styles['ENS-SUPP-blur-background']);
    }

    return () => {
      document.body.classList.remove(styles['ENS-SUPP-blur-background']);
    };
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setError('');

    if (!moduleId) {
      setError('Veuillez sélectionner un module');
      return;
    }
    if (!typeSeance) {
      setError('Veuillez sélectionner un type de séance');
      return;
    }
    if ((typeSeance === 'TD' || typeSeance === 'TP') && groupeIds.length === 0) {
      setError('Veuillez sélectionner au moins un groupe pour les séances TD ou TP');
      return;
    }
    if (!date) {
      setError('Veuillez sélectionner une date');
      return;
    }
    if (!timeSlot) {
      setError('Veuillez sélectionner un créneau horaire');
      return;
    }
    if (mode === 'presentiel' && !salleId) {
      setError('Veuillez sélectionner une salle pour les séances en présentiel');
      return;
    }

    console.log('Date being sent to backend:', date);

    try {
      const response = await fetch('http://localhost:8083/SUPPprof/add-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricule, sectionId, salleId, moduleId, typeSeance, groupeIds, date, timeSlot, mode }),
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.message || 'Une erreur est survenue lors de l\'ajout de la séance');
      } else {
        setSuccessMessage('Séance ajoutée avec succès');
        setTimeout(() => setSuccessMessage(''), 2000);
        setDate('');
        setTimeSlot('');
        setModuleId('');
        setTypeSeance('');
        setGroupeIds([]);
        setMode('presentiel');
        setSalleId('');
        setError('');
        if (onSessionAdded) {
          onSessionAdded();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la soumission de la séance:', error);
      setError('Une erreur est survenue lors de la soumission de la séance');
    }
  };

  const closeErrorModal = () => {
    const modal = errorModalRef.current;
    if (modal) {
      modal.classList.add(styles['ENS-SUPP-fade-out']);
      setTimeout(() => {
        setError('');
        modal.style.display = 'none';
      }, 300);
    }
  };

  const handleGroupChange = (groupId) => {
    const updatedGroupeIds = groupeIds.includes(groupId)
      ? groupeIds.filter((id) => id !== groupId)
      : [...groupeIds, groupId];
    setGroupeIds(updatedGroupeIds);
  };

  return (
    <div className={styles['ENS-SUPP-add-session-container']} style={{ position: 'relative' }}>
      <div ref={addSessionRef}>
        <form onSubmit={handleSubmit}>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className={styles['ENS-SUPP-document-item']}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            <option value="">Sélectionner un module</option>
            {modules.map((module) => (
              <option key={module.ID_module} value={module.ID_module}>
                {module.nom_module}
              </option>
            ))}
          </select>
          {moduleId && (
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className={styles['ENS-SUPP-document-item']}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              <option value="presentiel">Présentiel</option>
              <option value="en ligne">En ligne</option>
            </select>
          )}
          {moduleId && (
            <select
              value={typeSeance}
              onChange={(e) => setTypeSeance(e.target.value)}
              className={styles['ENS-SUPP-document-item']}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              <option value="">Sélectionner le type de séance</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}
          {(typeSeance === 'TD' || typeSeance === 'TP') && (
            <div style={{ marginBottom: '10px', maxHeight: '100px', overflowY: 'auto', padding: '5px', border: '1px solid #ddd', borderRadius: '5px' }}>
              {groups.map((group) => (
                <label key={group.ID_groupe} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={groupeIds.includes(String(group.ID_groupe))}
                    onChange={() => handleGroupChange(String(group.ID_groupe))}
                  />
                  Groupe {group.num_groupe}
                </label>
              ))}
            </div>
          )}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={styles['ENS-SUPP-document-item']}
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className={styles['ENS-SUPP-document-item']}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            <option value="">Sélectionner un créneau horaire</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {mode === 'presentiel' && (
            <select
              value={salleId}
              onChange={(e) => setSalleId(e.target.value)}
              className={styles['ENS-SUPP-document-item']}
              style={{ width: '100%', marginBottom: '10px' }}
            >
              <option value="">Sélectionner une salle</option>
              {rooms.map((room) => (
                <option key={room.ID_salle} value={room.ID_salle}>
                  {room.nom_salle}
                </option>
              ))}
            </select>
          )}
          <button type="submit" className={styles['ENS-SUPP-close-button']} style={{ marginTop: '20px' }}>
            Ajouter la séance
          </button>
        </form>
      </div>
      {successMessage && (
        <div className={styles['ENS-SUPP-success-message']}>
          {successMessage}
        </div>
      )}
      {error && (
        <div className={styles['ENS-SUPP-error-modal']} ref={errorModalRef}>
          <div className={styles['ENS-SUPP-error-modal-content']}>
            <h4>Erreur</h4>
            <p>{error}</p>
            <button onClick={closeErrorModal} className={styles['ENS-SUPP-close-button']}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddSession;