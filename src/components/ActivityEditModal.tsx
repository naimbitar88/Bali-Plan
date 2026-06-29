import { useState } from 'react'
import type { Activity, Area, Category, ScheduledItem } from '../types'
import { AREA_ORDER, CATEGORY_ICON } from '../utils'

const CATEGORIES = Object.keys(CATEGORY_ICON) as Category[]

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 40)

/** Instagram keyword search for a place name (opens in a new tab). */
const igSearchUrl = (q: string) =>
  `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(q)}`
/** Instagram hashtag explore link derived from a place name. */
const igHashtagUrl = (name: string) => `https://www.instagram.com/explore/tags/${slug(name)}/`

/* ───────────────────────────  Library card editor  ─────────────────────────── */
export function ActivityEditModal({
  activity,
  onSave,
  onDelete,
  onClose,
}: {
  activity: Activity
  onSave: (a: Activity) => void
  onDelete?: (id: string) => void
  onClose: () => void
}) {
  const [a, setA] = useState<Activity>(activity)
  const set = (patch: Partial<Activity>) => setA((p) => ({ ...p, ...patch }))

  return (
    <Backdrop onClose={onClose}>
      <h3>{activity.name ? 'Edit activity' : 'New activity'}</h3>
      <label>Name<input value={a.name} onChange={(e) => set({ name: e.target.value })} /></label>
      <div className="row">
        <label>
          Area
          <select value={a.area} onChange={(e) => set({ area: e.target.value as Area })}>
            {AREA_ORDER.map((ar) => (
              <option key={ar} value={ar}>{ar}</option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select value={a.category} onChange={(e) => set({ category: e.target.value as Category })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_ICON[c]} {c}</option>
            ))}
          </select>
        </label>
        <label>
          Duration (min)
          <input
            type="number"
            value={a.defaultDurationMin}
            onChange={(e) => set({ defaultDurationMin: Number(e.target.value) })}
          />
        </label>
      </div>
      <label>
        Instagram link
        <div className="ig-field">
          <input
            placeholder="Paste an Instagram URL, or use the buttons →"
            value={a.instagram ?? ''}
            onChange={(e) => set({ instagram: e.target.value })}
          />
          <a
            className="ig-btn search"
            href={igSearchUrl(a.name || 'Bali')}
            target="_blank"
            rel="noreferrer"
            title="Search Instagram for this place in a new tab, then paste the link"
          >
            🔍 Search IG
          </a>
          <button
            type="button"
            className="ig-btn tag"
            disabled={!a.name}
            onClick={() => set({ instagram: igHashtagUrl(a.name) })}
            title="Fill with an Instagram hashtag link from the name"
          >
            # Use hashtag
          </button>
        </div>
      </label>
      {a.instagram && (
        <a className="ig-preview" href={a.instagram} target="_blank" rel="noreferrer">
          ↗ Open: {a.instagram}
        </a>
      )}
      <label>Notes<textarea value={a.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} /></label>

      <div className="modal-actions">
        {onDelete && activity.name && (
          <button className="danger" onClick={() => onDelete(a.id)}>Delete</button>
        )}
        <span style={{ flex: 1 }} />
        <button onClick={onClose}>Cancel</button>
        <button className="primary" onClick={() => onSave(a)}>Save</button>
      </div>
    </Backdrop>
  )
}

/* ───────────────────────────  Scheduled event editor  ─────────────────────────── */
const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventEditModal({
  item,
  onSave,
  onDelete,
  onClose,
}: {
  item: ScheduledItem
  onSave: (s: ScheduledItem) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const [s, setS] = useState<ScheduledItem>(item)
  const set = (patch: Partial<ScheduledItem>) => setS((p) => ({ ...p, ...patch }))

  return (
    <Backdrop onClose={onClose}>
      <h3>Edit scheduled activity</h3>
      <label>Title<input value={s.title} onChange={(e) => set({ title: e.target.value })} /></label>
      <div className="row">
        <label>
          Starts
          <input
            type="datetime-local"
            value={toLocalInput(s.start)}
            onChange={(e) => set({ start: new Date(e.target.value).toISOString() })}
          />
        </label>
        <label>
          Ends
          <input
            type="datetime-local"
            value={toLocalInput(s.end)}
            onChange={(e) => set({ end: new Date(e.target.value).toISOString() })}
          />
        </label>
      </div>
      <label>Notes<textarea value={s.notes ?? ''} onChange={(e) => set({ notes: e.target.value })} /></label>

      <div className="modal-actions">
        <button className="danger" onClick={() => onDelete(s.id)}>Remove from day</button>
        <span style={{ flex: 1 }} />
        <button onClick={onClose}>Cancel</button>
        <button className="primary" onClick={() => onSave(s)}>Save</button>
      </div>
    </Backdrop>
  )
}

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
