import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaSearch, FaPaperPlane, FaTimes, FaUser } from "react-icons/fa";
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
  const messagesListRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // État pour la fenêtre modale
  const [searchResults, setSearchResults] = useState(null); // Résultats de la recherche

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "admin") {
      navigate("/");
    } else {
      setUser(storedUser);
      fetchReceivedMessages(storedUser.Matricule);
    }
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchReceivedMessages = async (matricule) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:8082/api/messages/received", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setReceivedMessages(data);
      } else {
        setError(`Erreur lors du chargement des messages reçus : ${data.message || response.statusText}`);
      }
    } catch (err) {
      setError(`Erreur réseau : ${err.message}`);
    }
  };

  const handleSearchRecipient = async () => {
    const token = localStorage.getItem("token");
    const normalizedEmail = emailInput.trim().toLowerCase();
    try {
      const response = await fetch(`http://localhost:8082/api/users/search?email=${normalizedEmail}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data && data.Matricule) {
        setSearchResults(data); // Affiche les résultats dans la modale
        setError("");
      } else {
        setError("Utilisateur non trouvé.");
        setSearchResults(null);
      }
    } catch (err) {
      setError("Erreur lors de la recherche.");
      setSearchResults(null);
    }
  };

  const handleSelectRecipient = (selectedRecipient) => {
    setRecipient(selectedRecipient);
    setIsModalOpen(false); // Ferme la modale
    setEmailInput(""); // Réinitialise le champ
    setSearchResults(null); // Réinitialise les résultats
    fetchMessages(selectedRecipient.Matricule); // Charge les messages
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
    } catch (err) {
      setError("Erreur lors du chargement des messages.");
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
        date_envoi: new Date().toISOString(),
      };
      const response = await fetch("http://localhost:8082/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(messageData),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages([...messages, data]);
        setNewMessage("");
        fetchReceivedMessages(user.Matricule);
      } else {
        setError(`Erreur lors de l'envoi du message : ${data.message || response.statusText}`);
      }
    } catch (err) {
      setError(`Erreur réseau : ${err.message}`);
    }
  };

  const handleMessageClick = (message) => {
    const selectedRecipient = {
      Matricule: message.expediteur,
      nom: message.nom,
      prenom: message.prenom,
      email: message.email || "",
    };
    setRecipient(selectedRecipient);
    fetchMessages(message.expediteur);
  };

  const handleCloseChat = () => {
    setRecipient(null);
    setMessages([]);
    setNewMessage("");
  };

  const uniqueContacts = () => {
    const contactsMap = new Map();
    receivedMessages.forEach((msg) => {
      if (!contactsMap.has(msg.expediteur) || new Date(msg.date_envoi) > new Date(contactsMap.get(msg.expediteur).date_envoi)) {
        contactsMap.set(msg.expediteur, msg);
      }
    });
    return Array.from(contactsMap.values()).sort((a, b) => new Date(b.date_envoi) - new Date(a.date_envoi));
  };

  const scrollToBottom = () => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight;
    }
  };

  const contacts = uniqueContacts();

  return (
    <div id="messages">
      <div className="messages-page">
        <div className="messages-container">
          <aside className="sidebar">
            <div className="logo">
              <h2>Messagerie</h2>
            </div>
            <button className="sidebar-button" onClick={() => navigate("/admin")}>
              <FaHome /> Retour à l'accueil
            </button>
            <button className="sidebar-button" onClick={() => setIsModalOpen(true)}>
              <FaSearch /> Rechercher
            </button>
          </aside>

          <section className="contacts-list">
            <h3>
              <FaUser /> Derniers Contacts
            </h3>
            {contacts.length > 0 ? (
              contacts.map((msg) => (
                <div
                  key={msg.ID_message}
                  className="contact-item"
                  onClick={() => handleMessageClick(msg)}
                >
                  <div className="contact-info">
                    <h4>
                      {msg.nom} {msg.prenom}
                    </h4>
                    <p>{msg.contenu.substring(0, 30)}...</p>
                  </div>
                  <span>{new Date(msg.date_envoi).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p className="no-contacts">Aucun message reçu.</p>
            )}
          </section>

          <main className="main-content">
            <header className="header">
              <h1>
                <FaPaperPlane /> Messagerie Admin
              </h1>
              <p>Gérez vos conversations ici</p>
            </header>

            {error && <p className="messages-error">{error}</p>}

            {recipient && (
              <div className="chat-section">
                <div className="recipient-info">
                  <h3>
                    Discussion avec {recipient.nom} {recipient.prenom}
                  </h3>
                  <button className="messages-btn close" onClick={handleCloseChat}>
                    <FaTimes /> Fermer
                  </button>
                </div>
                <div className="messages-list" ref={messagesListRef}>
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.ID_message}
                        className={`message-item ${
                          msg.expediteur === user.Matricule ? "sent" : "received"
                        }`}
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
                    <FaPaperPlane /> Envoyer
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Fenêtre modale pour la recherche */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Rechercher un utilisateur</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Rechercher par email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Entrez l'email"
                />
              </div>
              <button className="modal-search-btn" onClick={handleSearchRecipient}>
                <FaSearch /> Rechercher
              </button>
              {searchResults && (
                <div className="search-result">
                  <div
                    className="contact-item"
                    onClick={() => handleSelectRecipient(searchResults)}
                  >
                    <div className="contact-info">
                      <h4>
                        {searchResults.nom} {searchResults.prenom}
                      </h4>
                      <p>{searchResults.email}</p>
                    </div>
                  </div>
                </div>
              )}
              {error && <p className="messages-error">{error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;