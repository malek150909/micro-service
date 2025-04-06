import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactDOM from 'react-dom'; // Ajout de ReactDOM pour le portail
import SessionModal from './SessionModal'; // Réimportation de SessionModal
import '../css/EmploiDuTemps.css';
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
      <SessionModal session={selectedSession} onClose={closeModal} />,
      document.body
    );
  };

  if (!matricule) {
    return <div>Veuillez vous connecter pour voir votre emploi du temps.</div>;
  }

  return (
    <div className="teacher-timetable-wrapper">
      <div className="sidebar">
        <div className="logo"><h2>Emplois du temps</h2></div>
        <button className="sidebar-button" onClick={() => navigate('/enseignant')}>
          <FaHome /> Retour
        </button>
      </div>
      <div className="timetable-container">
        <h2 className="timetable-title">Votre Emploi du temps</h2>
        <table className="modern-timetable-table">
          <thead>
            <tr>
              <th className="modern-th">Jour</th>
              {timeSlots.map(slot => (
                <th key={slot} className="modern-th">{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day} className="modern-tr">
                <td className="modern-day">{day}</td>
                {timeSlots.map(slot => {
                  const session = seances.find(s => s.jour === day && s.time_slot === slot);
                  return (
                    <td
                      key={`${day}-${slot}`}
                      onClick={() => handleCellClick(day, slot)}
                      className="modern-td"
                    >
                      {session ? (
                        <div className="session-card">
                          <span className="session-type">{session.type_seance}</span>
                          <span className="session-module">{session.nom_module}</span>
                          <span className="session-room">Salle: {session.nom_salle}</span>
                          {(session.type_seance === 'TP' || session.type_seance === 'TD') && session.num_groupe && (
                            <span className="session-group">Groupe: {session.num_groupe}</span>
                          )}
                          <span className="session-section">{`(${session.niveau} ${session.nom_specialite} ${session.nom_section})`}</span>
                        </div>
                      ) : (
                        <span className="empty-slot">-</span>
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