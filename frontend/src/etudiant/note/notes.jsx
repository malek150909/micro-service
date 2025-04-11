import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaEye, FaTimes } from "react-icons/fa";
import styles from "./notes.module.css"; // Assurez-vous que le chemin est correct

const NotesFeed = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notes, setNotes] = useState([]);
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteContent, setNewNoteContent] = useState("");
    const [editNoteId, setEditNoteId] = useState(null);
    const [editNoteTitle, setEditNoteTitle] = useState("");
    const [editNoteContent, setEditNoteContent] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);

    const API_URL = "http://localhost:8083/notes";

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "etudiant") {
            navigate("/");
        } else {
            console.log("User loaded:", storedUser); // Debug log
            setUser(storedUser);
            fetchNotes(storedUser.Matricule);
        }
    }, [navigate]);

    const fetchNotes = async (matricule) => {
        try {
            const response = await fetch(`${API_URL}/notes/${matricule}`);
            if (!response.ok) throw new Error("Erreur lors du chargement des notes.");
            const data = await response.json();
            console.log("Fetched notes:", data); // Debug log
            setNotes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erreur lors de la récupération des notes :", err.message);
        }
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
            setShowAddModal(false);
            fetchNotes(user.Matricule);
        } catch (err) {
            console.error("Erreur lors de l’ajout de la note :", err.message);
        }
    };

    const updateNote = async () => {
        if (!editNoteTitle.trim() || !editNoteContent.trim()) {
            console.log("Title or content is empty, aborting update.");
            alert("Le titre et le contenu ne peuvent pas être vides.");
            return;
        }
        console.log("Updating note with ID:", editNoteId);
        console.log("Request body:", {
            matricule: user.Matricule,
            title: editNoteTitle,
            content: editNoteContent,
        });
        try {
            const response = await fetch(`${API_URL}/notes/${editNoteId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matricule: user.Matricule,
                    title: editNoteTitle,
                    content: editNoteContent,
                }),
            });
            console.log("Response status:", response.status);
            console.log("Response:", response);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur ${response.status} lors de la mise à jour de la note: ${errorText}`);
            }
            setEditNoteId(null);
            setEditNoteTitle("");
            setEditNoteContent("");
            setShowEditModal(false);
            fetchNotes(user.Matricule);
            alert("Note mise à jour avec succès !");
        } catch (err) {
            console.error("Erreur lors de la mise à jour de la note :", err.message);
            alert(`Erreur lors de la mise à jour de la note : ${err.message}`);
        }
    };

    const deleteNote = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) return;
        try {
            const response = await fetch(`${API_URL}/notes/${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Erreur lors de la suppression de la note.");
            fetchNotes(user.Matricule);
        } catch (err) {
            console.error("Erreur lors de la suppression de la note :", err.message);
        }
    };

    const openEditModal = (note) => {
        console.log("Opening Edit Modal with note:", note);
        const noteId = note.ID_note || note.id_note || note.id; // Try different variations
        if (!noteId) {
            console.error("Note ID is missing in note object:", note);
            alert("Erreur : Impossible de trouver l'ID de la note.");
            return;
        }
        setEditNoteId(noteId);
        setEditNoteTitle(note.title);
        setEditNoteContent(note.content);
        setShowEditModal(true);
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

    const closeAddModal = (e) => {
        if (e) e.stopPropagation();
        setShowAddModal(false);
        setNewNoteTitle("");
        setNewNoteContent("");
    };

    const closeEditModal = (e) => {
        if (e) e.stopPropagation();
        setShowEditModal(false);
        setEditNoteId(null);
        setEditNoteTitle("");
        setEditNoteContent("");
    };

    return (
        <div className={styles.notesFeedContainer}>
            <h1>Mes Notes</h1>
            <button onClick={() => setShowAddModal(true)} className={styles.addButton}>
                <FaPlus /> Ajouter une Note
            </button>

            {/* Add Note Modal */}
            {showAddModal && (
                <div className={`${styles.modalOverlay} ${showAddModal ? styles.modalOverlayActive : ''}`} data-modal="add">
                    <div className={`${styles.modalContent} ${styles.addNoteModal} ${styles.stickyNote}`}>
                        <button className={styles.closeButtonTopRight} onClick={(e) => closeAddModal(e)}>
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

            {/* Edit Note Modal */}
            {showEditModal && (
                <div className={`${styles.modalOverlay} ${showEditModal ? styles.modalOverlayActive : ''}`} data-modal="edit">
                    <div className={`${styles.modalContent} ${styles.editNoteModal} ${styles.stickyNote}`}>
                        <button className={styles.closeButtonTopRight} onClick={(e) => closeEditModal(e)}>
                            <FaTimes />
                        </button>
                        <h3>Modifier la Note</h3>
                        <div className={styles.modalBody}>
                            <input
                                type="text"
                                value={editNoteTitle}
                                onChange={(e) => setEditNoteTitle(e.target.value)}
                                placeholder="Titre de la note"
                                className={styles.titleInput}
                            />
                            <textarea
                                value={editNoteContent}
                                onChange={(e) => setEditNoteContent(e.target.value)}
                                placeholder="Écrivez votre note ici..."
                                rows="10"
                                className={styles.linedText}
                            />
                        </div>
                        <div className={styles.buttonGroup}>
                            <button onClick={updateNote}>Mettre à jour</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedNote && (
                <div className={`${styles.modalOverlay} ${showDetailsModal ? styles.modalOverlayActive : ''}`} data-modal="details">
                    <div className={`${styles.modalContent} ${styles.stickyNote}`}>
                        <button className={styles.closeButtonTopRight} onClick={(e) => closeDetailsModal(e)}>
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

            {/* Notes List */}
            <div className={styles.notesList}>
                {notes.length === 0 ? (
                    <p>Aucune note disponible.</p>
                ) : (
                    notes.map((note, index) => (
                        <div
                            key={note.id}
                            className={`${styles.noteItem} ${index % 2 === 0 ? styles.rotatePositive : styles.rotateNegative}`}
                        >
                            <div className={styles.noteContent}>
                                <p className={styles.noteTitle}>{note.title}</p>
                                <p className={styles.noteSnippet}>
                                    {note.content.substring(0, 100) +
                                        (note.content.length > 100 ? "..." : "")}
                                </p>
                                <span className={styles.noteDate}>
                                    {new Date(note.updated_at || note.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.noteActions}>
                                <button onClick={() => openDetailsModal(note)}>
                                    <FaEye />
                                </button>
                                <button onClick={() => openEditModal(note)}>
                                    <FaEdit />
                                </button>
                                <button onClick={() => deleteNote(note.id)}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotesFeed;