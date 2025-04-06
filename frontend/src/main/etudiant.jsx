import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaSignOutAlt, FaBell, FaChevronRight, FaCalendar, FaBook, FaUsers, FaClipboardList, FaBullhorn, FaPlus } from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import styles from "../admin_css_files/admin.module.css"; // Nouveau CSS Module

const Etudiant = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [todoList, setTodoList] = useState([
        { task: "Réviser pour l'examen", progress: 70, due: "Aujourd'hui" },
        { task: "Rendre le devoir", progress: 20, due: "Demain" },
        { task: "Consulter les annonces", progress: 100, due: "Cette semaine" }
    ]);
    const [newTask, setNewTask] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "etudiant") {
            navigate("/");
        } else {
            setUser(storedUser);
            const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
            if (!hasSeenWelcome) {
                setShowWelcome(true);
                sessionStorage.setItem("hasSeenWelcome", "true");
            }
            setTimeout(() => setIsLoaded(true), 100);
            console.log("Utilisateur chargé dans Etudiant :", storedUser);
        }
    }, [navigate]);

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
        { title: "Documents Administratifs", description: "Consulter et créer des documents", route: "/docsEtudiant", icon: <FaClipboardList /> },
        { title: "Annonces", description: "Consulter les annonces", route: "/AnnoncesETD", icon: <FaBullhorn /> },
        { title: "Clubs", description: "Consulter les clubs", route: "/clubsETD", icon: <FaUsers /> },
        { title: "Emploi du Temps", description: "Consulter l'emploi du temps", route: "/ETDemploi", icon: <FaCalendar /> },
        { title: "Notes", description: "Consulter les notes", route: "/ETDGRD", icon: <FaBook /> },
        { title: "Ressources", description: "Consulter les ressources", route: "/ETDressources", icon: <FaBook /> },
    ];

    const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1); // Jours d'avril
    const currentDay = 5; // 5 avril 2025

    const addTask = () => {
        if (newTask.trim()) {
            setTodoList([...todoList, { task: newTask, progress: 0, due: "Aujourd'hui" }]);
            setNewTask("");
        }
    };

    return (
        <div className={`${styles.etudiantContainer} ${isLoaded ? styles.etudiantContainerLoaded : ''}`}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarMenu}>
                    <button onClick={handleEditProfile} className={styles.sidebarItem}>
                        <FaUser className={styles.sidebarIcon} />
                    </button>
                    <button onClick={handleMessages} className={styles.sidebarItem}>
                        <FaEnvelope className={styles.sidebarIcon} />
                    </button>
                    <button onClick={handleNotificationClick} className={styles.sidebarItem}>
                        <FaBell className={styles.sidebarIcon} />
                    </button>
                    <button onClick={handleLogout} className={styles.sidebarItem}>
                        <FaSignOutAlt className={styles.sidebarIcon} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Welcome Message */}
                {showWelcome && user && (
                    <div className={`${styles.welcomeMessage} ${isLoaded ? styles.welcomeMessageSlideIn : ''}`}>
                        <h1>Bienvenue, {user.nom} {user.prenom} !</h1>
                        <p>Que souhaitez-vous faire aujourd'hui ?</p>
                    </div>
                )}

                {/* Notification Modal */}
                {showNotificationModal && (
                    <div className={`${styles.notificationModal} ${showNotificationModal ? styles.notificationModalActive : ''}`}>
                        <div className={`${styles.notificationModalContent} ${showNotificationModal ? styles.notificationModalContentActive : ''}`}>
                            <button
                                className={styles.closeModalBtn}
                                onClick={() => setShowNotificationModal(false)}
                            >
                                X
                            </button>
                            <NotificationBell showModal={true} />
                        </div>
                    </div>
                )}

                {/* Main Layout */}
                <div className={styles.mainLayout}>
                    {/* Cards Section */}
                    <div className={styles.cardsSection}>
                        <div className={styles.cardsGrid}>
                            {items.map((item, index) => (
                                <div key={index} onClick={() => navigate(item.route)} className={styles.card}>
                                    <div className={styles.cardIcon}>{item.icon}</div>
                                    <div className={styles.cardContent}>
                                        <h3 className={styles.cardTitle}>{item.title}</h3>
                                        <p className={styles.cardDescription}>{item.description}</p>
                                    </div>
                                    <FaChevronRight className={styles.cardArrow} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Calendar and To-Do List */}
                    <div className={styles.rightColumn}>
                        {/* Calendar */}
                        <div className={styles.calendarSection}>
                            <h3>Avril 2025</h3>
                            <div className={styles.calendarGrid}>
                                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, index) => (
                                    <div key={index} className={styles.calendarDayHeader}>
                                        {day}
                                    </div>
                                ))}
                                {calendarDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`${styles.calendarDay} ${day === currentDay ? styles.currentDay : ''}`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* To-Do List */}
                        <div className={styles.todoSection}>
                            <h3>Tâches d'aujourd'hui</h3>
                            <div className={styles.todoList}>
                                <div className={styles.todoInput}>
                                    <input
                                        type="text"
                                        value={newTask}
                                        onChange={(e) => setNewTask(e.target.value)}
                                        placeholder="Ajouter une tâche..."
                                    />
                                    <button onClick={addTask}>
                                        <FaPlus />
                                    </button>
                                </div>
                                {todoList.map((item, index) => (
                                    <div key={index} className={styles.todoItem}>
                                        <div className={styles.todoDetails}>
                                            <p>{item.task}</p>
                                            <div className={styles.todoProgress}>
                                                <div
                                                    className={styles.progressBar}
                                                    style={{ width: `${item.progress}%` }}
                                                ></div>
                                            </div>
                                            <span>{item.due}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Etudiant;