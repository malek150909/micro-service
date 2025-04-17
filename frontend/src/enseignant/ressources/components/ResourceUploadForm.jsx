import { useState, useEffect, useRef } from 'react';
import { FaUsers, FaBook, FaFileAlt, FaFileUpload, FaInfoCircle } from 'react-icons/fa';
import styles from '../ressources.module.css';

const ResourceUploadForm = ({
  matricule,
  onUploadSuccess,
  onSectionChange,
  onModuleChange,
  message,
  setMessage,
}) => {
  // State
  const [sections, setSections] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [formData, setFormData] = useState({
    nom_ressource: '',
    type_ressource: 'Cours',
    description: '',
    file: null,
  });
  const [localMessage, setLocalMessage] = useState('');
  const [fileName, setFileName] = useState('Aucun fichier sélectionné');

  // Ref for the message element
  const messageRef = useRef(null);

  // Effects
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLocalMessage('Erreur : Vous devez être connecté.');
          return;
        }

        const response = await fetch('http://localhost:8082/ressources/sections', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'matricule': matricule
          },
        });

        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response:', result);

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch sections');
        }

        setSections(result);
      } catch (error) {
        console.error('Error fetching sections:', error);
        setLocalMessage('Erreur lors du chargement des sections.');
        setTimeout(() => setLocalMessage(''), 3000);
      }
    };
    fetchSections();
  }, [matricule]);

  // Scroll to the message when it changes (only for errors)
  useEffect(() => {
    if (displayMessage && displayMessage.includes('Erreur') && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [localMessage, message]);

  // Handlers
  const fetchModules = async (sectionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLocalMessage('Erreur : Vous devez être connecté.');
        return;
      }

      const response = await fetch(`http://localhost:8082/ressources/modules/${sectionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'matricule': matricule
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch modules');
      }

      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setLocalMessage('Erreur lors du chargement des modules.');
      setTimeout(() => setLocalMessage(''), 3000);
    }
  };

  const handleSectionChange = (e) => {
    const sectionId = e.target.value;
    setSelectedSection(sectionId);
    setSelectedModule('');
    setModules([]);
    if (sectionId) {
      fetchModules(sectionId);
    }
    if (onSectionChange) onSectionChange(sectionId);
  };

  const handleModuleChange = (e) => {
    const moduleId = e.target.value;
    setSelectedModule(moduleId);
    if (onModuleChange) onModuleChange(moduleId);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file' && files[0]) {
      setFileName(files[0].name);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setLocalMessage('Erreur : Vous devez être connecté.');
      setTimeout(() => setLocalMessage(''), 3000);
      return;
    }

    if (!selectedSection || !selectedModule) {
      setLocalMessage('Veuillez sélectionner une section et un module.');
      setTimeout(() => setLocalMessage(''), 3000);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('ID_module', selectedModule);
    formDataToSend.append('ID_section', selectedSection);
    formDataToSend.append('nom_ressource', formData.nom_ressource);
    formDataToSend.append('type_ressource', formData.type_ressource);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('file', formData.file);

    try {
      const response = await fetch('http://localhost:8082/ressources/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'matricule': matricule
        },
        body: formDataToSend,
      });

      const result = await response.json();
      if (response.ok) {
        setLocalMessage('Ressource téléchargée avec succès !');
        setFormData({ nom_ressource: '', type_ressource: 'Cours', description: '', file: null });
        setFileName('Aucun fichier sélectionné');
        document.getElementById('file').value = '';
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setLocalMessage(`Erreur: ${result.error}`);
      }
    } catch (error) {
      setLocalMessage('Erreur lors du téléchargement: ' + error.message);
    } finally {
      setTimeout(() => setLocalMessage(''), 3000);
    }
  };

  // Render
  const displayMessage = localMessage || message;

  return (
      <form onSubmit={handleSubmit} className={styles['ENS-RES-form-group']}>
        <div className={styles['ENS-RES-input-group']}>
          <label htmlFor="section">
            <FaUsers className={styles['ENS-RES-input-icon']} />
            Sélectionner une Section
          </label>
          <select
            id="section"
            name="section"
            value={selectedSection}
            onChange={handleSectionChange}
            required
          >
            <option value="">-- Choisir une section --</option>
            {sections.map((section) => (
              <option key={section.ID_section} value={section.ID_section}>
                {` ${section.niveau} - ${section.nom_specialite} - ${section.nom_section}`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles['ENS-RES-input-group']}>
          <label htmlFor="module">
            <FaBook className={styles['ENS-RES-input-icon']} />
            Sélectionner un Module
          </label>
          <select
            id="module"
            name="module"
            value={selectedModule}
            onChange={handleModuleChange}
            disabled={!modules.length}
            required
          >
            <option value="">-- Choisir un module --</option>
            {modules.map((module) => (
              <option key={module.ID_module} value={module.ID_module}>
                {module.nom_module}
              </option>
            ))}
          </select>
        </div>

        <div className={styles['ENS-RES-input-group']}>
          <label htmlFor="nom_ressource">
            <FaFileAlt className={styles['ENS-RES-input-icon']} />
            Nom de la Ressource
          </label>
          <input
            type="text"
            id="nom_ressource"
            name="nom_ressource"
            value={formData.nom_ressource}
            onChange={handleInputChange}
            required
            placeholder="Ex: Cours 1 - Introduction"
          />
        </div>

        <div className={styles['ENS-RES-input-group']}>
          <label htmlFor="type_ressource">
            <FaBook className={styles['ENS-RES-input-icon']} />
            Type de Ressource
          </label>
          <select
            id="type_ressource"
            name="type_ressource"
            value={formData.type_ressource}
            onChange={handleInputChange}
            required
          >
            <option value="Cours">Cours</option>
            <option value="TD">TD</option>
            <option value="TP">TP</option>
          </select>
        </div>

        <div className={styles['ENS-RES-input-group']}>
          <label htmlFor="description">
            <FaInfoCircle className={styles['ENS-RES-input-icon']} />
            Description (Optionnel)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Description de la ressource"
          />
        </div>

        <div className={styles['ENS-RES-input-group']}>
          <label htmlFor="file">
            <FaFileUpload className={styles['ENS-RES-input-icon']} />
            Télécharger PDF
          </label>
          <div className={styles['ENS-RES-custom-file-input']}>
            <input
              type="file"
              id="file"
              name="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.png"
              onChange={handleInputChange}
              required
            />
            <label htmlFor="file" className={styles['ENS-RES-custom-file-label']}>
              <FaFileUpload className={styles['ENS-RES-icon']} />
              Choisir
            </label>
            <span className={styles['ENS-RES-file-name']}>{fileName}</span>
          </div>
        </div>

        <button type="submit">
          <FaFileUpload className={styles['ENS-RES-icon']} />
          Ajouter Ressource
        </button>

        {displayMessage && (
          <div
            ref={messageRef}
            className={`${styles['ENS-RES-message']} ${displayMessage.includes('Erreur') ? styles['ENS-RES-error'] : ''}`}
          >
            {displayMessage}
          </div>
        )}
      </form>
  );
};

export default ResourceUploadForm;