import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaTimes, FaEnvelope, FaSearch, FaCheck, FaUser, FaHome } from 'react-icons/fa';
import styles from './club.module.css';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles['ADM-CLUB-toast']} ${styles[`ADM-CLUB-toast-${type}`]}`}>
      {message}
    </div>
  );
};

const ClubAdmin = ({ handleLogout }) => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [sections, setSections] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [filteredEtudiants, setFilteredEtudiants] = useState([]);
  const [etudiantSearch, setEtudiantSearch] = useState('');
  const [filters, setFilters] = useState({
    id_faculte: '',
    id_departement: '',
    id_specialite: '',
    id_section: '',
  });
  const [formData, setFormData] = useState({
    nom: '',
    description_club: '',
    gerant_matricule: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [editClubId, setEditClubId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('clubs');
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const API_URL = 'http://events.localhost';

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const getFetchOptions = (method, body = null) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }
    return options;
  };

  const handleResponse = async (response) => {
    if (response.status === 401) {
      localStorage.removeItem('token');
      navigate('/login');
      throw new Error('Accès non autorisé - Veuillez vous reconnecter');
    }
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur: ${response.status} ${response.statusText} - ${errorText}`);
    }
    return response.json();
  };

  const fetchDemandes = async () => {
    try {
      const response = await fetch(`${API_URL}/demandesADM`, getFetchOptions('GET'));
      const data = await handleResponse(response);
      setDemandes(data);
    } catch (err) {
      setError(err.message);
      addToast('Erreur lors de la récupération des demandes', 'error');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchClubs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/clubsADM`, getFetchOptions('GET'));
        const data = await handleResponse(response);
        setClubs(data);
      } catch (err) {
        setError(err.message);
        addToast('Erreur lors de la récupération des clubs', 'error');
      } finally {
        setLoading(false);
      }
    };

    const fetchFacultes = async () => {
      try {
        const response = await fetch(`${API_URL}/Clubs/facultes`, getFetchOptions('GET'));
        const data = await handleResponse(response);
        setFacultes(data);
      } catch (err) {
        setError(err.message);
        addToast('Erreur lors de la récupération des facultés', 'error');
      }
    };

    fetchClubs();
    fetchDemandes();
    fetchFacultes();
  }, [navigate]);

  useEffect(() => {
    const fetchDepartements = async () => {
      if (!filters.id_faculte) {
        setDepartements([]);
        setSpecialites([]);
        setSections([]);
        setEtudiants([]);
        setFilteredEtudiants([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/Clubs/departements?id_faculte=${filters.id_faculte}`, getFetchOptions('GET'));
        const data = await handleResponse(response);
        setDepartements(data);
        setSpecialites([]);
        setSections([]);
        setEtudiants([]);
        setFilteredEtudiants([]);
      } catch (err) {
        setError(err.message);
        addToast('Erreur lors de la récupération des départements', 'error');
      }
    };

    fetchDepartements();
  }, [filters.id_faculte]);

  useEffect(() => {
    const fetchSpecialites = async () => {
      if (!filters.id_departement) {
        setSpecialites([]);
        setSections([]);
        setEtudiants([]);
        setFilteredEtudiants([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/Clubs/specialites?id_departement=${filters.id_departement}`, getFetchOptions('GET'));
        const data = await handleResponse(response);
        setSpecialites(data);
        setSections([]);
        setEtudiants([]);
        setFilteredEtudiants([]);
      } catch (err) {
        setError(err.message);
        addToast('Erreur lors de la récupération des spécialités', 'error');
      }
    };

    fetchSpecialites();
  }, [filters.id_departement]);

  useEffect(() => {
    const fetchSections = async () => {
      if (!filters.id_specialite) {
        setSections([]);
        setEtudiants([]);
        setFilteredEtudiants([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/Clubs/sections?id_specialite=${filters.id_specialite}`, getFetchOptions('GET'));
        const data = await handleResponse(response);
        setSections(data);
        setEtudiants([]);
        setFilteredEtudiants([]);
      } catch (err) {
        setError(err.message);
        addToast('Erreur lors de la récupération des sections', 'error');
      }
    };

    fetchSections();
  }, [filters.id_specialite]);

  useEffect(() => {
    const fetchEtudiants = async () => {
      if (!filters.id_section) {
        setEtudiants([]);
        setFilteredEtudiants([]);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/clubsADM/etudiants/filters?id_section=${filters.id_section}`, getFetchOptions('GET'));
        const data = await handleResponse(response);
        setEtudiants(data);
        setFilteredEtudiants(data);
      } catch (err) {
        setError(err.message);
        addToast('Erreur lors de la récupération des étudiants', 'error');
      }
    };

    fetchEtudiants();
  }, [filters.id_section]);

  useEffect(() => {
    if (etudiantSearch.trim() === '') {
      setFilteredEtudiants(etudiants);
    } else {
      const filtered = etudiants.filter((etudiant) => {
        const matricule = etudiant.Matricule ? etudiant.Matricule.toString().toLowerCase() : '';
        return matricule.includes(etudiantSearch.toLowerCase());
      });
      setFilteredEtudiants(filtered);
    }
  }, [etudiantSearch, etudiants]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };
      if (name === 'id_faculte') {
        newFilters.id_departement = '';
        newFilters.id_specialite = '';
        newFilters.id_section = '';
      } else if (name === 'id_departement') {
        newFilters.id_specialite = '';
        newFilters.id_section = '';
      } else if (name === 'id_specialite') {
        newFilters.id_section = '';
      }
      return newFilters;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEtudiantSearchChange = (e) => {
    setEtudiantSearch(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.gerant_matricule || formData.gerant_matricule === '') {
      setError('Veuillez sélectionner un gérant pour le club.');
      addToast('Veuillez sélectionner un gérant pour le club.', 'error');
      return;
    }

    const data = {
      nom: formData.nom,
      description_club: formData.description_club,
      gerant_matricule: formData.gerant_matricule,
    };

    try {
      const url = editMode ? `${API_URL}/clubsADM/${editClubId}` : `${API_URL}/clubsADM`;
      const method = editMode ? 'PUT' : 'POST';
      const response = await fetch(url, getFetchOptions(method, data));
      const result = await handleResponse(response);

      setSuccess(result.message || (editMode ? 'Club modifié avec succès' : 'Club créé avec succès'));
      addToast(result.message || (editMode ? 'Club modifié avec succès' : 'Club créé avec succès'), 'success');

      const updatedClubs = await fetch(`${API_URL}/clubsADM`, getFetchOptions('GET')).then(handleResponse);
      setClubs(updatedClubs);
      setShowModal(false);
      setFormData({ nom: '', description_club: '', gerant_matricule: '' });
      setEditMode(false);
      setEditClubId(null);
      setFilters({ id_faculte: '', id_departement: '', id_specialite: '', id_section: '' });
      setEtudiantSearch('');
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    }
  };

  const handleEdit = (club) => {
    setEditMode(true);
    setEditClubId(club.ID_club);
    setFormData({
      nom: club.nom,
      description_club: club.description_club,
      gerant_matricule: club.gerant_matricule ? club.gerant_matricule.toString() : '',
    });
    setFilters({ id_faculte: '', id_departement: '', id_specialite: '', id_section: '' });
    setEtudiantSearch('');
    setShowModal(true);
  };

  const handleView = (club) => {
    setSelectedClub(club);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_URL}/clubsADM/${id}`, getFetchOptions('DELETE'));
      const result = await handleResponse(response);

      setSuccess(result.message || 'Club supprimé avec succès');
      addToast(result.message || 'Club supprimé avec succès', 'success');
      setClubs(clubs.filter((club) => club.ID_club !== id));
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    }
  };

  const handleAccepterDemande = async (demande) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_URL}/demandesADM/accepter/${demande.ID_demande}`, getFetchOptions('PUT', { gerant_matricule: demande.matricule_etudiant }));
      const result = await handleResponse(response);

      setSuccess(result.message || 'Demande acceptée avec succès');
      addToast(result.message || 'Demande acceptée avec succès', 'success');
      const updatedClubs = await fetch(`${API_URL}/clubsADM`, getFetchOptions('GET')).then(handleResponse);
      setClubs(updatedClubs);
      fetchDemandes();
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    }
  };

  const handleRefuserDemande = async (id) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`${API_URL}/demandesADM/refuser/${id}`, getFetchOptions('PUT'));
      const result = await handleResponse(response);

      setSuccess(result.message || 'Demande refusée avec succès');
      addToast(result.message || 'Demande refusée avec succès', 'success');
      fetchDemandes();
    } catch (err) {
      setError(err.message);
      addToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div >
        <div className={styles['ADM-CLUB-container']}>Chargement...</div>
      </div>
    );
  }

  return (
    <div className={styles['ADM-CLUB-container']}>
      <div className={styles['ADM-CLUB-toast-container']}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>

      <div className={styles['ADM-CLUB-background-shapes']}>
        <div className={`${styles['ADM-CLUB-shape']} ${styles['ADM-CLUB-shape1']}`}></div>
        <div className={`${styles['ADM-CLUB-shape']} ${styles['ADM-CLUB-shape2']}`}></div>
      </div>

      <aside className={styles['ADM-CLUB-sidebar']}>
        <div className={styles['ADM-CLUB-logo']}>
          <h2>Gestion des Clubs</h2>
        </div>
        <button className={styles['ADM-CLUB-sidebar-button']} onClick={() => navigate('/admin')}>
          <FaHome /> Retour à l'accueil
        </button>
        <button
          className={`${styles['ADM-CLUB-sidebar-button']} ${activeTab === 'clubs' ? styles['ADM-CLUB-active'] : ''}`}
          onClick={() => setActiveTab('clubs')}
        >
          <FaUsers /> Gestion des Clubs
        </button>
        <button
          className={`${styles['ADM-CLUB-sidebar-button']} ${activeTab === 'demandes' ? styles['ADM-CLUB-active'] : ''}`}
          onClick={() => setActiveTab('demandes')}
        >
          <FaEnvelope /> Gérer les Demandes
        </button>
        {activeTab === 'clubs' && (
          <button className={styles['ADM-CLUB-sidebar-button']} onClick={() => setShowModal(true)}>
            <FaPlus /> Créer un Club
          </button>
        )}
      </aside>

      <main className={styles['ADM-CLUB-main-content']}>
        <section className={styles['ADM-CLUB-tab-content']}>
          {activeTab === 'clubs' && (
            <>
              <div className={styles['ADM-CLUB-header']}>
                <h1>
                  <FaUsers /> Gestion des Clubs
                </h1>
                <p>Créez, modifiez ou supprimez des clubs pour les étudiants</p>
              </div>

              <div className={styles['ADM-CLUB-content-grid']}>
                <div className molecules={styles['ADM-CLUB-club-grid']}>
                  {clubs.length === 0 ? (
                    <div className={styles['ADM-CLUB-no-results']}>Aucun club disponible</div>
                  ) : (
                    clubs.map((club) => (
                      <div key={club.ID_club} className={styles['ADM-CLUB-club-card']}>
                        <div className={styles['ADM-CLUB-club-avatar']}>
                          <div className={styles['ADM-CLUB-club-placeholder']}>
                            <FaUser size={40} />
                          </div>
                        </div>
                        <div className={styles['ADM-CLUB-club-info']}>
                          <h4>{club.nom}</h4>
                          <p>{club.description_club || 'Aucune description'}</p>
                          <p>
                            <strong>Gérant :</strong> {club.gerant_nom || 'Non défini'} {club.gerant_prenom || ''}
                          </p>
                        </div>
                        <div className={styles['ADM-CLUB-club-actions']}>
                          <button
                            className={styles['ADM-CLUB-view-button']}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(club);
                            }}
                          >
                            <FaUsers />
                          </button>
                          <button
                            className={styles['ADM-CLUB-edit-button']}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(club);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={styles['ADM-CLUB-delete-button']}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmModal({
                                isOpen: true,
                                message: `Êtes-vous sûr de vouloir supprimer le club "${club.nom}" ?`,
                                onConfirm: () => handleDelete(club.ID_club),
                              });
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'demandes' && (
            <>
              <div className={styles['ADM-CLUB-header']}>
                <h1>
                  <FaEnvelope /> Gérer les Demandes
                </h1>
                <p>Acceptez ou refusez les demandes de création de clubs</p>
              </div>

              <div className={styles['ADM-CLUB-content-grid']}>
                <div className={styles['ADM-CLUB-demande-grid']}>
                  {demandes.length === 0 ? (
                    <div className={styles['ADM-CLUB-no-results']}>Aucune demande en attente</div>
                  ) : (
                    demandes.map((demande) => (
                      <div key={demande.ID_demande} className={styles['ADM-CLUB-demande-card']}>
                        <div className={styles['ADM-CLUB-demande-avatar']}>
                          <div className={styles['ADM-CLUB-demande-placeholder']}>
                            <FaEnvelope size={40} />
                          </div>
                        </div>
                        <div className={styles['ADM-CLUB-demande-info']}>
                          <h4>{demande.nom_club}</h4>
                          <p>{demande.description_club || 'Aucune description'}</p>
                          <p>
                            <strong>Proposé par :</strong> {demande.etudiant_nom || 'Inconnu'} {demande.etudiant_prenom || ''} (
                            {demande.matricule_etudiant})
                          </p>
                          <p>
                            <strong>Date :</strong>{' '}
                            {demande.date_demande
                              ? new Date(demande.date_demande).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : 'Date non disponible'}
                          </p>
                        </div>
                        <div className={styles['ADM-CLUB-demande-actions']}>
                          <button
                            className={styles['ADM-CLUB-accept-button']}
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                message: `Êtes-vous sûr de vouloir accepter la demande pour le club "${demande.nom_club}" ?`,
                                onConfirm: () => handleAccepterDemande(demande),
                              })
                            }
                          >
                            <FaCheck />
                          </button>
                          <button
                            className={styles['ADM-CLUB-reject-button']}
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                message: `Êtes-vous sûr de vouloir refuser la demande pour le club "${demande.nom_club}" ?`,
                                onConfirm: () => handleRefuserDemande(demande.ID_demande),
                              })
                            }
                          >
                            <FaTimes />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {showModal && (
        <div className={`${styles['ADM-CLUB-modal-overlay']} ${styles['ADM-CLUB-active']}`}>
          <div className={styles['ADM-CLUB-modal-content']}>
            <h3>{editMode ? 'Modifier un Club' : 'Créer un Club'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles['ADM-CLUB-input-group']}>
                <label>Nom du Club</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles['ADM-CLUB-input-group']}>
                <label>Description</label>
                <textarea
                  name="description_club"
                  value={formData.description_club}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>
              <div className={styles['ADM-CLUB-filter-section']}>
                <h4>Filtrer les Étudiants pour Choisir le Gérant</h4>
                <div className={styles['ADM-CLUB-filter-options']}>
                  <div className={styles['ADM-CLUB-filter-group']}>
                    <label>Faculté</label>
                    <select name="id_faculte" value={filters.id_faculte} onChange={handleFilterChange}>
                      <option value="">Sélectionner une faculté</option>
                      {facultes.map((faculte) => (
                        <option key={faculte.ID_faculte} value={faculte.ID_faculte}>
                          {faculte.nom_faculte}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['ADM-CLUB-filter-group']}>
                    <label>Département</label>
                    <select
                      name="id_departement"
                      value={filters.id_departement}
                      onChange={handleFilterChange}
                      disabled={!filters.id_faculte}
                    >
                      <option value="">Sélectionner un département</option>
                      {departements.map((dep) => (
                        <option key={dep.ID_departement} value={dep.ID_departement}>
                          {dep.Nom_departement}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['ADM-CLUB-filter-group']}>
                    <label>Spécialité</label>
                    <select
                      name="id_specialite"
                      value={filters.id_specialite}
                      onChange={handleFilterChange}
                      disabled={!filters.id_departement}
                    >
                      <option value="">Sélectionner une spécialité</option>
                      {specialites.map((spec) => (
                        <option key={spec.ID_specialite} value={spec.ID_specialite}>
                          {spec.nom_specialite}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['ADM-CLUB-filter-group']}>
                    <label>Section</label>
                    <select
                      name="id_section"
                      value={filters.id_section}
                      onChange={handleFilterChange}
                      disabled={!filters.id_specialite}
                    >
                      <option value="">Sélectionner une section</option>
                      {sections.map((sec) => (
                        <option key={sec.ID_section} value={sec.ID_section}>
                          {sec.niveau}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles['ADM-CLUB-input-group']}>
                <label>Choisir le Gérant</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Rechercher par matricule..."
                    value={etudiantSearch}
                    onChange={handleEtudiantSearchChange}
                    style={{
                      width: '100%',
                      padding: '8px 30px 8px 10px',
                      marginBottom: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                    }}
                  />
                  <FaSearch
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#5483b3',
                    }}
                  />
                </div>
                <select
                  name="gerant_matricule"
                  value={formData.gerant_matricule}
                  onChange={handleInputChange}
                  required
                  disabled={!filters.id_section}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
                >
                  <option value="">Sélectionner un étudiant</option>
                  {filteredEtudiants.map((etudiant) => (
                    <option key={etudiant.Matricule} value={etudiant.Matricule}>
                      {etudiant.nom} {etudiant.prenom} ({etudiant.Matricule})
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles['ADM-CLUB-button-group']}>
                <button type="submit">
                  <FaPlus /> {editMode ? 'Modifier' : 'Créer'}
                </button>
                <button type="button" className={styles['ADM-CLUB-close-button']} onClick={() => setShowModal(false)}>
                  <FaTimes /> Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedClub && (
        <div className={`${styles['ADM-CLUB-modal-overlay']} ${styles['ADM-CLUB-active']}`}>
          <div className={styles['ADM-CLUB-modal-content']}>
            <h3>Détails du Club</h3>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  background: '#f0f7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5483b3',
                  fontStyle: 'italic',
                  borderRadius: '8px',
                  marginBottom: '10px',
                }}
              >
                <FaUsers size={50} />
              </div>
            </div>
            <div className={styles['ADM-CLUB-input-group']}>
              <label>Nom du Club</label>
              <p>{selectedClub.nom}</p>
            </div>
            <div className={styles['ADM-CLUB-input-group']}>
              <label>Description</label>
              <p>{selectedClub.description_club || 'Aucune description'}</p>
            </div>
            <div className={styles['ADM-CLUB-input-group']}>
              <label>Gérant</label>
              <p>{selectedClub.gerant_nom || 'Non défini'} {selectedClub.gerant_prenom || ''}</p>
            </div>
            <div className={styles['ADM-CLUB-button-group']}>
              <button type="button" className={styles['ADM-CLUB-close-button']} onClick={() => setShowViewModal(false)}>
                <FaTimes /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div className={`${styles['ADM-CLUB-modal-overlay']} ${styles['ADM-CLUB-active']}`}>
          <div className={styles['ADM-CLUB-confirm-modal']}>
            <h3>Confirmation</h3>
            <p>{confirmModal.message}</p>
            <div className={styles['ADM-CLUB-button-group']}>
              <button
                className={styles['ADM-CLUB-confirm-button']}
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
                }}
              >
                Confirmer
              </button>
              <button
                className={styles['ADM-CLUB-cancel-button']}
                onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} })}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubAdmin;