import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourceUploadForm from '../components/ResourceUploadForm';
import { FaHome, FaBook, FaDownload, FaTrash, FaEdit, FaInfoCircle, FaUser, FaFileAlt, FaFileUpload, FaUsers, FaCalendarAlt, FaTimes, FaPlus } from 'react-icons/fa';
import "../ressources.css";

function Home() {
    const [matricule, setMatricule] = useState(localStorage.getItem('matricule') || '');
    const [resources, setResources] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedResource, setSelectedResource] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const storedMatricule = localStorage.getItem('matricule');
        const token = localStorage.getItem('token');
        if (!storedMatricule || !token) {
            navigate('/');
        } else if (selectedSection && selectedModule) {
            fetchResources();
        } else {
            setResources([]);
        }
    }, [matricule, selectedSection, selectedModule, navigate]);

    const fetchResources = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Erreur : Vous devez être connecté.');
                navigate('/');
                return;
            }

            const response = await fetch('http://localhost:8082/ressources/resources', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'matricule': matricule
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setMessage('Session expirée. Veuillez vous reconnecter.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('matricule');
                    navigate('/');
                    return;
                }
                throw new Error('Failed to fetch resources');
            }

            const data = await response.json();
            const filteredResources = data.filter(resource =>
                resource.ID_section === parseInt(selectedSection) &&
                resource.ID_module === parseInt(selectedModule)
            );
            setResources(filteredResources);
        } catch (error) {
            console.error('Error fetching resources:', error);
            setMessage('Erreur lors du chargement des ressources.');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleReturn = () => {
        navigate('/enseignant');
    };

    const handleDeleteResource = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage('Erreur : Vous devez être connecté.');
                navigate('/');
                return;
            }

            const response = await fetch(`http://localhost:8082/ressources/resources/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'matricule': matricule
                }
            });

            if (response.ok) {
                setMessage('Ressource supprimée avec succès !');
                setTimeout(() => setMessage(''), 3000);
                fetchResources();
            } else {
                setMessage('Erreur lors de la suppression');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Erreur: ' + error.message);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDownloadClick = (e) => {
        e.stopPropagation();
    };

    const groupedResources = {
        Cours: resources.filter(r => r.type_ressource === 'Cours'),
        TD: resources.filter(r => r.type_ressource === 'TD'),
        TP: resources.filter(r => r.type_ressource === 'TP')
    };

    return (
        <div id="ressources">
            <div className="container">
                <div className="sidebar">
                    <div className="logo">
                        <FaUser className="icon" />
                        <h2>Professeur</h2>
                    </div>
                    <button className="sidebar-button" onClick={handleReturn}>
                        <FaHome className="icon" />
                        Retour à l'accueil
                    </button>
                </div>
                <div className="main-content">
                    <div className="header">
                        <h1>Gestion des Ressources Pédagogiques</h1>
                        <p>Gérer les ressources des sections et modules</p>
                    </div>
                    <div className="content-grid">
                        <div className="form-container">
                            <h2 className="form-title">
                                <FaPlus className="icon" />
                                Ajouter une Ressource
                            </h2>
                            <ResourceUploadForm
                                matricule={matricule}
                                onUploadSuccess={fetchResources}
                                onSectionChange={(sectionId) => {
                                    setSelectedSection(sectionId);
                                    setSelectedModule('');
                                }}
                                onModuleChange={setSelectedModule}
                                message={message}
                                setMessage={setMessage}
                            />
                        </div>
                        <div className="resources-list">
                            <h3>
                                <FaBook className="icon" />
                                Ressources
                            </h3>
                            {!selectedSection || !selectedModule ? (
                                <div className="no-results">
                                    Sélectionnez une section et un module pour afficher les ressources.
                                </div>
                            ) : resources.length === 0 ? (
                                <div className="no-results">
                                    Aucune ressource disponible pour cette section et ce module.
                                </div>
                            ) : (
                                <div className="resource-grid">
                                    {['Cours', 'TD', 'TP'].map((type) => {
                                        if (groupedResources[type].length === 0) {
                                            return null;
                                        }
                                        return (
                                            <div key={type} className="resource-section">
                                                <h3>{type}</h3>
                                                <ul>
                                                    {groupedResources[type].map(resource => (
                                                        <li
                                                            key={resource.ID_ressource}
                                                            className="resource-item"
                                                            onClick={() => setSelectedResource(resource)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="resource-info">
                                                                <h3>{resource.nom_ressource}</h3>
                                                                {resource.description && (
                                                                    <p>{resource.description}</p>
                                                                )}
                                                                <p>
                                                                    Date de soumission: {new Date(resource.date_upload).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="resource-actions">
                                                                <a
                                                                    href={`http://localhost:8082${resource.fichier_url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="download-link"
                                                                    onClick={handleDownloadClick}
                                                                >
                                                                    <FaDownload className="icon" />
                                                                    Télécharger
                                                                </a>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteResource(resource.ID_ressource);
                                                                    }}
                                                                    className="delete-button"
                                                                >
                                                                    <FaTrash className="icon" />
                                                                    Supprimer
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {selectedResource && (
                    <ResourceModal
                        resource={selectedResource}
                        onClose={() => setSelectedResource(null)}
                        onUpdate={fetchResources}
                        matricule={matricule}
                    />
                )}
            </div>
        </div>
    );
}

