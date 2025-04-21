import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaTimes, FaCalendar, FaMapMarkerAlt, FaUsers, FaSearch, FaList, FaPlus, FaHome, FaUser, FaChartBar } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import styles from './evenement.module.css';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const handleImageUpload = (e, setFormData) => {
  const file = e.target.files[0];
  setFormData(prevState => ({ ...prevState, image: file }));
};

function GestionEvenements() {
  const [evenements, setEvenements] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState({
    nom_evenement: '',
    description_evenement: '',
    date_evenement: '',
    lieu: '',
    capacite: '',
    organisateur_admin: '',
    image_url: '',
    image: null,
    target_type: '',
    target_filter: { tous: true, faculte: '', departement: '', specialite: '' }
  });
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
  };

  const handleTargetTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      target_type: e.target.value,
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
    console.log('handleSubmit appelé');
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

    const formDataToSend = new FormData();
    formDataToSend.append('nom_evenement', formData.nom_evenement);
    formDataToSend.append('description_evenement', formData.description_evenement);
    formDataToSend.append('date_evenement', formData.date_evenement);
    formDataToSend.append('lieu', formData.lieu);
    formDataToSend.append('capacite', formData.capacite);
    formDataToSend.append('organisateur_admin', formData.organisateur_admin);
    formDataToSend.append('target_type', formData.target_type || '');
    formDataToSend.append('target_filter', JSON.stringify(formData.target_filter));
    if (formData.image) formDataToSend.append('image', formData.image);
    if (formData.image_url) formDataToSend.append('image_url', formData.image_url);

    console.log('Données envoyées au backend :', {
      nom_evenement: formData.nom_evenement,
      description_evenement: formData.description_evenement,
      date_evenement: formData.date_evenement,
      lieu: formData.lieu,
      capacite: formData.capacite,
      organisateur_admin: formData.organisateur_admin,
      target_type: formData.target_type,
      target_filter: formData.target_filter,
      image: formData.image,
      image_url: formData.image_url,
    });

    try {
      let response;
      if (editingEvent) {
        console.log('Modification d’un événement');
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
      setFormData({
        nom_evenement: '',
        description_evenement: '',
        date_evenement: '',
        lieu: '',
        capacite: '',
        organisateur_admin: '',
        image_url: '',
        image: null,
        target_type: '',
        target_filter: { tous: true, faculte: '', departement: '', specialite: '' }
      });
      await fetchEvenements();
    } catch (error) {
      console.error('Erreur complète :', error);
      console.error('Détails de la réponse :', error.response);
      if (error.response) {
        if (error.response.status === 400) {
          const errorMessage = error.response.data.message;
          if (errorMessage.includes('date')) {
            setErrors({ date_evenement: errorMessage });
          } else {
            setErrors({ general: errorMessage });
          }
        } else if (error.response.status === 404) {
          setErrors({ general: 'Endpoint non trouvé. Vérifiez que l\'URL http://events.localhost/evenement/evenements est correcte et que le serveur est en marche.' });
        } else {
          setErrors({ general: `Erreur serveur (${error.response.status}) : ${error.response.data.message || 'Veuillez réessayer plus tard.'}` });
        }
      } else {
        setErrors({ general: 'Erreur réseau : Impossible de se connecter au serveur. Vérifiez que le serveur est en marche.' });
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
    const formattedDate = evenement.date_evenement ? evenement.date_evenement.split('T')[0] : '';
    setFormData({
      nom_evenement: evenement.nom_evenement,
      description_evenement: evenement.description_evenement,
      date_evenement: formattedDate,
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

  const toggleDetails = (id) => {
    console.log('Affichage des détails de l’événement avec ID :', id);
    if (selectedEvent === id) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(id);
    }
  };

  const filteredEvenements = evenements.filter(evenement =>
    evenement.nom_evenement.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Données pour le graphique (événements par mois)
  const eventStats = evenements.reduce((acc, event) => {
    const date = new Date(event.date_evenement);
    if (isNaN(date)) return acc; // Ignorer les dates invalides
    const month = date.toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  // Calculer le total des événements pour le taux
  const totalEvents = Object.values(eventStats).reduce((sum, count) => sum + count, 0);

  const chartData = {
    labels: Object.keys(eventStats),
    datasets: [
      {
        label: 'Nombre d\'événements',
        data: Object.values(eventStats),
        backgroundColor: 'rgba(129, 152, 200, 0.8)',
        borderWidth: 0,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(30, 44, 74, 0.9)',
        titleFont: { family: 'Poppins', size: 14 },
        bodyFont: { family: 'Poppins', size: 12 },
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const percentage = totalEvents > 0 ? ((value / totalEvents) * 100).toFixed(1) : 0;
            return `${value} événement(s) (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#33333', font: { family: 'Poppins', size: 12 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#333333', font: { family: 'Poppins', size: 12 } },
        grid: { color: '#E5E7EB' },
        beginAtZero: true,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  const handleOpenModal = () => {
    console.log('Bouton "Ajouter un événement" cliqué');
    setShowFormModal(true);
    console.log('setShowFormModal appelé avec true');
  };

  return (
    <div id="evenements">
      <div className={styles['ADM-EVN-container']}>
        {/* Formes abstraites en arrière-plan */}
        <div className={styles['ADM-EVN-background-shapes']}>
          <div className={`${styles['ADM-EVN-shape']} ${styles['ADM-EVN-shape1']}`}></div>
          <div className={`${styles['ADM-EVN-shape']} ${styles['ADM-EVN-shape2']}`}></div>
        </div>

        {/* Barre latérale */}
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

        {/* Placeholder pour occuper l'espace de la barre latérale */}
        <div className={styles['ADM-EVN-sidebar-placeholder']}></div>

        {/* Contenu principal */}
        <div className={styles['ADM-EVN-main-content']}>
          <div className={styles['ADM-EVN-header']}>
            <h1 className={styles['ADM-EVN-header-h1']}>
              <FaUser /> Bienvenue sur votre espace événement
            </h1>
            <p className={styles['ADM-EVN-header-p']}>
              Ayez une excellente expérience de gestion
            </p>
          </div>

          <div className={styles['ADM-EVN-content-grid']}>
            {/* Section des statistiques */}
            <div className={styles['ADM-EVN-chart-container']}>
              <h3 className={styles['ADM-EVN-chart-title']}>
                <FaChartBar /> Statistiques des Événements
              </h3>
              <div className={styles['ADM-EVN-chart-wrapper']}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Liste des événements */}
            <div className={styles['ADM-EVN-event-list']}>
              <h3 className={styles['ADM-EVN-event-list-h3']}>
                <FaList /> Liste des Événements
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
              <ul className={styles['ADM-EVN-event-list-ul']}>
                {filteredEvenements.length > 0 ? (
                  filteredEvenements.map((evenement) => (
                    <li
                      key={evenement.ID_evenement}
                      className={styles['ADM-EVN-event-item']}
                      onClick={() => toggleDetails(evenement.ID_evenement)}
                    >
                      <div className={styles['ADM-EVN-event-info']}>
                        <h4 className={styles['ADM-EVN-event-info-h4']}>
                          {evenement.nom_evenement}
                        </h4>
                        <p className={styles['ADM-EVN-event-info-p']}>
                          {evenement.date_evenement}
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
                    Aucun événement trouvé.
                  </p>
                )}
              </ul>
            </div>
          </div>

          {/* Modale pour le formulaire d'ajout/modification */}
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
                    >
                      <option value="">Sélectionner votre destinataire...</option>
                      <option value="Etudiants">Étudiants</option>
                      <option value="Enseignants">Enseignants</option>
                    </select>
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
                      onClick={() => setShowFormModal(false)}
                    >
                      <FaTimes /> Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modale pour les détails de l'événement */}
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
                        {evenement.nom_evenement}
                      </h3>
                      <div className={styles['ADM-EVN-description']}>
                        <p className={styles['ADM-EVN-description-p']}>
                          {evenement.description_evenement}
                        </p>
                      </div>
                      <p className={styles['ADM-EVN-modal-content-p']}>
                        <FaCalendar /> Date: {evenement.date_evenement}
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