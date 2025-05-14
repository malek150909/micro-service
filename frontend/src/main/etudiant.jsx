import React,{ useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaSignOutAlt, FaBell, FaChevronRight, FaCalendar, FaUsers, FaClipboardList, FaBullhorn, FaTimes, FaChartBar, FaFolderOpen, FaStickyNote, FaCalendarAlt, FaBook, FaClipboard } from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import styles from "../main_css_files/main.module.css";
import axios from "axios";

const Etudiant = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [notes, setNotes] = useState([]);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteContent, setNewNoteContent] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false); // État pour le modal de déconnexion
    const [showAddNoteModal, setShowAddNoteModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const [isLoadingCounts, setIsLoadingCounts] = useState(true);

    const API_URL = "http://courses.localhost/notes";
    const CALENDAR_API_URL = "http://courses.localhost/calendar";

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "etudiant") {
            navigate("/");
            return;
        }
    
        setUser(storedUser);
        console.log("Utilisateur chargé:", storedUser);
    
        const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
        if (!hasSeenWelcome) {
            setShowWelcome(true);
            sessionStorage.setItem("hasSeenWelcome", "true");
        }
    
        setTimeout(() => setIsLoaded(true), 100);
        fetchRecentNotes(storedUser.Matricule);
        fetchUpcomingEvents();
        setIsLoadingCounts(true);
        Promise.all([
            fetchNotifications().then(() => console.log("Notifications chargées")),
            fetchUnreadMessagesCount(storedUser.Matricule).then((count) => {
                console.log("Messages non lus chargés:", count);
                setUnreadMessagesCount(Number(count));
            }),
        ]).finally(() => setIsLoadingCounts(false));
    
        const interval = setInterval(() => {
            fetchNotifications();
            fetchUnreadMessagesCount(storedUser.Matricule).then((count) => {
                setUnreadMessagesCount(Number(count));
            });
        }, 30000);
    
        return () => clearInterval(interval);
    }, [navigate]);

    useEffect(() => {
        const handleUnreadMessagesUpdate = (event) => {
            setUnreadMessagesCount(event.detail.count);
        };

        window.addEventListener("unreadMessagesCountUpdated", handleUnreadMessagesUpdate);

        return () => {
            window.removeEventListener("unreadMessagesCountUpdated", handleUnreadMessagesUpdate);
        };
    }, []);

    const fetchNotifications = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Etudiant: Aucun token trouvé, impossible de récupérer les notifications");
          setNotifications([]);
          setUnreadNotificationsCount(0);
          return;
        }
      
        console.log("Etudiant: Récupération des notifications");
        try {
          const response = await fetch("http://messaging.localhost/notifications", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur ${response.status}: ${errorText || "Erreur lors de la récupération des notifications"}`);
          }
          const data = await response.json();
          console.log("Etudiant: Réponse brute de l'API:", JSON.stringify(data, null, 2));
      
          const validNotifications = Array.isArray(data)
            ? data
                .filter((notif) => {
                  const isValid =
                    notif &&
                    typeof notif === 'object' &&
                    notif.ID_notification != null &&
                    typeof notif.contenu === 'string' &&
                    notif.contenu.trim() !== '' &&
                    (typeof notif.is_seen === 'boolean' || typeof notif.is_seen === 'number');
                  if (!isValid) {
                    console.warn("Etudiant: Notification invalide filtrée:", notif);
                  }
                  return isValid;
                })
                .map((notif) => ({
                  ID_notification: notif.ID_notification,
                  contenu: notif.contenu,
                  is_seen: Boolean(notif.is_seen),
                  expediteur: notif.expediteur || null,
                  destinataire: notif.destinataire || null,
                  date_envoi: notif.date_envoi || null,
                }))
            : [];
      
          console.log("Etudiant: Notifications valides:", validNotifications);
          setNotifications(validNotifications);
          setUnreadNotificationsCount(validNotifications.filter((n) => !n.is_seen).length);
        } catch (err) {
          console.error("Etudiant: Erreur lors de la récupération des notifications:", err.message);
          setNotifications([]);
          setUnreadNotificationsCount(0);
        }
    };

    const fetchUnreadMessagesCount = async (matricule) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch("http://messaging.localhost/api/messages/unread", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                return data.unreadCount || 0;
            } else {
                console.error("Erreur lors de la récupération des messages non lus :", data.message);
                return 0;
            }
        } catch (err) {
            console.error("Erreur réseau lors de la récupération des messages non lus :", err);
            return 0;
        }
    };

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
                            `${event.event_date || event.date_seance || event.date_evenement} ${event.time_slot.split(" - ")[0]}`
                        );
                        return eventDateTime > today;
                    })
                    .sort((a, b) => {
                        const dateA = new Date(
                            `${a.event_date || a.date_seance || a.date_evenement} ${a.time_slot.split(" - ")[0]}`
                        );
                        const dateB = new Date(
                            `${b.event_date || b.date_seance || b.date_evenement} ${b.time_slot.split(" - ")[0]}`
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

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

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
        setShowLogoutModal(true); // Afficher le modal de confirmation
    };

    const confirmLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
        sessionStorage.removeItem("hasSeenWelcome");
        setShowLogoutModal(false);
    };

    const cancelLogout = () => {
        setShowLogoutModal(false); // Fermer le modal sans déconnexion
    };

    const handleEditProfile = () => navigate("/modifierProfil");
    const handleMessages = () => navigate("/messagerie");

    const handleNotificationClick = () => {
        setShowNotificationModal(true);
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

    const openEventDetailsModal = (event) => {
        setSelectedEvent(event);
        setShowEventDetailsModal(true);
    };

    const closeEventDetailsModal = (e) => {
        if (e) e.stopPropagation();
        setShowEventDetailsModal(false);
        setSelectedEvent(null);
    };

    const getEventIcon = (type) => {
        switch (type) {
            case "personal":
                return <FaCalendar />;
            case "administratif":
                return <FaClipboard />;
            case "supp_session":
                return <FaBook />;
            case "club_event":
                return <FaUsers />;
            default:
                return <FaCalendar />;
        }
    };

    const items = [
        {
            title: "Documents Administratifs",
            description: "Consultez, créez et gérez vos documents administratifs.",
            route: "/docsEtudiant",
            icon: <FaClipboardList />,
        },
        {
            title: "Annonces",
            description: "Accédez aux dernières annonces et informations officielles.",
            route: "/AnnoncesETD",
            icon: <FaBullhorn />,
        },
        {
            title: "Clubs",
            description: "Découvrez et participez aux activités des clubs étudiants.",
            route: "/clubsETD",
            icon: <FaUsers />,
        },
        {
            title: "Emploi du Temps",
            description: "Consultez votre emploi du temps personnalisé.",
            route: "/ETDemploi",
            icon: <FaCalendar />,
        },
        {
            title: "Resultats Academiques",
            description: "Visualisez vos résultats académiques et moyennes.",
            route: "/ETDGRD",
            icon: <FaChartBar />,
        },
        {
            title: "Ressources",
            description: "Accédez aux ressources pédagogiques et supports de cours.",
            route: "/ETDressources",
            icon: <FaFolderOpen />,
        },
        {
            title: "Mes Notes",
            description: "Créez, organisez et consultez vos notes personnelles.",
            route: "/ETDnotesFeed",
            icon: <FaStickyNote />,
        },
        {
            title: "Planning",
            description: "Consultez votre planning des Examens.",
            route: "/studentPlanning",
            icon: <FaCalendarAlt />,
        },
        {
            title: "calendar",
            description: "Consultez votre planning des Examens.",
            route: "/ETDcalendar",
            icon: <FaCalendarAlt />,
        },
    ];

    return (
        <div className={`${styles['MAIN-mainContainer']} ${isLoaded ? styles['MAIN-mainContainerLoaded'] : ''}`}>
            {/* Top Bar */}
            <div className={styles['MAIN-topBar']}>
                <div className={styles['MAIN-userInfo']}>
                    <span className={styles['MAIN-userName']}>{user ? `${user.nom} ${user.prenom}` : "Utilisateur"}</span>
                    <div className={styles['MAIN-userAvatar']}><FaUser/></div>
                </div>
            </div>

            {/* Sidebar */}
            <div className={styles['MAIN-sidebar']}>
                <div className={styles['MAIN-sidebarMenu']}>
                    <button onClick={handleEditProfile} className={styles['MAIN-sidebarItem']}>
                        <FaUser className={styles['MAIN-sidebarIcon']} />
                    </button>
                    <button 
                        onClick={handleMessages} 
                        className={styles['MAIN-sidebarItem']} 
                        aria-label={`Messagerie avec ${unreadMessagesCount} messages non lus`}
                    >
                        <div className={styles['MAIN-iconWrapper']}>
                            <FaEnvelope className={styles['MAIN-sidebarIcon']} />
                            {isLoadingCounts ? (
                                <span className={styles['MAIN-unreadBadge']}>...</span>
                            ) : (
                                unreadMessagesCount > 0 && (
                                    <span className={styles['MAIN-unreadBadge']}>{unreadMessagesCount}</span>
                                )
                            )}
                        </div>
                    </button>
                    <button onClick={handleNotificationClick} className={styles['MAIN-sidebarItem']}>
                        <div className={styles['MAIN-iconWrapper']}>
                            <FaBell className={styles['MAIN-sidebarIcon']} />
                            {isLoadingCounts ? (
                                <span className={styles['MAIN-unreadBadge']}>...</span>
                            ) : (
                                unreadNotificationsCount > 0 && (
                                    <span className={styles['MAIN-unreadBadge']}>{unreadNotificationsCount}</span>
                                )
                            )}
                        </div>
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

                {/* Logout Confirmation Modal */}
                {showLogoutModal && (
                    <div className={`${styles['MAIN-modalOverlay']} ${showLogoutModal ? styles['MAIN-modalOverlayActive'] : ''}`} data-modal="logout">
                        <div className={`${styles['MAIN-modalContent']} ${styles['MAIN-logoutModal']}`}>
                            <button
                                className={styles['MAIN-closeButtonTopRight']}
                                onClick={cancelLogout}
                            >
                                <span style={{ fontSize: '1.2rem' }}>×</span> {/* Symbole de croix Unicode */}
                            </button>
                            <h3>Confirmation de déconnexion</h3>
                            <div className={styles['MAIN-modalBody']}>
                                <p className={styles['MAIN-logoutContentText']}>
                                    Êtes-vous sûr de vouloir vous déconnecter ?
                                </p>
                            </div>
                            <div className={styles['MAIN-buttonGroup']}>
                                <button onClick={cancelLogout} className={styles['MAIN-cancelButton']}>
                                    Annuler
                                </button>
                                <button onClick={confirmLogout}>
                                    Confirmer
                                </button>
                            </div>
                        </div>
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
                            <NotificationBell
                            onNotificationClick={handleNotificationClick}
                            showModal={showNotificationModal}
                            notifications={notifications}
                            setNotifications={setNotifications}
                            fetchNotifications={fetchNotifications}
                            />
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
                                <span style={{ fontSize: '1.2rem' }}>×</span> {/* Symbole de croix Unicode */}
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
                                <span style={{ fontSize: '1.2rem' }}>×</span> {/* Symbole de croix Unicode */}
                            </button>
                            <h3>{selectedNote.title}</h3>
                            <div className={styles['MAIN-modalBody']}>
                                <p className={styles['MAIN-note-FamilyContentText']}>
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
                                <span style={{ fontSize: '1.2rem' }}>×</span> {/* Symbole de croix Unicode */}
                            </button>
                            <h3>{selectedEvent.title}</h3>
                            <div className={styles['MAIN-modalBody']}>
                                <p className={styles['MAIN-eventContentText']}>
                                    <strong>Date :</strong>{" "}
                                    {new Date(
                                        selectedEvent.event_date || selectedEvent.date_seance || selectedEvent.date_evenement
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
                                        : selectedEvent.type === "supp_session"
                                        ? "Séance supplémentaire"
                                        : "Événement de club"}
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
                                                event.event_date || event.date_seance || event.date_evenement
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
                                                : event.type === "supp_session"
                                                ? "Séance supplémentaire"
                                                : "Événement de club"}
                                        </p>
                                    </div>
                                    <FaChevronRight className={styles['MAIN-eventCardArrow']} />
                                </div>
                            ))
                        )}
                    </div>
                    <button
                        onClick={() => navigate("/ETDcalendar")}
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
                                <div 
                                    key={index} 
                                    onClick={() => navigate(item.route)} 
                                    className={styles['MAIN-card']}
                                >
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
                                    onClick={() => navigate("/ETDnotesFeed")}
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

export default Etudiant;