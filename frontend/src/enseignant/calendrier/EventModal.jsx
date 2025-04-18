"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { format } from "date-fns"
import { Calendar, Clock, X, Edit } from "lucide-react"
import styles from "./calendar.module.css"

function EventModal({ time, date, onClose, onSave, role, eventToEdit }) {
  const [title, setTitle] = useState(eventToEdit?.title || "")
  const [content, setContent] = useState(eventToEdit?.content || "")
  const [type, setType] = useState(eventToEdit?.type || "personal")

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || "")
      setContent(eventToEdit.content || "")
      setType(eventToEdit.type || "personal")
    }
  }, [eventToEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Aucun token trouvé. Veuillez vous reconnecter.")
      return
    }

    try {
      if (eventToEdit && eventToEdit.ID_event) {
        console.log("Envoi de la requête PUT pour l'événement ID:", eventToEdit.ID_event)
        await axios.put(
          `http://localhost:8083/calendar/event/${eventToEdit.ID_event}`,
          {
            title,
            content,
            event_date: format(date, "yyyy-MM-dd"),
            time_slot: time,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        console.log("Requête PUT réussie")
      } else {
        console.log("Envoi de la requête POST pour un nouvel événement")
        await axios.post(
          "http://localhost:8083/calendar/event",
          {
            title,
            content,
            event_date: format(date, "yyyy-MM-dd"),
            time_slot: time,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        console.log("Requête POST réussie")
      }
      onSave()
      onClose()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'événement:", error.response?.data || error.message)
      alert(`Erreur lors de la sauvegarde de l'événement: ${error.response?.data?.message || error.message}`)
    }
  }

  return (
    <div className={styles["CLD-modal"]}>
      <div className={styles["CLD-modal-content"]}>
        <h2>
          {eventToEdit ? (
            <>
              <Edit className={styles["CLD-icon"]} size={20} /> Modifier l'événement
            </>
          ) : (
            <>
              <Calendar className={styles["CLD-icon"]} size={20} /> Ajouter un événement
            </>
          )}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className={styles["CLD-input-group"]}>
            <Calendar className={styles["CLD-icon"]} size={16} />
            <input
              type="text"
              value={format(date, "d MMMM yyyy")}
              readOnly
              className={styles["CLD-input-field"]}
            />
          </div>
          <div className={styles["CLD-input-group"]}>
            <Clock className={styles["CLD-icon"]} size={16} />
            <input
              type="text"
              value={time}
              readOnly
              className={styles["CLD-input-field"]}
            />
          </div>
          <div className={styles["CLD-input-group"]}>
            <input
              type="text"
              placeholder="Titre de l'événement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles["CLD-input-field"]}
              required
            />
          </div>
          <div className={styles["CLD-input-group"]}>
            <textarea
              placeholder="Description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles["CLD-textarea-field"]}
            />
          </div>
          {role === "etudiant" && (
            <div className={styles["CLD-input-group"]}>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={styles["CLD-input-field"]}
              >
                <option value="personal">Événement personnel</option>
                <option value="club_event">Événement de club</option>
              </select>
            </div>
          )}
          <div style={{ display: "flex", gap: "1rem" }}>
            <button type="submit" className={styles["CLD-action-btn"]}>
              Sauvegarder
            </button>
            <button
              type="button"
              className={styles["CLD-action-btn"]}
              onClick={onClose}
            >
              <X className={styles["CLD-icon"]} size={16} />
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventModal