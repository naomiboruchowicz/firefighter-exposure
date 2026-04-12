import { FIRES, type Fire } from '../data/fires'

type Totals = {
  days: number
  pm25: number
  pahs: number
  formaldehyde: number
  benzene: number
  dioxins: number
}

type Props = {
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

// Average US city: ~10 µg/m³ PM2.5. Person breathes ~15 m³/day. Daily inhaled = 0.15 mg.
const CITY_AIR_PM25_PER_DAY = 0.15

// EPA dioxin reference dose: 0.7 pg/kg-day. 80kg person.
const DIOXIN_SAFE_DAILY_UG = 0.7 * 80 * 1e-6 // in µg

function pm25Context(mg: number): string {
  const cityDays = Math.round(mg / CITY_AIR_PM25_PER_DAY)
  if (cityDays > 365) {
    const years = Math.round(cityDays / 365)
    return `Equal to ${years} years of breathing city air`
  }
  return `Equal to ${cityDays} days of breathing city air`
}

function dioxinContext(ug: number, days: number): string {
  const safeDoseForPeriod = DIOXIN_SAFE_DAILY_UG * days
  const multiple = Math.round(ug / safeDoseForPeriod)
  return `${fmt(multiple)}x the EPA safe dose for ${days} days`
}

const CHEM_CONTEXT: Record<string, string> = {
  pahs_mg: 'Group 1 carcinogen (WHO/IARC)',
  formaldehyde_mg: 'Known human carcinogen (IARC)',
  benzene_mg: 'Any exposure above zero increases cancer risk (EPA)',
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

function getContext(key: string, value: number, days: number): string | null {
  if (key === 'pm25_mg') return pm25Context(value)
  if (key === 'dioxins_ug') return dioxinContext(value, days)
  return CHEM_CONTEXT[key] ?? null
}

function DetailPopover({ fire, totals: t }: { fire: Fire; totals: Totals }) {
  return (
    <div className="detail-popover">
      <div className="detail-popover-header">
        <div className="detail-popover-name">{fire.name}</div>
        <div className="detail-popover-year">{fire.year}</div>
      </div>
      <div className="detail-popover-location">{fire.location}</div>
      <div className="detail-popover-dates">
        {fire.startDate} → {fire.endDate} · {fire.daysWorked}d · {fmt(fire.acres)} acres
      </div>
      <div className="detail-popover-chems">
        {CHEMS.map((ch) => {
          const val = fire.chemicals[ch.key]
          const total = t[ch.totalKey] as number
          const pct = total > 0 ? Math.round((val / total) * 100) : 0
          const context = getContext(ch.key, val, fire.daysWorked)
          return (
            <div key={ch.key} className="fire-chem-group">
              <div className="fire-chem-row">
                <span className="chem-dot" style={{ background: ch.color }} />
                <span className="chem-name">{ch.label}</span>
                <span className="chem-value">
                  {fmtDec(val, val < 1 ? 2 : val < 100 ? 1 : 0)} {ch.unit}
                </span>
                <span className="chem-pct">{pct}%</span>
              </div>
              {context && <div className="chem-context">{context}</div>}
            </div>
          )
        })}
      </div>

      <button className="export-btn" onClick={(e) => e.stopPropagation()}>
        Export exposure record
      </button>

      <div className="detail-popover-sources">
        <div className="sources-label">Data sources</div>
        {fire.sources.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noreferrer" className="source-link">
            {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}

export default function Deployments({
  selectedFireId,
  onSelectFire,
  timeIndex,
  onTimeIndexChange,
  introComplete,
  totals: t,
}: Props) {
  return (
    <div className="deployments" onClick={(e) => e.stopPropagation()}>
      <div className="deployments-title">Deployments</div>
      <ul className="fire-list">
        {FIRES.map((fire, i) => {
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
                <span className="fire-meta">
                  {fire.year} · {fire.daysWorked}d
                </span>
              </button>
              {selected && <DetailPopover fire={fire} totals={t} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
