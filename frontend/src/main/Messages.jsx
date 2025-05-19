import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { FaHome, FaSearch, FaPaperPlane, FaTimes, FaUser, FaPaperclip, FaEnvelope } from "react-icons/fa"
import styles from "../main_css_files/messages.module.css"

const Messages = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [emailInput, setEmailInput] = useState("")
  const [recipient, setRecipient] = useState(null)
  const [sentMessages, setSentMessages] = useState([])
  const [receivedMessages, setReceivedMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const messagesListRef = useRef(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [recentContacts, setRecentContacts] = useState([])
  const wsRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectInterval = 5000 // 5 seconds

  const fetchUnreadMessagesCount = async (matricule) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("http://messaging.localhost/api/messages/unread", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        return data.unreadCount || 0
      } else {
        console.error("Erreur lors de la récupération des messages non lus :", data.message)
        return 0
      }
    } catch (err) {
      console.error("Erreur réseau lors de la récupération des messages non lus :", err)
      return 0
    }
  }

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
    if (!storedUser || !storedUser.Matricule) {
      navigate("/")
    } else {
      console.log("Setting user:", storedUser)
      setUser(storedUser)
      loadRecentContacts(storedUser.Matricule)
    }
  }, [navigate])

  useEffect(() => {
    if (!user || !user.Matricule) return

    console.log(`Initializing WebSocket and polling for ${user.Matricule}`)
    fetchReceivedMessages(user.Matricule)

    const connectWebSocket = () => {
      const wsUrl = `${import.meta.env.VITE_REACT_APP_WS_HOST}?matricule=${user.Matricule}`
      console.log(`Attempting WebSocket connection to ${wsUrl}`)
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log(`WebSocket connected for ${user.Matricule}`)
        reconnectAttempts.current = 0 // Reset attempts on successful connection
        setError("") // Clear any previous connection error
      }

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log(`Received WebSocket message for ${user.Matricule}:`, message)
        if (message.type === "new_message" && message.destinataire === user.Matricule) {
          setReceivedMessages((prev) => [...prev, message])
          saveRecentContact({
            Matricule: message.expediteur,
            nom: message.nom,
            prenom: message.prenom,
            email: message.email,
            lastMessageDate: message.date_envoi,
          })
          fetchUnreadMessagesCount(user.Matricule).then((count) => {
            localStorage.setItem(`unreadMessagesCount_${user.Matricule}`, count)
            window.dispatchEvent(new CustomEvent("unreadMessagesCountUpdated", { detail: { count } }))
          })
        }
      }

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket disconnected for ${user.Matricule}. Code: ${event.code}, Reason: ${event.reason}`)
        if (reconnectAttempts.current < maxReconnectAttempts) {
          console.log(`Reconnecting WebSocket in ${reconnectInterval / 1000} seconds... Attempt ${reconnectAttempts.current + 1}`)
          setTimeout(() => {
            reconnectAttempts.current += 1
            connectWebSocket()
          }, reconnectInterval)
        } else {
          console.error(`Max reconnect attempts reached for ${user.Matricule}`)
          setError("Impossible de se connecter au service de messagerie. Veuillez réessayer plus tard.")
        }
      }

      wsRef.current.onerror = (err) => {
        console.error(`WebSocket error for ${user.Matricule}:`, err)
        setError("Erreur de connexion au service de messagerie. Tentative de reconnexion en cours...")
      }
    }

    connectWebSocket()

    const intervalId = setInterval(() => {
      console.log(`Fallback polling for ${user.Matricule} at ${new Date().toISOString()}`)
      fetchReceivedMessages(user.Matricule)
    }, 30000)

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      clearInterval(intervalId)
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [sentMessages, receivedMessages])

  const loadRecentContacts = (matricule) => {
    try {
      const contacts = JSON.parse(localStorage.getItem(`recentContacts_${matricule}`) || "[]") || []
      console.log(`Loaded contacts for ${matricule}:`, contacts)
      setRecentContacts(contacts)
    } catch (err) {
      console.error("Erreur lors du chargement des contacts récents:", err)
      setRecentContacts([])
    }
  }

  const saveRecentContact = (contact) => {
    if (!user || !user.Matricule) {
      console.warn("Cannot save recent contact: user is null")
      return
    }
    try {
      let contacts = JSON.parse(localStorage.getItem(`recentContacts_${user.Matricule}`) || "[]") || []
      console.log(`Saving contact for ${user.Matricule}:`, contact)
      const existingIndex = contacts.findIndex((c) => c.Matricule === contact.Matricule)
      if (existingIndex !== -1) {
        contacts.splice(existingIndex, 1)
      }
      contacts.unshift({
        ...contact,
        lastMessageDate: new Date().toISOString(),
      })
      contacts = contacts.slice(0, 10)
      localStorage.setItem(`recentContacts_${user.Matricule}`, JSON.stringify(contacts))
      setRecentContacts([...contacts])
      console.log(`Updated contacts for ${user.Matricule}:`, contacts)
      loadRecentContacts(user.Matricule)
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du contact récent:", err)
    }
  }

  const handleDeleteContact = (contactMatricule) => {
    try {
      let contacts = JSON.parse(localStorage.getItem(`recentContacts_${user.Matricule}`) || "[]") || []
      console.log(`Deleting contact ${contactMatricule} for ${user.Matricule}`)
      contacts = contacts.filter((c) => c.Matricule !== contactMatricule)
      localStorage.setItem(`recentContacts_${user.Matricule}`, JSON.stringify(contacts))
      setRecentContacts([...contacts])
      console.log(`Contacts after deletion for ${user.Matricule}:`, contacts)
    } catch (err) {
      console.error("Erreur lors de la suppression du contact:", err)
      setError("Erreur lors de la suppression du contact.")
    }
  }

  const fetchReceivedMessages = async (matricule) => {
    if (!user || !user.Matricule) {
      console.warn("Cannot fetch messages: user is null")
      return
    }
    const token = localStorage.getItem("token")
    try {
      const response = await fetch("http://messaging.localhost/api/messages/received", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      console.log(`Fetch response for ${matricule}:`, response.status, response.statusText)
      const data = await response.json()
      console.log(`Received messages for ${matricule}:`, data)
      if (response.ok) {
        setReceivedMessages(data)
        data.forEach((msg) => {
          console.log(`Processing message from ${msg.expediteur}:`, msg)
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
      console.error("Erreur réseau lors de la récupération des messages reçus:", err)
      setError("Erreur réseau lors de la récupération des messages reçus.")
    }
  }

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
      } else {
        fetchUnreadMessagesCount(user.Matricule).then((count) => {
          localStorage.setItem(`unreadMessagesCount_${user.Matricule}`, count)
          window.dispatchEvent(new CustomEvent("unreadMessagesCountUpdated", { detail: { count } }))
        })
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
        data.role = user?.role
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
    fetchMessagesForRecipient(selectedRecipient.Matricule)
    markMessagesAsRead(selectedRecipient.Matricule, user?.Matricule)
    saveRecentContact(selectedRecipient)
  }

  const handleContactClick = (contact) => {
    setRecipient(contact)
    fetchMessagesForRecipient(contact.Matricule)
    markMessagesAsRead(contact.Matricule, user?.Matricule)
  }

  const fetchMessagesForRecipient = async (recipientMatricule) => {
    const token = localStorage.getItem("token")
    try {
      const response = await fetch(
        `http://messaging.localhost/api/messages?expediteur=${user?.Matricule}&destinataire=${recipientMatricule}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      const data = await response.json()
      if (response.ok) {
        setSentMessages(data.filter((msg) => msg.expediteur === user?.Matricule))
        setReceivedMessages(data.filter((msg) => msg.destinataire === user?.Matricule))
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
    formData.append("expediteur", user?.Matricule)
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
          expediteur: user?.Matricule,
          destinataire: recipient.Matricule,
          contenu: newMessage || "",
          date_envoi: new Date().toISOString(),
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

  const allMessages = [...sentMessages, ...receivedMessages].sort(
    (a, b) => new Date(a.date_envoi) - new Date(b.date_envoi),
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
                <div key={index} className={styles["MSG-contact-item"]}>
                  <div className={styles["MSG-contact-info"]} onClick={() => handleContactClick(contact)}>
                    <h4>
                      {contact.nom} {contact.prenom}
                      {receivedMessages.some((msg) => msg.expediteur === contact.Matricule && msg.isRead === 0) && (
                        <span className={styles["MSG-unread-dot"]} />
                      )}
                    </h4>
                    <p>{contact.email}</p>
                    <span>{new Date(contact.lastMessageDate).toLocaleDateString()}</span>
                  </div>
                  <button
                    className={styles["MSG-delete-contact-btn"]}
                    onClick={() => handleDeleteContact(contact.Matricule)}
                  >
                    <FaTimes />
                  </button>
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
                          msg.expediteur === user?.Matricule ? styles["MSG-sent"] : styles["MSG-received"]
                        }`}
                      >
                        <p>{msg.contenu}</p>
                        {msg.filePath && (
                          <div className={styles["MSG-file-attachment"]}>
                            <span>Fichier : </span>
                            <a
                              href={`http://messaging.localhost/uploads/${msg.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
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