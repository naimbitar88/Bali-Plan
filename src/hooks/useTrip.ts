import { useEffect, useMemo, useRef, useState } from 'react'
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
  stay: 'No.1 Jalan Raya Semat, Canggu, Bali',
  stayLat: -8.6515,
  stayLng: 115.134,
}

const LS_KEY = 'bali-plan-v2'

/**
 * We persist the user's *changes* (deletions, edits, custom cards) rather than a frozen
 * snapshot of the whole library. On load we rebuild the library from the current seed and
 * re-apply those changes — so new/moved built-in places always show up, while the user's
 * curation still sticks.
 */
interface Persisted {
  version: 2
  meta: TripMeta
  scheduled: ScheduledItem[]
  removedSeedIds: string[]
  edits: Record<string, Activity>
  custom: Activity[]
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Persisted
    return p && p.version === 2 ? p : null
  } catch {
    return null
  }
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

const SEED_IDS = new Set(SEED_ACTIVITIES.map((a) => a.id))

/* ─────────────────────────  LOCAL (no Firebase) MODE  ───────────────────────── */
function useLocalTrip(): TripStore {
  const demo =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
  const saved = demo ? null : loadPersisted()

  // Persisted *changes* (not a frozen library snapshot).
  const [removed, setRemoved] = useState<Set<string>>(new Set(saved?.removedSeedIds ?? []))
  const [edits, setEdits] = useState<Record<string, Activity>>(saved?.edits ?? {})
  const [custom, setCustom] = useState<Activity[]>(saved?.custom ?? [])
  const [meta, setMeta] = useState<TripMeta>(saved?.meta ?? DEFAULT_META)
  const [scheduled, setScheduled] = useState<ScheduledItem[]>(
    saved?.scheduled ?? (demo ? buildDemoScheduled(sortActivities(SEED_ACTIVITIES)) : []),
  )

  // Rebuild the library from the *current* seed, then apply the user's changes on top.
  const activities = useMemo(() => {
    const fromSeed = SEED_ACTIVITIES.filter((a) => !removed.has(a.id)).map(
      (a) => edits[a.id] ?? a,
    )
    return sortActivities([...fromSeed, ...custom])
  }, [removed, edits, custom])

  useEffect(() => {
    if (demo) return
    try {
      const payload: Persisted = {
        version: 2,
        meta,
        scheduled,
        removedSeedIds: [...removed],
        edits,
        custom,
      }
      localStorage.setItem(LS_KEY, JSON.stringify(payload))
    } catch {
      /* storage full / unavailable — ignore */
    }
  }, [demo, meta, scheduled, removed, edits, custom])

  return {
    meta,
    activities,
    scheduled,
    live: false,
    setMeta,
    addActivity: (a) => setCustom((p) => [...p, a]),
    updateActivity: (a) => {
      if (SEED_IDS.has(a.id)) setEdits((p) => ({ ...p, [a.id]: a }))
      else setCustom((p) => p.map((x) => (x.id === a.id ? a : x)))
    },
    removeActivity: (id) => {
      if (SEED_IDS.has(id)) setRemoved((p) => new Set(p).add(id))
      else setCustom((p) => p.filter((x) => x.id !== id))
    },
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
