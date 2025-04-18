import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaStickyNote, FaEnvelope, FaSignOutAlt, FaBell, FaChevronRight, FaCalendar, FaBook, FaUsers, FaClipboardList, FaBullhorn, FaCalendarAlt, FaClipboard, FaTimes } from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import styles from "../admin_css_files/main.module.css";
import axios from "axios";

const Enseignant = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [notes, setNotes] = useState([]);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteContent, setNewNoteContent] = useState("");
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);

    const CALENDAR_API_URL = "http://localhost:8083/calendar";
    const API_URL = "http://localhost:8083/notes";

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "enseignant") {
            navigate("/");
        } else {
            setUser(storedUser);
            const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
            if (!hasSeenWelcome) {
                setShowWelcome(true);
                sessionStorage.setItem("hasSeenWelcome", "true");
            }
            setTimeout(() => setIsLoaded(true), 100);
            console.log("Utilisateur chargé dans Enseignant :", storedUser);
            fetchRecentNotes(storedUser.Matricule);
            fetchUpcomingEvents();
        }
    }, [navigate]);

    // Fetch the 3 most recent notes
    const fetchRecentNotes = async (matricule) => {
        try {
            const response = await fetch(`${API_URL}/notes/${matricule}`);
            if (!response.ok) throw new Error("Erreur lors du chargement des notes.");
            const data = await response.json();
            const sortedNotes = (Array.isArray(data) ? data : [])
                .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                .slice(0, 3);
            setNotes(sortedNotes);
        } catch (err) {
            console.error("Erreur lors de la récupération des notes :", err.message);
        }
    };

    // Fetch upcoming events for the next 30 days
    const fetchUpcomingEvents = async () => {
        try {
            const token = localStorage.getItem("token");
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 30);

            const startDateFormatted = formatDate(today);
            const endDateFormatted = formatDate(endDate);

            const response = await axios.get(`${CALENDAR_API_URL}/${startDateFormatted}/${endDateFormatted}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data && Array.isArray(response.data)) {
                const sortedEvents = response.data
                    .filter((event) => {
                        const eventDateTime = new Date(
                            `${event.event_date || event.date_seance} ${event.time_slot.split(" - ")[0]}`
                        );
                        return eventDateTime > today;
                    })
                    .sort((a, b) => {
                        const dateA = new Date(
                            `${a.event_date || a.date_seance} ${a.time_slot.split(" - ")[0]}`
                        );
                        const dateB = new Date(
                            `${b.event_date || b.date_seance} ${b.time_slot.split(" - ")[0]}`
                        );
                        return dateA - dateB;
                    })
                    .slice(0, 3);
                setUpcomingEvents(sortedEvents);
            } else {
                setUpcomingEvents([]);
            }
        } catch (err) {
            console.error("Erreur lors de la récupération des événements :", err.message);
        }
    };

    // Helper function to format date as YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    // Add a new note
    const addNote = async () => {
        if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
        try {
            const response = await fetch(`${API_URL}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matricule: user.Matricule,
                    title: newNoteTitle,
                    content: newNoteContent,
                }),
            });
            if (!response.ok) throw new Error("Erreur lors de l’ajout de la note.");
            setNewNoteTitle("");
            setNewNoteContent("");
            setShowAddNoteModal(false);
            fetchRecentNotes(user.Matricule);
        } catch (err) {
            console.error("Erreur lors de l’ajout de la note :", err.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
        sessionStorage.removeItem("hasSeenWelcome");
    };

    const handleEditProfile = () => navigate("/modifierProfil");
    const handleMessages = () => navigate("/messagerie");

    const handleNotificationClick = () => {
        setShowNotificationModal(true);
    };

    const openEventDetailsModal = (event) => {
        setSelectedEvent(event);
        setShowEventDetailsModal(true);
    };

    const closeEventDetailsModal = (e) => {
        if (e) e.stopPropagation();
        setShowEventDetailsModal(false);
        setSelectedEvent(null);
    };

    const openDetailsModal = (note) => {
        setSelectedNote(note);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = (e) => {
       if (e) e.stopPropagation();
        setShowDetailsModal(false);
        setSelectedNote(null);
    };

    const openAddNoteModal = () => {
        setShowAddNoteModal(true);
    };

    const closeAddNoteModal = (e) => {
        if (e) e.stopPropagation();
        setShowAddNoteModal(false);
        setNewNoteTitle("");
        setNewNoteContent("");
    };

    const getEventIcon = (type) => {
        switch (type) {
            case "personal":
                return <FaCalendar />;
            case "administratif":
                return <FaClipboard />;
            case "supp_session":
                return <FaBook />;
            default:
                return <FaCalendar />;
        }
    };

    const items = [
        { 
            title: "Ressources", 
            description: "Consultez et enrichissez les ressources pédagogiques.", 
            route: "/ressources", 
            icon: <FaBook /> 
        },
        { 
            title: "Resultats Academiques", 
            description: "Accédez et gérez les notes des étudiants.", 
            route: "/notes", 
            icon: <FaClipboardList /> 
        },
        { 
            title: "Annonces", 
            description: "Consultez les annonces et informations officielles.", 
            route: "/annoncesENS", 
            icon: <FaBullhorn /> 
        },
        { 
            title: "Emploi du Temps", 
            description: "Visualisez votre emploi du temps personnalisé.", 
            route: "/ENSemploi", 
            icon: <FaCalendar /> 
        },
        { 
            title: "Liste des Étudiants", 
            description: "Consultez les listes détaillées des étudiants.", 
            route: "/ENSlistetudiant", 
            icon: <FaUsers /> 
        },
        { 
            title: "Séances Supplémentaires", 
            description: "Planifiez et gérez les séances supplémentaires.", 
            route: "/seanceSupp", 
            icon: <FaCalendar /> 
        },
        { 
            title: "calendar", 
            description: "Consultez votre planning des Examens.", 
            route: "/ENScalendar", 
            icon: <FaCalendarAlt /> 
        },
        { 
            title: "Mes Notes",
            description: "Créez, organisez et consultez vos notes personnelles.",
            route: "/ENSnotesFeed",
            icon: <FaStickyNote />,
        }
    ];

    return (
        <div className={`${styles['MAIN-mainContainer']} ${isLoaded ? styles['MAIN-mainContainerLoaded'] : ''}`}>
            {/* Sidebar */}
            <div className={styles['MAIN-sidebar']}>
                <div className={styles['MAIN-sidebarMenu']}>
                    <button onClick={handleEditProfile} className={styles['MAIN-sidebarItem']}>
                        <FaUser className={styles['MAIN-sidebarIcon']} />
                    </button>
                    <button onClick={handleMessages} className={styles['MAIN-sidebarItem']}>
                        <FaEnvelope className={styles['MAIN-sidebarIcon']} />
                    </button>
                    <button onClick={handleNotificationClick} className={styles['MAIN-sidebarItem']}>
                        <FaBell className={styles['MAIN-sidebarIcon']} />
                    </button>
                    <button onClick={handleLogout} className={styles['MAIN-sidebarItem']}>
                        <FaSignOutAlt className={styles['MAIN-sidebarIcon']} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles['MAIN-mainContent']}>
                {/* Welcome Message */}
                {showWelcome && user && (
                    <div className={`${styles['MAIN-welcomeMessage']} ${isLoaded ? styles['MAIN-welcomeMessageSlideIn'] : ''}`}>
                        <h1>Bienvenue, {user.nom} {user.prenom} !</h1>
                        <p>Que souhaitez-vous faire aujourd'hui ?</p>
                    </div>
                )}

                {/* Notification Modal */}
                {showNotificationModal && (
                    <div className={`${styles['MAIN-notificationModal']} ${showNotificationModal ? styles['MAIN-notificationModalActive'] : ''}`}>
                        <div className={`${styles['MAIN-notificationModalContent']} ${showNotificationModal ? styles['MAIN-notificationModalContentActive'] : ''}`}>
                            <button
                                className={styles['MAIN-closeModalBtn']}
                                onClick={() => setShowNotificationModal(false)}
                            >
                                X
                            </button>
                            <div className={styles['MAIN-notificationListWrapper']}>
                                <NotificationBell showModal={true} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Note Modal */}
                {showAddNoteModal && (
                    <div className={`${styles['MAIN-modalOverlay']} ${showAddNoteModal ? styles['MAIN-modalOverlayActive'] : ''}`} data-modal="add">
                        <div className={`${styles['MAIN-modalContent']} ${styles['MAIN-addNoteModal']} ${styles['MAIN-stickyNote']}`}>
                            <button
                                className={styles['MAIN-closeButtonTopRight']}
                                onClick={(e) => closeAddNoteModal(e)}
                            >
                                <FaTimes />
                            </button>
                            <h3>Ajouter une Note</h3>
                            <div className={styles['MAIN-modalBody']}>
                                <input
                                    type="text"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    placeholder="Titre de la note"
                                    className={styles['MAIN-titleInput']}
                                />
                                <textarea
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    placeholder="Écrivez votre note ici..."
                                    rows="10"
                                    className={styles['MAIN-linedText']}
                                />
                            </div>
                            <div className={styles['MAIN-buttonGroup']}>
                                <button onClick={addNote}>Ajouter</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Note Details Modal */}
                {showDetailsModal && selectedNote && (
                    <div className={`${styles['MAIN-modalOverlay']} ${showDetailsModal ? styles['MAIN-modalOverlayActive'] : ''}`} data-modal="details">
                        <div className={`${styles['MAIN-modalContent']} ${styles['MAIN-stickyNote']}`}>
                            <button
                                className={styles['MAIN-closeButtonTopRight']}
                                onClick={(e) => closeDetailsModal(e)}
                            >
                                <FaTimes />
                            </button>
                            <h3>{selectedNote.title}</h3>
                            <div className={styles['MAIN-modalBody']}>
                                <p className={styles['MAIN-noteContentText']}>
                                    <strong>Contenu :</strong> {selectedNote.content}
                                </p>
                                <p className={styles['MAIN-noteContentText']}>
                                    <strong>Créée le :</strong>{" "}
                                    {new Date(selectedNote.created_at).toLocaleString()}
                                </p>
                                <p className={styles['MAIN-noteContentText']}>
                                    <strong>Mise à jour le :</strong>{" "}
                                    {new Date(selectedNote.updated_at).toLocaleString()}
                                </p>
                            </div>
                            <div className={styles['MAIN-buttonGroup']}>
                                <button className={styles['MAIN-closeButton']} onClick={(e) => closeDetailsModal(e)}>
                                    <FaTimes /> Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Details Modal */}
                {showEventDetailsModal && selectedEvent && (
                    <div className={`${styles['MAIN-modalOverlay']} ${showEventDetailsModal ? styles['MAIN-modalOverlayActive'] : ''}`} data-modal="event-details">
                        <div className={`${styles['MAIN-modalContent']} ${styles['MAIN-eventModal']}`}>
                            <button
                                className={styles['MAIN-closeButtonTopRight']}
                                onClick={(e) => closeEventDetailsModal(e)}
                            >
                                <FaTimes />
                            </button>
                            <h3>{selectedEvent.title}</h3>
                            <div className={styles['MAIN-modalBody']}>
                                <p className={styles['MAIN-eventContentText']}>
                                    <strong>Date :</strong>{" "}
                                    {new Date(
                                        selectedEvent.event_date || selectedEvent.date_seance
                                    ).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                                <p className={styles['MAIN-eventContentText']}>
                                    <strong>Horaire :</strong> {selectedEvent.time_slot}
                                </p>
                                <p className={styles['MAIN-eventContentText']}>
                                    <strong>Type :</strong>{" "}
                                    {selectedEvent.type === "personal"
                                        ? "Personnel"
                                        : selectedEvent.type === "administratif"
                                        ? "Administratif"
                                        : "Séance supplémentaire"}
                                </p>
                                <p className={styles['MAIN-eventContentText']}>
                                    <strong>Description :</strong> {selectedEvent.content || "Aucune description disponible"}
                                </p>
                            </div>
                            <div className={styles['MAIN-buttonGroup']}>
                                <button className={styles['MAIN-closeButton']} onClick={(e) => closeEventDetailsModal(e)}>
                                    <FaTimes /> Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upcoming Events Section */}
                <div className={styles['MAIN-eventsSection']}>
                    <h3>Événements à venir</h3>
                    <div className={styles['MAIN-eventsHorizontal']}>
                        {upcomingEvents.length === 0 ? (
                            <p className={styles['MAIN-noEvents']}>Aucun événement à venir.</p>
                        ) : (
                            upcomingEvents.map((event, index) => (
                                <div
                                    key={index}
                                    className={styles['MAIN-eventCard']}
                                    onClick={() => openEventDetailsModal(event)}
                                >
                                    <div className={styles['MAIN-eventCardIcon']}>
                                        {getEventIcon(event.type)}
                                    </div>
                                    <div className={styles['MAIN-eventCardContent']}>
                                        <h4 className={styles['MAIN-eventCardTitle']}>{event.title}</h4>
                                        <p className={styles['MAIN-eventCardDate']}>
                                            {new Date(
                                                event.event_date || event.date_seance
                                            ).toLocaleDateString("fr-FR", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                        <p className={styles['MAIN-eventCardTime']}>{event.time_slot}</p>
                                        <p className={styles['MAIN-eventCardType']}>
                                            {event.type === "personal"
                                                ? "Personnel"
                                                : event.type === "administratif"
                                                ? "Administratif"
                                                : "Séance supplémentaire"}
                                        </p>
                                    </div>
                                    <FaChevronRight className={styles['MAIN-eventCardArrow']} />
                                </div>
                            ))
                        )}
                    </div>
                    <button
                        onClick={() => navigate("/ENScalendar")}
                        className={styles['MAIN-seeMoreButton']}
                    >
                        Voir plus
                    </button>
                </div>

                {/* Main Layout */}
                <div className={styles['MAIN-mainLayout']}>
                    {/* Cards Section */}
                    <div className={styles['MAIN-cardsSection']}>
                        <div className={styles['MAIN-cardsGrid']}>
                            {items.map((item, index) => (
                                <div key={index} onClick={() => navigate(item.route)} className={styles['MAIN-card']}>
                                    <div className={styles['MAIN-cardIcon']}>{item.icon}</div>
                                    <div className={styles['MAIN-cardContent']}>
                                        <h3 className={styles['MAIN-cardTitle']}>{item.title}</h3>
                                        <p className={styles['MAIN-cardDescription']}>{item.description}</p>
                                    </div>
                                    <FaChevronRight className={styles['MAIN-cardArrow']} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Notes */}
                    <div className={styles['MAIN-rightColumn']}>
                        {/* Notes Section */}
                        <div className={styles['MAIN-notesSection']}>
                            <h3>Dernières Notes</h3>
                            <div className={styles['MAIN-notesGrid']}>
                                <button onClick={openAddNoteModal} className={styles['MAIN-addButton']}>
                                    Ajouter
                                </button>
                                {notes.length === 0 ? (
                                    <p className={styles['MAIN-noNotes']}>Aucune note récente.</p>
                                ) : (
                                    notes.map((note, index) => (
                                        <div
                                            key={index}
                                            className={styles['MAIN-noteCard']}
                                            onClick={() => openDetailsModal(note)}
                                        >
                                            <div className={styles['MAIN-noteCardContent']}>
                                                <h4 className={styles['MAIN-noteCardTitle']}>{note.title}</h4>
                                                <p className={styles['MAIN-noteCardSnippet']}>
                                                    {note.content.substring(0, 50) +
                                                        (note.content.length > 50 ? "..." : "")}
                                                </p>
                                                <p className={styles['MAIN-noteCardDate']}>
                                                    {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <FaChevronRight className={styles['MAIN-noteCardArrow']} />
                                        </div>
                                    ))
                                )}
                                <button
                                    onClick={() => navigate("/ENSnotesFeed")}
                                    className={styles['MAIN-seeMoreButton']}
                                >
                                    Voir plus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Enseignant;