"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Save, X, Calendar, Clock, FileText, Edit } from "lucide-react"
import styles from "./calendar.module.css"

function EventModal({ time, date, onClose, onSave, role, eventToEdit }) {
  const [title, setTitle] = useState(eventToEdit?.title || "")
  const [content, setContent] = useState(eventToEdit?.content || "")

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title)
      setContent(eventToEdit.content)
    }
  }, [eventToEdit])

  const handleSave = async () => {
    try {
      const body = {
        title,
        content,
        event_date: format(date, "yyyy-MM-dd"),
        time_slot: time,
      }

      if (eventToEdit) {
        const response = await fetch(`http://localhost:8083/calendar/event/${eventToEdit.ID_event}`, {
          method: 'PUT',
          headers: {
            'matricule': matricule,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      } else {
        const response = await fetch("http://localhost:8083/calendar/event", {
          method: 'POST',
          headers: {
            'matricule': matricule,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }
      onSave()
      onClose()
    } catch (error) {
      alert("Erreur lors de la sauvegarde")
    }
  }

  return (
    <div className={styles['CLD-modal']}>
      <div className={styles['CLD-modal-content']}>
        <h2>
          {eventToEdit ? (
            <>
              <Edit className={styles['CLD-icon']} size={20} /> Modifier un événement
            </>
          ) : (
            <>
              <Calendar className={styles['CLD-icon']} size={20} /> Ajouter un événement à <Clock className={styles['CLD-icon']} size={16} /> {time}{" "}
              le {format(date, "d MMMM yyyy")}
            </>
          )}
        </h2>
        <div className={styles['CLD-input-group']}>
          <FileText className={styles['CLD-icon']} size={16} />
          <input
            type="text"
            className={styles['CLD-input-field']}
            placeholder="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className={styles['CLD-input-group']}>
          <FileText className={styles['CLD-icon']} size={16} />
          <textarea
            className={styles['CLD-textarea-field']}
            placeholder="Contenu"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button className={styles['CLD-action-btn']} onClick={handleSave}>
          <Save className={styles['CLD-icon']} size={16} />
          Enregistrer
        </button>
        <button className={styles['CLD-action-btn']} onClick={onClose}>
          <X className={styles['CLD-icon']} size={16} />
          Annuler
        </button>
      </div>
    </div>
  )
}

export default EventModal