import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SessionModal from './SessionModal';
import '../css//EmploiDuTemps.css';

const Timetable = () => {
  const [seances, setSeances] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matricule, setMatricule] = useState(null);

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

  if (!matricule) {
    return <div>Veuillez vous connecter pour voir votre emploi du temps.</div>;
  }

  return (
    <div className="timetable-container">
      <h2 className="timetable-title">Emploi du temps</h2>
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Jour</th>
            {timeSlots.map(slot => <th key={slot}>{slot}</th>)}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td>{day}</td>
              {timeSlots.map(slot => {
                const session = seances.find(s => s.jour === day && s.time_slot === slot);
                return (
                  <td
                    key={`${day}-${slot}`}
                    className={session ? 'session-occupied' : ''}
                    onClick={() => handleCellClick(day, slot)}
                  >
                    {session ? (
                      <div>
                        <strong>{session.type_seance}</strong><br />
                        {session.nom_module}<br />
                        {session.nom_salle}<br />
                        {(session.type_seance === 'TP' || session.type_seance === 'TD') && session.num_groupe && (
                          <>Groupe {session.num_groupe}<br /></>
                        )}
                        {`(${session.niveau} ${session.nom_specialite} ${session.nom_section})`}
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
      {isModalOpen && <SessionModal session={selectedSession} onClose={closeModal} />}
    </div>
  );
};

export default Timetable;