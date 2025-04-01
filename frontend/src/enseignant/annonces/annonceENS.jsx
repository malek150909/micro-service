import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaUser, FaPaperPlane, FaBullhorn, FaSearch, FaHome, FaPoll, FaStar, FaComment, FaUserTie } from 'react-icons/fa';
import '../../admin_css_files/annonceENS.css';

const AnnonceENS = ({ handleLogout }) => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const matricule = storedUser?.Matricule;

    const [activeTab, setActiveTab] = useState('consulter');
    const [adminAnnonces, setAdminAnnonces] = useState([]);
    const [filteredAdminAnnonces, setFilteredAdminAnnonces] = useState([]);
    const [teacherAnnonces, setTeacherAnnonces] = useState([]);
    const [filteredTeacherAnnonces, setFilteredTeacherAnnonces] = useState([]);
    const [teacherSondages, setTeacherSondages] = useState([]);
    const [filteredTeacherSondages, setFilteredTeacherSondages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sections, setSections] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSondageModal, setShowSondageModal] = useState(false);
    const [showSondageResultsModal, setShowSondageResultsModal] = useState(false);
    const [annonceToDelete, setAnnonceToDelete] = useState(null);
    const [selectedAnnonce, setSelectedAnnonce] = useState(null);
    const [currentAnnonce, setCurrentAnnonce] = useState(null);
    const [currentSondage, setCurrentSondage] = useState(null);
    const [selectedSondage, setSelectedSondage] = useState(null);
    const [sondageResults, setSondageResults] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [selectedSections, setSelectedSections] = useState([]);
    const [selectedGroups, setSelectedGroups] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comments, setComments] = useState([]);
    const [newReplies, setNewReplies] = useState({});

    const API_URL = 'http://localhost:8082';

    useEffect(() => {
        console.log('AnnonceENS rendu avec matricule:', matricule);
        const fetchData = async () => {
            if (!matricule) {
                setError('Veuillez vous connecter pour accéder à vos annonces et sondages.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const [adminResponse, teacherResponse, sondagesResponse, sectionsResponse] = await Promise.all([
                    fetch(`${API_URL}/annoncesENS/admin/${matricule}`),
                    fetch(`${API_URL}/annoncesENS/teacher/${matricule}`),
                    fetch(`${API_URL}/sondages/teacher/${matricule}`),
                    fetch(`${API_URL}/annoncesENS/sections/${matricule}`),
                ]);

                if (!adminResponse.ok) throw new Error((await adminResponse.json()).error || 'Erreur lors du chargement des annonces admin');
                if (!teacherResponse.ok) throw new Error((await teacherResponse.json()).error || 'Erreur lors du chargement des annonces enseignant');
                if (!sondagesResponse.ok) throw new Error((await sondagesResponse.json()).error || 'Erreur lors du chargement des sondages');
                if (!sectionsResponse.ok) throw new Error((await sectionsResponse.json()).error || 'Erreur lors du chargement des sections');

                const [adminData, teacherData, sondagesData, sectionsData] = await Promise.all([
                    adminResponse.json(),
                    teacherResponse.json(),
                    sondagesResponse.json(),
                    sectionsResponse.json(),
                ]);

                setAdminAnnonces(Array.isArray(adminData) ? adminData : []);
                setFilteredAdminAnnonces(Array.isArray(adminData) ? adminData : []);
                setTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);
                setFilteredTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);
                setTeacherSondages(Array.isArray(sondagesData) ? sondagesData : []);
                setFilteredTeacherSondages(Array.isArray(sondagesData) ? sondagesData : []);
                setSections(Array.isArray(sectionsData) ? sectionsData : []);
            } catch (err) {
                console.error('Erreur dans fetchData:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [matricule]);

    useEffect(() => {
        const filterData = (data, keys) =>
            data.filter(item => keys.some(key => (item[key] || '').toLowerCase().includes(searchTerm.toLowerCase())));

        setFilteredAdminAnnonces(searchTerm ? filterData(adminAnnonces, ['title', 'content']) : adminAnnonces);
        setFilteredTeacherAnnonces(searchTerm ? filterData(teacherAnnonces, ['title', 'content']) : teacherAnnonces);
        setFilteredTeacherSondages(searchTerm ? filterData(teacherSondages, ['title', 'question']) : teacherSondages);
    }, [searchTerm, adminAnnonces, teacherAnnonces, teacherSondages]);

    const parseTargetFilter = (targetFilter) => {
        try {
            const parsed = typeof targetFilter === 'string' ? JSON.parse(targetFilter) : targetFilter || {};
            return {
                sections: Array.isArray(parsed.sections) ? parsed.sections.map(String) : [],
                groupes: parsed.groupes && typeof parsed.groupes === 'object' ? Object.fromEntries(
                    Object.entries(parsed.groupes).map(([key, value]) => [String(key), Array.isArray(value) ? value.map(String) : []])
                ) : {},
            };
        } catch (error) {
            console.error('Erreur lors du parsing de target_filter:', error, 'Valeur:', targetFilter);
            return { sections: [], groupes: {} };
        }
    };

    const getSectionNames = (sectionIds, groupeData) => {
        if (!sectionIds?.length) return 'Aucune section';
        const sectionNames = sectionIds.map(id => {
            const section = sections.find(s => String(s.ID_section) === String(id));
            if (!section) return null;

            const groupesForSection = groupeData[id] || [];
            const groupeNames = groupesForSection.length > 0 && groupesForSection[0] !== ''
                ? groupesForSection.map(groupeId => {
                    const groupe = section.groupes?.find(g => String(g.ID_groupe) === String(groupeId));
                    return groupe?.nom_groupe || null;
                }).filter(Boolean).join(', ')
                : 'Tous les groupes';

            return `${section.niveau} - ${section.nom_specialite} (${groupeNames})`;
        }).filter(Boolean);
        return sectionNames.length > 0 ? sectionNames.join('; ') : 'Aucune section';
    };

    const handleSectionChange = (e) => {
        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
        setSelectedSections(selected);
        setSelectedGroups(prev => {
            const newGroups = {};
            selected.forEach(id => {
                newGroups[id] = prev[id] || [];
            });
            return newGroups;
        });
    };

    const handleGroupChange = (sectionId, e) => {
        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
        setSelectedGroups(prev => ({ ...prev, [sectionId]: selected }));
    };

    const handleOptionChange = (index, value) => {
        setOptions(prev => {
            const newOptions = [...prev];
            newOptions[index] = value;
            return newOptions;
        });
    };

    const addOption = () => setOptions(prev => [...prev, '']);
    const removeOption = (index) => options.length > 2 && setOptions(prev => prev.filter((_, i) => i !== index));

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !selectedSections.length) {
            setError('Tous les champs sont requis, y compris au moins une section.');
            return;
        }

        const data = { title, content, target_filter: { sections: selectedSections, groupes: selectedGroups }, matricule };
        if (currentAnnonce) data.id = currentAnnonce.id;

        try {
            const response = await fetch(`${API_URL}/annoncesENS${currentAnnonce ? `/${currentAnnonce.id}` : ''}`, {
                method: currentAnnonce ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Erreur lors de la création/modification');

            const updatedData = await (await fetch(`${API_URL}/annoncesENS/teacher/${matricule}`)).json();
            setTeacherAnnonces(Array.isArray(updatedData) ? updatedData : []);
            setFilteredTeacherAnnonces(Array.isArray(updatedData) ? updatedData : []);
            closeModal();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCreateOrUpdateSondage = async (e) => {
        e.preventDefault();
        if (!title.trim() || !question.trim() || options.some(opt => !opt.trim()) || options.length < 2 || !selectedSections.length) {
            setError('Tous les champs sont requis, avec au moins 2 options et une section.');
            return;
        }

        const data = { title, question, options, target_filter: { sections: selectedSections, groupes: selectedGroups }, matricule };
        if (currentSondage) data.id = currentSondage.id;

        try {
            const response = await fetch(`${API_URL}/sondages${currentSondage ? `/${currentSondage.id}` : ''}`, {
                method: currentSondage ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Erreur lors de la création/modification');

            const updatedData = await (await fetch(`${API_URL}/sondages/teacher/${matricule}`)).json();
            setTeacherSondages(Array.isArray(updatedData) ? updatedData : []);
            setFilteredTeacherSondages(Array.isArray(updatedData) ? updatedData : []);
            closeModal();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async () => {
        const id = annonceToDelete;
        const isSondage = activeTab === 'sondages';
        try {
            const response = await fetch(`${API_URL}/${isSondage ? 'sondages' : 'annoncesENS'}/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matricule }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Erreur lors de la suppression');

            const updatedData = await (await fetch(`${API_URL}/${isSondage ? 'sondages' : 'annoncesENS'}/teacher/${matricule}`)).json();
            if (isSondage) {
                setTeacherSondages(Array.isArray(updatedData) ? updatedData : []);
                setFilteredTeacherSondages(Array.isArray(updatedData) ? updatedData : []);
            } else {
                setTeacherAnnonces(Array.isArray(updatedData) ? updatedData : []);
                setFilteredTeacherAnnonces(Array.isArray(updatedData) ? updatedData : []);
            }
            closeModal();
        } catch (err) {
            setError(err.message);
            closeModal();
        }
    };

    const openModal = (annonce = null) => {
        setCurrentAnnonce(annonce);
        setTitle(annonce?.title || '');
        setContent(annonce?.content || '');
        const { sections, groupes } = annonce ? parseTargetFilter(annonce.target_filter) : { sections: [], groupes: {} };
        setSelectedSections(sections);
        setSelectedGroups(groupes);
        setShowModal(true);
    };

    const openSondageModal = (sondage = null) => {
        setCurrentSondage(sondage);
        setTitle(sondage?.title || '');
        setQuestion(sondage?.question || '');
        const parsedOptions = sondage?.options
            ? (Array.isArray(sondage.options) ? sondage.options : JSON.parse(sondage.options || '["", ""]'))
            : ['', ''];
        setOptions(parsedOptions.length >= 2 ? parsedOptions : ['', '']);
        const { sections, groupes } = sondage ? parseTargetFilter(sondage.target_filter) : { sections: [], groupes: {} };
        setSelectedSections(sections);
        setSelectedGroups(groupes);
        setShowSondageModal(true);
    };

    const openDetailsModal = async (annonce) => {
        setSelectedAnnonce(annonce);
        setShowDetailsModal(true);
        if (activeTab === 'gerer') {
            try {
                const commentsData = await (await fetch(`${API_URL}/annoncesENS/comments/${annonce.id}`)).json();
                setComments(Array.isArray(commentsData) ? commentsData : []);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const openSondageResultsModal = async (sondage) => {
        try {
            const data = await (await fetch(`${API_URL}/sondages/${sondage.id}/results`)).json();
            setSondageResults(data);
            setShowSondageResultsModal(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setShowDetailsModal(false);
        setShowConfirmModal(false);
        setShowSondageModal(false);
        setShowSondageResultsModal(false);
        setSelectedAnnonce(null);
        setSelectedSondage(null);
        setSondageResults(null);
        setCurrentAnnonce(null);
        setCurrentSondage(null);
        setAnnonceToDelete(null);
        setComments([]);
        setNewReplies({});
        setError(null);
        setTitle('');
        setContent('');
        setQuestion('');
        setOptions(['', '']);
        setSelectedSections([]);
        setSelectedGroups({});
    };

    const handleReplySubmit = async (commentaireId) => {
        const reply = newReplies[commentaireId]?.trim();
        if (!reply) {
            setError('Veuillez écrire une réponse avant de soumettre.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/annoncesENS/comment/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commentaireId, enseignantMatricule: matricule, reponse: reply }),
            });
            if (!response.ok) throw new Error((await response.json()).error || 'Erreur lors de l’envoi de la réponse');

            const updatedComments = await (await fetch(`${API_URL}/annoncesENS/comments/${selectedAnnonce.id}`)).json();
            setComments(Array.isArray(updatedComments) ? updatedComments : []);
            setNewReplies(prev => ({ ...prev, [commentaireId]: '' }));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="container">Chargement...</div>;
    if (error && !showModal && !showSondageModal) return (
        <div id="annoncesENS">
            <div className="container">
                <p className="error-message">{error}</p>
                <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
        </div>
    );

    return (
        <div id="annoncesENS">
            <div className="container">
                <div className="background-shapes">
                    <div className="shape shape1"></div>
                    <div className="shape shape2"></div>
                </div>

                <aside className="sidebar">
                    <div className="logo"><h2>Annonces</h2></div>
                    <button className="sidebar-button" onClick={handleLogout}><FaHome /> Retour à l'accueil</button>
                    <button className="sidebar-button" onClick={() => setActiveTab('consulter')}><FaBullhorn /> Consulter les Annonces</button>
                    <button className="sidebar-button" onClick={() => setActiveTab('gerer')}><FaPaperPlane /> Gérer mes Annonces</button>
                    <button className="sidebar-button" onClick={() => setActiveTab('sondages')}><FaPoll /> Gérer mes Sondages</button>
                </aside>

                <main className="main-content">
                    {activeTab === 'consulter' && (
                        <section id="consulter" className="tab-content">
                            <div className="header"><h1><FaUser /> Annonces Reçues</h1><p>Consultez les annonces destinées à vous de la part de l'administration</p></div>
                            <div className="search-bar-container"><div className="search-bar"><FaSearch className="search-icon" /><input type="text" placeholder="Rechercher une annonce..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                            <div className="event-list">
                                <ul id="annonces-list">
                                    {filteredAdminAnnonces.length === 0 ? <li className="no-results">Aucune annonce disponible</li> : filteredAdminAnnonces.map(annonce => (
                                        <li key={annonce.id} className="event-item" onClick={() => openDetailsModal(annonce)}>
                                            <div className="event-info"><h4><FaBullhorn className="annonce-icon" /> {annonce.title || 'Sans titre'}</h4><p>{new Date(annonce.created_at).toLocaleString()}</p></div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                    {activeTab === 'gerer' && (
                        <section id="gerer" className="tab-content">
                            <div className="header"><h1><FaUser /> Gérer mes Annonces</h1><p>Créer, modifier ou supprimer des annonces pour vos étudiants</p></div>
                            <div className="event-list">
                                <button className="button create-button" onClick={() => openModal()}><FaPlus /> Créer une Annonce</button>
                                <div className="search-bar-container"><div className="search-bar"><FaSearch className="search-icon" /><input type="text" placeholder="Rechercher une annonce..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                                <ul id="mes-annonces-list">
                                    {filteredTeacherAnnonces.length === 0 ? <li className="no-results">Aucune annonce disponible</li> : filteredTeacherAnnonces.map(annonce => (
                                        <li key={annonce.id} className="event-item" onClick={(e) => !e.target.closest('button') && openDetailsModal(annonce)}>
                                            <div className="event-info"><h4><FaBullhorn className="annonce-icon" /> {annonce.title || 'Sans titre'}</h4><p>{new Date(annonce.created_at).toLocaleString()}</p></div>
                                            <div>
                                                <button className="edit-button" onClick={(e) => { e.stopPropagation(); openModal(annonce); }}><FaEdit /> Modifier</button>
                                                <button className="delete-button" onClick={(e) => { e.stopPropagation(); setAnnonceToDelete(annonce.id); setShowConfirmModal(true); }}><FaTrash /> Supprimer</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                    {activeTab === 'sondages' && (
                        <section id="sondages" className="tab-content">
                            <div className="header"><h1><FaPoll /> Gérer mes Sondages</h1><p>Créer et consulter les résultats des sondages pour vos étudiants</p></div>
                            <div className="event-list">
                                <button className="button create-button" onClick={() => openSondageModal()}><FaPlus /> Créer un Sondage</button>
                                <div className="search-bar-container"><div className="search-bar"><FaSearch className="search-icon" /><input type="text" placeholder="Rechercher un sondage..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div>
                                <ul id="mes-sondages-list">
                                    {filteredTeacherSondages.length === 0 ? <li className="no-results">Aucun sondage disponible</li> : filteredTeacherSondages.map(sondage => (
                                        <li key={sondage.id} className="event-item">
                                            <div className="event-info"><h4><FaPoll className="annonce-icon" /> {sondage.title || 'Sans titre'}</h4><p>{new Date(sondage.created_at).toLocaleString()}</p></div>
                                            <div>
                                                <button className="edit-button" onClick={() => openSondageModal(sondage)}><FaEdit /> Modifier</button>
                                                <button className="delete-button" onClick={() => { setAnnonceToDelete(sondage.id); setShowConfirmModal(true); }}><FaTrash /> Supprimer</button>
                                                <button className="edit-button" onClick={() => openSondageResultsModal(sondage)}><FaPoll /> Voir les résultats</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}
                </main>

                {showModal && (
                    <div className="modal-overlay active">
                        <div className="modal-content">
                            <h3>{currentAnnonce ? 'Modifier une Annonce' : 'Créer une Annonce'}</h3>
                            {error && <p className="error-message">{error}</p>}
                            <form onSubmit={handleCreateOrUpdate}>
                                <div className="input-group"><label>Titre</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                                <div className="input-group"><label>Contenu</label><textarea value={content} onChange={(e) => setContent(e.target.value)} required /></div>
                                <div className="filter-section">
                                    <h4>Destinataires</h4>
                                    <div className="filter-options">
                                        <div className="filter-group">
                                            <label>Sections</label>
                                            <select multiple value={selectedSections} onChange={handleSectionChange}>
                                                {sections.length === 0 ? <option disabled>Aucune section disponible</option> : sections.map(section => (
                                                    <option key={section.ID_section} value={String(section.ID_section)}>{section.niveau} - {section.nom_specialite}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedSections.map(sectionId => {
                                            const section = sections.find(s => String(s.ID_section) === sectionId);
                                            if (!section?.groupes?.length) return null;
                                            const uniqueGroupes = [...new Map(section.groupes.map(g => [g.nom_groupe, g])).values()];
                                            return (
                                                <div key={sectionId} className="filter-group">
                                                    <label>Groupes pour {section.niveau} - {section.nom_specialite}</label>
                                                    <select multiple value={selectedGroups[sectionId] || []} onChange={(e) => handleGroupChange(sectionId, e)}>
                                                        <option value="">Tous les groupes</option>
                                                        {uniqueGroupes.map(groupe => (
                                                            <option key={groupe.ID_groupe} value={String(groupe.ID_groupe)}>{groupe.nom_groupe}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="button-group">
                                    <button type="submit"><FaPaperPlane /> Enregistrer</button>
                                    <button type="button" className="close-button" onClick={closeModal}><FaTimes /> Fermer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showSondageModal && (
                    <div className="modal-overlay active">
                        <div className="modal-content">
                            <h3>{currentSondage ? 'Modifier un Sondage' : 'Créer un Sondage'}</h3>
                            {error && <p className="error-message">{error}</p>}
                            <form onSubmit={handleCreateOrUpdateSondage}>
                                <div className="input-group"><label>Titre</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                                <div className="input-group"><label>Question</label><textarea value={question} onChange={(e) => setQuestion(e.target.value)} required /></div>
                                <div className="input-group">
                                    <label>Options</label>
                                    {options.map((option, index) => (
                                        <div key={index} className="option-group">
                                            <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} placeholder={`Option ${index + 1}`} required />
                                            {options.length > 2 && <button type="button" className="remove-option-button" onClick={() => removeOption(index)}><FaTrash /></button>}
                                        </div>
                                    ))}
                                    <button type="button" className="add-option-button" onClick={addOption}><FaPlus /> Ajouter une option</button>
                                </div>
                                <div className="filter-section">
                                    <h4>Destinataires</h4>
                                    <div className="filter-options">
                                        <div className="filter-group">
                                            <label>Sections</label>
                                            <select multiple value={selectedSections} onChange={handleSectionChange}>
                                                {sections.length === 0 ? <option disabled>Aucune section disponible</option> : sections.map(section => (
                                                    <option key={section.ID_section} value={String(section.ID_section)}>{section.niveau} - {section.nom_specialite}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedSections.map(sectionId => {
                                            const section = sections.find(s => String(s.ID_section) === sectionId);
                                            if (!section?.groupes?.length) return null;
                                            const uniqueGroupes = [...new Map(section.groupes.map(g => [g.nom_groupe, g])).values()];
                                            return (
                                                <div key={sectionId} className="filter-group">
                                                    <label>Groupes pour {section.niveau} - {section.nom_specialite}</label>
                                                    <select multiple value={selectedGroups[sectionId] || []} onChange={(e) => handleGroupChange(sectionId, e)}>
                                                        <option value="">Tous les groupes</option>
                                                        {uniqueGroupes.map(groupe => (
                                                            <option key={groupe.ID_groupe} value={String(groupe.ID_groupe)}>{groupe.nom_groupe}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="button-group">
                                    <button type="submit"><FaPaperPlane /> Enregistrer</button>
                                    <button type="button" className="close-button" onClick={closeModal}><FaTimes /> Fermer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDetailsModal && selectedAnnonce && (
                    <div className="modal-overlay active">
                        <div className="modal-content">
                            <h3>{selectedAnnonce.title || 'Sans titre'}</h3>
                            <div className="modal-body">
                                {activeTab === 'consulter' && selectedAnnonce.image_url ? (
                                    <img src={selectedAnnonce.image_url} alt={selectedAnnonce.title} className="event-image" onError={(e) => e.target.style.display = 'none'} />
                                ) : activeTab === 'consulter' && <div className="image-placeholder">Aucune image</div>}
                                <p><strong>Contenu :</strong> {selectedAnnonce.content || 'Aucun contenu'}</p>
                                <p><strong>Date de création :</strong> {new Date(selectedAnnonce.created_at).toLocaleString()}</p>
                                {activeTab === 'gerer' && <p><strong>Destinataires :</strong> {getSectionNames(...Object.values(parseTargetFilter(selectedAnnonce.target_filter)))}</p>}
                                {activeTab === 'gerer' && (
                                    <div className="comments-section">
                                        <h4><FaComment /> Commentaires</h4>
                                        {comments.length === 0 ? <p className="no-comments">Aucun commentaire pour le moment.</p> : (
                                            <div className="comments-list">
                                                {comments.map(comment => (
                                                    <div key={comment.ID_commentaire} className="comment-item">
                                                        <div className="comment-header">
                                                            <p>{comment.nom} {comment.prenom}</p>
                                                            <p>{new Date(comment.date_commentaire).toLocaleString()}</p>
                                                        </div>
                                                        <p>{comment.contenu}</p>
                                                        {comment.reponse_enseignant ? (
                                                            <div className="teacher-reply">
                                                                <p><FaUserTie /> Réponse de l'enseignant ({new Date(comment.date_reponse).toLocaleString()})</p>
                                                                <p>{comment.reponse_enseignant}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="reply-form">
                                                                <textarea
                                                                    placeholder="Votre réponse..."
                                                                    value={newReplies[comment.ID_commentaire] || ''}
                                                                    onChange={(e) => setNewReplies(prev => ({ ...prev, [comment.ID_commentaire]: e.target.value }))}
                                                                />
                                                                <button onClick={() => handleReplySubmit(comment.ID_commentaire)}><FaPaperPlane /> Répondre</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="button-group"><button className="close-button" onClick={closeModal}><FaTimes /> Fermer</button></div>
                        </div>
                    </div>
                )}

                {showSondageResultsModal && sondageResults && (
                    <div className="modal-overlay active">
                        <div className="modal-content">
                            <h3>Résultats du Sondage: {sondageResults.sondage.title}</h3>
                            <div className="modal-body">
                                <p><strong>Question :</strong> {sondageResults.sondage.question}</p>
                                <h4>Résultats :</h4>
                                <div className="sondage-results">
                                    {sondageResults.resultats.length === 0 ? <p className="no-votes">Aucun vote pour le moment.</p> : (
                                        <>
                                            {(() => {
                                                const totalVotes = sondageResults.resultats.reduce((sum, r) => sum + r.count, 0);
                                                const maxVotes = Math.max(...sondageResults.resultats.map(r => r.count));
                                                return sondageResults.resultats.map((result, index) => {
                                                    const percentage = totalVotes > 0 ? (result.count / totalVotes) * 100 : 0;
                                                    const isMostVoted = result.count === maxVotes && result.count > 0;
                                                    return (
                                                        <div key={index} className="result-item">
                                                            <div className="result-header">
                                                                <span className="result-option">{result.option}{isMostVoted && <FaStar className="most-voted-icon" title="Option la plus votée" />}</span>
                                                                <span className="result-stats">{result.count} vote(s) ({percentage.toFixed(1)}%)</span>
                                                            </div>
                                                            <div className="result-bar">
                                                                <div className={`result-bar-fill option-${index % 5}`} style={{ width: `${percentage}%` }}>
                                                                    <span className="result-bar-label">{percentage.toFixed(1)}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                            <p className="total-votes">Total des votes : {sondageResults.resultats.reduce((sum, r) => sum + r.count, 0)}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="button-group"><button className="close-button" onClick={closeModal}><FaTimes /> Fermer</button></div>
                        </div>
                    </div>
                )}

                {showConfirmModal && (
                    <div className="modal-overlay active">
                        <div className="modal-content">
                            <h3>Confirmer la Suppression</h3>
                            <div className="modal-body"><p>Êtes-vous sûr de vouloir supprimer {activeTab === 'sondages' ? 'ce sondage' : 'cette annonce'} ? Cette action est irréversible.</p></div>
                            <div className="button-group">
                                <button className="delete-button" onClick={handleDelete}><FaTrash /> Oui, Supprimer</button>
                                <button className="close-button" onClick={closeModal}><FaTimes /> Annuler</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnnonceENS;