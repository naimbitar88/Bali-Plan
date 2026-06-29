import { useEffect, useRef, useState } from 'react'
import { Draggable } from '@fullcalendar/interaction'
import './App.css'
import { useTrip } from './hooks/useTrip'
import { defaultHourFor, resolveDrop, tripDays } from './utils'
import type { Activity, ScheduledItem } from './types'
import TopBar from './components/TopBar'
import ActivityLibrary from './components/ActivityLibrary'
import PlannerCalendar from './components/PlannerCalendar'
import { ActivityEditModal, EventEditModal } from './components/ActivityEditModal'

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const blankActivity = (): Activity => ({
  id: uid(),
  name: '',
  area: 'Other',
  category: 'food',
  defaultDurationMin: 120,
})

export default function App() {
  const trip = useTrip()
  const libraryRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [editingEvent, setEditingEvent] = useState<ScheduledItem | null>(null)

  // Make the library cards draggable onto the calendar.
  useEffect(() => {
    if (!libraryRef.current) return
    const d = new Draggable(libraryRef.current, {
      itemSelector: '.activity-card',
      eventData: () => ({ create: false }),
    })
    return () => d.destroy()
  }, [])

  const handleDrop = (date: Date, activityId: string) => {
    const activity = trip.activities.find((a) => a.id === activityId)
    if (!activity) return
    const { start, end, title } = resolveDrop(activity, date)
    trip.addScheduled({
      id: uid(),
      activityId,
      title,
      area: activity.area,
      category: activity.category,
      instagram: activity.instagram,
      start: start.toISOString(),
      end: end.toISOString(),
    })
  }

  // Mobile-friendly "Add to day": schedule without dragging. Picks a sensible default
  // hour (party venues with a weekly event for that day override it automatically).
  const handleAssign = (activityId: string, dayIso: string) => {
    const activity = trip.activities.find((a) => a.id === activityId)
    if (!activity) return
    const date = new Date(`${dayIso}T00:00:00`)
    date.setHours(defaultHourFor(activity.category), 0, 0, 0)
    const { start, end, title } = resolveDrop(activity, date)
    trip.addScheduled({
      id: uid(),
      activityId,
      title,
      area: activity.area,
      category: activity.category,
      instagram: activity.instagram,
      start: start.toISOString(),
      end: end.toISOString(),
    })
  }

  const handleMove = (id: string, start: Date, end: Date) => {
    const item = trip.scheduled.find((s) => s.id === id)
    if (!item) return
    trip.updateScheduled({ ...item, start: start.toISOString(), end: end.toISOString() })
  }

  return (
    <div className="app">
      <TopBar meta={trip.meta} live={trip.live} onChange={trip.setMeta} />

      <div className="layout">
        <div ref={libraryRef}>
          <ActivityLibrary
            activities={trip.activities}
            days={tripDays(trip.meta.startDate, trip.meta.endDate)}
            onEdit={setEditing}
            onAdd={() => setEditing(blankActivity())}
            onAssign={handleAssign}
            onDelete={trip.removeActivity}
            onDeleteArea={(area) =>
              trip.activities
                .filter((a) => a.area === area)
                .forEach((a) => trip.removeActivity(a.id))
            }
          />
        </div>

        <main className="planner">
          <PlannerCalendar
            meta={trip.meta}
            scheduled={trip.scheduled}
            onDrop={handleDrop}
            onMove={handleMove}
            onClickEvent={(id) =>
              setEditingEvent(trip.scheduled.find((s) => s.id === id) ?? null)
            }
          />
        </main>
      </div>

      {editing && (
        <ActivityEditModal
          activity={editing}
          onSave={(a) => {
            trip.activities.some((x) => x.id === a.id)
              ? trip.updateActivity(a)
              : trip.addActivity(a)
            setEditing(null)
          }}
          onDelete={(id) => {
            trip.removeActivity(id)
            setEditing(null)
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {editingEvent && (
        <EventEditModal
          item={editingEvent}
          onSave={(s) => {
            trip.updateScheduled(s)
            setEditingEvent(null)
          }}
          onDelete={(id) => {
            trip.removeScheduled(id)
            setEditingEvent(null)
          }}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  )
}
