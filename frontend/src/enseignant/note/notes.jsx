import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaEye, FaTimes, FaHome } from "react-icons/fa";
import styles from "./notes.module.css";

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
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageModalContent, setMessageModalContent] = useState({ type: "", text: "" });

    const API_URL = "http://courses.localhost/notes";

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "enseignant") {
            navigate("/");
        } else {
            console.log("User loaded:", storedUser);
            setUser(storedUser);
            fetchNotes(storedUser.Matricule);
        }
    }, [navigate]);

    const fetchNotes = async (matricule) => {
        try {
            const response = await fetch(`${API_URL}/notes/${matricule}`);
            if (!response.ok) throw new Error(`Erreur lors du chargement des notes: ${response.statusText}`);
            const data = await response.json();
            console.log("Fetched notes:", data);
            setNotes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Erreur lors de la récupération des notes :", err.message);
        }
    };

    const addNote = async () => {
        if (!newNoteTitle.trim() || !newNoteContent.trim()) {
            setMessageModalContent({ type: "error", text: "Le titre et le contenu ne peuvent pas être vides." });
            setShowMessageModal(true);
            return;
        }
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/notes`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    matricule: user.Matricule,
                    title: newNoteTitle,
                    content: newNoteContent,
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors de l’ajout de la note: ${response.status} ${response.statusText} - ${errorText}`);
            }
            setNewNoteTitle("");
            setNewNoteContent("");
            setShowAddModal(false);
            fetchNotes(user.Matricule);
            setMessageModalContent({ type: "success", text: "Note ajoutée avec succès !" });
            setShowMessageModal(true);
        } catch (err) {
            console.error("Erreur lors de l’ajout de la note :", err.message);
            setMessageModalContent({ type: "error", text: `Erreur lors de l’ajout de la note : ${err.message}` });
            setShowMessageModal(true);
        }
    };

    const updateNote = async () => {
        if (!editNoteTitle.trim() || !editNoteContent.trim()) {
            console.log("Title or content is empty, aborting update.");
            setMessageModalContent({ type: "error", text: "Le titre et le contenu ne peuvent pas être vides." });
            setShowMessageModal(true);
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
            setMessageModalContent({ type: "success", text: "Note mise à jour avec succès !" });
            setShowMessageModal(true);
        } catch (err) {
            console.error("Erreur lors de la mise à jour de la note :", err.message);
            setMessageModalContent({ type: "error", text: `Erreur lors de la mise à jour de la note : ${err.message}` });
            setShowMessageModal(true);
        }
    };

    const deleteNote = async (id) => {
        console.log("Deleting note with ID:", id);
        try {
            const response = await fetch(`${API_URL}/notes/${id}`, {
                method: "DELETE",
            });
            console.log("Delete response status:", response.status);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur ${response.status} lors de la suppression de la note: ${errorText}`);
            }
            fetchNotes(user.Matricule);
            setMessageModalContent({ type: "success", text: "Note supprimée avec succès !" });
            setShowMessageModal(true);
        } catch (err) {
            console.error("Erreur lors de la suppression de la note :", err.message);
            setMessageModalContent({ type: "error", text: `Erreur lors de la suppression de la note : ${err.message}` });
            setShowMessageModal(true);
        }
    };

    const openEditModal = (note) => {
        console.log("Opening Edit Modal with note:", note);
        const noteId = note.ID_note || note.id;
        if (!noteId) {
            console.error("Note ID is missing in note object:", note);
            setMessageModalContent({ type: "error", text: "Erreur : Impossible de modifier la note car l'ID est manquant." });
            setShowMessageModal(true);
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

    const handleBack = () => {
        navigate("/enseignant");
    };

    const openDeleteConfirmModal = (id) => {
        setNoteToDelete(id);
        setShowDeleteConfirmModal(true);
    };

    const closeDeleteConfirmModal = () => {
        setShowDeleteConfirmModal(false);
        setNoteToDelete(null);
    };

    const confirmDelete = () => {
        if (noteToDelete) {
            deleteNote(noteToDelete);
        }
        setShowDeleteConfirmModal(false);
        setNoteToDelete(null);
    };

    const closeMessageModal = () => {
        setShowMessageModal(false);
        setMessageModalContent({ type: "", text: "" });
    };

    return (
        <div className={styles['NOTE-container']}>
            <div className={styles['NOTE-backgroundShapes']}>
                <div className={styles['NOTE-shape1']}></div>
                <div className={styles['NOTE-shape2']}></div>
            </div>

            <div className={styles['NOTE-sidebar']}>
                <div className={styles['NOTE-logo']}>
                    <h2>
                        Notes des Enseignant
                    </h2>
                </div>
                <button className={styles['NOTE-sidebarButton']} onClick={handleBack}>
                    <FaHome /> Retour à l’accueil
                </button>
            </div>

            <div className={styles['NOTE-mainContent']}>
                <div className={styles['NOTE-header']}>
                    <h1>Notes des Enseignant</h1>
                    <p>Gérez vos Notes ici</p>
                </div>

                <button onClick={() => setShowAddModal(true)} className={styles['NOTE-addButton']}>
                    <FaPlus /> Ajouter une Note
                </button>

                {/* Add Note Modal */}
                {showAddModal && (
                    <div className={`${styles['NOTE-modalOverlay']} ${showAddModal ? styles['NOTE-modalOverlayActive'] : ''}`} data-modal="add">
                        <div className={`${styles['NOTE-modalContent']} ${styles['NOTE-addNoteModal']} ${styles['NOTE-stickyNote']}`}>
                            <button className={styles['NOTE-closeButtonTopRight']} onClick={(e) => closeAddModal(e)}>
                                <FaTimes />
                            </button>
                            <h3>Ajouter une Note</h3>
                            <div className={styles['NOTE-modalBody']}>
                                <input
                                    type="text"
                                    value={newNoteTitle}
                                    onChange={(e) => setNewNoteTitle(e.target.value)}
                                    placeholder="Titre de la note"
                                    className={styles['NOTE-titleInput']}
                                />
                                <textarea
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    placeholder="Écrivez votre note ici..."
                                    rows="10"
                                    className={styles['NOTE-linedText']}
                                />
                            </div>
                            <div className={styles['NOTE-buttonGroup']}>
                                <button onClick={addNote}>Ajouter</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Note Modal */}
                {showEditModal && (
                    <div className={`${styles['NOTE-modalOverlay']} ${showEditModal ? styles['NOTE-modalOverlayActive'] : ''}`} data-modal="edit">
                        <div className={`${styles['NOTE-modalContent']} ${styles['NOTE-editNoteModal']} ${styles['NOTE-stickyNote']}`}>
                            <button className={styles['NOTE-closeButtonTopRight']} onClick={(e) => closeEditModal(e)}>
                                <FaTimes />
                            </button>
                            <h3>Modifier la Note</h3>
                            <div className={styles['NOTE-modalBody']}>
                                <input
                                    type="text"
                                    value={editNoteTitle}
                                    onChange={(e) => setEditNoteTitle(e.target.value)}
                                    placeholder="Titre de la note"
                                    className={styles['NOTE-titleInput']}
                                />
                                <textarea
                                    value={editNoteContent}
                                    onChange={(e) => setEditNoteContent(e.target.value)}
                                    placeholder="Écrivez votre note ici..."
                                    rows="10"
                                    className={styles['NOTE-linedText']}
                                />
                            </div>
                            <div className={styles['NOTE-buttonGroup']}>
                                <button onClick={updateNote}>Mettre à jour</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {showDetailsModal && selectedNote && (
                    <div className={`${styles['NOTE-modalOverlay']} ${showDetailsModal ? styles['NOTE-modalOverlayActive'] : ''}`} data-modal="details">
                        <div className={`${styles['NOTE-modalContent']} ${styles['NOTE-stickyNote']}`}>
                            <button className={styles['NOTE-closeButtonTopRight']} onClick={(e) => closeDetailsModal(e)}>
                                <FaTimes />
                            </button>
                            <h3>{selectedNote.title}</h3>
                            <div className={styles['NOTE-modalBody']}>
                                <p className={styles['NOTE-noteContentText']}>
                                    <strong>Contenu :</strong> {selectedNote.content}
                                </p>
                                <p className={styles['NOTE-noteContentText']}>
                                    <strong>Créée le :</strong>{" "}
                                    {new Date(selectedNote.created_at).toLocaleString()}
                                </p>
                                <p className={styles['NOTE-noteContentText']}>
                                    <strong>Mise à jour le :</strong>{" "}
                                    {new Date(selectedNote.updated_at).toLocaleString()}
                                </p>
                            </div>
                            <div className={styles['NOTE-buttonGroup']}>
                                <button className={styles['NOTE-closeButton']} onClick={(e) => closeDetailsModal(e)}>
                                    <FaTimes /> Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirmModal && (
                    <div className={`${styles['NOTE-modalOverlay']} ${showDeleteConfirmModal ? styles['NOTE-modalOverlayActive'] : ''}`} data-modal="delete-confirm">
                        <div className={`${styles['NOTE-modalContent']} ${styles['NOTE-confirmModal']}`}>
                            <h3>Confirmer la suppression</h3>
                            <p>Êtes-vous sûr de vouloir supprimer cette note ?</p>
                            <div className={styles['NOTE-buttonGroup']}>
                                <button onClick={confirmDelete} className={styles['NOTE-confirmButton']}>Confirmer</button>
                                <button onClick={closeDeleteConfirmModal} className={styles['NOTE-cancelButton']}>Annuler</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Modal (Success/Error) */}
                {showMessageModal && (
                    <div className={`${styles['NOTE-modalOverlay']} ${showMessageModal ? styles['NOTE-modalOverlayActive'] : ''}`} data-modal="message">
                        <div className={`${styles['NOTE-modalContent']} ${styles['NOTE-messageModal']}`}>
                            <h3>{messageModalContent.type === "success" ? "Succès" : "Erreur"}</h3>
                            <p className={messageModalContent.type === "success" ? styles['NOTE-successMessage'] : styles['NOTE-errorMessage']}>
                                {messageModalContent.text}
                            </p>
                            <div className={styles['NOTE-buttonGroup']}>
                                <button onClick={closeMessageModal}>OK</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes List */}
                <div className={styles['NOTE-notesList']}>
                    {notes.length === 0 ? (
                        <p>Aucune note disponible.</p>
                    ) : (
                        notes.map((note, index) => (
                            <div
                                key={note.ID_note || `note-${index}`}
                                className={`${styles['NOTE-noteItem']} ${index % 2 === 0 ? styles['NOTE-rotatePositive'] : styles['NOTE-rotateNegative']}`}
                            >
                                <div className={styles['NOTE-noteContent']}>
                                    <p className={styles['NOTE-noteTitle']}>{note.title}</p>
                                    <p className={styles['NOTE-noteSnippet']}>
                                        {note.content.substring(0, 100) +
                                            (note.content.length > 100 ? "..." : "")}
                                    </p>
                                    <span className={styles['NOTE-noteDate']}>
                                        {new Date(note.updated_at || note.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className={styles['NOTE-noteActions']}>
                                    <button onClick={() => openDetailsModal(note)}>
                                        <FaEye />
                                    </button>
                                    <button onClick={() => openEditModal(note)}>
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const noteId = note.ID_note || note.id;
                                            if (!noteId) {
                                                console.error("Note ID is missing in note object:", note);
                                                setMessageModalContent({ type: "error", text: "Erreur : Impossible de supprimer la note car l'ID est manquant." });
                                                setShowMessageModal(true);
                                                return;
                                            }
                                            openDeleteConfirmModal(noteId);
                                        }}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesFeed;