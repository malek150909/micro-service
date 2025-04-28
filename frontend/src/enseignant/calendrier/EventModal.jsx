"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { format } from "date-fns"
import { Save, X, Calendar, Clock, FileText, Edit } from "lucide-react"
import styles from "./calendar.module.css"
import ConfirmationModal from "./ConfirmationModal.jsx"

// Override window.confirm to prevent the default dialog
window.confirm = () => {
  console.log("window.confirm was called but overridden to prevent the default dialog.")
  return false
}

function EventModal({ time, date, onClose, onSave, role, event, timeSlots }) {
  const [title, setTitle] = useState(event?.title || "")
  const [content, setContent] = useState(event?.content || "")
  const [timeSlot, setTimeSlot] = useState(event?.time_slot || time || "")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)

  const token = localStorage.getItem("token")

  useEffect(() => {
    console.log("EventModal ouvert, event:", event, "time:", time, "timeSlot initial:", timeSlot, "date:", date)
    if (!(date instanceof Date) || isNaN(date)) {
      console.error("Invalid date prop in EventModal:", date)
      onClose()
      return
    }
    if (event) {
      setTitle(event.title || "")
      setContent(event.content || "")
      setTimeSlot(event.time_slot || time || timeSlots[0] || "")
    } else {
      setTitle("")
      setContent("")
      setTimeSlot(time || timeSlots[0] || "")
    }
  }, [event, time, timeSlots, date, onClose])

  const handleSave = async () => {
    console.log("Enregistrement, mode:", event ? "Modification" : "Ajout", "ID_event:", event?.ID_event)
    try {
      if (!title || !content || !timeSlot) {
        alert("Veuillez remplir tous les champs (titre, contenu, plage horaire).")
        return
      }
      if (pendingSave) {
        let response
        if (event) {
          response = await axios.put(
            `http://courses.localhost/calendar/event/${event.ID_event}`,
            {
              title,
              content,
              event_date: format(date, "yyyy-MM-dd"),
              time_slot: timeSlot,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "X-Past-Date-Confirmed": "true",
              },
            }
          )
          console.log("Backend response (PUT after confirmation):", response.data)
        } else {
          response = await axios.post(
            "http://courses.localhost/calendar/event",
            {
              title,
              content,
              event_date: format(date, "yyyy-MM-dd"),
              time_slot: timeSlot,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "X-Past-Date-Confirmed": "true",
              },
            }
          )
          console.log("Backend response (POST after confirmation):", response.data)
        }
        onSave()
        onClose()
        setPendingSave(false)
      } else {
        let response
        if (event) {
          response = await axios.put(
            `http://courses.localhost/calendar/event/${event.ID_event}`,
            {
              title,
              content,
              event_date: format(date, "yyyy-MM-dd"),
              time_slot: timeSlot,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          console.log("Backend response (PUT):", response.data)
        } else {
          response = await axios.post(
            "http://courses.localhost/calendar/event",
            {
              title,
              content,
              event_date: format(date, "yyyy-MM-dd"),
              time_slot: timeSlot,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          console.log("Backend response (POST):", response.data)
        }

        if (response.data?.message?.includes("Cette date est passée")) {
          console.warn("Backend returned past date message despite frontend validation")
          setPendingSave(true)
          setShowConfirmModal(true)
        } else {
          onSave()
          onClose()
        }
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      console.log("Backend error response:", error.response?.data)
      if (error.response?.data?.message?.includes("Cette date est passée")) {
        console.warn("Backend error indicated past date despite frontend validation")
        setPendingSave(true)
        setShowConfirmModal(true)
      } else {
        alert("Erreur lors de la sauvegarde: " + (error.response?.data?.message || error.message))
      }
    }
  }

  const handleConfirm = () => {
    setShowConfirmModal(false)
    handleSave()
  }

  const handleCancel = () => {
    setShowConfirmModal(false)
    setPendingSave(false)
    onClose()
  }

  return (
    <div className={styles['CLD-modal-wrapper']}>
      <div className={styles['CLD-modal']}>
        <div className={styles['CLD-modal-content']}>
          <h2>
            {event ? (
              <>
                <Edit className={styles['CLD-icon']} size={20} /> Modifier un événement
              </>
            ) : (
              <>
                <Calendar className={styles['CLD-icon']} size={20} /> Ajouter un événement à <Clock className={styles['CLD-icon']} size={16} /> {timeSlot || timeSlots[0]}{" "}
                le {format(date, "d MMMM yyyy")}
              </>
            )}
          </h2>
          <div className={styles['CLD-input-group']}>
            <FileText className={styles['CLD-icon']} size={16} />
            <input
              type="text"
              placeholder="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className={styles['CLD-input-group']}>
            <FileText className={styles['CLD-icon']} size={16} />
            <textarea
              placeholder="Contenu"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className={styles['CLD-input-group']}>
            <Clock className={styles['CLD-icon']} size={16} />
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className={styles['CLD-time-slot-select']}
            >
              <option value="" disabled>
                Choisir une plage horaire
              </option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button onClick={handleSave}>
              <Save className={styles['CLD-icon']} size={16} />
              Enregistrer
            </button>
            <button onClick={onClose}>
              <X className={styles['CLD-icon']} size={16} />
              Annuler
            </button>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        message="Cette date est passée, êtes-vous sûr d'ajouter quand même un événement à cette date ?"
      />
    </div>
  )
}

export default EventModal