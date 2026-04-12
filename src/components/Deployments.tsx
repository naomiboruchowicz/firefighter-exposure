import type { Fire } from '../data/fires'

type Totals = {
  days: number
  pm25: number
  pahs: number
  formaldehyde: number
  benzene: number
  dioxins: number
}

type Props = {
  fires: Fire[]
  selectedFireId: string | null
  onSelectFire: (id: string | null) => void
  timeIndex: number
  onTimeIndexChange: (index: number) => void
  introComplete: boolean
  totals: Totals
}

function fmtDec(n: number, places = 1): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })
}

function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

const CHEMS: {
  key: keyof Fire['chemicals']
  totalKey: keyof Totals
  label: string
  color: string
  unit: string
}[] = [
  { key: 'pm25_mg', totalKey: 'pm25', label: 'PM2.5', color: 'rgb(235,240,247)', unit: 'mg' },
  { key: 'pahs_mg', totalKey: 'pahs', label: 'PAHs', color: 'rgb(255,179,51)', unit: 'mg' },
  { key: 'formaldehyde_mg', totalKey: 'formaldehyde', label: 'Formaldehyde', color: 'rgb(255,224,51)', unit: 'mg' },
  { key: 'benzene_mg', totalKey: 'benzene', label: 'Benzene', color: 'rgb(77,179,255)', unit: 'mg' },
  { key: 'dioxins_ug', totalKey: 'dioxins', label: 'Dioxins', color: 'rgb(255,64,115)', unit: 'µg' },
]

function DetailPopover({
  fire,
  totals: t,
  onClose,
}: {
  fire: Fire
  totals: Totals
  onClose: () => void
}) {
  return (
    <div className="fire-detail-popover" onClick={(e) => e.stopPropagation()}>
      <div className="fire-detail-popover-header">
        <span className="fire-detail-popover-name">{fire.name} · {fire.year}</span>
        <button className="fire-detail-popover-close" onClick={onClose}>×</button>
      </div>

      <div className="fire-detail-meta">
        <div className="fire-detail-location">{fire.location}</div>
        <div className="fire-detail-stats">
          <span className="fire-detail-stat">
            <span className="fire-detail-stat-value">{fire.daysWorked}</span> days
          </span>
          <span className="fire-detail-stat">
            <span className="fire-detail-stat-value">{fmt(fire.acres)}</span> acres
          </span>
          <span className="fire-detail-stat">
            {fire.startDate} → {fire.endDate}
          </span>
        </div>
      </div>

      <div className="fire-detail-chems-label">Exposure</div>
      <div className="fire-detail-chems">
        {CHEMS.map((ch) => {
          const val = fire.chemicals[ch.key]
          const total = t[ch.totalKey] as number
          const pct = total > 0 ? Math.round((val / total) * 100) : 0
          return (
            <div key={ch.key} className="fire-chem-row">
              <span className="chem-dot" style={{ background: ch.color }} />
              <span className="chem-name">{ch.label}</span>
              <span className="chem-value">
                {fmtDec(val, val < 1 ? 2 : val < 100 ? 1 : 0)} {ch.unit}
              </span>
              <span className="chem-pct">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Deployments({
  fires,
  selectedFireId,
  onSelectFire,
  timeIndex,
  onTimeIndexChange,
  introComplete,
  totals: t,
}: Props) {
  const selectedFire = selectedFireId ? fires.find((f) => f.id === selectedFireId) ?? null : null

  return (
    <div className="deployments" onClick={(e) => e.stopPropagation()}>
      <div className={`deployments-list-wrap ${selectedFire ? 'hidden' : ''}`}>
        <div className="deployments-header">
          <span className="deployments-col-label">Deployments</span>
          <span className="deployments-col-label right">Year</span>
          <span className="deployments-col-label right">Days</span>
        </div>
        <ul className="fire-list">
        {fires.map((fire, i) => {
          const arrived = i < timeIndex
          const selected = selectedFireId === fire.id
          return (
            <li key={fire.id} className="fire-item">
              <button
                className={`fire-row ${arrived ? '' : 'pending'} ${selected ? 'selected' : ''} ${selectedFireId && !selected ? 'dimmed' : ''}`}
                onClick={() => {
                  if (!introComplete) return
                  if (selected) {
                    onSelectFire(null)
                    return
                  }
                  if (!arrived) {
                    onTimeIndexChange(i + 1)
                  }
                  onSelectFire(fire.id)
                }}
              >
                <span className="fire-name">{fire.name}</span>
                <span className="fire-year">{fire.year}</span>
                <span className="fire-days">{fire.daysWorked}</span>
              </button>
            </li>
          )
        })}
        </ul>
      </div>
      {selectedFire && (
        <DetailPopover
          fire={selectedFire}
          totals={t}
          onClose={() => onSelectFire(null)}
        />
      )}
    </div>
  )
}
