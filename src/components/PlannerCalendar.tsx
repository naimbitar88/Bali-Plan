import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventInput } from '@fullcalendar/core'
import type { ScheduledItem, TripMeta } from '../types'
import { AREA_COLOR, CATEGORY_ICON } from '../utils'

/** Track viewport width so we can size the calendar for phone / tablet / desktop. */
function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280))
  useEffect(() => {
    const on = () => setW(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return w
}

const addDayISO = (d: string) => {
  const x = new Date(d + 'T00:00:00')
  x.setDate(x.getDate() + 1)
  return x.toISOString().slice(0, 10)
}

interface Props {
  meta: TripMeta
  scheduled: ScheduledItem[]
  onDrop: (date: Date, activityId: string) => void
  onMove: (id: string, start: Date, end: Date) => void
  onClickEvent: (id: string) => void
}

function dayCount(meta: TripMeta) {
  const a = new Date(meta.startDate + 'T00:00:00')
  const b = new Date(meta.endDate + 'T00:00:00')
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000)
  return Math.max(1, diff + 1)
}

export default function PlannerCalendar({
  meta,
  scheduled,
  onDrop,
  onMove,
  onClickEvent,
}: Props) {
  const width = useViewportWidth()
  const totalDays = dayCount(meta)

  // Phone → 1 day, tablet → 3, small laptop → 5, desktop → whole trip. Fewer-than-trip
  // views get prev/next navigation (clamped to the trip range).
  const visibleDays =
    width < 640 ? 1 : width < 900 ? 3 : width < 1200 ? 5 : totalDays
  const days = Math.min(visibleDays, totalDays)
  const paged = days < totalDays

  const events: EventInput[] = scheduled.map((s) => ({
    id: s.id,
    title: s.title,
    start: s.start,
    end: s.end,
    backgroundColor: AREA_COLOR[s.area],
    borderColor: AREA_COLOR[s.area],
    extendedProps: { category: s.category, area: s.area },
  }))

  return (
    <FullCalendar
      key={`${meta.startDate}_${meta.endDate}_${days}`}
      events={events}
      plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
      initialView="trip"
      views={{ trip: { type: 'timeGrid', duration: { days } } }}
      initialDate={meta.startDate}
      validRange={{ start: meta.startDate, end: addDayISO(meta.endDate) }}
      headerToolbar={paged ? { left: 'prev,next', center: 'title', right: '' } : false}
      titleFormat={{ month: 'short', day: 'numeric' }}
      dayHeaderFormat={
        days === 1
          ? { weekday: 'long', day: 'numeric', month: 'short' }
          : { weekday: 'short', day: 'numeric', month: 'short' }
      }
      allDaySlot={false}
      slotMinTime="07:00:00"
      slotMaxTime="26:00:00"
      scrollTime="09:00:00"
      slotDuration="01:00:00"
      nowIndicator={false}
      height="100%"
      expandRows
      droppable
      editable
      eventResizableFromStart
      drop={(info) => {
        const id = info.draggedEl.getAttribute('data-activity-id')
        if (id) onDrop(info.date, id)
      }}
      eventDrop={(info) =>
        onMove(info.event.id, info.event.start!, info.event.end ?? info.event.start!)
      }
      eventResize={(info) =>
        onMove(info.event.id, info.event.start!, info.event.end ?? info.event.start!)
      }
      eventClick={(arg: EventClickArg) => onClickEvent(arg.event.id)}
      eventContent={(arg) => {
        const cat = arg.event.extendedProps.category
        const icon = cat ? CATEGORY_ICON[cat as keyof typeof CATEGORY_ICON] : '📍'
        return (
          <div className="fc-ev">
            <div className="fc-ev-time">{arg.timeText}</div>
            <div className="fc-ev-title">
              {icon} {arg.event.title}
            </div>
          </div>
        )
      }}
    />
  )
}