const ResourceModal = ({ resource, onClose, onUpdate, matricule }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        nom_ressource: resource.nom_ressource,
        type_ressource: resource.type_ressource,
        description: resource.description || '',
        file: null
    });

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Erreur : Vous devez être connecté.');
            onClose();
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('ID_module', resource.ID_module);
        formDataToSend.append('ID_section', resource.ID_section);
        formDataToSend.append('nom_ressource', formData.nom_ressource);
        formDataToSend.append('type_ressource', formData.type_ressource);
        formDataToSend.append('description', formData.description || '');

        if (formData.file) {
            formDataToSend.append('file', formData.file);
        }

        try {
            const response = await fetch(`http://localhost:8082/ressources/resources/${resource.ID_ressource}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'matricule': matricule
                },
                body: formDataToSend
            });

            const result = await response.json();
            if (response.ok) {
                onUpdate();
                setIsEditing(false);
                onClose();
            } else {
                alert(`Erreur: ${result.error || 'Failed to update resource'}`);
            }
        } catch (error) {
            alert('Erreur lors de la mise à jour: ' + error.message);
        }
    };

    return (
        <div id="ressoures">
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>
                        <FaInfoCircle className="icon" />
                        Détails de la Ressource
                    </h3>
                    {!isEditing ? (
                        <div className="modal-view">
                            <div className="modal-field">
                                <label>
                                    <FaFileAlt className="input-icon" />
                                    Nom de la Ressource
                                </label>
                                <input type="text" value={formData.nom_ressource} disabled />
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaBook className="input-icon" />
                                    Type de Ressource
                                </label>
                                <input type="text" value={formData.type_ressource} disabled />
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaInfoCircle className="input-icon" />
                                    Description
                                </label>
                                <textarea value={formData.description} disabled rows="2" />
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaFileUpload className="input-icon" />
                                    Fichier Actuel
                                </label>
                                <a href={`http://localhost:8082${resource.fichier_url}`} target="_blank" rel="noopener noreferrer">
                                    {resource.fichier_url.split('/').pop()}
                                </a>
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaBook className="input-icon" />
                                    Module
                                </label>
                                <input type="text" value={resource.nom_module} disabled />
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaUsers className="input-icon" />
                                    Section
                                </label>
                                <input type="text" value={`${resource.nom_section} - ${resource.niveau} - ${resource.nom_specialite}`} disabled />
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaCalendarAlt className="input-icon" />
                                    Date de Soumission
                                </label>
                                <input type="text" value={new Date(resource.date_upload).toLocaleString()} disabled />
                            </div>
                            <div className="modal-actions">
                                <button onClick={() => setIsEditing(true)}>
                                    <FaEdit className="icon" />
                                    Modifier
                                </button>
                                <button onClick={onClose}>
                                    <FaTimes className="icon" />
                                    Fermer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="modal-field">
                                <label>
                                    <FaFileAlt className="input-icon" />
                                    Nom de la Ressource
                                </label>
                                <input
                                    type="text"
                                    name="nom_ressource"
                                    value={formData.nom_ressource}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaBook className="input-icon" />
                                    Type de Ressource
                                </label>
                                <select name="type_ressource" value={formData.type_ressource} onChange={handleInputChange} required>
                                    <option value="Cours">Cours</option>
                                    <option value="TD">TD</option>
                                    <option value="TP">TP</option>
                                </select>
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaInfoCircle className="input-icon" />
                                    Description
                                </label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" />
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaFileUpload className="input-icon" />
                                    Fichier Actuel
                                </label>
                                <a href={`http://localhost:8082${resource.fichier_url}`} target="_blank" rel="noopener noreferrer">
                                    {resource.fichier_url.split('/').pop()}
                                </a>
                            </div>
                            <div className="modal-field">
                                <label>
                                    <FaFileUpload className="input-icon" />
                                    Remplacer le Fichier (Optionnel)
                                </label>
                                <input
                                    type="file"
                                    name="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="submit">
                                    <FaEdit className="icon" />
                                    Mettre à Jour
                                </button>
                                <button type="button" onClick={() => setIsEditing(false)}>
                                    <FaTimes className="icon" />
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;