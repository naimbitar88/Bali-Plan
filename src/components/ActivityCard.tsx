import type { Activity } from '../types'
import {
  AREA_COLOR,
  CATEGORY_ICON,
  DAY_NAMES,
  estimate,
  mapsDirectionsUrl,
  type LatLng,
  type TripDay,
} from '../utils'

interface Props {
  activity: Activity
  days: TripDay[]
  stay: string
  stayCoords: LatLng | null
  onEdit: (a: Activity) => void
  onAssign: (activityId: string, dayIso: string) => void
  onDelete: (id: string) => void
}

function durationLabel(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

export default function ActivityCard({
  activity,
  days,
  stay,
  stayCoords,
  onEdit,
  onAssign,
  onDelete,
}: Props) {
  const color = AREA_COLOR[activity.area]
  const coords =
    activity.lat != null && activity.lng != null ? { lat: activity.lat, lng: activity.lng } : undefined
  const est = stayCoords && coords ? estimate(stayCoords, coords) : null
  const directionsUrl = mapsDirectionsUrl(stay, activity.name, activity.area)
  return (
    <div
      className="activity-card"
      style={{ borderLeftColor: color }}
      data-activity-id={activity.id}
      title="Drag me onto a day"
    >
      <div className="card-main">
        <span className="card-icon">{CATEGORY_ICON[activity.category]}</span>
        <span className="card-name">{activity.name}</span>
        <button
          className="card-delete"
          onClick={() => {
            if (confirm(`Delete "${activity.name}"?`)) onDelete(activity.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Delete this card"
          aria-label="Delete card"
        >
          ×
        </button>
      </div>

      <div className="card-meta">
        <span className="chip duration">⏱ {durationLabel(activity.defaultDurationMin)}</span>
        {activity.rating != null && (
          <span className="chip rating" title="Google rating (snapshot)">
            ⭐ {activity.rating.toFixed(1)}
          </span>
        )}
        {est && (
          <span className="chip dist" title="Rough driving estimate from your stay (approx)">
            🚗 ≈{est.km} km · ≈{est.min} min
          </span>
        )}
        <a
          className="chip dir"
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          title="Open Google Maps directions from your stay (exact distance & time)"
        >
          🧭 Directions
        </a>
        {activity.weeklyEvents && activity.weeklyEvents.length > 0 && (
          <span
            className="chip events"
            title={activity.weeklyEvents
              .map((e) => `${DAY_NAMES[e.dayOfWeek]} ${e.start}–${e.end} · ${e.name}`)
              .join('\n')}
          >
            🎟 {activity.weeklyEvents.length} events
          </span>
        )}
        {activity.instagram && (
          <a
            className="chip ig"
            href={activity.instagram}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            title="Open Instagram"
          >
            📷 IG
          </a>
        )}
        <button
          className="chip edit"
          onClick={() => onEdit(activity)}
          onMouseDown={(e) => e.stopPropagation()}
          title="Edit"
        >
          ✎
        </button>
      </div>

      {activity.verifyNote && <div className="card-verify">⚠ {activity.verifyNote}</div>}

      <div className="card-assign">
        <select
          className="assign-select"
          value=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) onAssign(activity.id, e.target.value)
            e.target.value = ''
          }}
        >
          <option value="">📅 Add to day…</option>
          {days.map((d) => (
            <option key={d.iso} value={d.iso}>
              {d.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
