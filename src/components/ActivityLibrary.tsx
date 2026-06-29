import { useMemo, useState } from 'react'
import type { Activity, Area } from '../types'
import { AREA_COLOR, AREA_ORDER, type TripDay } from '../utils'
import ActivityCard from './ActivityCard'

interface Props {
  activities: Activity[]
  days: TripDay[]
  onEdit: (a: Activity) => void
  onAdd: () => void
  onAssign: (activityId: string, dayIso: string) => void
}

const AREA_LABEL: Record<Area, string> = {
  Uluwatu: 'Uluwatu',
  Canggu: 'Canggu',
  Ubud: 'Ubud',
  Other: 'Party / Beach Clubs',
}

export default function ActivityLibrary({ activities, days, onEdit, onAdd, onAssign }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map: Record<Area, Activity[]> = { Uluwatu: [], Canggu: [], Ubud: [], Other: [] }
    activities
      .filter((a) => !q || a.name.toLowerCase().includes(q))
      .forEach((a) => map[a.area].push(a))
    return map
  }, [activities, query])

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
              <button
                className="group-head"
                style={{ borderLeftColor: AREA_COLOR[area] }}
                onClick={() => setCollapsed((c) => ({ ...c, [area]: !c[area] }))}
              >
                <span className="group-dot" style={{ background: AREA_COLOR[area] }} />
                {AREA_LABEL[area]}
                <span className="group-count">{items.length}</span>
                <span className="group-caret">{isCollapsed ? '▸' : '▾'}</span>
              </button>
              {!isCollapsed && (
                <div className="group-cards">
                  {items.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      days={days}
                      onEdit={onEdit}
                      onAssign={onAssign}
                    />
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
