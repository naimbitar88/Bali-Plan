import type { Activity, Area, Category, WeeklyEvent } from './types'

export const CATEGORY_ICON: Record<Category, string> = {
  beach: '🏖️',
  temple: '🛕',
  beachclub: '🍹',
  party: '🎧',
  food: '🍽️',
  dining: '🍷',
  hike: '🥾',
  waterfall: '💦',
  nature: '🌿',
  culture: '🎭',
  surf: '🏄',
}

export const AREA_COLOR: Record<Area, string> = {
  Uluwatu: '#0e9f9f',
  Canggu: '#f0883e',
  Ubud: '#3fa34d',
  Other: '#9b5de5',
}

export const AREA_ORDER: Area[] = ['Uluwatu', 'Canggu', 'Ubud', 'Other']

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
