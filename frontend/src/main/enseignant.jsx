import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaSignOutAlt, FaBell, FaChevronRight, FaCalendar, FaBook, FaUsers, FaClipboardList, FaBullhorn, FaPlus } from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import styles from "../admin_css_files/main.module.css"; // Nouveau CSS Module

const Enseignant = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [todoList, setTodoList] = useState([
        { task: "Préparer un cours", progress: 80, due: "Aujourd'hui" },
        { task: "Corriger les devoirs", progress: 30, due: "Demain" },
        { task: "Répondre aux emails", progress: 100, due: "Cette semaine" }
    ]);
    const [newTask, setNewTask] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

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
        }
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
                            <NotificationBell showModal={true} />
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

                    {/* Right Column: Calendar and To-Do List */}
                    <div className={styles['MAIN-rightColumn']}>
                        {/* Calendar */}
                        <div className={styles['MAIN-calendarSection']}>
                            <h3>Avril 2025</h3>
                            <div className={styles['MAIN-calendarGrid']}>
                                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, index) => (
                                    <div key={index} className={styles['MAIN-calendarDayHeader']}>
                                        {day}
                                    </div>
                                ))}
                                {calendarDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`${styles['MAIN-calendarDay']} ${day === currentDay ? styles['MAIN-currentDay'] : ''}`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* To-Do List */}
                        <div className={styles['MAIN-todoSection']}>
                            <h3>Tâches d'aujourd'hui</h3>
                            <div className={styles['MAIN-todoList']}>
                                <div className={styles['MAIN-todoInput']}>
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
                                    <div key={index} className={styles['MAIN-todoItem']}>
                                        <div className={styles['MAIN-todoDetails']}>
                                            <p>{item.task}</p>
                                            <div className={styles['MAIN-todoProgress']}>
                                                <div
                                                    className={styles['MAIN-progressBar']}
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

export default Enseignant;