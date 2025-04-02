import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaSearch, FaPaperPlane, FaTimes, FaUser, FaPaperclip } from "react-icons/fa";
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
  const messagesListRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

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
        const filteredMessages = data.filter(msg => msg.destinataire === matricule && msg.expediteur !== matricule);
        console.log("Messages reçus filtrés :", filteredMessages);
        setReceivedMessages(filteredMessages);
      } else {
        setError(`Erreur lors du chargement des messages reçus : ${data.message || response.statusText}`);
      }
    } catch (err) {
      setError(`Erreur réseau : ${err.message}`);
    }
  };

  const handleSearchRecipient = async () => {
    setError("");
    const token = localStorage.getItem("token");
    const normalizedEmail = emailInput.trim().toLowerCase();
    try {
      const response = await fetch(`http://localhost:8082/api/users/search?email=${normalizedEmail}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data && data.Matricule) {
        setSearchResults(data);
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
    setIsModalOpen(false);
    setEmailInput("");
    setSearchResults(null);
    fetchMessages(selectedRecipient.Matricule);
    markMessagesAsRead(selectedRecipient.Matricule);
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
    if (!newMessage.trim() && !selectedFile) return;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("expediteur", user.Matricule);
    formData.append("destinataire", recipient.Matricule);
    formData.append("contenu", newMessage || "");
    formData.append("date_envoi", new Date().toISOString());
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      const response = await fetch("http://localhost:8082/api/messages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        const newMessageData = {
          ID_message: data.ID_message || Date.now(),
          expediteur: user.Matricule,
          destinataire: recipient.Matricule,
          contenu: newMessage || "",
          date_envoi: new Date().toISOString(),
          filePath: data.filePath || null,
          fileName: selectedFile ? selectedFile.name : null, // Utiliser le nom d'origine du fichier
          isRead: 0,
        };
        console.log("Nouveau message ajouté :", newMessageData);
        setMessages([...messages, newMessageData]);
        setNewMessage("");
        setSelectedFile(null);
      } else {
        setError(`Erreur lors de l'envoi du message : ${data.message || response.statusText}`);
      }
    } catch (err) {
      setError(`Erreur réseau : ${err.message}`);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const markMessagesAsRead = async (expediteurMatricule) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:8082/api/messages/mark-as-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          expediteur: expediteurMatricule,
          destinataire: user.Matricule,
        }),
      });
      fetchReceivedMessages(user.Matricule);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de isRead :", err);
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
    markMessagesAsRead(message.expediteur);
  };

  const handleCloseChat = () => {
    setRecipient(null);
    setMessages([]);
    setNewMessage("");
    setSelectedFile(null);
  };

  const uniqueContacts = () => {
    const contactsMap = new Map();
    const filteredReceived = receivedMessages.filter(msg => msg.expediteur !== user.Matricule && msg.destinataire === user.Matricule);
    filteredReceived.forEach((msg) => {
      if (!contactsMap.has(msg.expediteur) || new Date(msg.date_envoi) > new Date(contactsMap.get(msg.expediteur).date_envoi)) {
        contactsMap.set(msg.expediteur, msg);
      }
    });
    return Array.from(contactsMap.values()).sort((a, b) => new Date(b.date_envoi) - new Date(a.date_envoi));
  };

  const hasUnreadMessages = (expediteurMatricule) => {
    return receivedMessages.some(
      (msg) => msg.expediteur === expediteurMatricule && msg.isRead === 0 && msg.destinataire === user.Matricule
    );
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
              <h2>Messagerie`  Messagerie</h2>
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
                    <h4 className={hasUnreadMessages(msg.expediteur) ? "unread" : ""}>
                      {msg.nom} {msg.prenom}
                      {hasUnreadMessages(msg.expediteur) && <span className="unread-dot"></span>}
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
                        {msg.filePath && (
                          <div className="file-attachment">
                            <span>Fichier : {msg.fileName || "Fichier sans nom"}</span>
                            <a
                              href={`http://localhost:8082/uploads/${msg.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Voir le fichier
                            </a>
                          </div>
                        )}
                        <span>{new Date(msg.date_envoi).toLocaleTimeString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-messages">Aucun message pour l'instant.</p>
                  )}
                </div>
                <div className="message-input">
                  {selectedFile && (
                    <div className="selected-file">
                      <span>{selectedFile.name}</span>
                      <button className="remove-file-btn" onClick={handleRemoveFile}>
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                  />
                  <label className="file-upload-btn">
                    <FaPaperclip />
                    <input
                      type="file"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                  <button className="messages-btn send" onClick={handleSendMessage}>
                    <FaPaperPlane /> Envoyer
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

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