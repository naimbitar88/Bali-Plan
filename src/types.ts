export type Area = 'Uluwatu' | 'Canggu' | 'Ubud' | 'Other'

export type Category =
  | 'beach'
  | 'temple'
  | 'beachclub'
  | 'party'
  | 'food'
  | 'dining'
  | 'hike'
  | 'waterfall'
  | 'nature'
  | 'culture'
  | 'surf'

/** A recurring weekly event for a party / beach-club venue. */
export interface WeeklyEvent {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number
  name: string
  /** "HH:MM" 24h */
  start: string
  /** "HH:MM" 24h — may be earlier than start when the night runs past midnight */
  end: string
}

/** A library card — a place / thing you might do. */
export interface Activity {
  id: string
  name: string
  area: Area
  category: Category
  defaultDurationMin: number
  instagram?: string
  notes?: string
  cost?: string
  /** Present on venues that run scheduled events (Savaya, Single Fin, …). */
  weeklyEvents?: WeeklyEvent[]
  /** Shown when lineups should be double-checked closer to the trip. */
  verifyNote?: string
}

/** A scheduled instance placed on the calendar. */
export interface ScheduledItem {
  id: string
  activityId: string
  title: string
  area: Area
  category?: Category
  /** ISO datetime */
  start: string
  /** ISO datetime */
  end: string
  instagram?: string
  notes?: string
}

export interface TripMeta {
  title: string
  /** "YYYY-MM-DD" */
  startDate: string
  /** "YYYY-MM-DD" (exclusive-ish end day shown on the calendar) */
  endDate: string
}
