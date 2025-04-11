import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaSignOutAlt, FaBell, FaChevronRight, FaCalendar, FaBook, FaUsers, FaClipboardList, FaBullhorn, FaPlus, FaTimes } from "react-icons/fa";
import NotificationBell from "./NotificationBell";
import styles from "../admin_css_files/main.module.css"; // Nouveau CSS Module

const Etudiant = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [notes, setNotes] = useState([]); // State for recent notes
    const [newNoteTitle, setNewNoteTitle] = useState(""); // State for new note title
    const [newNoteContent, setNewNoteContent] = useState(""); // State for new note content
    const [isLoaded, setIsLoaded] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showAddNoteModal, setShowAddNoteModal] = useState(false); // State for add note modal
    const [showDetailsModal, setShowDetailsModal] = useState(false); // State for details modal
    const [selectedNote, setSelectedNote] = useState(null); // State for selected note

    const API_URL = "http://localhost:8083/notes"; // API URL for notes

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
            fetchRecentNotes(storedUser.Matricule); // Fetch recent notes on mount
        }
    }, [navigate]);

    // Fetch the 3 most recent notes
    const fetchRecentNotes = async (matricule) => {
        try {
            const response = await fetch(`${API_URL}/notes/${matricule}`);
            if (!response.ok) throw new Error("Erreur lors du chargement des notes.");
            const data = await response.json();
            // Sort notes by updated_at (or created_at if updated_at is not available) and take the top 3
            const sortedNotes = (Array.isArray(data) ? data : [])
                .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                .slice(0, 3);
            setNotes(sortedNotes);
        } catch (err) {
            console.error("Erreur lors de la récupération des notes :", err.message);
        }
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
            setShowAddNoteModal(false); // Close the modal
            fetchRecentNotes(user.Matricule); // Refresh the notes list
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

    const items = [
        { title: "Documents Administratifs", description: "Consulter et créer des documents", route: "/docsEtudiant", icon: <FaClipboardList /> },
        { title: "Annonces", description: "Consulter les annonces", route: "/AnnoncesETD", icon: <FaBullhorn /> },
        { title: "Clubs", description: "Consulter les clubs", route: "/clubsETD", icon: <FaUsers /> },
        { title: "Emploi du Temps", description: "Consulter l'emploi du temps", route: "/ETDemploi", icon: <FaCalendar /> },
        { title: "Notes", description: "Consulter les notes", route: "/ETDGRD", icon: <FaBook /> },
        { title: "Ressources", description: "Consulter les ressources", route: "/ETDressources", icon: <FaBook /> },
        { title: "Mes Notes", description: "Créer et gérer vos notes", route: "/notesFeed", icon: <FaBook /> },
    ];

    const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1); // Jours d'avril
    const currentDay = 5; // 5 avril 2025

    return (
        <div className={`${styles.mainContainer} ${isLoaded ? styles.mainContainerLoaded : ''}`}>
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

                {/* Add Note Modal */}
                {showAddNoteModal && (
                    <div className={`${styles.modalOverlay} ${showAddNoteModal ? styles.modalOverlayActive : ''}`} data-modal="add">
                        <div className={`${styles.modalContent} ${styles.addNoteModal} ${styles.stickyNote}`}>
                            <button
                                className={styles.closeButtonTopRight}
                                onClick={(e) => closeAddNoteModal(e)}
                            >
                                <FaTimes />
                            </button>
                            <h3>Ajouter une Note</h3>
                            <div className={styles.modalBody}>
                                <input
                                    type="text"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    placeholder="Titre de la note"
                                    className={styles.titleInput}
                                />
                                <textarea
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    placeholder="Écrivez votre note ici..."
                                    rows="10"
                                    className={styles.linedText}
                                />
                            </div>
                            <div className={styles.buttonGroup}>
                                <button onClick={addNote}>Ajouter</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {showDetailsModal && selectedNote && (
                    <div className={`${styles.modalOverlay} ${showDetailsModal ? styles.modalOverlayActive : ''}`} data-modal="details">
                        <div className={`${styles.modalContent} ${styles.stickyNote}`}>
                            <button
                                className={styles.closeButtonTopRight}
                                onClick={(e) => closeDetailsModal(e)}
                            >
                                <FaTimes />
                            </button>
                            <h3>{selectedNote.title}</h3>
                            <div className={styles.modalBody}>
                                <p className={styles.noteContentText}>
                                    <strong>Contenu :</strong> {selectedNote.content}
                                </p>
                                <p className={styles.noteContentText}>
                                    <strong>Créée le :</strong>{" "}
                                    {new Date(selectedNote.created_at).toLocaleString()}
                                </p>
                                <p className={styles.noteContentText}>
                                    <strong>Mise à jour le :</strong>{" "}
                                    {new Date(selectedNote.updated_at).toLocaleString()}
                                </p>
                            </div>
                            <div className={styles.buttonGroup}>
                                <button className={styles.closeButton} onClick={(e) => closeDetailsModal(e)}>
                                    <FaTimes /> Fermer
                                </button>
                            </div>
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

                    {/* Right Column: Calendar and Notes */}
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

                        {/* Notes Section */}
                        <div className={styles.notesSection}>
                            <h3>Dernières Notes</h3>
                            <div className={styles.notesList}>
                                {/* "Ajouter" button */}
                                <button onClick={openAddNoteModal} className={styles.addButton}>
                                    Ajouter
                                </button>
                                {/* List of recent notes */}
                                {notes.length === 0 ? (
                                    <p>Aucune note récente.</p>
                                ) : (
                                    notes.map((note, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.noteItem} ${index % 2 === 0 ? styles.rotatePositive : styles.rotateNegative}`}
                                            onClick={() => openDetailsModal(note)}
                                        >
                                            <div className={styles.noteContent}>
                                                <p className={styles.noteTitle}>{note.title}</p>
                                                <p className={styles.noteSnippet}>
                                                    {note.content.substring(0, 50) +
                                                        (note.content.length > 50 ? "..." : "")}
                                                </p>
                                                <span className={styles.noteDate}>
                                                    {new Date(note.updated_at || note.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {/* "Voir plus" button */}
                                <button
                                    onClick={() => navigate("/notesFeed")}
                                    className={styles.seeMoreButton}
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