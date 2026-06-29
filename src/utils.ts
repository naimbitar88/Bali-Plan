import type { Activity, Area, Category, WeeklyEvent } from './types'

export const CATEGORY_ICON: Record<Category, string> = {
  beach: '🏖️',
  temple: '🛕',
  beachclub: '🍹',
  party: '🎧',
  afterparty: '🪩',
  food: '🍽️',
  dining: '🍷',
  hike: '🥾',
  waterfall: '💦',
  nature: '🌿',
  culture: '🎭',
  surf: '🏄',
}

/* ───────────────  Location → Type grouping  ─────────────── */
export type PlaceType = 'Restaurant' | 'Beach' | 'Club' | 'After Party' | 'Tourism'
export const TYPE_ORDER: PlaceType[] = ['Restaurant', 'Beach', 'Club', 'After Party', 'Tourism']
export const TYPE_ICON: Record<PlaceType, string> = {
  Restaurant: '🍽️',
  Beach: '🏖️',
  Club: '🍹',
  'After Party': '🪩',
  Tourism: '📸',
}

/** Map a fine-grained category onto the user-facing type buckets. */
export function typeOf(category: Category): PlaceType {
  switch (category) {
    case 'dining':
    case 'food':
      return 'Restaurant'
    case 'beach':
    case 'surf':
      return 'Beach'
    case 'party':
    case 'beachclub':
      return 'Club'
    case 'afterparty':
      return 'After Party'
    default:
      return 'Tourism' // temple, culture, nature, hike, waterfall
  }
}

export const AREA_COLOR: Record<Area, string> = {
  Uluwatu: '#0e9f9f',
  Canggu: '#f0883e',
  Ubud: '#3fa34d',
  Other: '#9b5de5',
}

// Canggu first — that's where we're staying / focusing.
export const AREA_ORDER: Area[] = ['Canggu', 'Uluwatu', 'Ubud', 'Other']

const pad = (n: number) => String(n).padStart(2, '0')
export const fmtTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** Add minutes to an ISO datetime, returning ISO. */
export function addMinutesISO(iso: string, minutes: number): string {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString()
}

/** Build a local Date for a given calendar date + "HH:MM" string. */
function atTime(base: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * Given an activity and the date it was dropped on, compute the start/end and a label.
 * For party venues with a matching weekly event, the event's start/finish time wins and
 * the title gets the event name; otherwise we use the dropped slot + default duration.
 */
export function resolveDrop(
  activity: Activity,
  dropDate: Date,
): { start: Date; end: Date; title: string } {
  const ev: WeeklyEvent | undefined = activity.weeklyEvents?.find(
    (e) => e.dayOfWeek === dropDate.getDay(),
  )

  if (ev) {
    const start = atTime(dropDate, ev.start)
    let end = atTime(dropDate, ev.end)
    if (end <= start) end.setDate(end.getDate() + 1) // runs past midnight
    return { start, end, title: `${activity.name} — ${ev.name}` }
  }

  const start = new Date(dropDate)
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + activity.defaultDurationMin)
  return { start, end, title: activity.name }
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export interface TripDay {
  iso: string // YYYY-MM-DD
  label: string // e.g. "Wed Jul 15"
}

/** Inclusive list of every calendar day in the trip, for the mobile "Add to day" picker. */
export function tripDays(startDate: string, endDate: string): TripDay[] {
  const out: TripDay[] = []
  const d = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (d <= end && out.length < 60) {
    out.push({
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      label: `${DAY_NAMES[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`,
    })
    d.setDate(d.getDate() + 1)
  }
  return out
}

/** Sensible default start hour when an activity is added via the day picker (no drag). */
export function defaultHourFor(category: Category): number {
  switch (category) {
    case 'afterparty':
      return 23
    case 'party':
    case 'beachclub':
      return 16
    case 'temple':
      return 16
    case 'dining':
      return 19
    case 'food':
      return 12
    case 'hike':
      return 8
    default:
      return 10
  }
}

/* ───────────────  Distance & travel time from your stay  ─────────────── */
export interface LatLng {
  lat: number
  lng: number
}

/**
 * Parse the "Your stay" field into coordinates if possible. Accepts:
 *  - "lat,lng"  e.g. "-8.6478, 115.1385"
 *  - a Google Maps URL containing "@lat,lng" or "q=lat,lng" or "!3dlat!4dlng"
 * Returns null for a plain address (we still build a Directions link from the text).
 */
export function parseStayCoords(stay: string): LatLng | null {
  if (!stay) return null
  const tryPair = (a: string, b: string): LatLng | null => {
    const lat = Number(a)
    const lng = Number(b)
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)
      return { lat, lng }
    return null
  }
  const at = stay.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (at) return tryPair(at[1], at[2])
  const d3d4 = stay.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (d3d4) return tryPair(d3d4[1], d3d4[2])
  const q = stay.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (q) return tryPair(q[1], q[2])
  const plain = stay.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/)
  if (plain) return tryPair(plain[1], plain[2])
  return null
}

/** Great-circle distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/**
 * Rough driving estimate from straight-line distance. Bali roads are winding and slow,
 * so we apply a ~1.35 road-detour factor and ~22 km/h effective speed (Canggu traffic).
 */
export function estimate(from: LatLng, to: LatLng): { km: number; min: number } {
  const roadKm = haversineKm(from, to) * 1.35
  const min = Math.round((roadKm / 22) * 60)
  return { km: Math.round(roadKm * 10) / 10, min: Math.max(1, min) }
}

/** Google Maps directions link (live, exact distance/time when opened). */
export function mapsDirectionsUrl(stay: string, dest: { name: string; coords?: LatLng }): string {
  const destination = dest.coords
    ? `${dest.coords.lat},${dest.coords.lng}`
    : `${dest.name}, Bali`
  const base = 'https://www.google.com/maps/dir/?api=1&travelmode=driving'
  const origin = stay ? `&origin=${encodeURIComponent(stay)}` : ''
  return `${base}${origin}&destination=${encodeURIComponent(destination)}`
}
