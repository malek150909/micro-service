"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { format, addMonths, subMonths, addDays, subDays } from "date-fns"
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

  const token = localStorage.getItem("token")
  const role = localStorage.getItem("role")

  const fetchEvents = async (date) => {
    try {
      const response = await axios.get(`http://localhost:8083/calendar/${format(date, "yyyy-MM-dd")}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Événements récupérés:", response.data);
      response.data.forEach((event) => {
        console.log(`Événement: ${event.title}, Type: ${event.type}`);
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
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
      <a href="#" className={styles['CLD-home-link']}>
        <Home className={styles['CLD-icon']} size={16} />
        Retour à l'accueil
      </a>

      <div className={styles['CLD-title-container']}>
        <h1 className={styles['CLD-main-title']}>
          <CalendarIcon className={styles['CLD-icon']} size={28} />
          Mon Calendrier
        </h1>
        <p className={styles['CLD-subtitle']}>Bienvenue sur votre calendrier, que vous avez comme plan pour aujourd'hui?</p>
      </div>

      <div className={styles['CLD-calendar-body']}>
        <div className={styles['CLD-daily-view-header']}>
          <button className={`${styles['CLD-nav-btn']} ${styles['CLD-icon-btn']}`} onClick={() => handleDayChange("prev")}>
          {"<"}
          </button>
          <div className={styles['CLD-date-title-container']}>
            <h2>
              <CalendarIcon className={styles['CLD-icon']} size={22} />
              {format(selectedDate, "d MMMM yyyy", { locale: fr })}
            </h2>
            <p className={styles['CLD-day-name']}>{dayName}</p>
          </div>
          <button className={`${styles['CLD-nav-btn']} ${styles['CLD-icon-btn']}`} onClick={() => handleDayChange("next")}>
          {">"}
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
                className={`${styles['CLD-action-btn']} ${styles['CLD-icon-btn']}`}
                onClick={async () => {
                  try {
                    if (showEventDetails.type === "personal" || showEventDetails.type === "administratif") {
                      await axios.delete(`http://localhost:8083/calendar/event/${showEventDetails.ID_event}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                    } else if (showEventDetails.type === "supp_session") {
                      await axios.delete(
                        `http://localhost:8083/calendar/supp-session/${showEventDetails.ID_seance_supp}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
                    } else if (showEventDetails.type === "club_event") {
                      await axios.delete(
                        `http://localhost:8083/calendar/club-event/${showEventDetails.ID_club_evenement}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
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
                className={`${styles['CLD-action-btn']} ${styles['CLD-icon-btn']}`}
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
            <button
              className={`${styles['CLD-action-btn']} ${styles['CLD-icon-btn']}`}
              onClick={() => setShowEventDetails(null)}
            >
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