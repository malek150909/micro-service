import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaSignOutAlt, FaBell, FaChevronRight, FaCalendar, FaBook, FaUsers, FaClipboardList, FaBullhorn, FaCalendarAlt, FaClipboard } from "react-icons/fa";
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

    const CALENDAR_API_URL = "http://localhost:8083/calendar";

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
            fetchUpcomingEvents();
        }
    }, [navigate]);

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
            title: "Notes", 
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
            route: "/calendar", 
            icon: <FaCalendarAlt /> 
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
                        <p>Que souhaitez-vous faire aujourd&apos;hui ?</p>
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

                    {/* Right Column: Upcoming Events */}
                    <div className={styles['MAIN-rightColumn']}>
                        {/* Upcoming Events Section */}
                        <div className={styles['MAIN-eventsSection']}>
                            <h3>Événements à venir</h3>
                            <div className={styles['MAIN-eventsList']}>
                                {upcomingEvents.length === 0 ? (
                                    <p>Aucun événement à venir.</p>
                                ) : (
                                    upcomingEvents.map((event, index) => (
                                        <div
                                            key={index}
                                            className={styles['MAIN-eventItem']}
                                            onClick={() => openEventDetailsModal(event)}
                                        >
                                            <div className={styles['MAIN-eventIcon']}>
                                                {getEventIcon(event.type)}
                                            </div>
                                            <div className={styles['MAIN-eventContent']}>
                                                <p className={styles['MAIN-eventTitle']}>{event.title}</p>
                                                <p className={styles['MAIN-eventDetails']}>
                                                    {new Date(
                                                        event.event_date || event.date_seance
                                                    ).toLocaleDateString("fr-FR", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                    })}
                                                </p>
                                                <p className={styles['MAIN-eventDetails']}>{event.time_slot}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <button
                                    onClick={() => navigate("/calendar")}
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