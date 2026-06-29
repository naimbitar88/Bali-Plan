import { useEffect, useRef, useState } from 'react'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db, firebaseEnabled, TRIP_ID } from '../firebase'
import { SEED_ACTIVITIES } from '../data/seedActivities'
import { resolveDrop } from '../utils'
import type { Activity, ScheduledItem, TripMeta } from '../types'

/** Demo itinerary (only when ?demo=1) so the calendar shows a populated trip for previews. */
function buildDemoScheduled(activities: Activity[]): ScheduledItem[] {
  const plan: Array<[string, string]> = [
    ['cgu-oldmans', '2026-07-15T20:00:00'], // Wed — Old Man's party (auto event)
    ['ulu-padangpadang', '2026-07-16T10:00:00'],
    ['ulu-temple', '2026-07-16T17:00:00'],
    ['ubd-tegallalang', '2026-07-17T09:00:00'],
    ['ubd-monkeyforest', '2026-07-17T12:00:00'],
    ['cgu-finns', '2026-07-18T11:00:00'], // Sat — Finns pool party (auto event)
    ['oth-savaya', '2026-07-19T15:00:00'], // Sun — Savaya Sundays (auto event)
    ['ulu-singlefin', '2026-07-19T16:00:00'], // Sun — Single Fin Sundays (auto event)
  ]
  const out: ScheduledItem[] = []
  plan.forEach(([id, when], i) => {
    const a = activities.find((x) => x.id === id)
    if (!a) return
    const { start, end, title } = resolveDrop(a, new Date(when))
    out.push({
      id: `demo-${i}`,
      activityId: id,
      title,
      area: a.area,
      category: a.category,
      instagram: a.instagram,
      start: start.toISOString(),
      end: end.toISOString(),
    })
  })
  return out
}

export const DEFAULT_META: TripMeta = {
  title: 'Bali 2026 🌴',
  startDate: '2026-07-15',
  endDate: '2026-07-24',
}

export interface TripStore {
  meta: TripMeta
  activities: Activity[]
  scheduled: ScheduledItem[]
  live: boolean
  setMeta: (m: TripMeta) => void
  addActivity: (a: Activity) => void
  updateActivity: (a: Activity) => void
  removeActivity: (id: string) => void
  addScheduled: (s: ScheduledItem) => void
  updateScheduled: (s: ScheduledItem) => void
  removeScheduled: (id: string) => void
}

const sortActivities = (a: Activity[]) =>
  [...a].sort((x, y) => x.area.localeCompare(y.area) || x.name.localeCompare(y.name))

/* ─────────────────────────  LOCAL (no Firebase) MODE  ───────────────────────── */
function useLocalTrip(): TripStore {
  const [meta, setMeta] = useState<TripMeta>(DEFAULT_META)
  const seeded = sortActivities(SEED_ACTIVITIES)
  const [activities, setActivities] = useState<Activity[]>(seeded)
  const demo =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
  const [scheduled, setScheduled] = useState<ScheduledItem[]>(
    demo ? buildDemoScheduled(seeded) : [],
  )

  return {
    meta,
    activities,
    scheduled,
    live: false,
    setMeta,
    addActivity: (a) => setActivities((p) => sortActivities([...p, a])),
    updateActivity: (a) =>
      setActivities((p) => sortActivities(p.map((x) => (x.id === a.id ? a : x)))),
    removeActivity: (id) => setActivities((p) => p.filter((x) => x.id !== id)),
    addScheduled: (s) => setScheduled((p) => [...p, s]),
    updateScheduled: (s) => setScheduled((p) => p.map((x) => (x.id === s.id ? s : x))),
    removeScheduled: (id) => setScheduled((p) => p.filter((x) => x.id !== id)),
  }
}

/* ─────────────────────────  FIRESTORE (live) MODE  ───────────────────────── */
function useFirestoreTrip(): TripStore {
  const [meta, setMetaState] = useState<TripMeta>(DEFAULT_META)
  const [activities, setActivities] = useState<Activity[]>([])
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([])
  const seededRef = useRef(false)

  const tripDoc = doc(db!, 'trips', TRIP_ID)
  const activitiesCol = collection(db!, 'trips', TRIP_ID, 'activities')
  const scheduledCol = collection(db!, 'trips', TRIP_ID, 'scheduled')

  useEffect(() => {
    // meta
    const unsubMeta = onSnapshot(tripDoc, (snap) => {
      if (snap.exists()) setMetaState(snap.data() as TripMeta)
      else setDoc(tripDoc, DEFAULT_META)
    })

    // activities (seed once if empty)
    const unsubAct = onSnapshot(activitiesCol, (snap) => {
      if (snap.empty && !seededRef.current) {
        seededRef.current = true
        const batch = writeBatch(db!)
        SEED_ACTIVITIES.forEach((a) => batch.set(doc(activitiesCol, a.id), a))
        batch.commit()
        return
      }
      setActivities(sortActivities(snap.docs.map((d) => d.data() as Activity)))
    })

    const unsubSch = onSnapshot(scheduledCol, (snap) => {
      setScheduled(snap.docs.map((d) => d.data() as ScheduledItem))
    })

    return () => {
      unsubMeta()
      unsubAct()
      unsubSch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    meta,
    activities,
    scheduled,
    live: true,
    setMeta: (m) => setDoc(tripDoc, m),
    addActivity: (a) => setDoc(doc(activitiesCol, a.id), a),
    updateActivity: (a) => setDoc(doc(activitiesCol, a.id), a),
    removeActivity: (id) => deleteDoc(doc(activitiesCol, id)),
    addScheduled: (s) => setDoc(doc(scheduledCol, s.id), s),
    updateScheduled: (s) => setDoc(doc(scheduledCol, s.id), s),
    removeScheduled: (id) => deleteDoc(doc(scheduledCol, id)),
  }
}

export function useTrip(): TripStore {
  // Hooks must be called unconditionally; pick one implementation for the app's lifetime.
  return firebaseEnabled ? useFirestoreTrip() : useLocalTrip()
}

/** Unused helper kept for parity / future server reset. */
export async function clearScheduled() {
  if (!firebaseEnabled) return
  const snap = await getDocs(collection(db!, 'trips', TRIP_ID, 'scheduled'))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
}
