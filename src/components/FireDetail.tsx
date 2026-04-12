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
  fire: Fire
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

export default function FireDetail({ fire, totals: t }: Props) {
  return (
    <div className="fire-detail-card">
      <div className="fire-detail-header">
        <div className="fire-detail-name">{fire.name}</div>
        <div className="fire-detail-year">{fire.year}</div>
      </div>
      <div className="fire-detail-location">{fire.location}</div>
      <div className="fire-detail-dates">
        {fire.startDate} → {fire.endDate} · {fire.daysWorked}d · {fmt(fire.acres)} acres
      </div>

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

      <div className="fire-detail-sources">
        {fire.sources.map((s, i) => (
          <a key={i} href={s.url} target="_blank" rel="noreferrer" className="source-link">
            {s.label}
          </a>
        ))}
      </div>
    </div>
  )
}
