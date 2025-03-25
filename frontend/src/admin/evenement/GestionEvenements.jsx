import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaTimes, FaCalendar, FaMapMarkerAlt, FaUsers, FaSearch, FaList, FaPlus, FaHome, FaUser, FaChartBar } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import '../../admin_css_files/evenement.css';

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

  const fetchEvenements = async () => {
    try {
      const response = await axios.get('http://localhost:8084/evenement/evenements');
      setEvenements(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des événements :', error);
    }
  };

  const fetchFacultes = async () => {
    try {
      const response = await axios.get('http://localhost:8084/evenement/facultes');
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
      const response = await axios.get(`http://localhost:8084/evenement/departements?faculteId=${faculteId}`);
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
      const response = await axios.get(`http://localhost:8084/evenement/specialites?departementId=${departementId}`);
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
        response = await axios.put(`http://localhost:8084/evenement/evenements/${editingEvent.ID_evenement}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        console.log('Ajout d’un nouvel événement');
        response = await axios.post(`http://localhost:8084/evenement/evenements`, formDataToSend, {
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
      console.error('Erreur lors de l\'ajout/modification :', error.response?.data || error.message);
      if (error.response) {
        if (error.response.status === 400) {
          const errorMessage = error.response.data.message;
          if (errorMessage.includes('date')) {
            setErrors({ date_evenement: errorMessage });
          } else {
            setErrors({ general: errorMessage });
          }
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
      const response = await axios.delete(`http://localhost:8084/evenement/evenements/${id}`);
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
        backgroundColor: 'rgba(129, 152, 200, 0.8)', // Corail pour les barres
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

  // Gestion de l'animation de la modale
  useEffect(() => {
    const modalOverlay = document.querySelector('.modal-overlay');
    if (showFormModal || selectedEvent) {
      if (modalOverlay) {
        modalOverlay.classList.add('active');
      }
    } else {
      if (modalOverlay) {
        modalOverlay.classList.remove('active');
      }
    }
  }, [showFormModal, selectedEvent]);

  const handleOpenModal = () => {
    console.log('Bouton "Ajouter un événement" cliqué');
    setShowFormModal(true);
  };

  return (
    <div id="evenements">
    <div className="container">
      {/* Formes abstraites en arrière-plan */}
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
      </div>

      {/* Barre latérale */}
      <div className="sidebar">
        <div className="logo">
          <h2>Événements</h2>
        </div>
        <button onClick={() => navigate('/admin')} className="sidebar-button">
          <FaHome /> Retour à l'accueil
        </button>
        <button onClick={handleOpenModal} className="sidebar-button">
          <FaPlus /> Ajouter un événement
        </button>
      </div>

      {/* Placeholder pour occuper l'espace de la barre latérale dans la grille */}
      <div className="sidebar-placeholder"></div>

      {/* Contenu principal */}
      <div className="main-content">
        <div className="header">
          <h1><FaUser /> Bienvenue sur votre espace evenement</h1>
          <p>Ayez une excellente experience de gestionnement</p>
        </div>

        <div className="content-grid">
          {/* Section des statistiques */}
          <div className="chart-container">
            <h3 className="chart-title"><FaChartBar /> Statistiques des Événements</h3>
            <div className="chart-wrapper">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Liste des événements */}
          <div className="event-list">
            <h3><FaList /> Liste des Événements</h3>
            <div className="search-container">
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-bar"
              />
              <FaSearch className="search-icon" />
            </div>
            <ul>
              {filteredEvenements.length > 0 ? (
                filteredEvenements.map((evenement) => (
                  <li
                    key={evenement.ID_evenement}
                    className="event-item"
                    onClick={() => toggleDetails(evenement.ID_evenement)}
                  >
                    <div className="event-info">
                      <h4>{evenement.nom_evenement}</h4>
                      <p>{evenement.date_evenement}</p>
                    </div>
                    <div className="event-stats">
                      <p>{evenement.capacite} participants</p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="no-results">Aucun événement trouvé.</p>
              )}
            </ul>
          </div>
        </div>

        {/* Modale pour le formulaire d'ajout/modification */}
        {showFormModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{editingEvent ? 'Modifier un Événement' : 'Ajouter un Événement'}</h3>
              <form onSubmit={handleSubmit} ref={formRef}>
                <div className="input-group">
                  <input type="text" name="nom_evenement" placeholder="Nom de l'événement" value={formData.nom_evenement} onChange={handleChange} required />
                  {errors.nom_evenement && <span className="error-message">{errors.nom_evenement}</span>}
                </div>
                <div className="input-group">
                  <textarea name="description_evenement" placeholder="Description" value={formData.description_evenement} onChange={handleChange} required />
                  {errors.description_evenement && <span className="error-message">{errors.description_evenement}</span>}
                </div>
                <div className="input-group">
                  <FaCalendar className="input-icon" />
                  <input
                    type="date"
                    name="date_evenement"
                    value={formData.date_evenement}
                    onChange={handleChange}
                    required
                  />
                  {errors.date_evenement && <span className="error-message">{errors.date_evenement}</span>}
                </div>
                <div className="input-group">
                  <FaMapMarkerAlt className="input-icon" />
                  <input type="text" name="lieu" placeholder="Lieu" value={formData.lieu} onChange={handleChange} required />
                  {errors.lieu && <span className="error-message">{errors.lieu}</span>}
                </div>
                <div className="input-group">
                  <FaUsers className="input-icon" />
                  <input type="number" name="capacite" placeholder="Capacité" value={formData.capacite} onChange={handleChange} required />
                  {errors.capacite && <span className="error-message">{errors.capacite}</span>}
                </div>
                <div className="input-group">
                  <input type="number" name="organisateur_admin" placeholder="Matricule de l'organisateur" value={formData.organisateur_admin} onChange={handleChange} required />
                  {errors.organisateur_admin && <span className="error-message">{errors.organisateur_admin}</span>}
                </div>
                <div className="input-group">
                  <input type="text" name="image_url" placeholder="URL de l'image" value={formData.image_url} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <input type="file" name="image" onChange={(e) => handleImageUpload(e, setFormData)} accept="image/*" />
                </div>
                <div className="input-group">
                  <select name="target_type" value={formData.target_type} onChange={handleTargetTypeChange}>
                    <option value="">Sélectionner votre destinataire...</option>
                    <option value="Etudiants">Étudiants</option>
                    <option value="Enseignants">Enseignants</option>
                  </select>
                </div>
                {formData.target_type && (
                  <>
                    <div className="input-group">
                      <label>
                        <input type="checkbox" checked={formData.target_filter.tous} onChange={(e) => handleTousChange(e)} />
                        Tous les {formData.target_type.toLowerCase()}
                      </label>
                    </div>
                    {!formData.target_filter.tous && (
                      <div className="filter-section">
                        <div className="filter-options">
                          <div className="filter-group">
                            <label>Faculté</label>
                            <select name="faculte" value={formData.target_filter.faculte} onChange={handleChange}>
                              <option value="">Toutes</option>
                              {facultes.map(f => (
                                <option key={f.ID_faculte} value={f.ID_faculte}>{f.nom_faculte}</option>
                              ))}
                            </select>
                          </div>
                          <div className="filter-group">
                            <label>Département</label>
                            <select name="departement" value={formData.target_filter.departement} onChange={handleChange} disabled={!formData.target_filter.faculte}>
                              <option value="">Tous</option>
                              {departements.map(d => (
                                <option key={d.ID_departement} value={d.ID_departement}>{d.Nom_departement}</option>
                              ))}
                            </select>
                          </div>
                          <div className="filter-group">
                            <label>Spécialité</label>
                            <select name="specialite" value={formData.target_filter.specialite} onChange={handleChange} disabled={!formData.target_filter.departement}>
                              <option value="">Toutes</option>
                              {specialites.map(s => (
                                <option key={s.ID_specialite} value={s.ID_specialite}>{s.nom_specialite}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {errors.general && (
                  <div className="error-message">{errors.general}</div>
                )}
                <div className="button-group">
                  <button type="submit">{editingEvent ? 'Modifier' : 'Ajouter'}</button>
                  <button type="button" className="close-button" onClick={() => setShowFormModal(false)}>
                    <FaTimes /> Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modale pour les détails de l'événement */}
        {selectedEvent && (
          <div className="modal-overlay">
            <div className="modal-content">
              {(() => {
                const evenement = evenements.find(e => e.ID_evenement === selectedEvent);
                if (!evenement) return <p>Événement non trouvé.</p>;
                return (
                  <>
                    {evenement.image_url && (
                      <img
                        src={evenement.image_url}
                        alt={evenement.nom_evenement}
                        className="event-image"
                      />
                    )}
                    <h3>{evenement.nom_evenement}</h3>
                    <div className="description">
                      <p>{evenement.description_evenement}</p>
                    </div>
                    <p><FaCalendar /> Date: {evenement.date_evenement}</p>
                    <p><FaMapMarkerAlt /> Lieu: {evenement.lieu}</p>
                    <p><FaUsers /> Capacité: {evenement.capacite}</p>
                    <div className="button-group">
                      <button className="close-button" onClick={() => setSelectedEvent(null)}>
                        <FaTimes /> Fermer
                      </button>
                      <button className="edit-button" onClick={() => handleEdit(evenement)}>
                        <FaEdit /> Modifier
                      </button>
                      <button className="delete-button" onClick={() => handleDelete(evenement.ID_evenement)}>
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