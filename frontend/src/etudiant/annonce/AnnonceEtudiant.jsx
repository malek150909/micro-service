// student-annonces/frontend/src/components/AnnonceEtudiant.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Ajout de useNavigate
import { FaBullhorn, FaSearch, FaTimes, FaUser, FaHome, FaUserTie, FaImage } from 'react-icons/fa';
import './annonceEtudiant.css';

const AnnonceEtudiant = () => { // Suppression de handleLogout en prop
  const [activeTab, setActiveTab] = useState('admin');
  const [adminAnnonces, setAdminAnnonces] = useState([]);
  const [filteredAdminAnnonces, setFilteredAdminAnnonces] = useState([]);
  const [teacherAnnonces, setTeacherAnnonces] = useState([]);
  const [filteredTeacherAnnonces, setFilteredTeacherAnnonces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // Initialisation de useNavigate
  const API_URL = 'http://localhost:8082';

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const matricule = storedUser?.Matricule;

      if (!matricule) {
        setError('Utilisateur non authentifié');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const adminResponse = await fetch(`${API_URL}/annoncesETD/admin/${matricule}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (!adminResponse.ok) {
          const errorData = await adminResponse.json();
          throw new Error(errorData.error || 'Erreur lors du chargement des annonces admin');
        }
        const adminData = await adminResponse.json();
        setAdminAnnonces(Array.isArray(adminData) ? adminData : []);
        setFilteredAdminAnnonces(Array.isArray(adminData) ? adminData : []);

        const teacherResponse = await fetch(`${API_URL}/annoncesETD/teacher/${matricule}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (!teacherResponse.ok) {
          const errorData = await teacherResponse.json();
          throw new Error(errorData.error || 'Erreur lors du chargement des annonces enseignant');
        }
        const teacherData = await teacherResponse.json();
        setTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);
        setFilteredTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);

      } catch (err) {
        console.error('Erreur:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAdminAnnonces(adminAnnonces);
      setFilteredTeacherAnnonces(teacherAnnonces);
    } else {
      const filteredAdmin = adminAnnonces.filter(annonce =>
        (annonce.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (annonce.content || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      const filteredTeacher = teacherAnnonces.filter(annonce =>
        (annonce.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (annonce.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (annonce.enseignant_nom || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAdminAnnonces(filteredAdmin);
      setFilteredTeacherAnnonces(filteredTeacher);
    }
  }, [searchTerm, adminAnnonces, teacherAnnonces]);

  const openDetailsModal = (annonce) => {
    setSelectedAnnonce(annonce);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAnnonce(null);
  };

  // Nouvelle définition de handleLogout
  const handleLogout = () => {
    navigate('/etudiant'); // Redirection vers /etudiant sans supprimer les données
  };

  if (loading) {
    return <div className="container">Chargement...</div>;
  }

  if (error) {
    return (
      <div id="annoncesETD">
        <div className="container">
          <p className="error-message">{error}</p>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div id="annoncesETD">
      <div className="container">
        <div className="background-shapes">
          <div className="shape shape1"></div>
          <div className="shape shape2"></div>
        </div>

        <aside className="sidebar">
          <div className="logo">
            <h2>Mes annonces</h2>
          </div>
          <button className="sidebar-button" onClick={handleLogout}>
            <FaHome /> Retour à l'accueil
          </button>
          <button className="sidebar-button" onClick={() => setActiveTab('admin')}>
            <FaBullhorn /> Annonces Administratives
          </button>
          <button className="sidebar-button" onClick={() => setActiveTab('teacher')}>
            <FaBullhorn /> Annonces des Enseignants
          </button>
        </aside>

        <main className="main-content">
          {activeTab === 'admin' && (
            <section id="admin" className="tab-content">
              <div className="header">
                <h1><FaUser /> Annonces Administratives</h1>
                <p>Consultez les annonces destinées à vous de la part de l'administration</p>
              </div>
              <div className="search-bar-container">
                <div className="search-bar">
                  <span className="search-icon"><FaSearch /></span>
                  <input
                    type="text"
                    placeholder="Rechercher une annonce..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="content-grid">
                <div className="event-list">
                  <ul id="annonces-list">
                    {filteredAdminAnnonces.length === 0 ? (
                      <li className="no-results">Aucune annonce disponible</li>
                    ) : (
                      filteredAdminAnnonces.map(annonce => (
                        <li key={annonce.id} className="event-item" onClick={() => openDetailsModal(annonce)}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: '15px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
                            border: '2px solid rgba(84, 131, 179, 0.3)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            height: '150px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: '30%',
                              height: '100%',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              marginRight: '15px',
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                              border: '1px solid rgba(84, 131, 179, 0.2)',
                              flexShrink: 0
                            }}>
                              {annonce.image_url ? (
                                <img
                                  src={annonce.image_url}
                                  alt={annonce.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { e.target.src = ''; }}
                                />
                              ) : (
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  background: '#f0f7ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#5483b3',
                                  fontStyle: 'italic'
                                }}>
                                  <FaImage size={30} />
                                </div>
                              )}
                            </div>
                            <div className="event-info" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                              <h4 style={{ marginBottom: '8px', fontSize: '1.2rem', color: '#052659', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaBullhorn className="annonce-icon" />
                                {annonce.title || 'Sans titre'}
                              </h4>
                              <p style={{ margin: '4px 0', color: '#5483b3', fontSize: '0.95rem' }}>
                                {new Date(annonce.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'teacher' && (
            <section id="teacher" className="tab-content">
              <div className="header">
                <h1><FaUser /> Annonces des Enseignants</h1>
                <p>Consultez les annonces destinées à vous de la part de vos enseignants</p>
              </div>
              <div className="search-bar-container">
                <div className="search-bar">
                  <span className="search-icon"><FaSearch /></span>
                  <input
                    type="text"
                    placeholder="Rechercher une annonce..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="content-grid">
                <div className="event-list">
                  <ul id="annonces-list">
                    {filteredTeacherAnnonces.length === 0 ? (
                      <li className="no-results">Aucune annonce disponible</li>
                    ) : (
                      filteredTeacherAnnonces.map(annonce => (
                        <li key={annonce.id} className="event-item" onClick={() => openDetailsModal(annonce)}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '15px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
                            border: '2px solid rgba(125, 160, 202, 0.3)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            height: '100%',
                            minHeight: '300px'
                          }}>
                            <div style={{
                              width: '100%',
                              height: '150px',
                              borderRadius: '8px',
                              marginBottom: '10px',
                              background: '#e6f0ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#5483b3',
                              fontSize: '2rem'
                            }}>
                              <FaUserTie />
                            </div>
                            <div className="event-info" style={{ textAlign: 'center', width: '100%', flex: 1 }}>
                              <h4 style={{ marginBottom: '8px', fontSize: '1.2rem', color: '#052659' }}>
                                <FaBullhorn className="annonce-icon" />
                                {annonce.title || 'Sans titre'}
                              </h4>
                              <p style={{ margin: '4px 0', color: '#5483b3', fontSize: '0.95rem' }}>
                                <strong>Enseignant :</strong> {annonce.enseignant_nom}
                              </p>
                              <p style={{ margin: '4px 0', color: '#5483b3', fontSize: '0.95rem' }}>
                                {new Date(annonce.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </main>

        {showDetailsModal && selectedAnnonce && (
          <div className="modal-overlay active">
            <div className="modal-content">
              <h3>{selectedAnnonce.title || 'Sans titre'}</h3>
              <div className="modal-body">
                {selectedAnnonce.image_url && (
                  <img
                    src={selectedAnnonce.image_url}
                    alt={selectedAnnonce.title}
                    className="event-image"
                    style={{ maxWidth: '100%', maxHeight: '200px', marginBottom: '20px' }}
                    onError={(e) => { e.target.src = ''; }}
                  />
                )}
                <div className="description">
                  <p><strong>Contenu :</strong> {selectedAnnonce.content || 'Aucun contenu'}</p>
                </div>
                <p><strong>Date de création :</strong> {new Date(selectedAnnonce.created_at).toLocaleString()}</p>
                {selectedAnnonce.enseignant_nom && (
                  <p><strong>Enseignant :</strong> {selectedAnnonce.enseignant_nom}</p>
                )}
              </div>
              <div className="button-group">
                <button className="close-button" onClick={closeDetailsModal}>
                  <FaTimes /> Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnonceEtudiant;