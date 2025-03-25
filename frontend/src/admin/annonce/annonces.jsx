import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaPlus, FaEdit, FaTrash, FaTimes, FaUser, FaPaperPlane, FaBullhorn, FaSearch } from 'react-icons/fa';
import "../../admin_css_files/annonce.css";

const handleImageUpload = (e, setFormData) => {
  const file = e.target.files[0];
  if (file) {
    setFormData(prevState => ({ ...prevState, image: file }));
    console.log('Fichier sélectionné pour upload :', file.name);
  } else {
    setFormData(prevState => ({ ...prevState, image: null }));
    console.log('Aucun fichier sélectionné');
  }
};

function GestionAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [filteredEtudiants, setFilteredEtudiants] = useState([]);
  const [filteredEnseignants, setFilteredEnseignants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    image: null,
    admin_matricule: '',
    target_type: '',
    target_filter: { tous: true, faculte: '', departement: '', specialite: '' }
  });
  const [editingAnnonce, setEditingAnnonce] = useState(null);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    fetchAnnonces();
    fetchFacultes();
  }, []);

  useEffect(() => {
    const filtered = annonces.filter(annonce =>
      annonce.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      annonce.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const etudiants = filtered.filter(annonce => annonce.target_type === 'Etudiants');
    const enseignants = filtered.filter(annonce => annonce.target_type === 'Enseignants');
    setFilteredEtudiants(etudiants);
    setFilteredEnseignants(enseignants);
  }, [searchTerm, annonces]);

  const fetchAnnonces = async () => {
    try {
      const response = await axios.get('http://localhost:8082/annonces/annonces');
      if (Array.isArray(response.data)) {
        setAnnonces(response.data);
      } else {
        setAnnonces([]);
        setError('Erreur : les données des annonces sont invalides.');
      }
    } catch (error) {
      setAnnonces([]);
      setError('Erreur lors de la récupération des annonces : ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchFacultes = async () => {
    try {
      const response = await axios.get('http://localhost:8082/annonces/facultes');
      if (Array.isArray(response.data)) {
        setFacultes(response.data);
      } else {
        setFacultes([]);
        setError('Erreur : les données des facultés sont invalides.');
      }
    } catch (error) {
      setFacultes([]);
      setError('Erreur lors de la récupération des facultés : ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchDepartements = async (faculteId) => {
    if (!faculteId) {
      setDepartements([]);
      setSpecialites([]);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8082/annonces/departements?faculteId=${faculteId}`);
      if (Array.isArray(response.data)) {
        setDepartements(response.data);
        setSpecialites([]);
      } else {
        setDepartements([]);
        setSpecialites([]);
      }
    } catch (error) {
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
      const response = await axios.get(`http://localhost:8082/annonces/specialites?departementId=${departementId}`);
      if (Array.isArray(response.data)) {
        setSpecialites(response.data);
      } else {
        setSpecialites([]);
      }
    } catch (error) {
      setSpecialites([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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
      setFormData(prev => ({ ...prev, [name]: value }));
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
    if (!formData.title || !formData.content || !formData.admin_matricule || !formData.target_type) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (isNaN(formData.admin_matricule)) {
      alert('Le matricule de l\'admin doit être un nombre valide.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('admin_matricule', formData.admin_matricule);
    formDataToSend.append('target_type', formData.target_type);
    formDataToSend.append('target_filter', JSON.stringify(formData.target_filter));
    if (formData.image) formDataToSend.append('image', formData.image);
    else formDataToSend.append('image_url', formData.image_url);

    try {
      let response;
      if (editingAnnonce) {
        response = await axios.put(`http://localhost:8082/annonces/annonces/${editingAnnonce.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axios.post('http://localhost:8082/annonces/annonces', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setFormData(prev => ({
        ...prev,
        image_url: response.data.image_url || '',
        image: null
      }));
      setShowForm(false);
      setEditingAnnonce(null);
      setFormData({
        title: '',
        content: '',
        image_url: '',
        image: null,
        admin_matricule: '',
        target_type: '',
        target_filter: { tous: true, faculte: '', departement: '', specialite: '' }
      });
      fetchAnnonces();
    } catch (error) {
      alert('Erreur : ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8082/annonces/annonces/${id}`);
      fetchAnnonces();
      if (selectedAnnonce === id) {
        setSelectedAnnonce(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression :', error.response?.data || error.message);
    }
  };

  const handleEdit = (annonce) => {
    setEditingAnnonce(annonce);
    setFormData({
      title: annonce.title || '',
      content: annonce.content || '',
      image_url: annonce.image_url || '',
      image: null,
      admin_matricule: annonce.admin_matricule || '',
      target_type: annonce.target_type || '',
      target_filter: annonce.target_filter ? (typeof annonce.target_filter === 'string' ? JSON.parse(annonce.target_filter) : annonce.target_filter) : { tous: true, faculte: '', departement: '', specialite: '' }
    });
    setShowForm(true);
    setSelectedAnnonce(null);
    if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth' });
    const targetFilter = annonce.target_filter ? (typeof annonce.target_filter === 'string' ? JSON.parse(annonce.target_filter) : annonce.target_filter) : { tous: true, faculte: '', departement: '', specialite: '' };
    if (targetFilter.faculte) fetchDepartements(targetFilter.faculte);
    if (targetFilter.departement) fetchSpecialites(targetFilter.departement);
  };

  const toggleFullscreen = (id) => {
    console.log('toggleFullscreen - ID:', id, 'selectedAnnonce:', selectedAnnonce);
    setSelectedAnnonce(selectedAnnonce === id ? null : id);
  };

  if (error) {
    return (
      <div id="annonces">
        <div className="container">
          <h1 style={{ color: 'red', textAlign: 'center' }}>{error}</h1>
          <button onClick={() => { setError(null); fetchAnnonces(); fetchFacultes(); }}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="annonces">
      <div className="container">
        <div className="background-shapes">
          <div className="shape shape1"></div>
          <div className="shape shape2"></div>
        </div>

        <aside className="sidebar">
          <div className="logo">
            <h2>Gestion Annonces</h2>
          </div>
          <button className="sidebar-button" onClick={() => navigate('/admin')}>
            <FaHome /> Retour à l'accueil
          </button>
          <button className="sidebar-button" onClick={() => setShowForm(!showForm)}>
            <FaPlus /> {showForm ? 'Masquer le formulaire' : 'Ajouter une annonce'}
          </button>
        </aside>

        <main className="main-content">
          <header className="header">
            <h1><FaUser /> Bienvenue sur votre espace annonces</h1>
            <p>Ayez une excellente expérience de gestion</p>
          </header>

          {showForm && (
            <form onSubmit={handleSubmit} ref={formRef}>
              <div className="input-group">
                <span className="input-icon"><FaEdit /></span>
                <input type="text" name="title" placeholder="Titre de l'annonce" value={formData.title} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <textarea name="content" placeholder="Contenu" value={formData.content} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <input type="text" name="image_url" placeholder="URL de l'image (optionnel)" value={formData.image_url} onChange={handleChange} />
              </div>
              <div className="input-group">
                <input type="file" name="image" onChange={(e) => handleImageUpload(e, setFormData)} accept="image/*" />
              </div>
              <div className="input-group">
                <span className="input-icon"><FaEdit /></span>
                <input type="number" name="admin_matricule" placeholder="Matricule de l'admin" value={formData.admin_matricule} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <select name="target_type" value={formData.target_type} onChange={handleTargetTypeChange} required>
                  <option value="">Sélectionner votre destinataire...</option>
                  <option value="Etudiants">Étudiants</option>
                  <option value="Enseignants">Enseignants</option>
                </select>
              </div>
              {formData.target_type && (
                <>
                  <div className="input-group">
                    <label>
                      <input type="checkbox" checked={formData.target_filter.tous} onChange={handleTousChange} />
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
              <div className="button-group">
                <button type="submit">
                  <FaPaperPlane /> {editingAnnonce ? 'Modifier' : 'Publier'}
                </button>
                <button type="button" className="close-button" onClick={() => setShowForm(false)}>
                  <FaTimes /> Annuler
                </button>
              </div>
            </form>
          )}

          <section className="event-list">
            <h3><FaPaperPlane /> Liste des Annonces</h3>
            <div className="search-bar">
              <span className="search-icon"><FaSearch /></span>
              <input
                type="text"
                placeholder="Rechercher une annonce..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="etudiants-section">
              <h4>Annonces pour les Étudiants</h4>
              {filteredEtudiants.length === 0 ? (
                <p className="no-results">Aucune annonce pour les étudiants.</p>
              ) : (
                <ul>
                  {filteredEtudiants.map((annonce) => (
                    <li key={annonce.id} className="event-item" onClick={() => toggleFullscreen(annonce.id)}>
                      <div className="event-info">
                        <h4>
                          <FaBullhorn className="annonce-icon" />
                          {annonce.title}
                        </h4>
                        <p>{annonce.content.substring(0, 50)}...</p>
                      </div>
                      <div className="event-stats">
                        <p>{annonce.target_type}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="enseignants-section">
              <h4>Annonces pour les Enseignants</h4>
              {filteredEnseignants.length === 0 ? (
                <p className="no-results">Aucune annonce pour les enseignants.</p>
              ) : (
                <ul>
                  {filteredEnseignants.map((annonce) => (
                    <li key={annonce.id} className="event-item" onClick={() => toggleFullscreen(annonce.id)}>
                      <div className="event-info">
                        <h4>
                          <FaBullhorn className="annonce-icon" />
                          {annonce.title}
                        </h4>
                        <p>{annonce.content.substring(0, 50)}...</p>
                      </div>
                      <div className="event-stats">
                        <p>{annonce.target_type}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>

        <div className={`modal-overlay ${selectedAnnonce ? 'active' : ''}`}>
          {selectedAnnonce && (
            <div className="modal-content">
              <h3>{annonces.find(a => a.id === selectedAnnonce)?.title}</h3>
              {annonces.find(a => a.id === selectedAnnonce)?.image_url && (
                <img
                  src={annonces.find(a => a.id === selectedAnnonce).image_url}
                  alt={annonces.find(a => a.id === selectedAnnonce).title}
                  className="event-image"
                  onError={(e) => { e.target.src = ''; }}
                />
              )}
              <div className="description">
                <p>{annonces.find(a => a.id === selectedAnnonce)?.content}</p>
              </div>
              <p>Destinataire : {annonces.find(a => a.id === selectedAnnonce)?.target_type}</p>
              <p>Publié par : Matricule {annonces.find(a => a.id === selectedAnnonce)?.admin_matricule}</p>
              <div className="button-group">
                <button className="edit-button" onClick={() => handleEdit(annonces.find(a => a.id === selectedAnnonce))}>
                  <FaEdit /> Modifier
                </button>
                <button className="delete-button" onClick={() => handleDelete(selectedAnnonce)}>
                  <FaTrash /> Supprimer
                </button>
                <button className="close-button" onClick={() => setSelectedAnnonce(null)}>
                  <FaTimes /> Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestionAnnonces;