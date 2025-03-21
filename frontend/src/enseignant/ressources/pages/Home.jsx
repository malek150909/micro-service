import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourceUploadForm from '../components/ResourceUploadForm';
import "../ressources.css";
import apiRequest from '../utils/api.js';
import debounce from 'lodash/debounce';

function Home() {
    const [matricule, setMatricule] = useState(localStorage.getItem('matricule') || '');
    const [resources, setResources] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [selectedResource, setSelectedResource] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const fetchResources = async () => {
        setIsLoadingResources(true);
        try {
            console.log('Fetching resources avec matricule:', matricule);
            const data = await apiRequest('http://localhost:8082/ressources/resources');
            console.log('Resources récupérées:', data);
            const filteredResources = data.filter(resource =>
                resource.ID_section === parseInt(selectedSection) &&
                resource.ID_module === parseInt(selectedModule)
            );
            setResources(filteredResources);
        } catch (error) {
            console.error('Error fetching resources:', error);
            setMessage('Erreur lors du chargement des ressources: ' + error.message);
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsLoadingResources(false);
        }
    };

    const debouncedFetchResources = useCallback(debounce(fetchResources, 300), [selectedSection, selectedModule]);

    useEffect(() => {
        const storedMatricule = localStorage.getItem('matricule');
        if (!storedMatricule) {
            navigate('/');
        } else if (selectedSection && selectedModule) {
            debouncedFetchResources();
        } else {
            setResources([]);
        }
    }, [matricule, selectedSection, selectedModule, navigate, debouncedFetchResources]);

    const handleReturn = () => {
        navigate('/enseignant');
    };

    const handleDeleteResource = async (id) => {
        setIsLoading(true);
        try {
            await apiRequest(`http://localhost:8082/ressources/resources/${id}`, { method: 'DELETE' });
            setMessage('Ressource supprimée avec succès !');
            setTimeout(() => setMessage(''), 3000);
            fetchResources();
        } catch (error) {
            setMessage('Erreur lors de la suppression: ' + error.message);
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsLoading(false);
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

    console.log('Selected Section:', selectedSection, 'Selected Module:', selectedModule, 'Resources:', resources);

    return (
        <div id="ressources">
        <div className="container">
            <h2>Gérer les Ressources Pédagogiques </h2>
            <div className="button-container">
                <button onClick={handleReturn}>Retourner</button>
            </div>
            <div className="home-layout">
                <div className="form-column">
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
                <div className="resources-column">
                    {selectedSection && selectedModule ? (
                        isLoadingResources ? (
                            <div className="centered-message">
                                <p>Chargement des ressources...</p>
                            </div>
                        ) : resources.length === 0 ? (
                            <div className="centered-message">
                                <p>Aucune ressource téléchargée pour cette section et ce module.</p>
                            </div>
                        ) : (
                            <div className="resources-list">
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
                                                            onClick={() => setSelectedResource(resource)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="resource-info">
                                                                <strong className="resource-name">{resource.nom_ressource}</strong>
                                                                {resource.description && (
                                                                    <p className="resource-description">{resource.description}</p>
                                                                )}
                                                                <p className="resource-date">
                                                                    Date de soumission: {new Date(resource.date_upload).toLocaleDateString()}
                                                                </p>
                                                                <div className="resource-actions">
                                                                    <a
                                                                        href={`http://localhost:8082${resource.fichier_url}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="download-link"
                                                                        onClick={handleDownloadClick}
                                                                    >
                                                                        Télécharger
                                                                    </a>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteResource(resource.ID_ressource);
                                                                        }}
                                                                        className="delete-button"
                                                                        disabled={isLoading}
                                                                    >
                                                                        {isLoading ? 'Suppression...' : 'Supprimer'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="centered-message">
                            <p>Veuillez sélectionner une section et un module pour afficher les ressources.</p>
                        </div>
                    )}
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
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
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
            await apiRequest(`http://localhost:8082/ressources/resources/${resource.ID_ressource}`, {
                method: 'PUT',
                body: formDataToSend
            });
            onUpdate();
            setIsEditing(false);
            onClose();
        } catch (error) {
            console.error('Error updating resource:', error);
            alert('Erreur lors de la mise à jour: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div id="ressources">
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Détails de la Ressource</h3>
                {!isEditing ? (
                    <div className="modal-view">
                        <div className="modal-field">
                            <label>Nom de la Ressource</label>
                            <input type="text" value={formData.nom_ressource} disabled />
                        </div>
                        <div className="modal-field">
                            <label>Type de Ressource</label>
                            <input type="text" value={formData.type_ressource} disabled />
                        </div>
                        <div className="modal-field">
                            <label>Description</label>
                            <textarea value={formData.description} disabled rows="3" />
                        </div>
                        <div className="modal-field">
                            <label>Fichier Actuel</label>
                            <a href={`http://localhost:8082${resource.fichier_url}`} target="_blank" rel="noopener noreferrer">
                                {resource.fichier_url.split('/').pop()}
                            </a>
                        </div>
                        <div className="modal-field">
                            <label>Module</label>
                            <input type="text" value={resource.nom_module} disabled />
                        </div>
                        <div className="modal-field">
                            <label>Section</label>
                            <input type="text" value={`${resource.ID_section}: ${resource.niveau} - ${resource.nom_specialite}`} disabled />
                        </div>
                        <div className="modal-field">
                            <label>Date de Soumission</label>
                            <input type="text" value={new Date(resource.date_upload).toLocaleString()} disabled />
                        </div>
                        <div className="modal-actions">
                            <button onClick={() => setIsEditing(true)}>Modifier</button>
                            <button onClick={onClose}>Fermer</button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="modal-field">
                            <label>Nom de la Ressource</label>
                            <input
                                type="text"
                                name="nom_ressource"
                                value={formData.nom_ressource}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="modal-field">
                            <label>Type de Ressource</label>
                            <select name="type_ressource" value={formData.type_ressource} onChange={handleInputChange} required>
                                <option value="Cours">Cours</option>
                                <option value="TD">TD</option>
                                <option value="TP">TP</option>
                            </select>
                        </div>
                        <div className="modal-field">
                            <label>Description</label>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                        </div>
                        <div className="modal-field">
                            <label>Fichier Actuel</label>
                            <a href={`http://localhost:8082${resource.fichier_url}`} target="_blank" rel="noopener noreferrer">
                                {resource.fichier_url.split('/').pop()}
                            </a>
                        </div>
                        <div className="modal-field">
                            <label>Remplacer le Fichier (Optionnel)</label>
                            <input
                                type="file"
                                name="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.png"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="modal-field">
                            <label>Module</label>
                            <input type="text" value={resource.nom_module} disabled />
                        </div>
                        <div className="modal-field">
                            <label>Section</label>
                            <input type="text" value={`${resource.ID_section}: ${resource.niveau} - ${resource.nom_specialite}`} disabled />
                        </div>
                        <div className="modal-field">
                            <label>Date de Soumission</label>
                            <input type="text" value={new Date(resource.date_upload).toLocaleString()} disabled />
                        </div>
                        <div className="modal-actions">
                            <button type="submit" disabled={isLoading}>
                                {isLoading ? 'Mise à jour...' : 'Mettre à Jour'}
                            </button>
                            <button type="button" onClick={() => setIsEditing(false)} disabled={isLoading}>Annuler</button>
                        </div>
                    </form>
                )}
            </div>
        </div>
        </div>
    );
};

export default Home;