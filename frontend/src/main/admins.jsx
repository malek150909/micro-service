import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaSignOutAlt, FaBell, FaChevronRight, FaCalendar, FaBook, FaUsers, FaClipboardList, FaBullhorn, FaPlus } from "react-icons/fa";
import "../admin_css_files/admin.css";

const Admin = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [todoList, setTodoList] = useState([
        { task: "Créer un nouvel événement", progress: 90, due: "Aujourd'hui" },
        { task: "Valider les documents", progress: 50, due: "Demain" },
        { task: "Publier une annonce", progress: 100, due: "Cette semaine" }
    ]);
    const [newTask, setNewTask] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);

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
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/");
        sessionStorage.removeItem("hasSeenWelcome");
    };

    const handleEditProfile = () => navigate("/modifierProfilAdmin");
    const handleMessages = () => navigate("/messagesAdmin");

    const items = [
        { title: "Événements", description: "Consulter et créer les événements", route: "/gestionEvenements", icon: <FaCalendar /> },
        { title: "Exams Planning", description: "Consulter et créer les plannings", route: "/consult", icon: <FaBook /> },
        { title: "Modules", description: "Consulter les modules", route: "/modules", icon: <FaBook /> },
        { title: "Annonces", description: "Consulter et créer les annonces", route: "/annonces", icon: <FaBullhorn /> },
        { title: "Étudiants", description: "Consulter la liste des étudiants", route: "/etudiants", icon: <FaUsers /> },
        { title: "Profs", description: "Listes des enseignants", route: "/enseignants", icon: <FaUsers /> },
        { title: "Emploi du temps", description: "Consulter et créer des emplois", route: "/emploidutemps", icon: <FaCalendar /> },
        { title: "Documents", description: "Consulter et créer des documents", route: "/docsAdmin", icon: <FaClipboardList /> },
        { title: "Clubs", description: "Consulter les Clubs", route: "/clubsADM", icon: <FaUsers /> }
    ];

    // Calendrier (mois d'avril 2025)
    const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1); // Jours d'avril
    const currentDay = 5; // 5 avril 2025

    // Gestion de la To-Do List
    const addTask = () => {
        if (newTask.trim()) {
            setTodoList([...todoList, { task: newTask, progress: 0, due: "Aujourd'hui" }]);
            setNewTask("");
        }
    };

    return (
        <div className={`admin-container ${isLoaded ? 'loaded' : ''}`}>
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-menu">
                    <button onClick={handleEditProfile} className="sidebar-item">
                        <FaUser className="sidebar-icon" />
                    </button>
                    <button onClick={handleMessages} className="sidebar-item">
                        <FaEnvelope className="sidebar-icon" />
                    </button>
                    <button className="sidebar-item">
                        <FaBell className="sidebar-icon" />
                    </button>
                    <button onClick={handleLogout} className="sidebar-item">
                        <FaSignOutAlt className="sidebar-icon" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Welcome Message */}
                {showWelcome && user && (
                    <div className={`welcome-message ${isLoaded ? 'slide-in' : ''}`}>
                        <h1>Bienvenue, {user.nom} {user.prenom} !</h1>
                        <p>Que souhaitez-vous faire aujourd'hui ?</p>
                    </div>
                )}

                {/* Main Layout */}
                <div className="main-layout">
                    {/* Cards Section */}
                    <div className="cards-section">
                        <div className="cards-grid">
                            {items.map((item, index) => (
                                <div key={index} onClick={() => navigate(item.route)} className="card">
                                    <div className="card-icon">{item.icon}</div>
                                    <div className="card-content">
                                        <h3 className="card-title">{item.title}</h3>
                                        <p className="card-description">{item.description}</p>
                                    </div>
                                    <FaChevronRight className="card-arrow" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Calendar and To-Do List */}
                    <div className="right-column">
                        {/* Calendar */}
                        <div className="calendar-section">
                            <h3>Avril 2025</h3>
                            <div className="calendar-grid">
                                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day, index) => (
                                    <div key={index} className="calendar-day-header">
                                        {day}
                                    </div>
                                ))}
                                {calendarDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`calendar-day ${day === currentDay ? 'current-day' : ''}`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* To-Do List */}
                        <div className="todo-section">
                            <h3>Tâches d'aujourd'hui</h3>
                            <div className="todo-list">
                                <div className="todo-input">
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
                                    <div key={index} className="todo-item">
                                        <div className="todo-details">
                                            <p>{item.task}</p>
                                            <div className="todo-progress">
                                                <div
                                                    className="progress-bar"
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

export default Admin;