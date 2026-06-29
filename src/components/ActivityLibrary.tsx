import { useMemo, useState } from 'react'
import type { Activity, Area } from '../types'
import {
  AREA_COLOR,
  AREA_ORDER,
  TYPE_ICON,
  TYPE_ORDER,
  typeOf,
  type LatLng,
  type PlaceType,
  type TripDay,
} from '../utils'
import ActivityCard from './ActivityCard'

interface Props {
  activities: Activity[]
  days: TripDay[]
  stay: string
  stayCoords: LatLng | null
  onEdit: (a: Activity) => void
  onAdd: () => void
  onAssign: (activityId: string, dayIso: string) => void
  onDelete: (id: string) => void
  onDeleteArea: (area: Area) => void
}

const AREA_LABEL: Record<Area, string> = {
  Canggu: 'Canggu',
  Seminyak: 'Seminyak',
  Kuta: 'Kuta',
  Uluwatu: 'Uluwatu',
  Ubud: 'Ubud',
  Other: 'Other',
}

export default function ActivityLibrary({
  activities,
  days,
  stay,
  stayCoords,
  onEdit,
  onAdd,
  onAssign,
  onDelete,
  onDeleteArea,
}: Props) {
  // Focus on Canggu — other areas start collapsed.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    Seminyak: true,
    Kuta: true,
    Uluwatu: true,
    Ubud: true,
    Other: true,
  })
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map: Record<Area, Activity[]> = {
      Canggu: [],
      Seminyak: [],
      Kuta: [],
      Uluwatu: [],
      Ubud: [],
      Other: [],
    }
    activities
      .filter((a) => !q || a.name.toLowerCase().includes(q))
      .forEach((a) => map[a.area].push(a))
    return map
  }, [activities, query])

  // Within an area, split into Restaurant / Beach / Club / After Party / Tourism.
  const byType = (items: Activity[]) => {
    const m = new Map<PlaceType, Activity[]>()
    items.forEach((a) => {
      const t = typeOf(a.category)
      if (!m.has(t)) m.set(t, [])
      m.get(t)!.push(a)
    })
    return TYPE_ORDER.filter((t) => m.has(t)).map((t) => ({ type: t, items: m.get(t)! }))
  }

  return (
    <aside className="library">
      <div className="library-head">
        <h2>Activities</h2>
        <button className="add-btn" onClick={onAdd}>
          + Add
        </button>
      </div>
      <input
        className="search"
        placeholder="Search activities…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="hint">Drag a card onto a day →</p>

      <div className="groups">
        {AREA_ORDER.map((area) => {
          const items = grouped[area]
          if (items.length === 0) return null
          const isCollapsed = collapsed[area]
          return (
            <section key={area} className="group">
              <div className="group-head" style={{ borderLeftColor: AREA_COLOR[area] }}>
                <button
                  className="group-toggle"
                  onClick={() => setCollapsed((c) => ({ ...c, [area]: !c[area] }))}
                >
                  <span className="group-dot" style={{ background: AREA_COLOR[area] }} />
                  {AREA_LABEL[area]}
                  <span className="group-count">{items.length}</span>
                  <span className="group-caret">{isCollapsed ? '▸' : '▾'}</span>
                </button>
                <button
                  className="group-delete"
                  title={`Delete the entire ${AREA_LABEL[area]} section`}
                  aria-label={`Delete ${AREA_LABEL[area]} section`}
                  onClick={() => {
                    if (
                      confirm(
                        `Delete the entire "${AREA_LABEL[area]}" section (${items.length} cards)? This cannot be undone.`,
                      )
                    )
                      onDeleteArea(area)
                  }}
                >
                  🗑
                </button>
              </div>
              {!isCollapsed && (
                <div className="group-cards">
                  {byType(items).map(({ type, items: typeItems }) => (
                    <div key={type} className="type-group">
                      <div className="type-head">
                        <span>{TYPE_ICON[type]}</span>
                        {type}
                        <span className="type-count">{typeItems.length}</span>
                      </div>
                      {typeItems.map((a) => (
                        <ActivityCard
                          key={a.id}
                          activity={a}
                          days={days}
                          stay={stay}
                          stayCoords={stayCoords}
                          onEdit={onEdit}
                          onAssign={onAssign}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </aside>
  )
}
