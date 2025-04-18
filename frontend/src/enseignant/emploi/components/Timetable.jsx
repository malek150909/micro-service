import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactDOM from 'react-dom';
import SessionModal from './SessionModal';
import styles from '../css/EmploiDuTemps.module.css'; // Already correct
import { FaHome } from 'react-icons/fa';

const Timetable = () => {
  const [seances, setSeances] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matricule, setMatricule] = useState(null);

  const navigate = useNavigate();

  const days = ['Samedi', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
  const timeSlots = [
    '08:00 - 09:30', '09:40 - 11:10', '11:20 - 12:50',
    '13:00 - 14:30', '14:40 - 16:10', '16:20 - 17:50'
  ];

  useEffect(() => {
    const storedMatricule = localStorage.getItem('matricule');
    if (storedMatricule) {
      setMatricule(storedMatricule);
    } else {
      console.error('Matricule non trouvé dans localStorage');
    }
  }, []);

  useEffect(() => {
    if (matricule) {
      fetchTimetable();
    }
  }, [matricule]);

  const fetchTimetable = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8083/timetableENS/${matricule}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSeances(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l’emploi du temps:', error);
    }
  };

  const handleCellClick = (jour, timeSlot) => {
    const session = seances.find(s => s.jour === jour && s.time_slot === timeSlot);
    setSelectedSession(session || { jour, time_slot: timeSlot, Matricule: matricule });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
    fetchTimetable();
  };

  const renderModal = () => {
    if (!isModalOpen || !selectedSession) return null;

    return ReactDOM.createPortal(
      <SessionModal session={selectedSession} onClose={closeModal} styles={styles} />, // Pass styles as a prop
      document.body
    );
  };

  if (!matricule) {
    return <div>Veuillez vous connecter pour voir votre emploi du temps.</div>;
  }

  return (
    <div className={styles['ENS-EDT-teacher-timetable-wrapper']}>
      <div className={styles['ENS-EDT-sidebar']}>
        <div className={styles['ENS-EDT-logo']}><h2>Emplois du temps</h2></div>
        <button className={styles['ENS-EDT-sidebar-button']} onClick={() => navigate('/enseignant')}>
          <FaHome /> Retour a l'accueil
        </button>
      </div>
      <div className={styles['ENS-EDT-timetable-container']}>
        <h2 className={styles['ENS-EDT-timetable-title']}>Votre Emploi du temps</h2>
        <table className={styles['ENS-EDT-modern-timetable-table']}>
          <thead>
            <tr>
              <th className={styles['ENS-EDT-modern-th']}>Jour</th>
              {timeSlots.map(slot => (
                <th key={slot} className={styles['ENS-EDT-modern-th']}>{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day} className={styles['ENS-EDT-modern-tr']}>
                <td className={styles['ENS-EDT-modern-day']}>{day}</td>
                {timeSlots.map(slot => {
                  const session = seances.find(s => s.jour === day && s.time_slot === slot);
                  return (
                    <td
                      key={`${day}-${slot}`}
                      onClick={() => handleCellClick(day, slot)}
                      className={styles['ENS-EDT-modern-td']}
                    >
                      {session ? (
                        <div className={styles['ENS-EDT-session-card']}>
                          <span className={styles['ENS-EDT-session-type']}>{session.type_seance}</span>
                          <span className={styles['ENS-EDT-session-module']}>{session.nom_module}</span>
                          <span className={styles['ENS-EDT-session-room']}>Salle: {session.nom_salle}</span>
                          {(session.type_seance === 'TP' || session.type_seance === 'TD') && session.num_groupe && (
                            <span className={styles['ENS-EDT-session-group']}>Groupe: {session.num_groupe}</span>
                          )}
                          <span className={styles['ENS-EDT-session-section']}>{`(${session.niveau} ${session.nom_specialite} ${session.nom_section})`}</span>
                        </div>
                      ) : (
                        <span className={styles['ENS-EDT-empty-slot']}>-</span>
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
    </div>
  );
};

export default Timetable;