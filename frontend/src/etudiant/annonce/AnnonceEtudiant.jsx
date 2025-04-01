import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBullhorn, FaSearch, FaTimes, FaUser, FaHome, FaUserTie, FaImage, FaPoll, FaCheck, FaComment } from 'react-icons/fa';
import './annonceEtudiant.css';

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
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8082';

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
      if (!matricule) {
        setError('Veuillez vous connecter pour accéder à vos annonces et sondages.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [adminResponse, teacherResponse, sondagesResponse] = await Promise.all([
          fetch(`${API_URL}/annoncesETD/admin/${matricule}`),
          fetch(`${API_URL}/annoncesETD/teacher/${matricule}`),
          fetch(`${API_URL}/annoncesETD/sondages/${matricule}`),
        ]);

        if (!adminResponse.ok) throw new Error((await adminResponse.json()).error || 'Erreur lors du chargement des annonces administratives.');
        if (!teacherResponse.ok) throw new Error((await teacherResponse.json()).error || 'Erreur lors du chargement des annonces des enseignants.');
        if (!sondagesResponse.ok) throw new Error((await sondagesResponse.json()).error || 'Erreur lors du chargement des sondages.');

        const [adminData, teacherData, sondagesData] = await Promise.all([
          adminResponse.json(),
          teacherResponse.json(),
          sondagesResponse.json(),
        ]);

        setAdminAnnonces(Array.isArray(adminData) ? adminData : []);
        setFilteredAdminAnnonces(Array.isArray(adminData) ? adminData : []);
        setTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);
        setFilteredTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);
        setTeacherSondages(Array.isArray(sondagesData) ? sondagesData : []);
        setFilteredTeacherSondages(Array.isArray(sondagesData) ? sondagesData : []);

        const responses = await Promise.all(
          sondagesData.map(sondage =>
            fetch(`${API_URL}/annoncesETD/sondages/reponse/${sondage.id}/${matricule}`)
              .then(res => res.json())
          )
        );
        setSondageResponses(Object.fromEntries(
          sondagesData.map((sondage, index) => [sondage.id, responses[index]])
        ));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matricule, API_URL]);

  useEffect(() => {
    const filterData = (data, keys) =>
      data.filter(item =>
        keys.some(key => (item[key] || '').toLowerCase().includes(searchTerm.toLowerCase()))
      );

    setFilteredAdminAnnonces(searchTerm ? filterData(adminAnnonces, ['title', 'content']) : adminAnnonces);
    setFilteredTeacherAnnonces(searchTerm ? filterData(teacherAnnonces, ['title', 'content', 'enseignant_nom']) : teacherAnnonces);
    setFilteredTeacherSondages(searchTerm ? filterData(teacherSondages, ['title', 'question', 'enseignant_nom']) : teacherSondages);
  }, [searchTerm, adminAnnonces, teacherAnnonces, teacherSondages]);

  const openDetailsModal = async (annonce) => {
    setSelectedAnnonce(annonce);
    setShowDetailsModal(true);

    if (!annonce.id || !annonce.enseignant_matricule) return;

    try {
      const response = await fetch(`${API_URL}/annoncesETD/comments/${annonce.id}`);
      if (!response.ok) throw new Error((await response.json()).error || 'Erreur lors de la récupération des commentaires.');
      const commentsData = await response.json();
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAnnonce(null);
    setComments([]);
    setNewComment('');
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
        body: JSON.stringify({ annonceId: selectedAnnonce.id, matricule, contenu: newComment }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Erreur lors de l’ajout du commentaire.');
      const responseData = await response.json();
      showMessage(responseData.message, 'success');

      const commentsResponse = await fetch(`${API_URL}/annoncesETD/comments/${selectedAnnonce.id}`);
      const updatedComments = await commentsResponse.json();
      setComments(Array.isArray(updatedComments) ? updatedComments : []);
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
      showMessage('Veuillez sélectionner une option avant de soumettre.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/annoncesETD/sondages/reponse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sondageId: selectedSondage.id, matricule, reponse: selectedOption }),
      });

      if (!response.ok) throw new Error((await response.json()).error || 'Erreur lors de la soumission de la réponse.');
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

  if (loading) return <div className="container">Chargement de vos annonces et sondages...</div>;
  if (error) return (
    <div id="annoncesETD">
    <div className="container">
      <p className="error-message">{error}</p>
      <button onClick={() => window.location.reload()}>Réessayer</button>
    </div>
    </div>
  );

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
        <button className="sidebar-button" onClick={()=> navigate("/etudiant")}>
          <FaHome /> Retour à l&apos;accueil
        </button>
        <button className="sidebar-button" onClick={() => setActiveTab('admin')}>
          <FaBullhorn /> Annonces Administratives
        </button>
        <button className="sidebar-button" onClick={() => setActiveTab('teacher')}>
          <FaBullhorn /> Annonces des Enseignants
        </button>
        <button className="sidebar-button" onClick={() => setActiveTab('sondages')}>
          <FaPoll /> Sondages
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
                    <li className="no-results">Aucune annonce administrative disponible pour le moment.</li>
                  ) : (
                    filteredAdminAnnonces.map(annonce => (
                      <li key={annonce.id} className="event-item" onClick={() => openDetailsModal(annonce)}>
                        <div className="annonce-card">
                          <div className="annonce-image">
                            {annonce.image_url ? (
                              <img
                                src={annonce.image_url}
                                alt={annonce.title}
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            ) : (
                              <div className="no-image"><FaImage size={30} /></div>
                            )}
                          </div>
                          <div className="event-info">
                            <h4><FaBullhorn className="annonce-icon" /> {annonce.title || 'Sans titre'}</h4>
                            <p>{new Date(annonce.created_at).toLocaleString()}</p>
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
                    <li className="no-results">Aucune annonce des enseignants disponible pour le moment.</li>
                  ) : (
                    filteredTeacherAnnonces.map(annonce => (
                      <li key={annonce.id} className="event-item" onClick={() => openDetailsModal(annonce)}>
                        <div className="annonce-card">
                          <div className="annonce-icon-placeholder"><FaUserTie /></div>
                          <div className="event-info">
                            <h4><FaBullhorn className="annonce-icon" /> {annonce.title || 'Sans titre'}</h4>
                            <p><strong>Enseignant :</strong> {annonce.enseignant_nom}</p>
                            <p>{new Date(annonce.created_at).toLocaleString()}</p>
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
          <section id="sondages" className="tab-content">
            <div className="header">
              <h1><FaPoll /> Sondages</h1>
              <p>Participez aux sondages créés par vos enseignants</p>
            </div>
            <div className="search-bar-container">
              <div className="search-bar">
                <span className="search-icon"><FaSearch /></span>
                <input
                  type="text"
                  placeholder="Rechercher un sondage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="content-grid">
              <div className="event-list">
                <ul id="sondages-list">
                  {filteredTeacherSondages.length === 0 ? (
                    <li className="no-results">Aucun sondage disponible pour le moment.</li>
                  ) : (
                    filteredTeacherSondages.map(sondage => (
                      <li key={sondage.id} className="event-item" onClick={() => openSondageModal(sondage)}>
                        <div className="annonce-card">
                          <div className="annonce-icon-placeholder"><FaPoll /></div>
                          <div className="event-info">
                            <h4>
                              <FaPoll className="sondage-icon" /> {sondage.title || 'Sans titre'}
                              {sondageResponses[sondage.id]?.hasResponded && <FaCheck className="check-icon" />}
                            </h4>
                            <p><strong>Question :</strong> {sondage.question}</p>
                            <p><strong>Enseignant :</strong> {sondage.enseignant_nom}</p>
                            <p>{new Date(sondage.created_at).toLocaleString()}</p>
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
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}
              <div className="description">
                <p><strong>Contenu :</strong> {selectedAnnonce.content || 'Aucun contenu'}</p>
              </div>
              <p><strong>Date de création :</strong> {new Date(selectedAnnonce.created_at).toLocaleString()}</p>
              {selectedAnnonce.enseignant_nom && <p><strong>Enseignant :</strong> {selectedAnnonce.enseignant_nom}</p>}

              {selectedAnnonce.enseignant_matricule && (
                <div className="comments-section">
                  <h4><FaComment /> Commentaires</h4>
                  {comments.length === 0 ? (
                    <p className="no-comments">Aucun commentaire pour le moment.</p>
                  ) : (
                    <div className="comments-list">
                      {comments.map(comment => (
                        <div key={comment.ID_commentaire} className="comment-item">
                          <div className="comment-header">
                            <p>{comment.nom} {comment.prenom}</p>
                            <p>{new Date(comment.date_commentaire).toLocaleString()}</p>
                          </div>
                          <p>{comment.contenu}</p>
                          {comment.reponse_enseignant && (
                            <div className="teacher-reply">
                              <p><FaUserTie /> Réponse de l'enseignant ({new Date(comment.date_reponse).toLocaleString()})</p>
                              <p>{comment.reponse_enseignant}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="comment-form">
                    <textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button onClick={handleCommentSubmit}>Publier</button>
                  </div>
                </div>
              )}
            </div>
            <div className="button-group">
              <button className="close-button" onClick={closeDetailsModal}><FaTimes /> Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showSondageModal && selectedSondage && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <h3>{selectedSondage.title || 'Sans titre'}</h3>
            <div className="modal-body">
              {sondageResponses[selectedSondage.id]?.hasResponded ? (
                <>
                  <p><strong>Question：</strong> {selectedSondage.question}</p>
                  <p><strong>Votre réponse :</strong> {sondageResponses[selectedSondage.id].reponse}</p>
                  <p className="success-text">Vous avez déjà répondu à ce sondage.</p>
                </>
              ) : (
                <>
                  <p><strong>Question :</strong> {selectedSondage.question}</p>
                  <p><strong>Enseignant :</strong> {selectedSondage.enseignant_nom}</p>
                  <p><strong>Date de création :</strong> {new Date(selectedSondage.created_at).toLocaleString()}</p>
                  <div className="sondage-options">
                    {selectedSondage.options.map((option, index) => (
                      <div key={index} className="sondage-option">
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
                </>
              )}
            </div>
            <div className="button-group">
              {sondageResponses[selectedSondage.id]?.hasResponded ? (
                <button className="close-button" onClick={closeSondageModal}><FaTimes /> Fermer</button>
              ) : (
                <>
                  <button onClick={handleSondageSubmit}>Soumettre</button>
                  <button className="close-button" onClick={closeSondageModal}><FaTimes /> Annuler</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="modal-overlay active">
          <div className="modal-content">
            <h3>{messageType === 'success' ? 'Succès' : 'Erreur'}</h3>
            <div className="modal-body">
              <p className={messageType === 'success' ? 'success-text' : 'error-text'}>{message}</p>
            </div>
            <div className="button-group">
              <button className="close-button" onClick={closeMessageModal}><FaTimes /> Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AnnonceEtudiant;