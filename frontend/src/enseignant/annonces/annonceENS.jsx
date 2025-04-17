import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FaPlus, FaEdit, FaTrash, FaTimes, FaUser, FaPaperPlane, FaBullhorn, FaSearch, FaHome, FaPoll, FaStar, FaComment, FaUserTie, FaCalendarPlus } from 'react-icons/fa';
import styles from './annonceENS.module.css';


const AnnonceENS = ({ handleLogout }) => {

    // États pour gérer les onglets, annonces, sondages, filtres, modales, et commentaires
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
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [isEventAdded, setIsEventAdded] = useState(false);
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
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const matricule = storedUser?.Matricule;

    const API_URL = 'http://localhost:8082';

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setShowMessageModal(true);
    };

    const closeMessageModal = () => {
        setShowMessageModal(false);
        setMessage('');
        setMessageType('');
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const adminResponse = await fetch(`${API_URL}/annoncesENS/admin/${matricule}`);
                if (!adminResponse.ok) {
                    const errorData = await adminResponse.json();
                    throw new Error(errorData.error || 'Erreur lors du chargement des annonces admin');
                }
                const adminData = await adminResponse.json();
                setAdminAnnonces(Array.isArray(adminData) ? adminData : []);
                setFilteredAdminAnnonces(Array.isArray(adminData) ? adminData : []);

                const teacherResponse = await fetch(`${API_URL}/annoncesENS/teacher/${matricule}`);
                if (!teacherResponse.ok) {
                    const errorData = await teacherResponse.json();
                    throw new Error(errorData.error || 'Erreur lors du chargement des annonces enseignant');
                }
                const teacherData = await teacherResponse.json();
                setTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);
                setFilteredTeacherAnnonces(Array.isArray(teacherData) ? teacherData : []);

                const sondagesResponse = await fetch(`${API_URL}/sondages/teacher/${matricule}`);
                if (!sondagesResponse.ok) {
                    const errorData = await sondagesResponse.json();
                    throw new Error(errorData.error || 'Erreur lors du chargement des sondages');
                }
                const sondagesData = await sondagesResponse.json();
                setTeacherSondages(Array.isArray(sondagesData) ? sondagesData : []);
                setFilteredTeacherSondages(Array.isArray(sondagesData) ? sondagesData : []);

                const sectionsResponse = await fetch(`${API_URL}/annoncesENS/sections/${matricule}`);
                if (!sectionsResponse.ok) {
                    const errorData = await sectionsResponse.json();
                    throw new Error(errorData.error || 'Erreur lors du chargement des sections');
                }
                const sectionsData = await sectionsResponse.json();
                setSections(Array.isArray(sectionsData) ? sectionsData : []);
            } catch (err) {
                console.error('Erreur:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (matricule) {
            fetchData();
        } else {
            setError('Matricule non fourni');
            setLoading(false);
        }
    }, [matricule]);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredAdminAnnonces(adminAnnonces);
            setFilteredTeacherAnnonces(teacherAnnonces);
            setFilteredTeacherSondages(teacherSondages);
        } else {
            const filteredAdmin = adminAnnonces.filter(annonce =>
                (annonce.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (annonce.content || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            const filteredTeacher = teacherAnnonces.filter(annonce =>
                (annonce.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (annonce.content || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            const filteredSondages = teacherSondages.filter(sondage =>
                (sondage.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (sondage.question || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredAdminAnnonces(filteredAdmin);
            setFilteredTeacherAnnonces(filteredTeacher);
            setFilteredTeacherSondages(filteredSondages);
        }
    }, [searchTerm, adminAnnonces, teacherAnnonces, teacherSondages]);

    const parseTargetFilter = (targetFilter) => {
        try {
            if (typeof targetFilter === 'string' && targetFilter.trim() !== '') {
                const parsed = JSON.parse(targetFilter);
                return {
                    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
                    groupes: parsed.groupes && typeof parsed.groupes === 'object' ? parsed.groupes : {}
                };
            } else if (typeof targetFilter === 'object' && targetFilter !== null) {
                return {
                    sections: Array.isArray(targetFilter.sections) ? targetFilter.sections : [],
                    groupes: targetFilter.groupes && typeof targetFilter.groupes === 'object' ? targetFilter.groupes : {}
                };
            }
            return { sections: [], groupes: {} };
        } catch (error) {
            console.error('Erreur lors du parsing de target_filter:', error, 'Valeur:', targetFilter);
            return { sections: [], groupes: {} };
        }
    };

    const getSectionNames = (sectionIds, groupeData) => {
        if (!sectionIds || sectionIds.length === 0) {
            return 'Aucune section';
        }
        const sectionNames = sectionIds.map(id => {
            const section = sections.find(s => s.ID_section === parseInt(id));
            if (!section) {
                console.log(`Section non trouvée pour ID_section: ${id}`);
                return null;
            }

            const groupesForSection = groupeData[id] || [];
            const groupeNames = groupesForSection.length > 0 && groupesForSection[0] !== ''
                ? groupesForSection.map(groupeId => {
                    const groupe = section.groupes.find(g => g.ID_groupe === parseInt(groupeId));
                    if (!groupe) {
                        console.log(`Groupe non trouvé pour ID_groupe: ${groupeId} dans la section ${id}`);
                        return null;
                    }
                    return groupe.nom_groupe;
                }).filter(name => name !== null).join(', ')
                : 'Tous les groupes';

            return `${section.niveau} - ${section.nom_specialite} (${groupeNames})`;
        }).filter(name => name !== null);
        return sectionNames.length > 0 ? sectionNames.join('; ') : 'Aucune section';
    };

    const handleSectionChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selected = selectedOptions.map(opt => opt.value);
        setSelectedSections(selected);
        const newSelectedGroups = {};
        selected.forEach(sectionId => {
            if (selectedGroups[sectionId]) {
                newSelectedGroups[sectionId] = selectedGroups[sectionId];
            }
        });
        setSelectedGroups(newSelectedGroups);
    };

    const handleGroupChange = (sectionId, e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selected = selectedOptions.map(opt => opt.value);
        setSelectedGroups(prev => ({
            ...prev,
            [sectionId]: selected
        }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, '']);
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Le titre est requis');
            return;
        }
        if (!content.trim()) {
            setError('Le contenu est requis');
            return;
        }
        if (selectedSections.length === 0) {
            setError('Vous devez sélectionner au moins une section');
            return;
        }

        const data = {
            title,
            content,
            target_filter: {
                sections: selectedSections,
                groupes: selectedGroups
            },
            matricule
        };
        if (currentAnnonce) {
            data.id = currentAnnonce.id;
        }

        const url = currentAnnonce
            ? `${API_URL}/annoncesENS/${currentAnnonce.id}`
            : `${API_URL}/annoncesENS`;
        const method = currentAnnonce ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création/modification de l\'annonce');
            }

            const res = await fetch(`${API_URL}/annoncesENS/teacher/${matricule}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erreur lors du rafraîchissement des annonces');
            }
            const updatedData = await res.json();
            setTeacherAnnonces(Array.isArray(updatedData) ? updatedData : []);
            setFilteredTeacherAnnonces(Array.isArray(updatedData) ? updatedData : []);
            setShowModal(false);
            setTitle('');
            setContent('');
            setSelectedSections([]);
            setSelectedGroups({});
            setCurrentAnnonce(null);
            showMessage('Annonce enregistrée avec succès !', 'success');
        } catch (err) {
            console.error('Erreur dans handleCreateOrUpdate:', err);
            setError(err.message);
        }
    };

    const handleCreateOrUpdateSondage = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            setError('Le titre est requis');
            return;
        }
        if (!question.trim()) {
            setError('La question est requise');
            return;
        }
        if (options.some(opt => !opt.trim())) {
            setError('Toutes les options doivent être remplies');
            return;
        }
        if (options.length < 2) {
            setError('Il doit y avoir au moins 2 options');
            return;
        }
        if (selectedSections.length === 0) {
            setError('Vous devez sélectionner au moins une section');
            return;
        }

        const data = {
            title,
            question,
            options,
            target_filter: {
                sections: selectedSections,
                groupes: selectedGroups
            },
            matricule
        };
        if (currentSondage) {
            data.id = currentSondage.id;
        }

        const url = currentSondage
            ? `${API_URL}/sondages/${currentSondage.id}`
            : `${API_URL}/sondages`;
        const method = currentSondage ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la création/modification du sondage');
            }

            const res = await fetch(`${API_URL}/sondages/teacher/${matricule}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erreur lors du rafraîchissement des sondages');
            }
            const updatedData = await res.json();
            setTeacherSondages(Array.isArray(updatedData) ? updatedData : []);
            setFilteredTeacherSondages(Array.isArray(updatedData) ? updatedData : []);
            setShowSondageModal(false);
            setTitle('');
            setQuestion('');
            setOptions(['', '']);
            setSelectedSections([]);
            setSelectedGroups({});
            setCurrentSondage(null);
            showMessage('Sondage enregistré avec succès !', 'success');
        } catch (err) {
            console.error('Erreur dans handleCreateOrUpdateSondage:', err);
            setError(err.message);
        }
    };

    const confirmDelete = (id) => {
        setAnnonceToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDeleteSondage = (id) => {
        setAnnonceToDelete(id);
        setShowConfirmModal(true);
    };

    const handleDelete = async () => {
        const id = annonceToDelete;
        try {
            const isSondage = activeTab === 'sondages';
            const url = isSondage
                ? `${API_URL}/sondages/${id}`
                : `${API_URL}/annoncesENS/${id}`;
            const refreshUrl = isSondage
                ? `${API_URL}/sondages/teacher/${matricule}`
                : `${API_URL}/annoncesENS/teacher/${matricule}`;
            const setDataFunction = isSondage ? setTeacherSondages : setTeacherAnnonces;
            const setFilteredDataFunction = isSondage ? setFilteredTeacherSondages : setFilteredTeacherAnnonces;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matricule })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur lors de la suppression de ${isSondage ? 'du sondage' : 'l\'annonce'}`);
            }

            const res = await fetch(refreshUrl);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Erreur lors du rafraîchissement des ${isSondage ? 'sondages' : 'annonces'}`);
            }
            const updatedData = await res.json();
            setDataFunction(Array.isArray(updatedData) ? updatedData : []);
            setFilteredDataFunction(Array.isArray(updatedData) ? updatedData : []);

            setShowConfirmModal(false);
            setAnnonceToDelete(null);
            showMessage(`${isSondage ? 'Sondage' : 'Annonce'} supprimé(e) avec succès !`, 'success');
        } catch (err) {
            console.error('Erreur dans handleDelete:', err);
            setError(err.message);
            setShowConfirmModal(false);
            setAnnonceToDelete(null);
        }
    };

    const openModal = (annonce = null) => {
        setCurrentAnnonce(annonce);
        if (annonce) {
            setTitle(annonce.title || '');
            setContent(annonce.content || '');
            const { sections, groupes } = parseTargetFilter(annonce.target_filter);
            setSelectedSections(sections);
            setSelectedGroups(groupes);
        } else {
            setTitle('');
            setContent('');
            setSelectedSections([]);
            setSelectedGroups({});
        }
        setShowModal(true);
    };

    const openSondageModal = (sondage = null) => {
        setCurrentSondage(sondage);
        try {
            if (sondage) {
                setTitle(sondage.title || '');
                setQuestion(sondage.question || '');
                let parsedOptions = ['', ''];
                if (typeof sondage.options === 'string') {
                    parsedOptions = JSON.parse(sondage.options);
                } else if (Array.isArray(sondage.options)) {
                    parsedOptions = sondage.options;
                }
                setOptions(parsedOptions.length >= 2 ? parsedOptions : ['', '']);
                const { sections, groupes } = parseTargetFilter(sondage.target_filter);
                setSelectedSections(sections);
                setSelectedGroups(groupes);
            } else {
                setTitle('');
                setQuestion('');
                setOptions(['', '']);
                setSelectedSections([]);
                setSelectedGroups({});
            }
            setShowSondageModal(true);
        } catch (error) {
            console.error('Erreur lors de l\'ouverture de la modale de modification:', error);
            setError('Erreur lors du chargement des données du sondage');
            setShowSondageModal(true);
        }
    };

    const openDetailsModal = async (annonce) => {
        setSelectedAnnonce(annonce);
        setShowDetailsModal(true);

        if (!annonce.id) {
            showMessage('ID de l\'annonce manquant.', 'error');
            return;
        }

        if (activeTab === 'consulter') {
            try {
                const response = await fetch(`${API_URL}/annoncesENS/calendar/check/${annonce.id}/${matricule}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erreur lors de la vérification de l\'événement.');
                }
                const { isAdded } = await response.json();
                setIsEventAdded(isAdded);
            } catch (err) {
                showMessage(err.message, 'error');
            }
        }

        if (activeTab === 'gerer') {
            try {
                const response = await fetch(`${API_URL}/annoncesENS/comments/${annonce.id}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Erreur lors de la récupération des commentaires.');
                }
                const commentsData = await response.json();
                setComments(commentsData);
            } catch (err) {
                console.error('Erreur lors de la récupération des commentaires:', err);
                setError(err.message);
            }
        }
    };

    const openSondageDetailsModal = (sondage) => {
        setSelectedSondage(sondage);
        setShowDetailsModal(true);
    };

    const openSondageResultsModal = async (sondage) => {
        try {
            const response = await fetch(`${API_URL}/sondages/${sondage.id}/results`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la récupération des résultats');
            }
            const data = await response.json();
            setSondageResults(data);
            setShowSondageResultsModal(true);
        } catch (err) {
            console.error('Erreur lors de la récupération des résultats:', err);
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
        setError('');
        setIsEventAdded(false);
    };

    const handleReplySubmit = async (commentaireId) => {
        const reply = newReplies[commentaireId];
        if (!reply || !reply.trim()) {
            showMessage('Veuillez écrire une réponse avant de soumettre.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/annoncesENS/comment/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commentaireId,
                    enseignantMatricule: matricule,
                    reponse: reply,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'envoi de votre réponse.');
            }

            const commentsResponse = await fetch(`${API_URL}/annoncesENS/comments/${selectedAnnonce.id}`);
            if (!commentsResponse.ok) {
                const errorData = await commentsResponse.json();
                throw new Error(errorData.error || 'Erreur lors du rafraîchissement des commentaires.');
            }
            const updatedComments = await commentsResponse.json();
            setComments(updatedComments);

            setNewReplies(prev => ({ ...prev, [commentaireId]: '' }));
            showMessage('Réponse envoyée avec succès !', 'success');
        } catch (err) {
            console.error('Erreur lors de l\'envoi de la réponse:', err);
            showMessage(err.message, 'error');
        }
    };

    const openCalendarModal = () => {
        setShowCalendarModal(true);
    };

    const closeCalendarModal = () => {
        setShowCalendarModal(false);
        setSelectedDate('');
        setSelectedTimeSlot('');
    };

    const handleAddToCalendar = async () => {
        if (!selectedDate || !selectedTimeSlot) {
            showMessage('Veuillez sélectionner une date et un créneau horaire.', 'error');
            return;
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const chosenDate = new Date(selectedDate);
        chosenDate.setHours(0, 0, 0, 0);

        if (chosenDate < currentDate) {
            showMessage('La date choisie doit être supérieure ou égale à la date courante.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/annoncesENS/calendar/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    annonceId: selectedAnnonce.id,
                    matricule,
                    time_slot: selectedTimeSlot,
                    event_date: selectedDate,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de l\'ajout au calendrier.');
            }

            const responseData = await response.json();
            showMessage(responseData.message, 'success');
            setIsEventAdded(true);
            closeCalendarModal();
        } catch (err) {
            showMessage(err.message, 'error');
        }
    };

    if (loading) {
        return <div className={styles['ENS-ANC-container']}>Chargement...</div>;
    }
    
    if (error && !showModal && !showSondageModal) {
        return (
            <div className={styles['ENS-ANC-container']}>
                <p className={styles['ENS-ANC-error-message']}>{error}</p>
                <button onClick={() => window.location.reload()}>Réessayer</button>
            </div>
        );
    }
    
    return (
        <div className={styles['ENS-ANC-container']}>
            <div className={styles['ENS-ANC-background-shapes']}>
                <div className={`${styles['ENS-ANC-shape']} ${styles['ENS-ANC-shape1']}`}></div>
                <div className={`${styles['ENS-ANC-shape']} ${styles['ENS-ANC-shape2']}`}></div>
            </div>
    
            <aside className={styles['ENS-ANC-sidebar']}>
                <div className={styles['ENS-ANC-logo']}>
                    <h2>Annonces</h2>
                </div>
                <button className={styles['ENS-ANC-sidebar-button']} onClick={() => navigate("/enseignant")}>
                    <FaHome className={styles['ENS-ANC-sidebar-icon']} /> Retour à l'accueil
                </button>
                <button className={styles['ENS-ANC-sidebar-button']} onClick={() => setActiveTab('consulter')}>
                    <FaBullhorn className={styles['ENS-ANC-sidebar-icon']} /> Consulter les Annonces
                </button>
                <button className={styles['ENS-ANC-sidebar-button']} onClick={() => setActiveTab('gerer')}>
                    <FaPaperPlane className={styles['ENS-ANC-sidebar-icon']} /> Gérer mes Annonces
                </button>
                <button className={styles['ENS-ANC-sidebar-button']} onClick={() => setActiveTab('sondages')}>
                    <FaPoll className={styles['ENS-ANC-sidebar-icon']} /> Gérer mes Sondages
                </button>
            </aside>
    
            <main className={styles['ENS-ANC-main-content']}>
                {activeTab === 'consulter' && (
                    <section id="consulter" className={styles['ENS-ANC-tab-content']}>
                        <div className={styles['ENS-ANC-header']}>
                            <h1><FaUser className={styles['ENS-ANC-sidebar-icon']} /> Annonces Reçues</h1>
                            <p>Consultez les annonces destinées à vous de la part de l'administration</p>
                        </div>
                        <div className={styles['ENS-ANC-search-bar-container']}>
                            <div className={styles['ENS-ANC-search-bar']}>
                                <span className={styles['ENS-ANC-search-icon']}><FaSearch /></span>
                                <input
                                    type="text"
                                    placeholder="Rechercher une annonce..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles['ENS-ANC-event-list']}>
                            <ul id="ENS-ANC-annonces-list">
                                {filteredAdminAnnonces.length === 0 ? (
                                    <li className={styles['ENS-ANC-no-results']}>Aucune annonce disponible</li>
                                ) : (
                                    filteredAdminAnnonces.map(annonce => (
                                        <li key={annonce.id} className={styles['ENS-ANC-event-item']} onClick={() => openDetailsModal(annonce)}>
                                            <div className={styles['ENS-ANC-event-info']}>
                                                <h4>
                                                    <FaBullhorn className={styles['ENS-ANC-annonce-icon']} />
                                                    {annonce.title || 'Sans titre'}
                                                </h4>
                                                <p>{new Date(annonce.created_at).toLocaleString()}</p>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </section>
                )}
    
                {activeTab === 'gerer' && (
                    <section id="gerer" className={styles['ENS-ANC-tab-content']}>
                        <div className={styles['ENS-ANC-header']}>
                            <h1><FaUser className={styles['ENS-ANC-sidebar-icon']} /> Gérer mes Annonces</h1>
                            <p>Créer, modifier ou supprimer des annonces pour vos étudiants</p>
                        </div>
                        <div className={styles['ENS-ANC-event-list']}>
                            <button className={`${styles['ENS-ANC-button']} ${styles['ENS-ANC-create-button']}`} onClick={() => openModal()}>
                                <FaPlus /> Créer une Annonce
                            </button>
                            <div className={styles['ENS-ANC-search-bar-container']}>
                                <div className={styles['ENS-ANC-search-bar']}>
                                    <span className={styles['ENS-ANC-search-icon']}><FaSearch /></span>
                                    <input
                                        type="text"
                                        placeholder="Rechercher une annonce..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <ul id="ENS-ANC-mes-annonces-list">
                                {filteredTeacherAnnonces.length === 0 ? (
                                    <li className={styles['ENS-ANC-no-results']}>Aucune annonce disponible</li>
                                ) : (
                                    filteredTeacherAnnonces.map(annonce => (
                                        <li
                                            key={annonce.id}
                                            className={styles['ENS-ANC-event-item']}
                                            onClick={(e) => {
                                                if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                                                    openDetailsModal(annonce);
                                                }
                                            }}
                                        >
                                            <div className={styles['ENS-ANC-event-info']}>
                                                <h4>
                                                    <FaBullhorn className={styles['ENS-ANC-annonce-icon']} />
                                                    {annonce.title || 'Sans titre'}
                                                </h4>
                                                <p>{new Date(annonce.created_at).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <button
                                                    className={styles['ENS-ANC-edit-button']}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openModal(annonce);
                                                    }}
                                                >
                                                    <FaEdit /> Modifier
                                                </button>
                                                <button
                                                    className={styles['ENS-ANC-delete-button']}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmDelete(annonce.id);
                                                    }}
                                                >
                                                    <FaTrash /> Supprimer
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </section>
                )}
    
                {activeTab === 'sondages' && (
                    <section id="sondages" className={styles['ENS-ANC-tab-content']}>
                        <div className={styles['ENS-ANC-header']}>
                            <h1><FaPoll className={styles['ENS-ANC-sidebar-icon']} /> Gérer mes Sondages</h1>
                            <p>Créer et consulter les résultats des sondages pour vos étudiants</p>
                        </div>
                        <div className={styles['ENS-ANC-event-list']}>
                            <button className={`${styles['ENS-ANC-button']} ${styles['ENS-ANC-create-button']}`} onClick={() => openSondageModal()}>
                                <FaPlus /> Créer un Sondage
                            </button>
                            <div className={styles['ENS-ANC-search-bar-container']}>
                                <div className={styles['ENS-ANC-search-bar']}>
                                    <span className={styles['ENS-ANC-search-icon']}><FaSearch /></span>
                                    <input
                                        type="text"
                                        placeholder="Rechercher un sondage..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <ul id="ENS-ANC-mes-sondages-list">
                                {filteredTeacherSondages.length === 0 ? (
                                    <li className={styles['ENS-ANC-no-results']}>Aucun sondage disponible</li>
                                ) : (
                                    filteredTeacherSondages.map(sondage => (
                                        <li
                                            key={sondage.id}
                                            className={styles['ENS-ANC-event-item']}
                                        >
                                            <div className={styles['ENS-ANC-event-info']}>
                                                <h4>
                                                    <FaPoll className={styles['ENS-ANC-annonce-icon']} />
                                                    {sondage.title || 'Sans titre'}
                                                </h4>
                                                <p>{new Date(sondage.created_at).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <button
                                                    className={styles['ENS-ANC-edit-button']}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openSondageModal(sondage);
                                                    }}
                                                >
                                                    <FaEdit /> Modifier
                                                </button>
                                                <button
                                                    className={styles['ENS-ANC-delete-button']}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmDeleteSondage(sondage.id);
                                                    }}
                                                >
                                                    <FaTrash /> Supprimer
                                                </button>
                                                <button
                                                    className={styles['ENS-ANC-edit-button']}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openSondageResultsModal(sondage);
                                                    }}
                                                >
                                                    <FaPoll /> Voir les résultats
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </section>
                )}
            </main>
    
            {showModal && (
                <div className={`${styles['ENS-ANC-modal-overlay']} ${styles['active']}`}>
                    <div className={styles['ENS-ANC-modal-content']}>
                        <h3>{currentAnnonce ? 'Modifier une Annonce' : 'Créer une Annonce'}</h3>
                        {error && <p className={styles['ENS-ANC-error-message']}>{error}</p>}
                        <form onSubmit={handleCreateOrUpdate}>
                            <div className={styles['ENS-ANC-input-group']}>
                                <label>Titre</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className={styles['ENS-ANC-input']}
                                />
                            </div>
                            <div className={styles['ENS-ANC-input-group']}>
                                <label>Contenu</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    className={styles['ENS-ANC-textarea']}
                                />
                            </div>
                            <div className={styles['ENS-ANC-filter-section']}>
                                <h4>Destinataires</h4>
                                <div className={styles['ENS-ANC-filter-options']}>
                                    <div className={styles['ENS-ANC-filter-group']}>
                                        <label>Sections</label>
                                        <select
                                            multiple
                                            value={selectedSections}
                                            onChange={handleSectionChange}
                                            className={styles['ENS-ANC-select']}
                                        >
                                            {sections.length === 0 ? (
                                                <option disabled>Aucune section disponible</option>
                                            ) : (
                                                sections.map(section => (
                                                    <option key={section.ID_section} value={String(section.ID_section)}>
                                                        {section.niveau} - {section.nom_specialite}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    {selectedSections.map(sectionId => {
                                        const section = sections.find(s => s.ID_section === parseInt(sectionId));
                                        if (!section || !section.groupes || section.groupes.length === 0) return null;
    
                                        const uniqueGroupes = [];
                                        const seenNames = new Set();
                                        section.groupes.forEach(groupe => {
                                            if (!seenNames.has(groupe.nom_groupe)) {
                                                seenNames.add(groupe.nom_groupe);
                                                uniqueGroupes.push(groupe);
                                            }
                                        });
    
                                        return (
                                            <div key={sectionId} className={styles['ENS-ANC-filter-group']}>
                                                <label>Groupes pour {section.niveau} - {section.nom_specialite}</label>
                                                <select
                                                    multiple
                                                    value={selectedGroups[sectionId] || []}
                                                    onChange={(e) => handleGroupChange(sectionId, e)}
                                                    className={styles['ENS-ANC-select']}
                                                >
                                                    <option value="">Tous les groupes</option>
                                                    {uniqueGroupes.map(groupe => (
                                                        <option key={groupe.ID_groupe} value={String(groupe.ID_groupe)}>
                                                            {groupe.nom_groupe}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className={styles['ENS-ANC-button-group']}>
                                <button type="submit" className={styles['ENS-ANC-button']}><FaPaperPlane /> Enregistrer</button>
                                <button type="button" className={styles['ENS-ANC-close-button']} onClick={closeModal}>
                                    <FaTimes /> Fermer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
    
            {showSondageModal && (
                <div className={`${styles['ENS-ANC-modal-overlay']} ${styles['active']}`}>
                    <div className={styles['ENS-ANC-modal-content']}>
                        <h3>{currentSondage ? 'Modifier un Sondage' : 'Créer un Sondage'}</h3>
                        {error && <p className={styles['ENS-ANC-error-message']}>{error}</p>}
                        <form onSubmit={handleCreateOrUpdateSondage}>
                            <div className={styles['ENS-ANC-input-group']}>
                                <label>Titre</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className={styles['ENS-ANC-input']}
                                />
                            </div>
                            <div className={styles['ENS-ANC-input-group']}>
                                <label>Question</label>
                                <textarea
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    required
                                    className={styles['ENS-ANC-textarea']}
                                />
                            </div>
                            <div className={styles['ENS-ANC-input-group']}>
                                <label>Options</label>
                                {options.map((option, index) => (
                                    <div key={index} className={styles['ENS-ANC-option-group']}>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            required
                                            className={styles['ENS-ANC-input']}
                                        />
                                        {options.length > 2 && (
                                            <button
                                                type="button"
                                                className={styles['ENS-ANC-remove-option-button']}
                                                onClick={() => removeOption(index)}
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className={styles['ENS-ANC-add-option-button']} onClick={addOption}>
                                    <FaPlus /> Ajouter une option
                                </button>
                            </div>
                            <div className={styles['ENS-ANC-filter-section']}>
                                <h4>Destinataires</h4>
                                <div className={styles['ENS-ANC-filter-options']}>
                                    <div className={styles['ENS-ANC-filter-group']}>
                                        <label>Sections</label>
                                        <select
                                            multiple
                                            value={selectedSections}
                                            onChange={handleSectionChange}
                                            className={styles['ENS-ANC-select']}
                                        >
                                            {sections.length === 0 ? (
                                                <option disabled>Aucune section disponible</option>
                                            ) : (
                                                sections.map(section => (
                                                    <option key={section.ID_section} value={String(section.ID_section)}>
                                                        {section.niveau} - {section.nom_specialite}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    {selectedSections.map(sectionId => {
                                        const section = sections.find(s => s.ID_section === parseInt(sectionId));
                                        if (!section || !section.groupes || section.groupes.length === 0) return null;
    
                                        const uniqueGroupes = [];
                                        const seenNames = new Set();
                                        section.groupes.forEach(groupe => {
                                            if (!seenNames.has(groupe.nom_groupe)) {
                                                seenNames.add(groupe.nom_groupe);
                                                uniqueGroupes.push(groupe);
                                            }
                                        });
    
                                        return (
                                            <div key={sectionId} className={styles['ENS-ANC-filter-group']}>
                                                <label>Groupes pour {section.niveau} - {section.nom_specialite}</label>
                                                <select
                                                    multiple
                                                    value={selectedGroups[sectionId] || []}
                                                    onChange={(e) => handleGroupChange(sectionId, e)}
                                                    className={styles['ENS-ANC-select']}
                                                >
                                                    <option value="">Tous les groupes</option>
                                                    {uniqueGroupes.map(groupe => (
                                                        <option key={groupe.ID_groupe} value={String(groupe.ID_groupe)}>
                                                            {groupe.nom_groupe}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className={styles['ENS-ANC-button-group']}>
                                <button type="submit" className={styles['ENS-ANC-button']}><FaPaperPlane /> Enregistrer</button>
                                <button type="button" className={styles['ENS-ANC-close-button']} onClick={closeModal}>
                                    <FaTimes /> Fermer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
    
            {showDetailsModal && selectedAnnonce && (
                <div className={`${styles['ENS-ANC-modal-overlay']} ${styles['active']}`}>
                    <div className={styles['ENS-ANC-modal-content']}>
                        <h3>{selectedAnnonce.title || 'Sans titre'}</h3>
                        {error && <p className={styles['ENS-ANC-error-message']}>{error}</p>}
                        <div className={styles['ENS-ANC-modal-body']}>
                            {activeTab === 'consulter' && selectedAnnonce.image_url ? (
                                <img
                                    src={selectedAnnonce.image_url}
                                    alt={selectedAnnonce.title}
                                    className={styles['ENS-ANC-event-image']}
                                    onError={(e) => {
                                        e.target.src = '';
                                        console.error('Erreur chargement image :', e.target.src);
                                    }}
                                />
                            ) : activeTab === 'consulter' ? (
                                <div className={styles['ENS-ANC-image-placeholder']}>Aucune image</div>
                            ) : null}
                            <div className={styles['ENS-ANC-description']}>
                                <p><strong>Contenu :</strong> {selectedAnnonce.content || 'Aucun contenu'}</p>
                            </div>
                            <p><strong>Date de création :</strong> {new Date(selectedAnnonce.created_at).toLocaleString()}</p>
                            {activeTab === 'gerer' && (
                                <p>
                                    <strong>Destinataires :</strong>{' '}
                                    {(() => {
                                        const { sections, groupes } = parseTargetFilter(selectedAnnonce.target_filter);
                                        return getSectionNames(sections, groupes);
                                    })()}
                                </p>
                            )}
    
                            {activeTab === 'gerer' && (
                                <div className={styles['ENS-ANC-comments-section']} style={{ marginTop: '20px' }}>
                                    <h4 style={{
                                        marginBottom: '15px',
                                        color: '#052659',
                                        fontSize: '1.3rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderBottom: '2px solid #e6f0ff',
                                        paddingBottom: '5px'
                                    }}>
                                        <FaComment style={{ marginRight: '8px', color: '#5483b3' }} /> Commentaires
                                    </h4>
    
                                    {comments.length === 0 ? (
                                        <p style={{
                                            color: '#5483b3',
                                            fontStyle: 'italic',
                                            backgroundColor: '#f0f7ff',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}>
                                            Aucun commentaire pour le moment.
                                        </p>
                                    ) : (
                                        <div className={styles['ENS-ANC-comments-list']} style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                                            {comments.map(comment => (
                                                <div key={comment.ID_commentaire} className={styles['ENS-ANC-comment-item']} style={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '10px',
                                                    padding: '15px',
                                                    marginBottom: '15px',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                                    borderLeft: '4px solid #5483b3',
                                                    transition: 'transform 0.2s ease',
                                                    position: 'relative'
                                                }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '8px'
                                                    }}>
                                                        <p style={{
                                                            margin: 0,
                                                            fontWeight: 'bold',
                                                            color: '#052659',
                                                            fontSize: '1rem'
                                                        }}>
                                                            {comment.nom} {comment.prenom}
                                                        </p>
                                                        <p style={{
                                                            margin: 0,
                                                            color: '#5483b3',
                                                            fontSize: '0.85rem',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            ({new Date(comment.date_commentaire).toLocaleString()})
                                                        </p>
                                                    </div>
                                                    <p style={{
                                                        margin: '0 0 10px 0',
                                                        color: '#333',
                                                        fontSize: '0.95rem',
                                                        lineHeight: '1.5'
                                                    }}>
                                                        {comment.contenu}
                                                    </p>
                                                    {comment.reponse_enseignant ? (
                                                        <div className={styles['ENS-ANC-teacher-reply']} style={{
                                                            backgroundColor: '#f0f7ff',
                                                            borderRadius: '8px',
                                                            padding: '10px',
                                                            marginTop: '10px',
                                                            borderLeft: '3px solid #052659'
                                                        }}>
                                                            <p style={{
                                                                margin: '0 0 5px 0',
                                                                fontWeight: 'bold',
                                                                color: '#052659',
                                                                fontSize: '0.9rem',
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}>
                                                                <FaUserTie style={{ marginRight: '6px', color: '#5483b3' }} />
                                                                Réponse de l'enseignant
                                                                <span style={{
                                                                    marginLeft: '10px',
                                                                    color: '#5483b3',
                                                                    fontSize: '0.85rem',
                                                                    fontStyle: 'italic',
                                                                    fontWeight: 'normal'
                                                                }}>
                                                                    ({new Date(comment.date_reponse).toLocaleString()})
                                                                </span>
                                                            </p>
                                                            <p style={{
                                                                margin: 0,
                                                                color: '#052659',
                                                                fontSize: '0.9rem',
                                                                fontStyle: 'italic',
                                                                lineHeight: '1.4'
                                                            }}>
                                                                {comment.reponse_enseignant}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className={styles['ENS-ANC-reply-form']} style={{
                                                            marginTop: '10px',
                                                            backgroundColor: '#f9f9f9',
                                                            padding: '10px',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
                                                        }}>
                                                            <textarea
                                                                placeholder="Votre réponse..."
                                                                value={newReplies[comment.ID_commentaire] || ''}
                                                                onChange={(e) =>
                                                                    setNewReplies(prev => ({
                                                                        ...prev,
                                                                        [comment.ID_commentaire]: e.target.value
                                                                    }))
                                                                }
                                                                style={{
                                                                    width: '100%',
                                                                    minHeight: '60px',
                                                                    padding: '8px',
                                                                    borderRadius: '5px',
                                                                    border: '1px solid #ddd',
                                                                    fontSize: '0.9rem',
                                                                    resize: 'vertical',
                                                                    marginBottom: '8px',
                                                                    outline: 'none',
                                                                    transition: 'border-color 0.2s ease',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                                onFocus={(e) => e.target.style.borderColor = '#5483b3'}
                                                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                                            />
                                                            <button
                                                                onClick={() => handleReplySubmit(comment.ID_commentaire)}
                                                                style={{
                                                                    backgroundColor: '#052659',
                                                                    color: '#fff',
                                                                    padding: '8px 15px',
                                                                    borderRadius: '5px',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.9rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    transition: 'background-color 0.2s ease'
                                                                }}
                                                                onMouseOver={(e) => e.target.style.backgroundColor = '#5483b3'}
                                                                onMouseOut={(e) => e.target.style.backgroundColor = '#052659'}
                                                            >
                                                                <FaPaperPlane style={{ marginRight: '5px' }} /> Répondre
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles['ENS-ANC-button-group']}>
                            {activeTab === 'consulter' && !isEventAdded && (
                                <button onClick={openCalendarModal} className={styles['ENS-ANC-button']}>
                                    <FaCalendarPlus /> Ajouter au calendrier
                                </button>
                            )}
                            <button className={styles['ENS-ANC-close-button']} onClick={closeModal}>
                                <FaTimes /> Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
    
            {showCalendarModal && (
                <div className={`${styles['ENS-ANC-modal-overlay']} ${styles['ENS-ANC-calendar-modal']}`}>
                    <div className={styles['ENS-ANC-modal-content']}>
                        <h3>Ajouter au calendrier</h3>
                        <div className={styles['ENS-ANC-modal-body']}>
                            <p><strong>Événement :</strong> {selectedAnnonce.title}</p>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Sélectionner une date :</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '1px solid #ccc',
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Sélectionner un créneau horaire :</label>
                                <select
                                    value={selectedTimeSlot}
                                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '1px solid #ccc',
                                    }}
                                >
                                    <option value="">Choisir un créneau</option>
                                    {[
                                        '08:00 - 09:30',
                                        '09:40 - 11:10',
                                        '11:20 - 12:50',
                                        '13:00 - 14:30',
                                        '14:40 - 16:10',
                                        '16:20 - 17:50',
                                    ].map((slot) => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles['ENS-ANC-button-group']}>
                            <button
                                onClick={handleAddToCalendar}
                                className={styles['ENS-ANC-button']}
                            >
                                Valider
                            </button>
                            <button
                                className={styles['ENS-ANC-close-button']}
                                onClick={closeCalendarModal}
                            >
                                <FaTimes /> Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
    
            {showDetailsModal && selectedSondage && (
                <div className={`${styles['ENS-ANC-modal-overlay']} ${styles['active']}`}>
                    <div className={styles['ENS-ANC-modal-content']}>
                        <h3>{selectedSondage.title || 'Sans titre'}</h3>
                        <div className={styles['ENS-ANC-modal-body']}>
                            <p><strong>Question :</strong> {selectedSondage.question || 'Aucune question'}</p>
                            <p><strong>Options :</strong> {JSON.parse(selectedSondage.options).join(', ')}</p>
                            <p><strong>Date de création :</strong> {new Date(selectedSondage.created_at).toLocaleString()}</p>
                            <p>
                                <strong>Destinataires :</strong>{' '}
                                {(() => {
                                    const { sections, groupes } = parseTargetFilter(selectedSondage.target_filter);
                                    return getSectionNames(sections, groupes);
                                })()}
                            </p>
                        </div>
                        <div className={styles['ENS-ANC-button-group']}>
                            <button className={styles['ENS-ANC-close-button']} onClick={closeModal}>
                                <FaTimes /> Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
    
            {showSondageResultsModal && sondageResults && (
                <div className={`${styles['ENS-ANC-modal-overlay']} ${styles['active']}`}>
                    <div className={styles['ENS-ANC-modal-content']}>
                        <h3>Résultats du Sondage: {sondageResults.sondage.title}</h3>
                        <div className={styles['ENS-ANC-modal-body']}>
                            <p><strong>Question :</strong> {sondageResults.sondage.question}</p>
                            <h4>Résultats :</h4>
                            <div className={styles['ENS-ANC-sondage-results']}>
                                {sondageResults.resultats.length === 0 ? (
                                    <p className={styles['ENS-ANC-no-votes']}>Aucun vote pour le moment.</p>
                                ) : (
                                    <>
                                        {(() => {
                                            const totalVotes = sondageResults.resultats.reduce((sum, r) => sum + r.count, 0);
                                            const maxVotes = Math.max(...sondageResults.resultats.map(r => r.count));
                                            return sondageResults.resultats.map((result, index) => {
                                                const percentage = totalVotes > 0 ? (result.count / totalVotes) * 100 : 0;
                                                const isMostVoted = result.count === maxVotes && result.count > 0;
                                                return (
                                                    <div key={index} className={styles['ENS-ANC-result-item']}>
                                                        <div className={styles['ENS-ANC-result-header']}>
                                                            <span className={styles['ENS-ANC-result-option']}>
                                                                {result.option}
                                                                {isMostVoted && (
                                                                    <span className={styles['ENS-ANC-most-voted-icon']} title="Option la plus votée">
                                                                        <FaStar />
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className={styles['ENS-ANC-result-stats']}>
                                                                {result.count} vote(s) ({percentage.toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                        <div className={styles['ENS-ANC-result-bar']}>
                                                            <div
                                                                className={`${styles['ENS-ANC-result-bar-fill']} ${styles[`ENS-ANC-option-${index % 5}`]}`}
                                                                style={{ width: `${percentage}%` }}
                                                            >
                                                                <span className={styles['ENS-ANC-result-bar-label']}>
                                                                    {percentage.toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                        <p className={styles['ENS-ANC-total-votes']}>
                                            Total des votes : {sondageResults.resultats.reduce((sum, r) => sum + r.count, 0)}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className={styles['ENS-ANC-button-group']}>
                            <button className={styles['ENS-ANC-close-button']} onClick={closeModal}>
                                <FaTimes /> Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
    
            {showConfirmModal && (
                <div className={`${styles['ENS-ANC-modal-overlay']} ${styles['active']}`}>
                    <div className={styles['ENS-ANC-modal-content']}>
                        <h3>Confirmer la Suppression</h3>
                        <div className={styles['ENS-ANC-modal-body']}>
                            <p>Êtes-vous sûr de vouloir supprimer {activeTab === 'sondages' ? 'ce sondage' : 'cette annonce'} ? Cette action est irréversible.</p>
                        </div>
                        <div className={styles['ENS-ANC-button-group']}>
                            <button className={styles['ENS-ANC-delete-button']} onClick={handleDelete}>
                                <FaTrash /> Oui, Supprimer
                            </button>
                            <button className={styles['ENS-ANC-close-button']} onClick={closeModal}>
                                <FaTimes /> Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
    
            {showMessageModal && (
                <div className={`${styles['ENS-ANC-modal-overlay']} ${styles['ENS-ANC-success-modal']}`}>
                    <div className={`${styles['ENS-ANC-modal-content']} ${styles['ENS-ANC-success-modal-content']}`}>
                        <h3>{messageType === 'success' ? 'Succès' : 'Erreur'}</h3>
                        <div className={styles['ENS-ANC-modal-body']}>
                            <p style={{ color: messageType === 'success' ? '#28a745' : '#FF4D4F' }}>
                                {message}
                            </p>
                        </div>
                        <div className={styles['ENS-ANC-button-group']}>
                            <button className={styles['ENS-ANC-success-close-button']} onClick={closeMessageModal}>
                                <FaTimes /> Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnonceENS;