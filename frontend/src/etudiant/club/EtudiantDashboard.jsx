// club-evenement-service/frontend/src/components/EtudiantDashboard.jsx
import { useState, useEffect } from 'react';
import { FaUsers, FaList, FaEnvelope, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import GererMesClubs from './GererMesClubs';
import ListeClubsDisponibles from './ListeClubsDisponibles';
import MesClubsMembre from './MesClubsMembre';
import DemandeCreationClub from './DemandeCreationClub';
import './club.css';

const EtudiantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('gerer');
  const [clubsGerant, setClubsGerant] = useState([]);
  const [clubsMembre, setClubsMembre] = useState([]);
  const [clubsDisponibles, setClubsDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084';
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/clubsCLUB/etudiant/${matricule}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des clubs');
        }
        const data = await response.json();
        setClubsGerant(data.clubsGerant);
        setClubsMembre(data.clubsMembre);
        setClubsDisponibles(data.clubsDisponibles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [matricule]);

  const handleLogout = () => {
    navigate('/');
  };

  if (loading) {
    return (
        <div id="clubs">
        <div className="container">Chargement...</div>
        </div>
    );
  }

  return (
    <div id="clubs">
    <div className="container">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
      </div>

      <aside className="sidebar">
        <div className="logo">
          <h2>Club et Événement</h2>
        </div>
        <button
          className={`sidebar-button ${activeTab === 'gerer' ? 'active' : ''}`}
          onClick={() => setActiveTab('gerer')}
        >
          <FaUsers /> Gérer mes Clubs
        </button>
        <button
          className={`sidebar-button ${activeTab === 'disponibles' ? 'active' : ''}`}
          onClick={() => setActiveTab('disponibles')}
        >
          <FaList /> Consulter les Clubs
        </button>
        <button
          className={`sidebar-button ${activeTab === 'membre' ? 'active' : ''}`}
          onClick={() => setActiveTab('membre')}
        >
          <FaUsers /> Mes Clubs (Membre)
        </button>
        <button
          className={`sidebar-button ${activeTab === 'demande' ? 'active' : ''}`}
          onClick={() => setActiveTab('demande')}
        >
          <FaEnvelope /> Demande de Création
        </button>
        <button className="sidebar-button" onClick={()=> navigate('/etudiant')}>
          <FaSignOutAlt /> Déconnexion
        </button>
      </aside>

      <main className="main-content">
        <section className="tab-content">
          {activeTab === 'gerer' && (
            <GererMesClubs
              matricule={matricule}
              clubsGerant={clubsGerant}
              setClubsGerant={setClubsGerant}
              setError={setError}
            />
          )}
          {activeTab === 'disponibles' && (
            <ListeClubsDisponibles
              matricule={matricule}
              clubsDisponibles={clubsDisponibles}
              setClubsDisponibles={setClubsDisponibles}
              setError={setError}
            />
          )}
          {activeTab === 'membre' && (
            <MesClubsMembre
              matricule={matricule}
              clubsMembre={clubsMembre}
              setClubsMembre={setClubsMembre}
              setError={setError}
            />
          )}
          {activeTab === 'demande' && (
            <DemandeCreationClub
              matricule={matricule}
              setError={setError}
            />
          )}
          {error && <p className="error-message">{error}</p>}
        </section>
      </main>
    </div>
    </div>
  );
};

export default EtudiantDashboard;