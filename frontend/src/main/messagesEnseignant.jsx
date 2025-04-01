import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaSearch, FaUser, FaPaperPlane, FaTimes } from "react-icons/fa";
import "../admin_css_files/messages.css";

const Messages = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [emailInput, setEmailInput] = useState("");
    const [recipient, setRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "enseignant") {
            navigate("/");
        } else {
            setUser(storedUser);
            fetchReceivedMessages(storedUser.Matricule);
        }
    }, [navigate]);

    const fetchReceivedMessages = async (matricule) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch("http://localhost:8082/api/messages/received", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setReceivedMessages(data);
            } else {
                setError(`Erreur: ${data.message || response.statusText}`);
            }
        } catch (err) {
            setError(`Erreur réseau: ${err.message}`);
        }
    };

    const handleSearchRecipient = async () => {
        const token = localStorage.getItem("token");
        const normalizedEmail = emailInput.trim().toLowerCase();
        try {
            const response = await fetch(`http://localhost:8082/api/users/search?email=${normalizedEmail}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data && data.Matricule) {
                setRecipient(data);
                setError("");
                fetchMessages(data.Matricule);
            } else {
                setError("Utilisateur non trouvé.");
                setRecipient(null);
            }
        } catch (err) {
            setError("Erreur lors de la recherche.");
        }
    };

    const fetchMessages = async (recipientMatricule) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(
                `http://localhost:8082/api/messages?expediteur=${user.Matricule}&destinataire=${recipientMatricule}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            const data = await response.json();
            setMessages(data);

            const unreadMessages = receivedMessages.filter(m => 
                m.expediteur === recipientMatricule && !m.isRead
            );
            if (unreadMessages.length > 0) {
                const messageIds = unreadMessages.map(m => m.ID_message);
                await markMessagesAsRead(messageIds);
                await fetchReceivedMessages(user.Matricule);
            }
        } catch (err) {
            setError("Erreur lors du chargement des messages.");
        }
    };

    const markMessagesAsRead = async (messageIds) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch("http://localhost:8082/api/messages/markAsRead", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ messageIds })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erreur lors du marquage des messages comme lus");
            }
        } catch (err) {
            console.error("Erreur lors du marquage des messages comme lus:", err);
            setError(`Erreur: ${err.message}`);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedFile) return;
        if (!recipient) return;

        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("expediteur", user.Matricule);
        formData.append("destinataire", recipient.Matricule);
        formData.append("contenu", newMessage || "");
        formData.append("isRead", false);
        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        try {
            const response = await fetch("http://localhost:8082/api/messages", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                setMessages(prevMessages => [...prevMessages, data]); // Ajout à la fin
                setNewMessage("");
                setSelectedFile(null);
                fetchMessages(recipient.Matricule); // Rafraîchir la liste complète
                fetchReceivedMessages(user.Matricule); // Mettre à jour les contacts
            } else {
                setError(`Erreur: ${data.message || response.statusText}`);
            }
        } catch (err) {
            setError(`Erreur réseau: ${err.message}`);
        }
    };

    const handleContactClick = (message) => {
        const selectedRecipient = {
            Matricule: message.expediteur,
            nom: message.nom,
            prenom: message.prenom,
            email: message.email || ""
        };
        setRecipient(selectedRecipient);
        fetchMessages(message.expediteur);
    };

    const handleCloseChat = () => {
        setRecipient(null);
        setMessages([]);
        setNewMessage("");
        setSelectedFile(null);
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    return (
        <div id="messages">
            <div className="container">
                <div className="background-shapes">
                    <div className="shape shape1"></div>
                    <div className="shape shape2"></div>
                </div>

                <aside className="sidebar">
                    <div className="logo">
                        <h2>Messagerie</h2>
                    </div>
                    <button className="sidebar-button" onClick={() => navigate("/enseignant")}>
                        <FaHome /> Retour à l'accueil
                    </button>
                    <button className="sidebar-button" onClick={() => setShowSearch(!showSearch)}>
                        <FaSearch /> {showSearch ? "Masquer la recherche" : "Chercher un utilisateur"}
                    </button>
                </aside>

                <div className="contacts-panel">
                    <div className="contacts-section">
                        <h4>Derniers contacts</h4>
                        {receivedMessages.length === 0 ? (
                            <p className="no-results">Aucune conversation récente</p>
                        ) : (
                            <ul>
                                {Array.from(
                                    new Map(
                                        receivedMessages.map(msg => [msg.expediteur, msg])
                                    ).values()
                                ).map((msg) => (
                                    <li 
                                        key={msg.ID_message} 
                                        className={`event-item ${!msg.isRead ? 'unread' : ''}`}
                                        onClick={() => handleContactClick(msg)}
                                    >
                                        <div className="event-info">
                                            <h4>{msg.nom} {msg.prenom}</h4>
                                            <p>{msg.contenu.substring(0, 30)}...</p>
                                        </div>
                                        <div className="event-stats">
                                            <p>{new Date(msg.date_envoi).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <main className="main-content">
                    <header className="header">
                        <h1><FaUser /> Messagerie enseignant</h1>
                        <p>Gérez vos conversations efficacement</p>
                    </header>

                    {showSearch && (
                        <div className="search-bar">
                            <span className="search-icon"><FaSearch /></span>
                            <input
                                type="email"
                                placeholder="Rechercher par email..."
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearchRecipient()}
                            />
                            <button onClick={handleSearchRecipient}>Rechercher</button>
                        </div>
                    )}

                    {error && <p className="error-message">{error}</p>}

                    {recipient && (
                        <div className="chat-section">
                            <div className="chat-header">
                                <h3>Discussion avec {recipient.nom} {recipient.prenom}</h3>
                                <button className="close-button" onClick={handleCloseChat}>
                                    <FaTimes /> Fermer
                                </button>
                            </div>
                            <div className="messages-list">
                                {messages.map((msg) => (
                                    <div 
                                        key={msg.ID_message}
                                        className={`message-item ${msg.expediteur === user.Matricule ? 'sent' : 'received'}`}
                                    >
                                        {msg.contenu && <p>{msg.contenu}</p>}
                                        {msg.filePath && (
                                            <div className="file-preview">
                                                {msg.filePath.match(/\.(jpg|jpeg|png)$/i) ? (
                                                    <img src={`http://localhost:8082/${msg.filePath}`} alt="Prévisualisation" />
                                                ) : (
                                                    <a href={`http://localhost:8082/${msg.filePath}`} target="_blank" rel="noopener noreferrer">
                                                        Télécharger le fichier
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <span>{new Date(msg.date_envoi).toLocaleTimeString()}</span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} /> {/* Point d'ancrage pour le défilement */}
                            </div>
                            <div className="message-input">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Tapez votre message..."
                                />
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,application/pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    className="file-input"
                                />
                                <button onClick={handleSendMessage}>
                                    <FaPaperPlane /> Envoyer
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Messages;