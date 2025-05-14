"use client"

import React,{ useState, useEffect } from "react"
import axios from "axios"
import { format, addMonths, subMonths, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addWeeks, subWeeks, startOfDay, isBefore } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, Edit, Trash, X, Home, ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { FaHome } from "react-icons/fa"
import SmallCalendar from "./SmallCalendar.jsx"
import EventModal from "./EventModal.jsx"
import ConfirmationModal from "./ConfirmationModal.jsx"
import styles from "./calendar.module.css"

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState(null)
  const [showEventDetails, setShowEventDetails] = useState(null)
  const [editEvent, setEditEvent] = useState(null)
  const [viewMode, setViewMode] = useState("daily")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingTime, setPendingTime] = useState(null)
  const [pendingDate, setPendingDate] = useState(null)
  const navigate = useNavigate()

  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "{}")
  const role = user.role

  const timeSlots = [
    "08:00 - 09:30",
    "09:40 - 11:10",
    "11:20 - 12:50",
    "13:00 - 14:30",
    "14:40 - 16:10",
    "16:20 - 17:50",
  ]

  const fetchEvents = async (startDate, endDate) => {
    try {
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
      const eventPromises = dateRange.map(async (date) => {
        const response = await axios.get(`http://courses.localhost/calendar/${format(date, "yyyy-MM-dd")}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        return response.data.map(event => ({ ...event, date: format(date, "yyyy-MM-dd") }))
      })
      const eventsArray = await Promise.all(eventPromises)
      const allEvents = eventsArray.flat()
      console.log("Événements récupérés pour la période:", allEvents)
      allEvents.forEach((event) => {
        console.log(`Événement: ${event.title}, Type: ${event.type}, ID: ${event.ID_event}, Date: ${event.date}, Time_slot: ${event.time_slot}`)
      })
      setEvents(allEvents)
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error)
    }
  }

  useEffect(() => {
    if (viewMode === "daily") {
      fetchEvents(selectedDate, selectedDate)
    } else if (viewMode === "weekly") {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 })
      fetchEvents(start, end)
    } else if (viewMode === "monthly") {
      const start = startOfMonth(selectedDate)
      const end = endOfMonth(selectedDate)
      fetchEvents(start, end)
    }
  }, [selectedDate, viewMode])

  useEffect(() => {
    console.log("State updated, showModal:", showModal, "selectedDate:", selectedDate, "selectedTime:", selectedTime)
  }, [showModal, selectedDate, selectedTime])

  const handleDateClick = (date) => {
    setSelectedDate(date)
    setCurrentDate(date)
    if (viewMode !== "daily") {
      setViewMode("daily")
    }
  }

  const handleCellClick = (time, date = selectedDate) => {
    console.log("Cellule cliquée, time:", time, "date:", date)
    const today = startOfDay(new Date())
    const selected = startOfDay(date)

    if (isBefore(selected, today)) {
      setPendingTime(time)
      setPendingDate(date)
      setShowConfirmModal(true)
    } else {
      setSelectedDate(date)
      setSelectedTime(time)
      setEditEvent(null)
      setShowModal(true)
    }
  }

  const handleConfirm = () => {
    console.log("Confirmation clicked, pendingTime:", pendingTime, "pendingDate:", pendingDate)
    setShowConfirmModal(false)
    if (pendingTime && pendingDate && pendingDate instanceof Date && !isNaN(pendingDate)) {
      console.log("Setting selectedDate to:", pendingDate, "selectedTime to:", pendingTime)
      setSelectedDate(pendingDate)
      setSelectedTime(pendingTime)
      setEditEvent(null)
      setShowModal(true)
    } else {
      console.error("Invalid pendingTime or pendingDate:", { pendingTime, pendingDate })
    }
    setPendingTime(null)
    setPendingDate(null)
  }

  const handleCancel = () => {
    setShowConfirmModal(false)
    setPendingTime(null)
    setPendingDate(null)
  }

  const handleEventClick = (event) => {
    console.log("Événement cliqué:", event)
    setShowEventDetails(event)
  }

  const handleMonthChange = (direction) => {
    setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    setSelectedDate(direction === "next" ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1))
  }

  const handleDayChange = (direction) => {
    const newDate = direction === "next" ? addDays(selectedDate, 1) : subDays(selectedDate, 1)
    setSelectedDate(newDate)
    setCurrentDate(newDate)
  }

  const handleWeekChange = (direction) => {
    const newDate = direction === "next" ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1)
    setSelectedDate(newDate)
    setCurrentDate(newDate)
  }

  const dayName = format(selectedDate, "EEEE", { locale: fr })

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 })
    return eachDayOfInterval({
      start: start,
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
    })
  }

  const getMonthDays = () => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    const days = eachDayOfInterval({ start, end })
    const firstDayOfMonth = getDay(start) === 0 ? 6 : getDay(start) - 1
    const daysWithPadding = [
      ...Array(firstDayOfMonth).fill(null),
      ...days,
    ]
    const totalCells = Math.ceil(daysWithPadding.length / 7) * 7
    return [
      ...daysWithPadding,
      ...Array(totalCells - daysWithPadding.length).fill(null),
    ]
  }

  const today = new Date()
  const todayEvents = events.filter(event => isSameDay(new Date(event.date), today))
  const todayMessage = todayEvents.length > 0
    ? `Aujourd’hui, vous avez : ${todayEvents.map(event => `${event.title} à ${event.time_slot}`).join(", ")}`
    : null

  return (
    <div className={styles['CLD-calendar-container']}>
      <button className={styles['CLD-home-link']} onClick={() => navigate("/enseignant")}>
        <FaHome /> Retour à l'accueil
      </button>

      <div className={styles['CLD-title-container']}>
        <h1 className={styles['CLD-main-title']}>
          <CalendarIcon className={styles['CLD-icon']} size={28} />
          Mon Calendrier
        </h1>
        <p className={styles['CLD-subtitle']}>
          Bienvenue sur votre calendrier, que vous avez comme plan pour aujourd'hui?
        </p>
      </div>

      <div className={styles['CLD-calendar-body']}>
        <div className={styles['CLD-view-switcher']}>
          <button
            className={`${styles['CLD-view-button']} ${viewMode === "daily" ? styles['CLD-view-button-active'] : ''}`}
            onClick={() => setViewMode("daily")}
          >
            Jour
          </button>
          <button
            className={`${styles['CLD-view-button']} ${viewMode === "weekly" ? styles['CLD-view-button-active'] : ''}`}
            onClick={() => setViewMode("weekly")}
          >
            Semaine
          </button>
          <button
            className={`${styles['CLD-view-button']} ${viewMode === "monthly" ? styles['CLD-view-button-active'] : ''}`}
            onClick={() => setViewMode("monthly")}
          >
            Mois
          </button>
        </div>

        {todayMessage && (
          <div className={styles['CLD-today-message']}>
            {todayMessage}
          </div>
        )}

        {viewMode === "daily" && (
          <div className={styles['CLD-daily-view-header']}>
            <button className={styles['CLD-prev-day']} onClick={() => handleDayChange("prev")}>
              {"<"}
            </button>
            <div className={styles['CLD-date-title-container']}>
              <h2>
                <CalendarIcon className="CLD-icon" size={22} />
                {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </h2>
              <p className={styles['CLD-day-name']}>{dayName}</p>
            </div>
            <button className={styles['CLD-next-day']} onClick={() => handleDayChange("next")}>
              {">"}
            </button>
          </div>
        )}

        {viewMode === "weekly" && (
          <div className={styles['CLD-weekly-view-header']}>
            <button className={styles['CLD-prev-week']} onClick={() => handleWeekChange("prev")}>
              {"<"}
            </button>
            <div className={styles['CLD-date-title-container']}>
              <h2>
                <CalendarIcon className="CLD-icon" size={22} />
                {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMMM yyyy", { locale: fr })} -{" "}
                {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMMM yyyy", { locale: fr })}
              </h2>
            </div>
            <button className={styles['CLD-next-week']} onClick={() => handleWeekChange("next")}>
              {">"}
            </button>
          </div>
        )}

        {viewMode === "monthly" && (
          <div className={styles['CLD-monthly-view-header']}>
            <button className={styles['CLD-prev-month']} onClick={() => handleMonthChange("prev")}>
              {"<"}
            </button>
            <div className={styles['CLD-date-title-container']}>
              <h2>
                <CalendarIcon className="CLD-icon" size={22} />
                {format(selectedDate, "MMMM yyyy", { locale: fr })}
              </h2>
            </div>
            <button className={styles['CLD-next-month']} onClick={() => handleMonthChange("next")}>
              {">"}
            </button>
          </div>
        )}

        <div className={styles['CLD-main-content']}>
          <div className={styles['CLD-daily-view-container']}>
            {viewMode === "daily" && (
              <div className={styles['CLD-daily-view']}>
                <div className={styles['CLD-day-grid']}>
                  {timeSlots.map((time) => {
                    const hasEvent = events.some(event => event.time_slot === time)
                    const isTodayWithEvent = isSameDay(selectedDate, today) && hasEvent
                    return (
                      <div key={time} className={styles['CLD-time-row']}>
                        <div className={styles['CLD-time-slot-label']}>
                          <Clock className={styles['CLD-icon']} size={16} />
                          {time.split(" - ")[0]}
                        </div>
                        <div
                          className={`${styles['CLD-time-slot-cell']} ${isTodayWithEvent ? styles['CLD-today-event'] : ''}`}
                          onClick={() => handleCellClick(time)}
                        >
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
                                  e.stopPropagation()
                                  handleEventClick(event)
                                }}
                              >
                                <span>{event.title}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {viewMode === "weekly" && (
              <div className={styles['CLD-weekly-view']}>
                <div className={styles['CLD-week-grid']}>
                  <div className={styles['CLD-week-header']}>
                    <div className={styles['CLD-time-slot-label']}></div>
                    {getWeekDays().map((day) => (
                      <div key={day} className={styles['CLD-week-day-label']}>
                        {format(day, "EEEE d", { locale: fr })}
                        {isSameDay(day, today) && <span className={styles['CLD-today-indicator']}> (Aujourd'hui)</span>}
                      </div>
                    ))}
                  </div>
                  {timeSlots.map((time) => (
                    <div key={time} className={styles['CLD-time-row']}>
                      <div className={styles['CLD-time-slot-label']}>
                        <Clock className={styles['CLD-icon']} size={16} />
                        {time.split(" - ")[0]}
                      </div>
                      {getWeekDays().map((day) => {
                        const dayEvents = events.filter(
                          event => event.time_slot === time && isSameDay(new Date(event.date), day)
                        )
                        const isTodayWithEvent = isSameDay(day, today) && dayEvents.length > 0
                        return (
                          <div
                            key={`${format(day, "yyyy-MM-dd")}-${time}`}
                            className={`${styles['CLD-time-slot-cell']} ${isTodayWithEvent ? styles['CLD-today-event'] : ''}`}
                            onClick={() => handleCellClick(time, day)}
                          >
                            {dayEvents.map((event) => (
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
                                  e.stopPropagation()
                                  handleEventClick(event)
                                }}
                              >
                                <span>{event.title}</span>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === "monthly" && (
              <div className={styles['CLD-monthly-view']}>
                <div className={styles['CLD-month-grid']}>
                  {getMonthDays().map((day, index) => {
                    const dayEvents = day ? events.filter(event => isSameDay(new Date(event.date), day)) : []
                    const isToday = day && isSameDay(day, today)
                    return (
                      <div
                        key={index}
                        className={`${styles['CLD-month-day']} ${!day ? styles['CLD-empty-day'] : ''} ${isToday ? styles['CLD-today'] : ''}`}
                        onClick={() => day && handleDateClick(day)}
                      >
                        {day ? (
                          <>
                            <span className={styles['CLD-day-number']}>{format(day, "d")}</span>
                            <div className={styles['CLD-event-list']}>
                              {dayEvents.slice(0, 3).map((event) => (
                                <div
                                  key={event.ID_event || event.ID_seance_supp || event.ID_club_evenement}
                                  className={`${styles['CLD-event-block-month']} ${
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
                                    e.stopPropagation()
                                    handleEventClick(event)
                                  }}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className={styles['CLD-see-more']}>
                                  +{dayEvents.length - 3} autres
                                </div>
                              )}
                            </div>
                          </>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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

      {showModal && selectedTime && selectedDate && selectedDate instanceof Date && !isNaN(selectedDate) && (
        <EventModal
          time={selectedTime}
          date={selectedDate}
          event={editEvent}
          timeSlots={timeSlots}
          onClose={() => {
            setShowModal(false)
            setEditEvent(null)
          }}
          onSave={() => fetchEvents(selectedDate, selectedDate)}
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
                onClick={async () => {
                  try {
                    if (showEventDetails.type === "personal" || showEventDetails.type === "administratif") {
                      await axios.delete(`http://courses.localhost/calendar/event/${showEventDetails.ID_event}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                    } else if (showEventDetails.type === "supp_session") {
                      await axios.delete(
                        `http://courses.localhost/calendar/supp-session/${showEventDetails.ID_seance_supp}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                      )
                    } else if (showEventDetails.type === "club_event") {
                      await axios.delete(
                        `http://courses.localhost/calendar/club-event/${showEventDetails.ID_club_evenement}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                      )
                    }
                    fetchEvents(selectedDate, selectedDate)
                    setShowEventDetails(null)
                  } catch (error) {
                    alert("Erreur lors de la suppression")
                  }
                }}
              >
                <Trash className={styles['CLD-icon']} size={16} />
                Supprimer
              </button>
            )}
            {showEventDetails.canEdit && (
              <button
                onClick={() => {
                  console.log("Préparation modification, événement:", showEventDetails)
                  setEditEvent(showEventDetails)
                  setSelectedTime(showEventDetails.time_slot || timeSlots[0])
                  setShowModal(true)
                  setShowEventDetails(null)
                }}
              >
                <Edit className={styles['CLD-icon']} size={16} />
                Modifier
              </button>
            )}
            <button onClick={() => setShowEventDetails(null)}>
              <X className={styles['CLD-icon']} size={16} />
              Fermer
            </button>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        message="Cette date est passée, êtes-vous sûr d'ajouter quand même un événement à cette date ?"
      />
    </div>
  )
}

export default Calendar