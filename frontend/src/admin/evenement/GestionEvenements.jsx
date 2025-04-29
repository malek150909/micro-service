import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaTimes, FaCalendar, FaMapMarkerAlt, FaUsers, FaSearch, FaList, FaPlus, FaHome, FaUser } from 'react-icons/fa';
import styles from './evenement.module.css';

// Fonction pour inspecter FormData
const logFormData = (formData) => {
  const entries = {};
  for (const [key, value] of formData.entries()) {
    entries[key] = value instanceof File ? value.name : value;
  }
  console.log('Contenu de FormData avant envoi :', entries);
  return entries;
};

const handleImageUpload = (e, setFormData) => {
  const file = e.target.files[0];
  setFormData(prevState => ({ ...prevState, image: file }));
};

// État initial de formData
const initialFormData = {
  nom_evenement: '',
  description_evenement: '',
  date_evenement: '',
  heure_evenement: '',
  lieu: '',
  capacite: '',
  organisateur_admin: '',
  image_url: '',
  image: null,
  target_type: '',
  target_filter: { tous: true, faculte: '', departement: '', specialite: '' }
};

function GestionEvenements() {
  const [evenements, setEvenements] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    fetchEvenements();
    fetchFacultes();
  }, []);

  useEffect(() => {
    console.log('showFormModal changed:', showFormModal);
  }, [showFormModal]);

  const fetchEvenements = async () => {
    try {
      const response = await axios.get('http://events.localhost/evenement/evenements');
      console.log('Événements reçus :', response.data.map(e => ({
        ID_evenement: e.ID_evenement,
        nom_evenement: e.nom_evenement,
        target_type: e.target_type,
        date_evenement: e.date_evenement,
        heure_evenement: e.heure_evenement
      })));
      setEvenements(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des événements :', error);
    }
  };

  const fetchFacultes = async () => {
    try {
      const response = await axios.get('http://messaging.localhost/annonces/facultes');
      setFacultes(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des facultés :', error);
      setFacultes([]);
    }
  };

  const fetchDepartements = async (faculteId) => {
    if (!faculteId) {
      setDepartements([]);
      setSpecialites([]);
      return;
    }
    try {
      const response = await axios.get(`http://messaging.localhost/annonces/departements?faculteId=${faculteId}`);
      setDepartements(response.data);
      setSpecialites([]);
    } catch (error) {
      console.error('Erreur lors de la récupération des départements :', error);
      setDepartements([]);
      setSpecialites([]);
    }
  };

  const fetchSpecialites = async (departementId) => {
    if (!departementId) {
      setSpecialites([]);
      return;
    }
    try {
      const response = await axios.get(`http://messaging.localhost/annonces/specialites?departementId=${departementId}`);
      setSpecialites(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des spécialités :', error);
      setSpecialites([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'heure_evenement' && value && !/^[0-2][0-9]:[0-5][0-9]$/.test(value)) {
      setErrors({ heure_evenement: 'L\'heure doit être au format HH:mm (par exemple, 09:00).' });
      return;
    }
    if (name === 'faculte') {
      setFormData(prev => ({
        ...prev,
        target_filter: { ...prev.target_filter, faculte: value, departement: '', specialite: '', tous: false }
      }));
      fetchDepartements(value);
    } else if (name === 'departement') {
      setFormData(prev => ({
        ...prev,
        target_filter: { ...prev.target_filter, departement: value, specialite: '', tous: false }
      }));
      fetchSpecialites(value);
    } else if (name === 'specialite') {
      setFormData(prev => ({
        ...prev,
        target_filter: { ...prev.target_filter, specialite: value, tous: false }
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
    console.log(`Champ ${name} mis à jour :`, value);
  };

  const handleTargetTypeChange = (e) => {
    const value = e.target.value;
    console.log('target_type sélectionné :', value);
    setFormData(prev => ({
      ...prev,
      target_type: value,
      target_filter: { tous: true, faculte: '', departement: '', specialite: '' }
    }));
    setDepartements([]);
    setSpecialites([]);
  };

  const handleTousChange = (e) => {
    setFormData(prev => ({
      ...prev,
      target_filter: { tous: e.target.checked, faculte: '', departement: '', specialite: '' }
    }));
    setDepartements([]);
    setSpecialites([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit appelé avec formData :', formData);
    setErrors({});

    if (!formData.nom_evenement) {
      setErrors({ nom_evenement: 'Le nom de l\'événement est requis.' });
      return;
    }
    if (!formData.description_evenement) {
      setErrors({ description_evenement: 'La description est requise.' });
      return;
    }
    if (!formData.date_evenement) {
      setErrors({ date_evenement: 'La date est requise.' });
      return;
    }
    if (!formData.heure_evenement || !/^[0-2][0-9]:[0-5][0-9]$/.test(formData.heure_evenement)) {
      setErrors({ heure_evenement: 'L\'heure est requise et doit être au format HH:mm (par exemple, 09:00).' });
      return;
    }
    if (!formData.lieu) {
      setErrors({ lieu: 'Le lieu est requis.' });
      return;
    }
    if (!formData.capacite) {
      setErrors({ capacite: 'La capacité est requise.' });
      return;
    }
    if (!formData.organisateur_admin) {
      setErrors({ organisateur_admin: 'L\'organisateur est requis.' });
      return;
    }
    if (!formData.target_type) {
      setErrors({ target_type: 'Le type de destinataire est requis.' });
      return;
    }

    const dateTime = `${formData.date_evenement} ${formData.heure_evenement}:00`;
    console.log('dateTime construit :', dateTime);

    // Valider dateTime
    const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!dateRegex.test(dateTime)) {
      setErrors({ date_evenement: 'Format de date et heure invalide. Doit être YYYY-MM-DD HH:mm:ss.' });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('nom_evenement', formData.nom_evenement);
    formDataToSend.append('description_evenement', formData.description_evenement);
    formDataToSend.append('date_evenement', dateTime);
    formDataToSend.append('lieu', formData.lieu);
    formDataToSend.append('capacite', formData.capacite);
    formDataToSend.append('organisateur_admin', formData.organisateur_admin);
    formDataToSend.append('target_type', formData.target_type);
    formDataToSend.append('target_filter', JSON.stringify(formData.target_filter));
    if (formData.image) formDataToSend.append('image', formData.image);
    if (formData.image_url) formDataToSend.append('image_url', formData.image_url);

    // Inspecter FormData
    logFormData(formDataToSend);

    try {
      let response;
      if (editingEvent) {
        if (!editingEvent.ID_evenement) {
          throw new Error('ID_evenement manquant pour la modification');
        }
        console.log('Modification d’un événement avec ID :', editingEvent.ID_evenement);
        response = await axios.put(`http://events.localhost/evenement/evenements/${editingEvent.ID_evenement}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        console.log('Ajout d’un nouvel événement');
        response = await axios.post(`http://events.localhost/evenement/evenements`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      console.log('Réponse du backend :', response.data);

      setShowFormModal(false);
      setEditingEvent(null);
      setFormData(initialFormData);
      await fetchEvenements();
    } catch (error) {
      console.error('Erreur lors de la soumission :', error);
      if (error.response) {
        console.error('Détails de la réponse :', error.response.data);
        if (error.response.status === 400) {
          setErrors({ general: error.response.data.message || 'Données invalides.' });
        } else if (error.response.status === 404) {
          setErrors({ general: 'Événement non trouvé ou serveur inaccessible.' });
        } else {
          setErrors({ general: `Erreur serveur (${error.response.status}) : ${error.response.data.message || 'Veuillez réessayer.'}` });
        }
      } else {
        setErrors({ general: 'Erreur réseau : Vérifiez que le serveur est en marche.' });
      }
    }
  };

  const handleDelete = async (id) => {
    console.log('Suppression de l’événement avec ID :', id);
    try {
      const response = await axios.delete(`http://events.localhost/evenement/evenements/${id}`);
      console.log('Réponse suppression :', response.data);

      await fetchEvenements();
      if (selectedEvent === id) {
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression :', error.response?.data || error.message);
      alert('Erreur lors de la suppression. Vérifiez la console.');
    }
  };

  const handleEdit = (evenement) => {
    console.log('Modification de l’événement :', evenement);
    setEditingEvent(evenement);
    const dateTime = evenement.date_evenement ? new Date(evenement.date_evenement) : null;
    const formattedDate = dateTime ? dateTime.toISOString().split('T')[0] : '';
    const formattedTime = evenement.heure_evenement || (dateTime ? dateTime.toISOString().slice(11, 16) : '');
    console.log('Heure extraite pour édition :', formattedTime);
    setFormData({
      nom_evenement: evenement.nom_evenement,
      description_evenement: evenement.description_evenement,
      date_evenement: formattedDate,
      heure_evenement: formattedTime,
      lieu: evenement.lieu,
      capacite: evenement.capacite,
      organisateur_admin: evenement.organisateur_admin,
      image_url: evenement.image_url,
      image: null,
      target_type: evenement.target_type || '',
      target_filter: evenement.target_filter ? (typeof evenement.target_filter === 'string' ? JSON.parse(evenement.target_filter) : evenement.target_filter) : { tous: true, faculte: '', departement: '', specialite: '' }
    });
    setShowFormModal(true);
    setSelectedEvent(null);
    if (evenement.target_filter?.faculte) fetchDepartements(evenement.target_filter.faculte);
    if (evenement.target_filter?.departement) fetchSpecialites(evenement.target_filter.departement);
  };

  const handleCancel = () => {
    console.log('Annulation du formulaire');
    setShowFormModal(false);
    setEditingEvent(null);
    setFormData(initialFormData);
    setErrors({});
    console.log('formData réinitialisé :', initialFormData);
  };

  const handleOpenModal = () => {
    console.log('Bouton "Ajouter un événement" cliqué');
    setFormData(initialFormData);
    setEditingEvent(null);
    setErrors({});
    setShowFormModal(true);
    console.log('formData réinitialisé pour ajout :', initialFormData);
    console.log('setShowFormModal appelé avec true');
  };

  const toggleDetails = (id) => {
    console.log('Affichage des détails de l’événement avec ID :', id);
    if (selectedEvent === id) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(id);
    }
  };

  // Séparer les événements par target_type
  const etudiantsEvenements = evenements.filter(evenement =>
    evenement.target_type === 'Etudiants' &&
    evenement.nom_evenement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enseignantsEvenements = evenements.filter(evenement =>
    evenement.target_type === 'Enseignants' &&
    evenement.nom_evenement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formater la date et l'heure pour l'affichage
  const formatDateTime = (dateString, heureString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const heure = heureString || (dateString.includes('T') ? date.toISOString().slice(11, 16) : '00:00');
    console.log('Date brute pour affichage :', dateString, 'Heure :', heure, '-> Formatée :', date);
    return `${date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })} ${heure}`;
  };

  // Formater le nom avec target_type
  const formatEventName = (evenement) => {
    const target = evenement.target_type || 'Non défini';
    return `[${target}] ${evenement.nom_evenement}`;
  };

  return (
    <div id="evenements">
      <div className={styles['ADM-EVN-container']}>
        <div className={styles['ADM-EVN-background-shapes']}>
          <div className={`${styles['ADM-EVN-shape']} ${styles['ADM-EVN-shape1']}`}></div>
          <div className={`${styles['ADM-EVN-shape']} ${styles['ADM-EVN-shape2']}`}></div>
        </div>

        <div className={styles['ADM-EVN-sidebar']}>
          <div className={styles['ADM-EVN-logo']}>
            <h2 className={styles['ADM-EVN-logo-h2']}>Événements</h2>
          </div>
          <button onClick={() => navigate('/admin')} className={styles['ADM-EVN-sidebar-button']}>
            <FaHome /> Retour à l'accueil
          </button>
          <button onClick={handleOpenModal} className={styles['ADM-EVN-sidebar-button']}>
            <FaPlus /> Ajouter un événement
          </button>
        </div>

        <div className={styles['ADM-EVN-sidebar-placeholder']}></div>

        <div className={styles['ADM-EVN-main-content']}>
          <div className={styles['ADM-EVN-header']}>
            <h1 className={styles['ADM-EVN-header-h1']}>
              <FaUser /> Bienvenue sur votre espace événement
            </h1>
            <p className={styles['ADM-EVN-header-p']}>
              Ayez une excellente expérience de gestion
            </p>
          </div>

          <div className={styles['ADM-EVN-content-grid']} style={{ gridTemplateColumns: '1fr' }}>
            <div className={styles['ADM-EVN-event-list']}>
              <h3 className={styles['ADM-EVN-event-list-h3']}>
                <FaList /> Événements pour Étudiants
              </h3>
              <div className={styles['ADM-EVN-search-container']}>
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles['ADM-EVN-search-bar']}
                />
                <FaSearch className={styles['ADM-EVN-search-icon']} />
              </div>

              <div className={styles['ADM-EVN-event-section']}>
                <ul className={styles['ADM-EVN-event-list-ul']}>
                  {etudiantsEvenements.length > 0 ? (
                    etudiantsEvenements.map((evenement) => (
                      <li
                        key={evenement.ID_evenement}
                        className={styles['ADM-EVN-event-item']}
                        onClick={() => toggleDetails(evenement.ID_evenement)}
                      >
                        <div className={styles['ADM-EVN-event-info']}>
                          <h4 className={styles['ADM-EVN-event-info-h4']}>
                            {formatEventName(evenement)}
                          </h4>
                          <p className={styles['ADM-EVN-event-info-p']}>
                            {formatDateTime(evenement.date_evenement, evenement.heure_evenement)}
                          </p>
                        </div>
                        <div className={styles['ADM-EVN-event-stats']}>
                          <p className={styles['ADM-EVN-event-stats-p']}>
                            {evenement.capacite} participants
                          </p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className={styles['ADM-EVN-no-results']}>
                      Aucun événement trouvé pour les étudiants.
                    </p>
                  )}
                </ul>
              </div>

              <h3 className={styles['ADM-EVN-event-list-h3']}>
                <FaList /> Événements pour Enseignants
              </h3>
              <div className={styles['ADM-EVN-event-section']}>
                <ul className={styles['ADM-EVN-event-list-ul']}>
                  {enseignantsEvenements.length > 0 ? (
                    enseignantsEvenements.map((evenement) => (
                      <li
                        key={evenement.ID_evenement}
                        className={styles['ADM-EVN-event-item']}
                        onClick={() => toggleDetails(evenement.ID_evenement)}
                      >
                        <div className={styles['ADM-EVN-event-info']}>
                          <h4 className={styles['ADM-EVN-event-info-h4']}>
                            {formatEventName(evenement)}
                          </h4>
                          <p className={styles['ADM-EVN-event-info-p']}>
                            {formatDateTime(evenement.date_evenement, evenement.heure_evenement)}
                          </p>
                        </div>
                        <div className={styles['ADM-EVN-event-stats']}>
                          <p className={styles['ADM-EVN-event-stats-p']}>
                            {evenement.capacite} participants
                          </p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className={styles['ADM-EVN-no-results']}>
                      Aucun événement trouvé pour les enseignants.
                    </p>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {showFormModal && (
            <div className={`${styles['ADM-EVN-modal-overlay']} ${styles['ADM-EVN-active']}`}>
              <div className={styles['ADM-EVN-modal-content']}>
                <h3 className={styles['ADM-EVN-modal-content-h3']}>
                  {editingEvent ? 'Modifier un Événement' : 'Ajouter un Événement'}
                </h3>
                <form onSubmit={handleSubmit} ref={formRef} className={styles['ADM-EVN-form']}>
                  <div className={styles['ADM-EVN-input-group']}>
                    <input
                      type="text"
                      name="nom_evenement"
                      placeholder="Nom de l'événement"
                      value={formData.nom_evenement}
                      onChange={handleChange}
                      required
                      className={styles['ADM-EVN-input']}
                    />
                    {errors.nom_evenement && (
                      <span className={styles['ADM-EVN-error-message']}>
                        {errors.nom_evenement}
                      </span>
                    )}
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <textarea
                      name="description_evenement"
                      placeholder="Description"
                      value={formData.description_evenement}
                      onChange={handleChange}
                      required
                      className={styles['ADM-EVN-textarea']}
                    />
                    {errors.description_evenement && (
                      <span className={styles['ADM-EVN-error-message']}>
                        {errors.description_evenement}
                      </span>
                    )}
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <FaCalendar className={styles['ADM-EVN-input-icon']} />
                    <input
                      type="date"
                      name="date_evenement"
                      value={formData.date_evenement}
                      onChange={handleChange}
                      required
                      className={styles['ADM-EVN-input']}
                    />
                    {errors.date_evenement && (
                      <span className={styles['ADM-EVN-error-message']}>
                        {errors.date_evenement}
                      </span>
                    )}
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <FaCalendar className={styles['ADM-EVN-input-icon']} />
                    <input
                      type="time"
                      name="heure_evenement"
                      value={formData.heure_evenement}
                      onChange={handleChange}
                      required
                      className={styles['ADM-EVN-input']}
                    />
                    {errors.heure_evenement && (
                      <span className={styles['ADM-EVN-error-message']}>
                        {errors.heure_evenement}
                      </span>
                    )}
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <FaMapMarkerAlt className={styles['ADM-EVN-input-icon']} />
                    <input
                      type="text"
                      name="lieu"
                      placeholder="Lieu"
                      value={formData.lieu}
                      onChange={handleChange}
                      required
                      className={styles['ADM-EVN-input']}
                    />
                    {errors.lieu && (
                      <span className={styles['ADM-EVN-error-message']}>
                        {errors.lieu}
                      </span>
                    )}
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <FaUsers className={styles['ADM-EVN-input-icon']} />
                    <input
                      type="number"
                      name="capacite"
                      placeholder="Capacité"
                      value={formData.capacite}
                      onChange={handleChange}
                      required
                      className={styles['ADM-EVN-input']}
                    />
                    {errors.capacite && (
                      <span className={styles['ADM-EVN-error-message']}>
                        {errors.capacite}
                      </span>
                    )}
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <input
                      type="number"
                      name="organisateur_admin"
                      placeholder="Matricule de l'organisateur"
                      value={formData.organisateur_admin}
                      onChange={handleChange}
                      required
                      className={styles['ADM-EVN-input']}
                    />
                    {errors.organisateur_admin && (
                      <span className={styles['ADM-EVN-error-message']}>
                        {errors.organisateur_admin}
                      </span>
                    )}
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <input
                      type="text"
                      name="image_url"
                      placeholder="URL de l'image"
                      value={formData.image_url}
                      onChange={handleChange}
                      className={styles['ADM-EVN-input']}
                    />
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <input
                      type="file"
                      name="image"
                      onChange={(e) => handleImageUpload(e, setFormData)}
                      accept="image/*"
                    />
                  </div>
                  <div className={styles['ADM-EVN-input-group']}>
                    <select
                      name="target_type"
                      value={formData.target_type}
                      onChange={handleTargetTypeChange}
                      className={styles['ADM-EVN-select']}
                      required
                    >
                      <option value="" disabled>Sélectionner votre destinataire...</option>
                      <option value="Etudiants">Étudiants</option>
                      <option value="Enseignants">Enseignants</option>
                    </select>
                    {errors.target_type && (
                      <span className={styles['ADM-EVN-error-message']}>
                        {errors.target_type}
                      </span>
                    )}
                  </div>
                  {formData.target_type && (
                    <>
                      <div className={styles['ADM-EVN-input-group']}>
                        <label className={styles['ADM-EVN-input-group-label']}>
                          <input
                            type="checkbox"
                            checked={formData.target_filter.tous}
                            onChange={(e) => handleTousChange(e)}
                          />
                          Tous les {formData.target_type.toLowerCase()}
                        </label>
                      </div>
                      {!formData.target_filter.tous && (
                        <div className={styles['ADM-EVN-filter-section']}>
                          <div className={styles['ADM-EVN-filter-options']}>
                            <div className={styles['ADM-EVN-filter-group']}>
                              <label className={styles['ADM-EVN-filter-group-label']}>
                                Faculté
                              </label>
                              <select
                                name="faculte"
                                value={formData.target_filter.faculte}
                                onChange={handleChange}
                                className={styles['ADM-EVN-select']}
                              >
                                <option value="">Toutes</option>
                                {facultes.map(f => (
                                  <option key={f.ID_faculte} value={f.ID_faculte}>
                                    {f.nom_faculte}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className={styles['ADM-EVN-filter-group']}>
                              <label className={styles['ADM-EVN-filter-group-label']}>
                                Département
                              </label>
                              <select
                                name="departement"
                                value={formData.target_filter.departement}
                                onChange={handleChange}
                                disabled={!formData.target_filter.faculte}
                                className={styles['ADM-EVN-select']}
                              >
                                <option value="">Tous</option>
                                {departements.map(d => (
                                  <option key={d.ID_departement} value={d.ID_departement}>
                                    {d.Nom_departement}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className={styles['ADM-EVN-filter-group']}>
                              <label className={styles['ADM-EVN-filter-group-label']}>
                                Spécialité
                              </label>
                              <select
                                name="specialite"
                                value={formData.target_filter.specialite}
                                onChange={handleChange}
                                disabled={!formData.target_filter.departement}
                                className={styles['ADM-EVN-select']}
                              >
                                <option value="">Toutes</option>
                                {specialites.map(s => (
                                  <option key={s.ID_specialite} value={s.ID_specialite}>
                                    {s.nom_specialite}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {errors.general && (
                    <div className={styles['ADM-EVN-error-message']}>
                      {errors.general}
                    </div>
                  )}
                  <div className={styles['ADM-EVN-button-group']}>
                    <button type="submit" className={styles['ADM-EVN-button']}>
                      {editingEvent ? 'Modifier' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      className={`${styles['ADM-EVN-button']} ${styles['ADM-EVN-close-button']}`}
                      onClick={handleCancel}
                    >
                      <FaTimes /> Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedEvent && (
            <div className={`${styles['ADM-EVN-modal-overlay']} ${styles['ADM-EVN-active']}`}>
              <div className={styles['ADM-EVN-modal-content']}>
                {(() => {
                  const evenement = evenements.find(e => e.ID_evenement === selectedEvent);
                  if (!evenement) return (
                    <p className={styles['ADM-EVN-modal-content-p']}>
                      Événement non trouvé.
                    </p>
                  );
                  return (
                    <>
                      {evenement.image_url && (
                        <img
                          src={evenement.image_url}
                          alt={evenement.nom_evenement}
                          className={styles['ADM-EVN-event-image']}
                        />
                      )}
                      <h3 className={styles['ADM-EVN-modal-content-h3']}>
                        {formatEventName(evenement)}
                      </h3>
                      <div className={styles['ADM-EVN-description']}>
                        <p className={styles['ADM-EVN-description-p']}>
                          {evenement.description_evenement}
                        </p>
                      </div>
                      <p className={styles['ADM-EVN-modal-content-p']}>
                        <FaCalendar /> Date: {formatDateTime(evenement.date_evenement, evenement.heure_evenement)}
                      </p>
                      <p className={styles['ADM-EVN-modal-content-p']}>
                        <FaMapMarkerAlt /> Lieu: {evenement.lieu}
                      </p>
                      <p className={styles['ADM-EVN-modal-content-p']}>
                        <FaUsers /> Capacité: {evenement.capacite}
                      </p>
                      <div className={styles['ADM-EVN-button-group']}>
                        <button
                          className={`${styles['ADM-EVN-button']} ${styles['ADM-EVN-close-button']}`}
                          onClick={() => setSelectedEvent(null)}
                        >
                          <FaTimes /> Fermer
                        </button>
                        <button
                          className={`${styles['ADM-EVN-button']} ${styles['ADM-EVN-edit-button']}`}
                          onClick={() => handleEdit(evenement)}
                        >
                          <FaEdit /> Modifier
                        </button>
                        <button
                          className={`${styles['ADM-EVN-button']} ${styles['ADM-EVN-delete-button']}`}
                          onClick={() => handleDelete(evenement.ID_evenement)}
                        >
                          <FaTrash /> Supprimer
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestionEvenements;