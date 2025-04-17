"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays, addDays } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import styles from "./calendar.module.css"

function SmallCalendar({ currentDate, onDateClick, onMonthChange }) {
  const [monthDays, setMonthDays] = useState([])
  const [daysWithEvents, setDaysWithEvents] = useState([])
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const matricule = storedUser?.Matricule;
  
  useEffect(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start, end })

    const firstDayOfMonth = getDay(start)
    const daysBefore = Array.from({ length: firstDayOfMonth }, (_, i) => subDays(start, firstDayOfMonth - i))
    const totalDays = daysBefore.length + days.length
    const daysAfterCount = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7)
    const daysAfter = Array.from({ length: daysAfterCount }, (_, i) => addDays(end, i + 1))

    setMonthDays([...daysBefore, ...days, ...daysAfter])

    const fetchEventsForMonth = async () => {
      try {
        const startDate = format(start, "yyyy-MM-dd")
        const endDate = format(end, "yyyy-MM-dd")
        const response = await fetch(`http://localhost:8083/calendar/${startDate}/${endDate}`, {
          headers: {
            'matricule': matricule,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Événements du mois récupérés:", data)

        const eventDays = data
          .map((event) => {
            let eventDate = null

            // Événements personnels et administratifs (tous deux dans CalendarEvent)
            if ((event.type === "personal" || event.type === "administratif") && event.event_date) {
              if (typeof event.event_date === "string") {
                eventDate = event.event_date.includes(" ")
                  ? format(new Date(event.event_date), "yyyy-MM-dd")
                  : event.event_date
              } else {
                eventDate = format(new Date(event.event_date), "yyyy-MM-dd")
              }
              console.log(`Événement ${event.type} détecté: ${eventDate} (brut: ${event.event_date})`)
              return eventDate
            }

            // Séances supplémentaires
            if (event.type === "supp_session" && event.date_seance) {
              if (typeof event.date_seance === "string") {
                eventDate = event.date_seance.includes(" ")
                  ? format(new Date(event.date_seance), "yyyy-MM-dd")
                  : event.date_seance
              } else {
                eventDate = format(new Date(event.date_seance), "yyyy-MM-dd")
              }
              console.log(`Séance supplémentaire détectée: ${eventDate} (brut: ${event.date_seance})`)
              return eventDate
            }

            // Événements de club
            if (event.type === "club_event" && event.date_evenement) {
              eventDate = format(new Date(event.date_evenement), "yyyy-MM-dd")
              console.log(`Événement de club détecté: ${eventDate} (brut: ${event.date_evenement})`)
              return eventDate
            }

            return null
          })
          .filter((date) => date)

        console.log("Jours avec des événements (avant déduplication):", eventDays)
        const uniqueEventDays = [...new Set(eventDays)]
        console.log("Jours avec des événements (après déduplication):", uniqueEventDays)
        setDaysWithEvents(uniqueEventDays)
      } catch (error) {
        console.error("Erreur lors de la récupération des événements du mois:", error)
      }
    }

    fetchEventsForMonth()
  }, [currentDate, matricule])

  return (
    <div className={styles['CLD-small-calendar']}>
      <div className={styles['CLD-calendar-header']}>
        <button className={styles['CLD-nav-btn']} onClick={() => onMonthChange("prev")}>
          <ChevronLeft className={styles['CLD-icon']} size={16} />
        </button>
        <h3>
          <Calendar className={styles['CLD-icon']} size={18} />
          {format(currentDate, "MMMM yyyy")}
        </h3>
        <button className={styles['CLD-nav-btn']} onClick={() => onMonthChange("next")}>
          <ChevronRight className={styles['CLD-icon']} size={16} />
        </button>
      </div>
      <div className={styles['CLD-days-header']}>
        <div>Dim</div>
        <div>Lun</div>
        <div>Mar</div>
        <div>Mer</div>
        <div>Jeu</div>
        <div>Ven</div>
        <div>Sam</div>
      </div>
      <div className={styles['CLD-days-grid']}>
        {monthDays.map((day, index) => {
          const dayFormatted = format(day, "yyyy-MM-dd")
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = dayFormatted === format(new Date(), "yyyy-MM-dd")
          const hasEvent = daysWithEvents.includes(dayFormatted)
          console.log(
            `Jour ${dayFormatted}: hasEvent=${hasEvent}, in daysWithEvents=${daysWithEvents.includes(dayFormatted)}`,
          )
          return (
            <div
              key={index}
              className={`${styles['CLD-day']} ${
                !isCurrentMonth ? styles['CLD-empty-day'] : ""
              } ${isToday ? styles['CLD-today'] : ""} ${hasEvent ? styles['CLD-has-event'] : ""}`}
              onClick={() => isCurrentMonth && onDateClick(day)}
            >
              {day.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SmallCalendar