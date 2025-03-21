import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaPlus, FaEdit, FaTrash, FaTimes, FaPaperPlane } from 'react-icons/fa';
import '../../admin_css_files/annonce.css';

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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    image: null,
    Matricule: '',
    target_type: '',
    target_filter: { tous: true, faculte: '', departement: '', specialite: '' }
  });
  const [editingAnnonce, setEditingAnnonce] = useState(null);
  const [selectedAnnonce, setSelectedAnnonce] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [facultes, setFacultes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [specialites, setSpecialites] = useState([]);
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    fetchAnnonces();
    fetchFacultes();
  }, []);

  const fetchAnnonces = async () => {
    try {
      const response = await axios.get('http://localhost:8082/annonces/annonces');
      setAnnonces(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des annonces :', error.response?.data || error.message);
    }
  };

  const fetchFacultes = async () => {
    try {
      const response = await axios.get('http://localhost:8082/annonces/facultes');
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
      const response = await axios.get(`http://localhost:8082/annonces/departements?faculteId=${faculteId}`);
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
      const response = await axios.get(`http://localhost:8082/annonces/specialites?departementId=${departementId}`);
      setSpecialites(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des spécialités :', error);
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
    if (!formData.title || !formData.content || !formData.Matricule || !formData.target_type) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (isNaN(formData.Matricule)) {
      alert('Le matricule doit être un nombre valide.');
      return;
    }
  
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('Matricule', formData.Matricule);
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
      // Mettre à jour formData.image_url avec la réponse du serveur
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
        Matricule: '',
        target_type: '',
        target_filter: { tous: true, faculte: '', departement: '', specialite: '' }
      });
      fetchAnnonces(); // Rafraîchir la liste
    } catch (error) {
      console.error('Erreur lors de l\'ajout/modification :', error.response?.data || error.message);
      alert('Erreur : ' + (error.response?.data?.message || error.message));
    }
  };
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8082/annonces/annonces/${id}`);
      fetchAnnonces();
      if (selectedAnnonce === id) {
        setSelectedAnnonce(null);
        setIsClosing(true);
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
      Matricule: annonce.Matricule || '',
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

  const handleSendNotifications = async (id) => {
    try {
      const response = await axios.post(`http://localhost:8082/annonces/annonces/${id}/notifications`);
      alert(response.data.message);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications :', error.response?.data || error.message);
      alert('Erreur : ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleFullscreen = (id) => {
    if (selectedAnnonce === id) {
      setIsClosing(true);
    } else {
      setSelectedAnnonce(id);
      setIsClosing(false);
    }
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setSelectedAnnonce(null);
      setIsClosing(false);
    }
  };

  return (
    <div id="annonces">
    <div className="container">
      <h1>Gestion des Annonces</h1>
      <div className="button-group">
        <button onClick={() => navigate('/admin')}>
          <FaHome /> Retour à l'accueil
        </button>
        <button onClick={() => setShowForm(!showForm)}>
          <FaPlus /> {showForm ? 'Masquer le formulaire' : 'Ajouter une annonce'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} ref={formRef}>
          <div className="input-group">
            <input type="text" name="title" placeholder="Titre de l'annonce" value={formData.title} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <textarea name="content" placeholder="Contenu" value={formData.content} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <input type="text" name="image_url" placeholder="URL de l'image" value={formData.image_url} onChange={handleChange} />
          </div>
          <div className="input-group">
            <input type="file" name="image" onChange={(e) => handleImageUpload(e, setFormData)} accept="image/*" />
          </div>
          <div className="input-group">
            <input type="number" name="Matricule" placeholder="Matricule de l'admin" value={formData.Matricule} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <select name="target_type" value={formData.target_type} onChange={handleTargetTypeChange} required>
              <option value="">Sélectionner...</option>
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
                <>
                  <div className="input-group">
                    <select name="faculte" value={formData.target_filter.faculte} onChange={handleChange}>
                      <option value="">Toutes</option>
                      {facultes.map(f => (
                        <option key={f.ID_faculte} value={f.ID_faculte}>{f.nom_faculte}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <select name="departement" value={formData.target_filter.departement} onChange={handleChange} disabled={!formData.target_filter.faculte}>
                      <option value="">Tous</option>
                      {departements.map(d => (
                        <option key={d.ID_departement} value={d.ID_departement}>{d.Nom_departement}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <select name="specialite" value={formData.target_filter.specialite} onChange={handleChange} disabled={!formData.target_filter.departement}>
                      <option value="">Toutes</option>
                      {specialites.map(s => (
                        <option key={s.ID_specialite} value={s.ID_specialite}>{s.nom_specialite}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </>
          )}
          <button type="submit">{editingAnnonce ? 'Modifier' : 'Ajouter'}</button>
        </form>
      )}

      <h2>Liste des Annonces</h2>
      <ul>
        {annonces.map((annonce) => (
          <li key={annonce.id} className="annonce-square" onClick={() => toggleFullscreen(annonce.id)}>
            <h3>{annonce.title}</h3>
          </li>
        ))}
      </ul>

      {selectedAnnonce && (
        <div className={`modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`} onAnimationEnd={handleAnimationEnd}>
          <div className="event-modal">
            <button className="close-button" onClick={() => toggleFullscreen(selectedAnnonce)}>
              <FaTimes /> Fermer
            </button>
            <div className="modal-content">
              <div className="modal-image">
                {annonces.find(a => a.id === selectedAnnonce)?.image_url ? (
                  <img
                    src={annonces.find(a => a.id === selectedAnnonce).image_url}
                    alt={annonces.find(a => a.id === selectedAnnonce).title}
                    className="event-image"
                    onError={(e) => { e.target.src = ''; console.error('Erreur chargement image :', e.target.src); }}
                  />
                ) : (
                  <div className="image-placeholder">Aucune image</div>
                )}
              </div>
              <div className="modal-text">
                <h3>{annonces.find(a => a.id === selectedAnnonce)?.title}</h3>
                <p>{annonces.find(a => a.id === selectedAnnonce)?.content}</p>
                <div className="button-group">
                  <button className="edit-button" onClick={() => handleEdit(annonces.find(a => a.id === selectedAnnonce))}>
                    <FaEdit /> Modifier
                  </button>
                  <button className="delete-button" onClick={() => handleDelete(selectedAnnonce)}>
                    <FaTrash /> Supprimer
                  </button>
                 
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default GestionAnnonces;