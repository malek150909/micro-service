import { useState, useEffect } from 'react';
import "../ressources.css";
import apiRequest from '../utils/api.js';

const ResourceUploadForm = ({ matricule, onUploadSuccess, onSectionChange, onModuleChange, message, setMessage }) => {
    const [sections, setSections] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [formData, setFormData] = useState({
        nom_ressource: '',
        type_ressource: 'Cours',
        description: '',
        file: null
    });
    const [localMessage, setLocalMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        console.log('Matricule envoyé au backend:', matricule);
        if (!matricule) {
            setLocalMessage('Matricule manquant.');
            return;
        }
        try {
            const data = await apiRequest('http://localhost:8082/ressources/sections');
            console.log('Sections récupérées:', data);
            setSections(data);
        } catch (error) {
            console.error('Error fetching sections:', error);
            setLocalMessage('Erreur lors du chargement des sections: ' + error.message);
            setTimeout(() => setLocalMessage(''), 3000);
        }
    };

    const fetchModules = async (sectionId) => {
        try {
            console.log('Fetching modules pour sectionId:', sectionId, 'avec matricule:', matricule);
            const data = await apiRequest(`http://localhost:8082/ressources/modules/${sectionId}`);
            console.log('Modules récupérés:', data);
            setModules(data);
        } catch (error) {
            console.error('Error fetching modules:', error);
            setLocalMessage('Erreur lors du chargement des modules: ' + error.message);
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
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSection || !selectedModule) {
            setLocalMessage('Veuillez sélectionner une section et un module.');
            setTimeout(() => setLocalMessage(''), 3000);
            return;
        }
        setIsLoading(true);
        const formDataToSend = new FormData();
        formDataToSend.append('ID_module', selectedModule);
        formDataToSend.append('ID_section', selectedSection);
        formDataToSend.append('nom_ressource', formData.nom_ressource);
        formDataToSend.append('type_ressource', formData.type_ressource);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('file', formData.file);
    
        console.log('FormData envoyé au backend:');
        for (let [key, value] of formDataToSend.entries()) {
            if (value instanceof File) {
                console.log(`${key}: ${value.name} (size: ${value.size}, type: ${value.type})`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }
    
        try {
            const data = await apiRequest('http://localhost:8082/ressources/upload', {
                method: 'POST',
                body: formDataToSend
            });
            setLocalMessage('Ressource téléchargée avec succès !');
            setTimeout(() => setLocalMessage(''), 3000);
            setFormData({ nom_ressource: '', type_ressource: 'Cours', description: '', file: null });
            document.getElementById('file').value = '';
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            setLocalMessage('Erreur lors du téléchargement: ' + error.message);
            setTimeout(() => setLocalMessage(''), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const displayMessage = localMessage || message;

    return (
        <form onSubmit={handleSubmit} className="form-group">
            <div className="form-field">
                <label htmlFor="section">Sélectionner une Section</label>
                <select id="section" name="section" value={selectedSection} onChange={handleSectionChange} required>
                    <option value="">-- Choisir une section --</option>
                    {sections.map(section => (
                        <option key={section.ID_section} value={section.ID_section}>
                            {`${section.ID_section}: ${section.niveau} - ${section.nom_specialite}`}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-field">
                <label htmlFor="module">Sélectionner un Module</label>
                <select id="module" name="module" value={selectedModule} onChange={handleModuleChange} disabled={!modules.length} required>
                    <option value="">-- Choisir un module --</option>
                    {modules.map(module => (
                        <option key={module.ID_module} value={module.ID_module}>
                            {module.nom_module}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-field">
                <label htmlFor="nom_ressource">Nom de la Ressource</label>
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
            <div className="form-field">
                <label htmlFor="type_ressource">Type de Ressource</label>
                <select id="type_ressource" name="type_ressource" value={formData.type_ressource} onChange={handleInputChange} required>
                    <option value="Cours">Cours</option>
                    <option value="TD">TD</option>
                    <option value="TP">TP</option>
                </select>
            </div>
            <div className="form-field">
                <label htmlFor="file">Charger le Fichier</label>
                <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png"
                    onChange={handleInputChange}
                    required
                />
            </div>
            <div className="form-field">
                <label htmlFor="description">Description (Optionnel)</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Description de la ressource"
                />
            </div>
            <div className="form-field">
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Ajout en cours...' : 'Ajouter'}
                </button>
                {displayMessage && <div className={`message ${displayMessage.includes('Erreur') ? 'error' : ''}`}>{displayMessage}</div>}
            </div>
        </form>
    );
};

export default ResourceUploadForm;