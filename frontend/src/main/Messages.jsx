"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FaHome, FaSearch, FaPaperPlane, FaTimes, FaUser, FaPaperclip, FaEnvelope } from "react-icons/fa"
import styles from "../admin_css_files/messages.module.css"

const Messages = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [emailInput, setEmailInput] = useState("")
  const [recipient, setRecipient] = useState(null)
  const [sentMessages, setSentMessages] = useState([])
  const [receivedMessages, setReceivedMessages] = useState([]) // Nouvel état pour les messages reçus
  const [newMessage, setNewMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const messagesListRef = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [recentContacts, setRecentContacts] = useState([])

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
    if (!storedUser || !storedUser.Matricule) {
      navigate("/")
    } else {
      setUser(storedUser)
      loadRecentContacts()
      // Charger les messages reçus au démarrage
      fetchReceivedMessages(storedUser.Matricule)
    }
  }, [navigate])

  useEffect(() => {
    scrollToBottom()
  }, [sentMessages, receivedMessages])

  // Charger les contacts récents
  const loadRecentContacts = () => {
    try {
      const contacts = JSON.parse(localStorage.getItem("recentContacts")) || []
      setRecentContacts(contacts)
    } catch (err) {
      console.error("Erreur lors du chargement des contacts récents:", err)
      setRecentContacts([])
    }
  }

  // Sauvegarder un contact récent
  const saveRecentContact = (contact) => {
    try {
      let contacts = JSON.parse(localStorage.getItem("recentContacts")) || []
      const existingIndex = contacts.findIndex((c) => c.Matricule === contact.Matricule)
      if (existingIndex !== -1) {
        contacts.splice(existingIndex, 1)
      }
      contacts.unshift({
        ...contact,
        lastMessageDate: new Date().toISOString(),
      })
      contacts = contacts.slice(0, 10)
      localStorage.setItem("recentContacts", JSON.stringify(contacts))
      setRecentContacts(contacts)
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du contact récent:", err)
    }
  }

  // Récupérer les messages reçus
  const fetchReceivedMessages = async (matricule) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("http://messaging.localhost/api/messages/received", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setReceivedMessages(data)
        // Mettre à jour les contacts récents avec les expéditeurs des messages reçus
        data.forEach((msg) => {
          saveRecentContact({
            Matricule: msg.expediteur,
            nom: msg.nom,
            prenom: msg.prenom,
            email: msg.email,
            lastMessageDate: msg.date_envoi,
          })
        })
      } else {
        setError("Erreur lors de la récupération des messages reçus.")
      }
    } catch (err) {
      setError("Erreur réseau lors de la récupération des messages reçus.")
    }
  }

  // Marquer les messages comme lus
  const markMessagesAsRead = async (expediteur, destinataire) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("http://messaging.localhost/api/messages/mark-as-read", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expediteur, destinataire }),
      })
      if (!response.ok) {
        console.error("Erreur lors du marquage des messages comme lus.")
      }
    } catch (err) {
      console.error("Erreur réseau lors du marquage des messages comme lus:", err)
    }
  }

  const handleSearchRecipient = async () => {
    setError("")
    const token = localStorage.getItem("token")
    const normalizedEmail = emailInput.trim().toLowerCase()
    try {
      const response = await fetch(`http://messaging.localhost/api/users/search?email=${normalizedEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (response.ok && data && data.Matricule) {
        data.role = user.role
        setSearchResults(data)
        setError("")
      } else {
        setError("Utilisateur non trouvé.")
        setSearchResults(null)
      }
    } catch (err) {
      setError("Erreur lors de la recherche.")
      setSearchResults(null)
    }
  }

  const handleSelectRecipient = (selectedRecipient) => {
    setRecipient(selectedRecipient)
    setIsModalOpen(false)
    setEmailInput("")
    setSearchResults(null)
    setSentMessages([])
    // Charger les messages envoyés et reçus pour ce destinataire
    fetchMessagesForRecipient(selectedRecipient.Matricule)
    // Marquer les messages comme lus
    markMessagesAsRead(selectedRecipient.Matricule, user.Matricule)
    saveRecentContact(selectedRecipient)
  }

  const handleContactClick = (contact) => {
    setRecipient(contact)
    fetchMessagesForRecipient(contact.Matricule)
    // Marquer les messages comme lus
    markMessagesAsRead(contact.Matricule, user.Matricule)
  }

  // Récupérer les messages envoyés et reçus pour un destinataire spécifique
  const fetchMessagesForRecipient = async (recipientMatricule) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(
        `http://messaging.localhost/api/messages?expediteur=${user.Matricule}&destinataire=${recipientMatricule}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const data = await response.json()
      if (response.ok) {
        setSentMessages(data.filter((msg) => msg.expediteur === user.Matricule))
        setReceivedMessages(data.filter((msg) => msg.destinataire === user.Matricule))
      } else {
        setError("Erreur lors de la récupération des messages.")
      }
    } catch (err) {
      setError("Erreur réseau lors de la récupération des messages.")
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return
  
    setError("")
    setSuccess("")
  
    const token = localStorage.getItem("token")
    const formData = new FormData()
    formData.append("expediteur", user.Matricule)
    formData.append("destinataire", recipient.Matricule)
    formData.append("contenu", newMessage || "")
    if (selectedFile) {
      formData.append("file", selectedFile)
    }
  
    try {
      const response = await fetch("http://messaging.localhost/api/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })
      const data = await response.json()
  
      if (response.ok) {
        const newMessageData = {
          ID_message: data.ID_message || Date.now(),
          expediteur: user.Matricule,
          destinataire: recipient.Matricule,
          contenu: newMessage || "",
          date_envoi: new Date().toISOString(), // Utilisé localement pour l'affichage
          filePath: data.filePath || null,
          fileName: selectedFile ? selectedFile.name : null,
        }
  
        setSentMessages([...sentMessages, newMessageData])
        setNewMessage("")
        setSelectedFile(null)
        setSuccess(`Message envoyé avec succès à ${recipient.email}`)
        saveRecentContact({
          ...recipient,
          lastMessageDate: new Date().toISOString(),
        })
  
        setTimeout(() => {
          setSuccess("")
        }, 5000)
      } else {
        setError(`Erreur lors de l'envoi du message : ${data.message || response.statusText}`)
      }
    } catch (err) {
      setError(`Erreur réseau : ${err.message}`)
    }
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const handleCloseChat = () => {
    setRecipient(null)
    setSentMessages([])
    setReceivedMessages([])
    setNewMessage("")
    setSelectedFile(null)
  }

  const scrollToBottom = () => {
    if (messagesListRef.current) {
      messagesListRef.current.scrollTop = messagesListRef.current.scrollHeight
    }
  }

  const handleNavigateHome = () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
    if (storedUser.role === "admin") navigate("/admin")
    else if (storedUser.role === "enseignant") navigate("/enseignant")
    else if (storedUser.role === "etudiant") navigate("/etudiant")
  }

  // Fusionner et trier les messages envoyés et reçus
  const allMessages = [...sentMessages, ...receivedMessages].sort(
    (a, b) => new Date(a.date_envoi) - new Date(b.date_envoi)
  )

  return (
    <div>
      <div className={styles["MSG-messages-page"]}>
        <div className={styles["MSG-messages-container"]}>
          <aside className={styles["MSG-sidebar"]}>
            <div className={styles["MSG-logo"]}>
              <h2>
                <FaEnvelope /> Messagerie Email
              </h2>
            </div>
            <button className={styles["MSG-sidebar-button"]} onClick={handleNavigateHome}>
              <FaHome /> Retour à l'accueil
            </button>
            <button className={styles["MSG-sidebar-button"]} onClick={() => setIsModalOpen(true)}>
              <FaSearch /> Rechercher
            </button>
          </aside>

          <section className={styles["MSG-contacts-list"]}>
            <h3>
              <FaUser /> Contacts Récents
            </h3>
            {recentContacts.length > 0 ? (
              recentContacts.map((contact, index) => (
                <div key={index} className={styles["MSG-contact-item"]} onClick={() => handleContactClick(contact)}>
                  <div className={styles["MSG-contact-info"]}>
                    <h4>
                      {contact.nom} {contact.prenom}
                      {/* Afficher un indicateur pour les messages non lus */}
                      {receivedMessages.some(
                        (msg) => msg.expediteur === contact.Matricule && msg.isRead === 0
                      ) && <span className={styles["MSG-unread-dot"]} />}
                    </h4>
                    <p>{contact.email}</p>
                  </div>
                  <span>{new Date(contact.lastMessageDate).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p className={styles["MSG-no-contacts"]}>Aucun contact récent.</p>
            )}
          </section>

          <main className={styles["MSG-main-content"]}>
            <header className={styles["MSG-header"]}>
              <h1>
                <FaEnvelope /> Messagerie Email{" "}
                {user?.role === "admin" ? "Admin" : user?.role === "enseignant" ? "Enseignant" : "Étudiant"}
              </h1>
              <p>Envoyez des emails directement depuis l'application</p>
            </header>

            {error && <p className={styles["MSG-messages-error"]}>{error}</p>}
            {success && <p className={styles["MSG-messages-success"]}>{success}</p>}

            {recipient && (
              <div className={styles["MSG-chat-section"]}>
                <div className={styles["MSG-recipient-info"]}>
                  <h3>
                    Conversation avec {recipient.nom} {recipient.prenom} ({recipient.email})
                  </h3>
                  <button className={`${styles["MSG-messages-btn"]} ${styles["MSG-close"]}`} onClick={handleCloseChat}>
                    <FaTimes /> Fermer
                  </button>
                </div>
                <div className={styles["MSG-messages-list"]} ref={messagesListRef}>
                  {allMessages.length > 0 ? (
                    allMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`${styles["MSG-message-item"]} ${
                          msg.expediteur === user.Matricule ? styles["MSG-sent"] : styles["MSG-received"]
                        }`}
                      >
                        <p>{msg.contenu}</p>
                        {msg.filePath && (
                          <div className={styles["MSG-file-attachment"]}>
                            <span>Fichier : </span>
                            <a href={`http://messaging.localhost/Uploads/${msg.filePath}`} target="_blank" rel="noopener noreferrer">
                              {msg.fileName || "Fichier sans nom"}
                            </a>
                          </div>
                        )}
                        <span>{new Date(msg.date_envoi).toLocaleTimeString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles["MSG-no-messages"]}>
                      Aucun message pour l'instant. Les messages envoyés et reçus apparaîtront ici.
                    </p>
                  )}
                </div>
                <div className={styles["MSG-message-input"]}>
                  {selectedFile && (
                    <div className={styles["MSG-selected-file"]}>
                      <span>{selectedFile.name}</span>
                      <button className={styles["MSG-remove-file-btn"]} onClick={handleRemoveFile}>
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                  />
                  <label className={styles["MSG-file-upload-btn"]}>
                    <FaPaperclip />
                    <input type="file" onChange={handleFileChange} style={{ display: "none" }} />
                  </label>
                  <button className={`${styles["MSG-messages-btn"]} ${styles["MSG-send"]}`} onClick={handleSendMessage}>
                    <FaPaperPlane /> Envoyer
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles["MSG-modal-overlay"]}>
          <div className={styles["MSG-modal-content"]}>
            <div className={styles["MSG-modal-header"]}>
              <h2>Rechercher un utilisateur</h2>
              <button className={styles["MSG-modal-close-btn"]} onClick={() => setIsModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className={styles["MSG-modal-body"]}>
              <div className={styles["MSG-form-group"]}>
                <label>Rechercher par email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Entrez l'email"
                />
              </div>
              <button className={styles["MSG-modal-search-btn"]} onClick={handleSearchRecipient}>
                <FaSearch /> Rechercher
              </button>
              {searchResults && (
                <div className={styles["MSG-search-result"]}>
                  <div className={styles["MSG-contact-item"]} onClick={() => handleSelectRecipient(searchResults)}>
                    <div className={styles["MSG-contact-info"]}>
                      <h4>
                        {searchResults.nom} {searchResults.prenom}
                      </h4>
                      <p>{searchResults.email}</p>
                    </div>
                  </div>
                </div>
              )}
              {error && <p className={styles["MSG-messages-error"]}>{error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages