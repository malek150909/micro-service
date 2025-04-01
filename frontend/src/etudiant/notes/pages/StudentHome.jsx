import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faHome, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import '../global.css';

const StudentHome = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <>
    <div id="notes">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
      </div>
      <div className="sidebar">
        <div className="logo">
          <h2>Notes</h2>
        </div>
        <button className="sidebar-button" onClick={() => navigate('/ETD')}>
          <FontAwesomeIcon icon={faHome} /> Accueil
        </button>
        <button className="sidebar-button" onClick={() => navigate('/ETDGRD')}>
          <FontAwesomeIcon icon={faClipboardList} /> Mes Notes
        </button>
        <button className="sidebar-button" onClick={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
        </button>
      </div>
      <div className="container">
        <div className="main-content">
          <div className="welcome-panel">
            <h1>BIENVENUE SUR VOTRE ESPACE ÉTUDIANT</h1>
            <p>Gérez vos informations et consultez vos notes</p>
          </div>
          <div className="section-card">
            <h1>Tableau de Bord</h1>
            <p>Bienvenue, étudiant ! Que souhaitez-vous faire ?</p>
            <button className="submit-btn" onClick={() => navigate('/ETDGRD')}>
              <FontAwesomeIcon icon={faClipboardList} /> Consulter Mes Notes Archivées
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default StudentHome;