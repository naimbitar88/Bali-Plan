import type { TripMeta } from '../types'

interface Props {
  meta: TripMeta
  live: boolean
  onChange: (m: TripMeta) => void
}

export default function TopBar({ meta, live, onChange }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-emoji">🌴</span>
        <input
          className="trip-title"
          value={meta.title}
          onChange={(e) => onChange({ ...meta, title: e.target.value })}
        />
      </div>

      <div className="dates">
        <label>
          From
          <input
            type="date"
            value={meta.startDate}
            onChange={(e) => onChange({ ...meta, startDate: e.target.value })}
          />
        </label>
        <span className="arrow">→</span>
        <label>
          To
          <input
            type="date"
            value={meta.endDate}
            onChange={(e) => onChange({ ...meta, endDate: e.target.value })}
          />
        </label>
      </div>

      <label className="stay">
        🏠 Your stay
        <input
          className="stay-input"
          placeholder="address or lat,lng"
          value={meta.stay ?? ''}
          onChange={(e) => onChange({ ...meta, stay: e.target.value })}
          title="Used as the origin for distance + Directions on every card"
        />
      </label>

      <div className={`status ${live ? 'on' : 'off'}`}>
        <span className="dot" />
        {live ? 'Live · shared' : 'Local preview'}
      </div>
    </header>
  )
}
