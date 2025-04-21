import { useState, useEffect } from "react"
import axios from "axios"
import { format } from "date-fns"
import { Save, X, Calendar, Clock, FileText, Edit } from "lucide-react"
import styles from "./calendar.module.css"

function EventModal({ time, date, onClose, onSave, role, event, timeSlots }) {
  const [title, setTitle] = useState(event?.title || "")
  const [content, setContent] = useState(event?.content || "")
  const [timeSlot, setTimeSlot] = useState(event?.time_slot || time || "")

  const token = localStorage.getItem("token")

  useEffect(() => {
    console.log("EventModal ouvert, event:", event, "time:", time, "timeSlot initial:", timeSlot);
    if (event) {
      setTitle(event.title || "")
      setContent(event.content || "")
      setTimeSlot(event.time_slot || time || timeSlots[0] || "")
    } else {
      setTitle("")
      setContent("")
      setTimeSlot(time || timeSlots[0] || "")
    }
  }, [event, time, timeSlots])

  const handleSave = async () => {
    console.log("Enregistrement, mode:", event ? "Modification" : "Ajout", "ID_event:", event?.ID_event);
    try {
      if (!title || !content || !timeSlot) {
        alert("Veuillez remplir tous les champs (titre, contenu, plage horaire).")
        return
      }
      if (event) {
        await axios.put(
          `http://courses.localhost/calendar/event/${event.ID_event}`,
          {
            title,
            content,
            event_date: format(date, "yyyy-MM-dd"),
            time_slot: timeSlot,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      } else {
        await axios.post(
          "http://courses.localhost/calendar/event",
          {
            title,
            content,
            event_date: format(date, "yyyy-MM-dd"),
            time_slot: timeSlot,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      }
      onSave()
      onClose()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      alert("Erreur lors de la sauvegarde")
    }
  }

  return (
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
  )
}

export default EventModal