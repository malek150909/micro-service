import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBullhorn, FaSearch, FaTimes, FaUser, FaHome, FaUserTie, FaImage, FaPoll, FaCheck, FaComment, FaCalendarPlus } from 'react-icons/fa';
import styles from './annonceEtudiant.module.css';

const AnnonceEtudiant = ({ handleLogout }) => {
  const [activeTab, setActiveTab] = useState('admin');
  const [adminAnnonces, setAdminAnnonces] = useState([]);
  const [filteredAdminAnnonces, setFilteredAdminAnnonces] = useState([]);
  const [teacherAnnonces, setTeacherAnnonces] = useState([]);
  const [filteredTeacherAnnonces, setFilteredTeacherAnnonces] = useState([]);
  const [teacherSondages, setTeacherSondages] = useState([]);
  const [filteredTeacherSondages, setFilteredTeacherSondages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [showSondageModal, setShowSondageModal] = useState(false);
  const [selectedSondage, setSelectedSondage] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [sondageResponses, setSondageResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [isEventAdded, setIsEventAdded] = useState(false);
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  const API_URL = 'http://messaging.localhost';

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
    setMessage('');
    setMessageType('');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const adminResponse = await fetch(`${API_URL}/annoncesETD/admin/${matricule}`);
        if (!adminResponse.ok) {
          const errorData = await adminResponse.json();
          throw new Error(errorData.error || 'Erreur lors du chargement des annonces administratives.');
        }
        const adminData = await adminResponse.json();
        setAdminAnnonces(Array.isArray(adminData) ? adminData : []);
        setFilteredAdminAnnonces(Array.isArray(adminData) ? adminData : []);

        const teacherResponse = await fetch(`${API_URL}/annoncesETD/teacher/${matricule}`);
        if (!teacherResponse.ok) {
          const errorData = await teacherResponse.json();
          throw new Error(errorData.error || 'Erreur lors du chargement des annonces des enseignants.');
        }
        const teacherData = await teacherResponse.json();
        setTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);
        setFilteredTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);

        const sondagesResponse = await fetch(`${API_URL}/annoncesETD/sondages/${matricule}`);
        if (!sondagesResponse.ok) {
          const errorData = await sondagesResponse.json();
          throw new Error(errorData.error || 'Erreur lors du chargement des sondages.');
        }
        const sondagesData = await sondagesResponse.json();
        setTeacherSondages(Array.isArray(sondagesData) ? sondagesData : []);
        setFilteredTeacherSondages(Array.isArray(sondagesData) ? sondagesData : []);

        const responses = {};
        for (const sondage of sondagesData) {
          const responseCheck = await fetch(`${API_URL}/annoncesETD/sondages/reponse/${sondage.id}/${matricule}`);
          const responseData = await responseCheck.json();
          responses[sondage.id] = responseData;
        }
        setSondageResponses(responses);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (matricule) {
      fetchData();
    } else {
      setError('Veuillez fournir votre matricule pour accéder à vos annonces et sondages.');
      setLoading(false);
    }
  }, [matricule]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAdminAnnonces(adminAnnonces);
      setFilteredTeacherAnnonces(teacherAnnonces);
      setFilteredTeacherSondages(teacherSondages);
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
      const filteredSondages = teacherSondages.filter(sondage =>
        (sondage.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sondage.question || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sondage.enseignant_nom || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAdminAnnonces(filteredAdmin);
      setFilteredTeacherAnnonces(filteredTeacher);
      setFilteredTeacherSondages(filteredSondages);
    }
  }, [searchTerm, adminAnnonces, teacherAnnonces, teacherSondages]);

  const openDetailsModal = async (annonce) => {
    setSelectedAnnonce(annonce);
    setShowDetailsModal(true);

    if (!annonce.id) {
      showMessage('ID de l\'annonce manquant.', 'error');
      return;
    }

    if (!annonce.enseignant_matricule) {
      try {
        const response = await fetch(`${API_URL}/annoncesETD/calendar/check/${annonce.id}/${matricule}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de la vérification de l\'événement.');
        }
        const { isAdded } = await response.json();
        setIsEventAdded(isAdded);
      } catch (err) {
        showMessage(err.message, 'error');
      }
    }

    if (annonce.enseignant_matricule) {
      try {
        console.log(`Récupération des commentaires pour l'announce ID ${annonce.id}...`);
        const response = await fetch(`${API_URL}/annoncesETD/comments/${annonce.id}`);
        if (!response.ok) {
          const text = await response.text();
          console.log('Réponse brute en cas d\'erreur:', text);
          let errorData;
          try {
            errorData = JSON.parse(text);
          } catch (parseError) {
            throw new Error('La réponse du serveur n\'est pas au format JSON : ' + text);
          }
          throw new Error(errorData.error || 'Erreur lors de la récupération des commentaires.');
        }
        const commentsData = await response.json();
        console.log('Commentaires récupérés:', commentsData);
        setComments(commentsData);
      } catch (err) {
        console.error('Erreur lors de la récupération des commentaires:', err);
        showMessage(err.message, 'error');
      }
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAnnonce(null);
    setComments([]);
    setNewComment('');
    setIsEventAdded(false);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      showMessage('Veuillez écrire un commentaire avant de soumettre.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/annoncesETD/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annonceId: selectedAnnonce.id,
          matricule,
          contenu: newComment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout de votre commentaire.');
      }

      const responseData = await response.json();
      showMessage(responseData.message, 'success');

      const commentsResponse = await fetch(`${API_URL}/annoncesETD/comments/${selectedAnnonce.id}`);
      const updatedComments = await commentsResponse.json();
      setComments(updatedComments);
      setNewComment('');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const openSondageModal = (sondage) => {
    setSelectedSondage(sondage);
    setSelectedOption('');
    setShowSondageModal(true);
  };

  const closeSondageModal = () => {
    setShowSondageModal(false);
    setSelectedSondage(null);
    setSelectedOption('');
  };

  const handleSondageSubmit = async () => {
    if (!selectedOption) {
      showMessage('Veuillez sélectionner une option avant de soumettre votre réponse.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/annoncesETD/sondages/reponse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sondageId: selectedSondage.id,
          matricule,
          reponse: selectedOption,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la soumission de votre réponse.');
      }

      const responseData = await response.json();
      showMessage(responseData.message, 'success');

      setSondageResponses(prev => ({
        ...prev,
        [selectedSondage.id]: { hasResponded: true, reponse: selectedOption },
      }));

      closeSondageModal();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const openCalendarModal = () => {
    setShowCalendarModal(true);
  };

  const closeCalendarModal = () => {
    setShowCalendarModal(false);
    setSelectedDate('');
    setSelectedTimeSlot('');
  };

  const handleAddToCalendar = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      showMessage('Veuillez sélectionner une date et un créneau horaire.', 'error');
      return;
    }

    // Validation de la date : doit être supérieure ou égale à la date courante
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer uniquement les dates
    const chosenDate = new Date(selectedDate);
    chosenDate.setHours(0, 0, 0, 0);

    if (chosenDate < currentDate) {
      showMessage('La date choisie doit être supérieure ou égale à la date courante.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/annoncesETD/calendar/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annonceId: selectedAnnonce.id,
          matricule,
          time_slot: selectedTimeSlot,
          event_date: selectedDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'ajout au calendrier.');
      }

      const responseData = await response.json();
      showMessage(responseData.message, 'success');
      setIsEventAdded(true);
      closeCalendarModal();
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  if (loading) {
    return <div className={styles['ETD-ANC-container']}>Chargement de vos annonces et sondages...</div>;
  }

  if (error) {
    return (
      <div className={styles['ETD-ANC-container']}>
        <p className={styles['ETD-ANC-error-message']}>{error}</p>
        <button className={styles['ETD-ANC-button']} onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className={styles['ETD-ANC-container']}>
      <div className={styles['ETD-ANC-background-shapes']}>
        <div className={`${styles['ETD-ANC-shape']} ${styles['ETD-ANC-shape1']}`}></div>
        <div className={`${styles['ETD-ANC-shape']} ${styles['ETD-ANC-shape2']}`}></div>
      </div>

      <aside className={styles['ETD-ANC-sidebar']}>
        <div className={styles['ETD-ANC-logo']}>
          <h2>Mes annonces</h2>
        </div>
        <button className={styles['ETD-ANC-sidebar-button']} onClick={() => navigate("/etudiant")}>
          <FaHome /> Retour à l'accueil
        </button>
        <button className={styles['ETD-ANC-sidebar-button']} onClick={() => setActiveTab('admin')}>
          <FaBullhorn /> Annonces Administratives
        </button>
        <button className={styles['ETD-ANC-sidebar-button']} onClick={() => setActiveTab('teacher')}>
          <FaBullhorn /> Annonces des Enseignants
        </button>
        <button className={styles['ETD-ANC-sidebar-button']} onClick={() => setActiveTab('sondages')}>
          <FaPoll /> Sondages
        </button>
      </aside>

      <main className={styles['ETD-ANC-main-content']}>
        {activeTab === 'admin' && (
          <section id="admin" className={styles['ETD-ANC-tab-content']}>
            <div className={styles['ETD-ANC-header']}>
              <h1><FaUser /> Annonces Administratives</h1>
              <p>Consultez les annonces destinées à vous de la part de l'administration</p>
            </div>
            <div className={styles['ETD-ANC-search-bar-container']}>
              <div className={styles['ETD-ANC-search-bar']}>
                <span className={styles['ETD-ANC-search-icon']}><FaSearch /></span>
                <input
                  className={styles['ETD-ANC-input']}
                  type="text"
                  placeholder="Rechercher une annonce..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className={styles['ETD-ANC-content-grid']}>
              <div className={styles['ETD-ANC-event-list']}>
                <ul id="ETD-ANC-annonces-list">
                  {filteredAdminAnnonces.length === 0 ? (
                    <li className={styles['ETD-ANC-no-results']}>Aucune annonce administrative disponible pour le moment.</li>
                  ) : (
                    filteredAdminAnnonces.map(annonce => (
                      <li key={annonce.id} className={styles['ETD-ANC-event-item']} onClick={() => openDetailsModal(annonce)}>
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
                                onError={(e) => e.target.src = ''}
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
                          <div className={styles['ETD-ANC-event-info']} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h4 style={{ marginBottom: '8px', fontSize: '1.2rem', color: '#052659', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FaBullhorn className={styles['ETD-ANC-annonce-icon']} />
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
          <section id="teacher" className={styles['ETD-ANC-tab-content']}>
            <div className={styles['ETD-ANC-header']}>
              <h1><FaUser /> Annonces des Enseignants</h1>
              <p>Consultez les annonces destinées à vous de la part de vos enseignants</p>
            </div>
            <div className={styles['ETD-ANC-search-bar-container']}>
              <div className={styles['ETD-ANC-search-bar']}>
                <span className={styles['ETD-ANC-search-icon']}><FaSearch /></span>
                <input
                  className={styles['ETD-ANC-input']}
                  type="text"
                  placeholder="Rechercher une annonce..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className={styles['ETD-ANC-content-grid']}>
              <div className={styles['ETD-ANC-event-list']}>
                <ul id="ETD-ANC-annonces-list">
                  {filteredTeacherAnnonces.length === 0 ? (
                    <li className={styles['ETD-ANC-no-results']}>Aucune annonce des enseignants disponible pour le moment.</li>
                  ) : (
                    filteredTeacherAnnonces.map(annonce => (
                      <li key={annonce.id} className={styles['ETD-ANC-event-item']} onClick={() => openDetailsModal(annonce)}>
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
                          <div className={styles['ETD-ANC-event-info']} style={{ textAlign: 'center', width: '100%', flex: 1 }}>
                            <h4 style={{ marginBottom: '8px', fontSize: '1.2rem', color: '#052659' }}>
                              <FaBullhorn className={styles['ETD-ANC-annonce-icon']} />
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

        {activeTab === 'sondages' && (
          <section id="sondages" className={styles['ETD-ANC-tab-content']}>
            <div className={styles['ETD-ANC-header']}>
              <h1><FaPoll /> Sondages</h1>
              <p>Participez aux sondages créés par vos enseignants</p>
            </div>
            <div className={styles['ETD-ANC-search-bar-container']}>
              <div className={styles['ETD-ANC-search-bar']}>
                <span className={styles['ETD-ANC-search-icon']}><FaSearch /></span>
                <input
                  className={styles['ETD-ANC-input']}
                  type="text"
                  placeholder="Rechercher un sondage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className={styles['ETD-ANC-content-grid']}>
              <div className={styles['ETD-ANC-event-list']}>
                <ul id="ETD-ANC-sondages-list">
                  {filteredTeacherSondages.length === 0 ? (
                    <li className={styles['ETD-ANC-no-results']}>Aucun sondage disponible pour le moment.</li>
                  ) : (
                    filteredTeacherSondages.map(sondage => (
                      <li key={sondage.id} className={styles['ETD-ANC-event-item']} onClick={() => openSondageModal(sondage)}>
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
                            <FaPoll />
                          </div>
                          <div className={styles['ETD-ANC-event-info']} style={{ textAlign: 'center', width: '100%', flex: 1 }}>
                            <h4 style={{ marginBottom: '8px', fontSize: '1.2rem', color: '#052659', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <FaPoll className={styles['ETD-ANC-sondage-icon']} />
                              {sondage.title || 'Sans titre'}
                              {sondageResponses[sondage.id]?.hasResponded && (
                                <span style={{ marginLeft: '8px', color: '#50C878' }}>
                                  <FaCheck />
                                </span>
                              )}
                            </h4>
                            <p style={{ margin: '4px 0', color: '#5483b3', fontSize: '0.95rem' }}>
                              <strong>Question :</strong> {sondage.question}
                            </p>
                            <p style={{ margin: '4px 0', color: '#5483b3', fontSize: '0.95rem' }}>
                              <strong>Enseignant :</strong> {sondage.enseignant_nom}
                            </p>
                            <p style={{ margin: '4px 0', color: '#5483b3', fontSize: '0.95rem' }}>
                              {new Date(sondage.created_at).toLocaleString()}
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
        <div className={`${styles['ETD-ANC-modal-overlay']} ${styles['ETD-ANC-active']}`}>
          <div className={styles['ETD-ANC-modal-content']}>
            <h3>{selectedAnnonce.title || 'Sans titre'}</h3>
            <div className={styles['ETD-ANC-modal-body']}>
              {selectedAnnonce.image_url && (
                <img
                  src={selectedAnnonce.image_url}
                  alt={selectedAnnonce.title}
                  className={styles['ETD-ANC-event-image']}
                  style={{ maxWidth: '100%', maxHeight: '200px', marginBottom: '20px' }}
                  onError={(e) => e.target.src = ''}
                />
              )}
              <div className={styles['ETD-ANC-description']}>
                <p><strong>Contenu :</strong> {selectedAnnonce.content || 'Aucun contenu'}</p>
              </div>
              <p><strong>Date de création :</strong> {new Date(selectedAnnonce.created_at).toLocaleString()}</p>
              {selectedAnnonce.enseignant_nom && (
                <p><strong>Enseignant :</strong> {selectedAnnonce.enseignant_nom}</p>
              )}
              {!selectedAnnonce.enseignant_matricule && !isEventAdded && (
                <button
                  className={styles['ETD-ANC-button']}
                  onClick={openCalendarModal}
                  style={{
                    backgroundColor: '#28A745',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    marginTop: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <FaCalendarPlus /> Ajouter au calendrier
                </button>
              )}
              {selectedAnnonce.enseignant_matricule && (
                <div className={styles['ETD-ANC-comments-section']} style={{ marginTop: '20px' }}>
                  <h4 style={{
                    marginBottom: '15px',
                    color: '#052659',
                    fontSize: '1.3rem',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '2px solid #e6f0ff',
                    paddingBottom: '5px'
                  }}>
                    <FaComment style={{ marginRight: '8px', color: '#5483b3' }} /> Commentaires
                  </h4>
                  {comments.length === 0 ? (
                    <p className={styles['ETD-ANC-no-comments']}>
                      Aucun commentaire pour le moment.
                    </p>
                  ) : (
                    <div className={styles['ETD-ANC-comments-list']} style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                      {comments.map(comment => (
                        <div key={comment.ID_commentaire} className={styles['ETD-ANC-comment-item']} style={{
                          backgroundColor: '#fff',
                          borderRadius: '10px',
                          padding: '15px',
                          marginBottom: '15px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          borderLeft: '4px solid #5483b3',
                          transition: 'transform 0.2s ease',
                          position: 'relative'
                        }}>
                          <div className={styles['ETD-ANC-header']} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <p className={styles['ETD-ANC-name']} style={{
                              margin: 0,
                              fontWeight: 'bold',
                              color: '#052659',
                              fontSize: '1rem'
                            }}>
                              {comment.nom} {comment.prenom}
                            </p>
                            <p className={styles['ETD-ANC-date']} style={{
                              margin: 0,
                              color: '#5483b3',
                              fontSize: '0.85rem',
                              fontStyle: 'italic'
                            }}>
                              {new Date(comment.date_commentaire).toLocaleString()}
                            </p>
                          </div>
                          <p className={styles['ETD-ANC-content']} style={{
                            margin: '0 0 10px 0',
                            color: '#333',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                          }}>
                            {comment.contenu}
                          </p>
                          {comment.reponse_enseignant && (
                            <div className={styles['ETD-ANC-teacher-reply']} style={{
                              backgroundColor: '#f0f7ff',
                              borderRadius: '8px',
                              padding: '10px',
                              marginTop: '10px',
                              borderLeft: '3px solid #052659'
                            }}>
                              <p className={styles['ETD-ANC-header']} style={{
                                margin: '0 0 5px 0',
                                fontWeight: 'bold',
                                color: '#052659',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                <FaUserTie style={{ marginRight: '6px', color: '#5483b3' }} />
                                Réponse de l'enseignant
                                <span className={styles['ETD-ANC-date']} style={{
                                  marginLeft: '10px',
                                  color: '#5483b3',
                                  fontSize: '0.85rem',
                                  fontStyle: 'italic',
                                  fontWeight: 'normal'
                                }}>
                                  ({new Date(comment.date_reponse).toLocaleString()})
                                </span>
                              </p>
                              <p className={styles['ETD-ANC-content']} style={{
                                margin: 0,
                                color: '#052659',
                                fontSize: '0.9rem',
                                fontStyle: 'italic',
                                lineHeight: '1.4'
                              }}>
                                {comment.reponse_enseignant}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={styles['ETD-ANC-comment-form']} style={{
                    marginTop: '20px',
                    backgroundColor: '#f9f9f9',
                    padding: '15px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                  }}>
                    <textarea
                      className={styles['ETD-ANC-textarea']}
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        fontSize: '0.95rem',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 0.3s ease',
                        backgroundColor: '#fff',
                        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#5483b3'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                    <button
                      className={styles['ETD-ANC-button']}
                      onClick={handleCommentSubmit}
                      style={{
                        backgroundColor: '#4A90E2',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        marginTop: '10px',
                        fontSize: '0.95rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease, transform 0.1s ease',
                        display: 'block',
                        marginLeft: 'auto'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#357ABD'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#4A90E2'}
                      onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
                      onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      Publier
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles['ETD-ANC-button-group']}>
              <button className={styles['ETD-ANC-close-button']} onClick={closeDetailsModal}>
                <FaTimes /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showCalendarModal && (
        <div className={`${styles['ETD-ANC-modal-overlay']} ${styles['ETD-ANC-active']}`}>
          <div className={styles['ETD-ANC-modal-content']}>
            <h3>Ajouter au calendrier</h3>
            <div className={styles['ETD-ANC-modal-body']}>
              <p><strong>Événement :</strong> {selectedAnnonce.title}</p>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Sélectionner une date :</label>
                <input
                  className={styles['ETD-ANC-input']}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                  }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Sélectionner un créneau horaire :</label>
                <select
                  className={styles['ETD-ANC-select']}
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                  }}
                >
                  <option value="">Choisir un créneau</option>
                  {[
                    '08:00 - 09:30',
                    '09:40 - 11:10',
                    '11:20 - 12:50',
                    '13:00 - 14:30',
                    '14:40 - 16:10',
                    '16:20 - 17:50',
                  ].map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles['ETD-ANC-button-group']}>
              <button
                className={styles['ETD-ANC-button']}
                onClick={handleAddToCalendar}
                style={{
                  backgroundColor: '#4A90E2',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                Valider
              </button>
              <button
                className={styles['ETD-ANC-close-button']}
                onClick={closeCalendarModal}
                style={{
                  backgroundColor: '#FF4D4F',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                }}
              >
                <FaTimes /> Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showSondageModal && selectedSondage && (
        <div className={`${styles['ETD-ANC-modal-overlay']} ${styles['ETD-ANC-active']}`}>
          <div className={styles['ETD-ANC-modal-content']}>
            <h3>{selectedSondage.title || 'Sans titre'}</h3>
            <div className={styles['ETD-ANC-modal-body']}>
              {sondageResponses[selectedSondage.id]?.hasResponded ? (
                <div>
                  <p><strong>Question :</strong> {selectedSondage.question}</p>
                  <p><strong>Votre réponse :</strong> {sondageResponses[selectedSondage.id].reponse}</p>
                  <p style={{ color: '#50C878', fontStyle: 'italic' }}>
                    Vous avez déjà répondu à ce sondage.
                  </p>
                </div>
              ) : (
                <div>
                  <p><strong>Question :</strong> {selectedSondage.question}</p>
                  <p><strong>Enseignant :</strong> {selectedSondage.enseignant_nom}</p>
                  <p><strong>Date de création :</strong> {new Date(selectedSondage.created_at).toLocaleString()}</p>
                  <div className={styles['ETD-ANC-sondage-options']}>
                    {selectedSondage.options.map((option, index) => (
                      <div key={index} className={styles['ETD-ANC-sondage-option']}>
                        <input
                          type="radio"
                          id={`option-${index}`}
                          name="sondage-option"
                          value={option}
                          checked={selectedOption === option}
                          onChange={(e) => setSelectedOption(e.target.value)}
                        />
                        <label htmlFor={`option-${index}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles['ETD-ANC-button-group']}>
              {sondageResponses[selectedSondage.id]?.hasResponded ? (
                <button className={styles['ETD-ANC-close-button']} onClick={closeSondageModal}>
                  <FaTimes /> Fermer
                </button>
              ) : (
                <>
                  <button className={styles['ETD-ANC-button']} onClick={handleSondageSubmit} style={{ backgroundColor: '#4A90E2', color: 'white' }}>
                    Soumettre
                  </button>
                  <button className={styles['ETD-ANC-close-button']} onClick={closeSondageModal}>
                    <FaTimes /> Annuler
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className={`${styles['ETD-ANC-modal-overlay']} ${styles['ETD-ANC-active']}`}>
          <div className={styles['ETD-ANC-modal-content']}>
            <h3>{messageType === 'success' ? 'Succès' : 'Erreur'}</h3>
            <div className={styles['ETD-ANC-modal-body']}>
              <p style={{ color: messageType === 'success' ? '#50C878' : '#FF4D4F' }}>
                {message}
              </p>
            </div>
            <div className={styles['ETD-ANC-button-group']}>
              <button className={styles['ETD-ANC-close-button']} onClick={closeMessageModal}>
                <FaTimes /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnonceEtudiant;