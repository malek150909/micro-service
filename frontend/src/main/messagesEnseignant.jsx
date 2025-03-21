import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../admin_css_files/messages.css";

const Messages = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [emailInput, setEmailInput] = useState("");
    const [recipient, setRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [error, setError] = useState("");

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
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log("Received messages data:", data);
            if (response.ok) {
                setReceivedMessages(data);
            } else {
                setError(`Erreur lors du chargement des messages reçus : ${data.message || response.statusText}`);
            }
        } catch (err) {
            setError(`Erreur réseau : ${err.message}`);
            console.error("Erreur réseau détaillée:", err);
        }
    };

    const handleSearchRecipient = async () => {
        const token = localStorage.getItem("token");
        const normalizedEmail = emailInput.trim().toLowerCase();
        console.log("Searching for email:", normalizedEmail);
        try {
            const response = await fetch(`http://localhost:8082/api/users/search?email=${normalizedEmail}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log("Response data:", data);
            if (response.ok && data && data.Matricule) {
                setRecipient(data);
                setError("");
                fetchMessages(data.Matricule);
            } else if (data.message === "Non autorisé" || data.message === "Token invalide") {
                setError("Veuillez vous reconnecter (session expirée).");
                navigate("/");
            } else {
                setError("Utilisateur non trouvé.");
                setRecipient(null);
            }
        } catch (err) {
            setError("Erreur lors de la recherche.");
            console.error("Erreur réseau:", err);
        }
    };

    const fetchMessages = async (recipientMatricule) => {
        const token = localStorage.getItem("token");
        try {
            const response = await fetch(
                `http://localhost:8082/api/messages?expediteur=${user.Matricule}&destinataire=${recipientMatricule}`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );
            const data = await response.json();
            setMessages(data);
        } catch (err) {
            setError("Erreur lors du chargement des messages.");
            console.error("Erreur réseau:", err);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !recipient) return;
        const token = localStorage.getItem("token");
        try {
            const messageData = {
                expediteur: user.Matricule,
                destinataire: recipient.Matricule,
                contenu: newMessage,
                date_envoi: new Date().toISOString()
            };
            const response = await fetch("http://localhost:8082/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(messageData)
            });
            const data = await response.json();
            if (response.ok) {
                setMessages([...messages, data]);
                setNewMessage("");
            } else {
                setError(`Erreur lors de l'envoi du message : ${data.message || response.statusText}`);
            }
        } catch (err) {
            setError(`Erreur réseau : ${err.message}`);
            console.error("Erreur réseau détaillée:", err);
        }
    };

    const handleMessageClick = (message) => {
        const selectedRecipient = {
            Matricule: message.expediteur,
            nom: message.nom,
            prenom: message.prenom,
            email: message.email || ""
        };
        setRecipient(selectedRecipient);
        fetchMessages(message.expediteur);
    };

    // Nouvelle fonction pour fermer la discussion
    const handleCloseChat = () => {
        setRecipient(null); // Réinitialise le destinataire
        setMessages([]); // Vide les messages affichés
        setNewMessage(""); // Réinitialise le champ de saisie
    };

    return (
        <div className="messages-page">
            <div className="messages-container">
                <h2 className="messages-title">Messagerie</h2>

                {/* Liste des messages reçus */}
                <div className="received-messages">
                    <h3>Messages reçus</h3>
                    {receivedMessages.length > 0 ? (
                        receivedMessages.map((msg) => (
                            <div
                                key={msg.ID_message}
                                className="received-message-item"
                                onClick={() => handleMessageClick(msg)}
                                style={{ cursor: "pointer" }}
                            >
                                <p>
                                    <strong>{msg.nom} {msg.prenom}</strong> ({msg.expediteur}) : {msg.contenu}
                                </p>
                                <span>{new Date(msg.date_envoi).toLocaleString()}</span>
                            </div>
                        ))
                    ) : (
                        <p>Aucun message reçu pour l'instant.</p>
                    )}
                </div>

                {/* Section pour chercher et envoyer des messages */}
                <div className="search-section">
                    <div className="form-group">
                        <label>Rechercher un destinataire par email</label>
                        <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="Entrez l'email"
                        />
                    </div>
                    <button className="messages-btn search" onClick={handleSearchRecipient}>
                        Rechercher
                    </button>
                </div>
                {error && <p className="messages-error">{error}</p>}
                {recipient && (
                    <div className="chat-section">
                        <div className="recipient-info">
                            <h3>Discussion avec {recipient.nom} {recipient.prenom}</h3>
                            <button className="messages-btn close" onClick={handleCloseChat}>
                                Fermer
                            </button>
                        </div>
                        <div className="messages-list">
                            {messages.length > 0 ? (
                                messages.map((msg) => (
                                    <div
                                        key={msg.ID_message}
                                        className={`message-item ${msg.expediteur === user.Matricule ? "sent" : "received"}`}
                                    >
                                        <p>{msg.contenu}</p>
                                        <span>{new Date(msg.date_envoi).toLocaleTimeString()}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="no-messages">Aucun message pour l'instant.</p>
                            )}
                        </div>
                        <div className="message-input">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Tapez votre message..."
                            />
                            <button className="messages-btn send" onClick={handleSendMessage}>
                                Envoyer
                            </button>
                        </div>
                    </div>
                )}
                <button className="messages-btn back" onClick={() => navigate("/enseignant")}>
                    Retour
                </button>
            </div>
        </div>
    );
};

export default Messages;