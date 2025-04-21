import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourceUploadForm from '../components/ResourceUploadForm';
import { FaHome, FaBook, FaDownload, FaTrash, FaEdit, FaInfoCircle, FaUser, FaFileAlt, FaFileUpload, FaUsers, FaCalendarAlt, FaTimes, FaPlus } from 'react-icons/fa';
import styles from '../ressources.module.css';

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

            const response = await fetch('http://messaging.localhost/ressources/resources', {
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

            const response = await fetch(`http://messaging.localhost/ressources/resources/${id}`, {
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
            <div className={styles['ENS-RES-container']}>
                <div className={styles['ENS-RES-sidebar']}>
                    <div className={styles['ENS-RES-logo']}>
                        <h2>Ressources</h2>
                    </div>
                    <button className={styles['ENS-RES-sidebar-button']} onClick={handleReturn}>
                        <FaHome className={styles['ENS-RES-icon']} />
                        Retour à l'accueil
                    </button>
                </div>
                <div className={styles['ENS-RES-main-content']}>
                    <div className={styles['ENS-RES-header']}>
                        <h1>Gestion des Ressources Pédagogiques</h1>
                        <p>Gérer les ressources des sections et modules</p>
                    </div>
                    <div className={styles['ENS-RES-content-grid']}>
                        <div className={styles['ENS-RES-form-container']}>
                            <h2 className={styles['ENS-RES-form-title']}>
                                <FaPlus className={styles['ENS-RES-icon']} />
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
                        <div className={styles['ENS-RES-resources-list']}>
                            <h3>
                                <FaBook className={styles['ENS-RES-icon']} />
                                Ressources
                            </h3>
                            {!selectedSection || !selectedModule ? (
                                <div className={styles['ENS-RES-no-results']}>
                                    Sélectionnez une section et un module pour afficher les ressources.
                                </div>
                            ) : resources.length === 0 ? (
                                <div className={styles['ENS-RES-no-results']}>
                                    Aucune ressource disponible pour cette section et ce module.
                                </div>
                            ) : (
                                <div className={styles['ENS-RES-resource-grid']}>
                                    {['Cours', 'TD', 'TP'].map((type) => {
                                        if (groupedResources[type].length === 0) {
                                            return null;
                                        }
                                        return (
                                            <div key={type} className={styles['ENS-RES-resource-section']}>
                                                <h3>{type}</h3>
                                                <ul>
                                                    {groupedResources[type].map(resource => (
                                                        <li
                                                            key={resource.ID_ressource}
                                                            className={styles['ENS-RES-resource-item']}
                                                            onClick={() => setSelectedResource(resource)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className={styles['ENS-RES-resource-info']}>
                                                                <h3>{resource.nom_ressource}</h3>
                                                                {resource.description && (
                                                                    <p>{resource.description}</p>
                                                                )}
                                                                <p>
                                                                    Date de soumission: {new Date(resource.date_upload).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className={styles['ENS-RES-resource-actions']}>
                                                                <a
                                                                    href={`http://messaging.localhost${resource.fichier_url}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={styles['ENS-RES-download-link']}
                                                                    onClick={handleDownloadClick}
                                                                >
                                                                    <FaDownload className={styles['ENS-RES-icon']} />
                                                                    Télécharger
                                                                </a>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteResource(resource.ID_ressource);
                                                                    }}
                                                                    className={styles['ENS-RES-delete-button']}
                                                                >
                                                                    <FaTrash className={styles['ENS-RES-icon']} />
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
            const response = await fetch(`http://messaging.localhost/ressources/resources/${resource.ID_ressource}`, {
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
            <div className={styles['ENS-RES-modal-overlay']}>
                <div className={styles['ENS-RES-modal-content']}>
                    <h3>
                        <FaInfoCircle className={styles['ENS-RES-icon']} />
                        Détails de la Ressource
                    </h3>
                    {!isEditing ? (
                        <div className={styles['ENS-RES-modal-view']}>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaFileAlt className={styles['ENS-RES-input-icon']} />
                                    Nom de la Ressource
                                </label>
                                <input type="text" value={formData.nom_ressource} disabled />
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaBook className={styles['ENS-RES-input-icon']} />
                                    Type de Ressource
                                </label>
                                <input type="text" value={formData.type_ressource} disabled />
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaInfoCircle className={styles['ENS-RES-input-icon']} />
                                    Description
                                </label>
                                <textarea value={formData.description} disabled rows="2" />
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaFileUpload className={styles['ENS-RES-input-icon']} />
                                    Fichier Actuel
                                </label>
                                <a href={`http://messaging.localhost${resource.fichier_url}`} target="_blank" rel="noopener noreferrer">
                                    {resource.fichier_url.split('/').pop()}
                                </a>
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaBook className={styles['ENS-RES-input-icon']} />
                                    Module
                                </label>
                                <input type="text" value={resource.nom_module} disabled />
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaUsers className={styles['ENS-RES-input-icon']} />
                                    Section
                                </label>
                                <input type="text" value={`${resource.nom_section} - ${resource.niveau} - ${resource.nom_specialite}`} disabled />
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaCalendarAlt className={styles['ENS-RES-input-icon']} />
                                    Date de Soumission
                                </label>
                                <input type="text" value={new Date(resource.date_upload).toLocaleString()} disabled />
                            </div>
                            <div className={styles['ENS-RES-modal-actions']}>
                                <button onClick={() => setIsEditing(true)}>
                                    <FaEdit className={styles['ENS-RES-icon']} />
                                    Modifier
                                </button>
                                <button onClick={onClose}>
                                    <FaTimes className={styles['ENS-RES-icon']} />
                                    Fermer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaFileAlt className={styles['ENS-RES-input-icon']} />
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
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaBook className={styles['ENS-RES-input-icon']} />
                                    Type de Ressource
                                </label>
                                <select name="type_ressource" value={formData.type_ressource} onChange={handleInputChange} required>
                                    <option value="Cours">Cours</option>
                                    <option value="TD">TD</option>
                                    <option value="TP">TP</option>
                                </select>
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaInfoCircle className={styles['ENS-RES-input-icon']} />
                                    Description
                                </label>
                                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" />
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaFileUpload className={styles['ENS-RES-input-icon']} />
                                    Fichier Actuel
                                </label>
                                <a href={`http://messaging.localhost${resource.fichier_url}`} target="_blank" rel="noopener noreferrer">
                                    {resource.fichier_url.split('/').pop()}
                                </a>
                            </div>
                            <div className={styles['ENS-RES-modal-field']}>
                                <label>
                                    <FaFileUpload className={styles['ENS-RES-input-icon']} />
                                    Remplacer le Fichier (Optionnel)
                                </label>
                                <input
                                    type="file"
                                    name="file"
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png"
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles['ENS-RES-modal-actions']}>
                                <button type="submit">
                                    <FaEdit className={styles['ENS-RES-icon']} />
                                    Mettre à Jour
                                </button>
                                <button type="button" onClick={() => setIsEditing(false)}>
                                    <FaTimes className={styles['ENS-RES-icon']} />
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
    );
};

export default Home;