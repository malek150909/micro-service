import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ReactDOM from 'react-dom';
import './StudentTimetableFeed.css';
import { FaHome, FaFilePdf, FaFileExcel } from 'react-icons/fa'; // Ajout des icônes pour PDF et Excel

const StudentTimetableFeed = () => {
  const [seances, setSeances] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matricule, setMatricule] = useState(null);
  const sectionInfo = seances.length > 0 
    ? `${seances[0].niveau} ${seances[0].nom_specialite} ${seances[0].nom_section}`
    : '';

  const navigate = useNavigate();

  const days = ['Samedi', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
  const timeSlots = [
    '08:00 - 09:30',
    '09:40 - 11:10',
    '11:20 - 12:50',
    '13:00 - 14:30',
    '14:40 - 16:10',
    '16:20 - 17:50',
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
      const response = await axios.get('http://courses.localhost/timetableETD/seances', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSeances(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération de l’emploi du temps:', error);
    }
  };

  const handleCellClick = (jour, timeSlot) => {
    const sessions = seances.filter((s) => s.jour === jour && s.time_slot === timeSlot);
    setSelectedSession({ jour, timeSlot, sessions });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
    fetchTimetable();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const sectionDetails = seances.length > 0 ? {
      niveau: seances[0].niveau,
      specialty: seances[0].nom_specialite,
      section: seances[0].nom_section,
    } : {};

    doc.setFontSize(16);
    doc.text('Emploi du Temps', 14, 20);
    doc.setFontSize(12);
    doc.text(`Niveau: ${sectionDetails.niveau || ''}`, 14, 30);
    doc.text(`Spécialité: ${sectionDetails.specialty || ''}`, 14, 40);
    doc.text(`Section: ${sectionDetails.section || ''}`, 14, 50);

    const tableData = [];
    tableData.push(['Jour', ...timeSlots]);
    days.forEach((day) => {
      const row = [day];
      timeSlots.forEach((slot) => {
        const sessions = seances.filter((s) => s.jour === day && s.time_slot === slot);
        row.push(
          sessions.length > 0
            ? sessions
                .map((s) => `${s.type_seance === 'Cour' ? 'Cours' : s.type_seance}: ${s.nom_module} (${s.nom_salle}${s.num_groupe ? `, Groupe ${s.num_groupe}` : ''})`)
                .join('\n')
            : '-'
        );
      });
      tableData.push(row);
    });

    autoTable(doc, {
      startY: 60,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 102, 204] },
    });

    const fileName = `emploi_du_temps_${sectionDetails.niveau || 'unknown'}_${sectionDetails.specialty || 'unknown'}_${sectionDetails.section || 'unknown'}.pdf`;
    doc.save(fileName);
  };

  const renderModal = () => {
    if (!isModalOpen || !selectedSession) return null;

    return ReactDOM.createPortal(
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="session-details">
            <h3 className="timetable-title">Détails de la case ({selectedSession.jour} {selectedSession.timeSlot})</h3>
            {selectedSession.sessions.length > 0 ? (
              selectedSession.sessions.map((s, index) => (
                <div key={index} className="details-card">
                  <div className="detail-item">
                    <span className="detail-label">Type :</span>
                    <span className="detail-value">{s.type_seance === 'Cour' ? 'Cours' : s.type_seance}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Module :</span>
                    <span className="detail-value">{s.nom_module}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Salle :</span>
                    <span className="detail-value">{s.nom_salle}</span>
                  </div>
                  {(s.type_seance === 'TP' || s.type_seance === 'TD') && s.num_groupe && (
                    <div className="detail-item">
                      <span className="detail-label">Groupe :</span>
                      <span className="detail-value">{s.num_groupe}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Jour :</span>
                    <span className="detail-value">{s.jour}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Horaire :</span>
                    <span className="detail-value">{s.time_slot}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Section :</span>
                    <span className="detail-value">{`(${s.niveau} ${s.nom_specialite} ${s.nom_section})`}</span>
                  </div>
                  {index < selectedSession.sessions.length - 1 && <hr />}
                </div>
              ))
            ) : (
              <p className="no-session">Aucune séance à cet emplacement.</p>
            )}
            <button className="timetable-btn close-modal" onClick={closeModal}>Fermer</button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (!matricule) {
    return <div>Veuillez vous connecter pour voir votre emploi du temps.</div>;
  }

  return (
    <div className="student-timetable-wrapper">
      <div className="sidebar">
      <div className="logo"><h2>Emplois du temps</h2></div>
        <button className="sidebar-button" onClick={() => navigate('/etudiant')}>
          <FaHome /> Retour à l'accueil
        </button>
        <button className="sidebar-button export-pdf" onClick={exportToPDF}>
          <FaFilePdf /> Exporter en PDF
        </button>
      </div>
      <div className="timetable-container">
        <div className="timetable-header">
          <h2 className="timetable-title">Votre Emploi du temps</h2>
          {sectionInfo && <div className="section-info">{sectionInfo}</div>}
        </div>
        <table className="modern-timetable-table">
          <thead>
            <tr>
              <th className="modern-th">Jour</th>
              {timeSlots.map((slot) => (
                <th key={slot} className="modern-th">{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="modern-tr">
                <td className="modern-day">{day}</td>
                {timeSlots.map((slot) => {
                  const sessions = seances.filter((s) => s.jour === day && s.time_slot === slot);
                  return (
                    <td
                      key={`${day}-${slot}`}
                      onClick={() => handleCellClick(day, slot)}
                      className="modern-td"
                    >
                      {sessions.length > 0 ? (
                        sessions.map((session, index) => (
                          <div key={index} className="session-card">
                            <span className="session-type">{session.type_seance === 'Cour' ? 'Cours' : session.type_seance}</span>
                            <span className="session-module">{session.nom_module}</span>
                            <span className="session-room">Salle: {session.nom_salle}</span>
                            {(session.type_seance === 'TP' || session.type_seance === 'TD') && session.num_groupe && (
                              <span className="session-group">Groupe: {session.num_groupe}</span>
                            )}
                          </div>
                        ))
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

export default StudentTimetableFeed;