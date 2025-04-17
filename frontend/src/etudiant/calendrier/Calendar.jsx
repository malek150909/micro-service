"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { format, addMonths, subMonths, addDays, subDays } from "date-fns"
import { FaHome } from "react-icons/fa"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, Edit, Trash, X, Home, ChevronLeft, ChevronRight } from "lucide-react"
import SmallCalendar from "./SmallCalendar.jsx"
import EventModal from "./EventModal.jsx"
import styles from "./calendar.module.css"

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState(null)
  const [showEventDetails, setShowEventDetails] = useState(null)
    const navigate = useNavigate()

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;
  const role = localStorage.getItem("role")

  const fetchEvents = async (date) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token trouvé');
      }
  
      const response = await fetch(`http://localhost:8083/calendar/${format(date, "yyyy-MM-dd")}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Réponse du serveur:", data)
      setEvents(data)
      
    } catch (error) {
      console.error("Détails de l'erreur:", {
        message: error.message,
        status: error.response?.status
      })
  
      if (error.response?.status === 401) {
        alert("Session expirée - Veuillez vous reconnecter")
        window.location.href = '/login'
      } else {
        alert(`Erreur technique: ${error.message}`)
      }
    }
  }

  useEffect(() => {
    fetchEvents(selectedDate)
  }, [selectedDate])

  const handleDateClick = (date) => {
    setSelectedDate(date)
    setCurrentDate(date)
  }

  const handleCellClick = (time) => {
    setSelectedTime(time)
    setShowModal(true)
  }

  const handleEventClick = (event) => {
    setShowEventDetails(event)
  }

  const handleMonthChange = (direction) => {
    setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
  }

  const handleDayChange = (direction) => {
    const newDate = direction === "next" ? addDays(selectedDate, 1) : subDays(selectedDate, 1)
    setSelectedDate(newDate)
    setCurrentDate(newDate)
  }

  const timeSlots = [
    "08:00 - 09:30",
    "09:40 - 11:10",
    "11:20 - 12:50",
    "13:00 - 14:30",
    "14:40 - 16:10",
    "16:20 - 17:50",
  ]

  const dayName = format(selectedDate, "EEEE", { locale: fr })

  return (
    <div className={styles['CLD-calendar-container']}>
      <button className={styles['CLD-home-link']} onClick={() => navigate("/etudiant")}>
                <FaHome /> Retour à l'accueil
      </button>

      <div className={styles['CLD-title-container']}>
        <h1 className={styles['CLD-main-title']}>
          <CalendarIcon className={styles['CLD-icon']} size={28} />
          Mon Calendrier
        </h1>
        <p className={styles['CLD-subtitle']}>Bienvenue sur votre calendrier, que vous avez comme plan pour aujourd'hui?</p>
      </div>

      <div className={styles['CLD-calendar-body']}>
        <div className={styles['CLD-daily-view-header']}>
          <button className={styles['CLD-nav-btn']} onClick={() => handleDayChange("prev")}>
            <ChevronLeft className={styles['CLD-icon']} size={16} />
          </button>
          <div className={styles['CLD-date-title-container']}>
            <h2>
              <CalendarIcon className={styles['CLD-icon']} size={22} />
              {format(selectedDate, "d MMMM yyyy", { locale: fr })}
            </h2>
            <p className={styles['CLD-day-name']}>{dayName}</p>
          </div>
          <button className={styles['CLD-nav-btn']} onClick={() => handleDayChange("next")}>
            <ChevronRight className={styles['CLD-icon']} size={16} />
          </button>
        </div>

        <div className={styles['CLD-main-content']}>
          <div className={styles['CLD-daily-view-container']}>
            <div className={styles['CLD-daily-view']}>
              <div className={styles['CLD-day-grid']}>
                {timeSlots.map((time) => (
                  <div key={time} className={styles['CLD-time-row']}>
                    <div className={styles['CLD-time-slot-label']}>
                      <Clock className={styles['CLD-icon']} size={16} />
                      {time.split(" - ")[0]}
                    </div>
                    <div className={styles['CLD-time-slot-cell']} onClick={() => handleCellClick(time)}>
                      {events
                        .filter((event) => event.time_slot === time)
                        .map((event) => (
                          <div
                            key={event.ID_event || event.ID_seance_supp || event.ID_club_evenement}
                            className={`${styles['CLD-event-block']} ${
                              event.type === "personal"
                                ? styles['CLD-event-personal']
                                : event.type === "supp_session"
                                ? styles['CLD-event-supp']
                                : event.type === "club_event"
                                ? styles['CLD-event-club']
                                : event.type === "administratif"
                                ? styles['CLD-event-admin']
                                : ""
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            <span>{event.title}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles['CLD-sidebar']}>
            <SmallCalendar currentDate={currentDate} onDateClick={handleDateClick} onMonthChange={handleMonthChange} />
            <div className={styles['CLD-event-types']}>
              <div>
                <span className={`${styles['CLD-dot']} ${styles['CLD-dot-personal']}`}></span> Événement personnel
              </div>
              <div>
                <span className={`${styles['CLD-dot']} ${styles['CLD-dot-supp']}`}></span> Séance supplémentaire
              </div>
              {role === "etudiant" && (
                <div>
                  <span className={`${styles['CLD-dot']} ${styles['CLD-dot-club']}`}></span> Événement de club
                </div>
              )}
              <div>
                <span className={`${styles['CLD-dot']} ${styles['CLD-dot-admin']}`}></span> Événement administratif
              </div>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <EventModal
          time={selectedTime}
          date={selectedDate}
          onClose={() => setShowModal(false)}
          onSave={() => fetchEvents(selectedDate)}
          role={role}
        />
      )}
      {showEventDetails && (
        <div className={styles['CLD-modal']}>
          <div className={styles['CLD-modal-content']}>
            <h2>{showEventDetails.title}</h2>
            <p>{showEventDetails.content}</p>
            {showEventDetails.canDelete && (
              <button
                className={styles['CLD-action-btn']}
                onClick={async () => {
                  try {
                    let response;
                    if (showEventDetails.type === "personal" || showEventDetails.type === "administratif") {
                      response = await fetch(`http://localhost:8083/calendar/event/${showEventDetails.ID_event}`, {
                        method: 'DELETE',
                        headers: { 'matricule': matricule }
                      });
                    } else if (showEventDetails.type === "supp_session") {
                      response = await fetch(`http://localhost:8083/calendar/supp-session/${showEventDetails.ID_seance_supp}`, {
                        method: 'DELETE',
                        headers: { 'matricule': matricule }
                      });
                    } else if (showEventDetails.type === "club_event") {
                      response = await fetch(`http://localhost:8083/calendar/club-event/${showEventDetails.ID_club_evenement}`, {
                        method: 'DELETE',
                        headers: { 'matricule': matricule }
                      });
                    }

                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    fetchEvents(selectedDate);
                    setShowEventDetails(null);
                  } catch (error) {
                    alert("Erreur lors de la suppression");
                  }
                }}
              >
                <Trash className={styles['CLD-icon']} size={16} />
                Supprimer
              </button>
            )}
            {showEventDetails.canEdit && (
              <button
                className={styles['CLD-action-btn']}
                onClick={() => {
                  setSelectedTime(showEventDetails.time_slot);
                  setShowModal(true);
                  setShowEventDetails(null);
                }}
              >
                <Edit className={styles['CLD-icon']} size={16} />
                Modifier
              </button>
            )}
            <button className={styles['CLD-action-btn']} onClick={() => setShowEventDetails(null)}>
              <X className={styles['CLD-icon']} size={16} />
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar