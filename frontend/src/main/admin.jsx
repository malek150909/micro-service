import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaSignOutAlt, FaBell, FaChevronRight, FaCalendar, FaBook, FaUsers, FaClipboardList, FaBullhorn } from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import styles from "../admin_css_files/main.module.css";

const Admin = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "admin") {
            navigate("/");
        } else {
            setUser(storedUser);
            const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
            if (!hasSeenWelcome) {
                setShowWelcome(true);
                sessionStorage.setItem("hasSeenWelcome", "true");
            }
            setTimeout(() => setIsLoaded(true), 100);
            fetchUnreadMessagesCount(storedUser.Matricule).then((count) => {
                setUnreadMessagesCount(count);
            });
        }
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

    const items = [
        { title: "Événements", description: "Gérez et créez des événements institutionnels.", route: "/gestionEvenements", icon: <FaCalendar /> },
        { title: "Exams Planning", description: "Planifiez et consultez les calendriers d'examens.", route: "/consult", icon: <FaBook /> },
        { title: "Modules", description: "Accédez et gérez les modules pédagogiques.", route: "/modules", icon: <FaBook /> },
        { title: "Annonces", description: "Créez et consultez les annonces officielles.", route: "/annonces", icon: <FaBullhorn /> },
        { title: "Étudiants", description: "Consultez et gérez la liste des étudiants.", route: "/etudiants", icon: <FaUsers /> },
        { title: "Profs", description: "Consultez et gérez la liste des enseignants.", route: "/enseignants", icon: <FaUsers /> },
        { title: "Emploi du temps", description: "Créez et visualisez les emplois du temps.", route: "/emploidutemps", icon: <FaCalendar /> },
        { title: "Documents", description: "Gérez et consultez les documents administratifs.", route: "/docsAdmin", icon: <FaClipboardList /> },
        { title: "Clubs", description: "Supervisez et consultez les clubs étudiants.", route: "/clubsADM", icon: <FaUsers /> }
    ];

    return (
        <div className={`${styles['MAIN-mainContainer']} ${isLoaded ? styles['MAIN-mainContainerLoaded'] : ''}`}>
            <div className={styles['MAIN-sidebar']}>
                <div className={styles['MAIN-sidebarMenu']}>
                    <button onClick={handleEditProfile} className={styles['MAIN-sidebarItem']}>
                        <FaUser className={styles['MAIN-sidebarIcon']} />
                    </button>
                    <button onClick={handleMessages} className={styles['MAIN-sidebarItem']} aria-label={`Messagerie avec ${unreadMessagesCount} messages non lus`}>
                        <div className={styles['MAIN-iconWrapper']}>
                            <FaEnvelope className={styles['MAIN-sidebarIcon']} />
                            {unreadMessagesCount > 0 && (
                                <span className={styles['MAIN-unreadBadge']}>{unreadMessagesCount}</span>
                            )}
                        </div>
                    </button>
                    <button onClick={handleNotificationClick} className={styles['MAIN-sidebarItem']}>
                        <FaBell className={styles['MAIN-sidebarIcon']} />
                    </button>
                    <button onClick={handleLogout} className={styles['MAIN-sidebarItem']}>
                        <FaSignOutAlt className={styles['MAIN-sidebarIcon']} />
                    </button>
                </div>
            </div>
            <div className={styles['MAIN-mainContent']}>
                {showWelcome && user && (
                    <div className={`${styles['MAIN-welcomeMessage']} ${isLoaded ? styles['MAIN-welcomeMessageSlideIn'] : ''}`}>
                        <h1>Bienvenue, {user.nom} {user.prenom} !</h1>
                        <p>Que souhaitez-vous faire aujourd&apos;hui ?</p>
                    </div>
                )}
                {showNotificationModal && (
                    <div className={`${styles['MAIN-notificationModal']} ${showNotificationModal ? styles['MAIN-notificationModalActive'] : ''}`}>
                        <div className={`${styles['MAIN-notificationModalContent']} ${showNotificationModal ? styles['MAIN-notificationModalContentActive'] : ''}`}>
                            <button className={styles['MAIN-closeModalBtn']} onClick={() => setShowNotificationModal(false)}>
                                X
                            </button>
                            <NotificationBell showModal={true} />
                        </div>
                    </div>
                )}
                <div className={styles['MAIN-mainLayout']}>
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
                </div>
            </div>
        </div>
    );
};

export default Admin;