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
  visibleFires: Fire[]
  totals: Totals
  timeIndex: number
}

function fmt(n: number): string {
  return n.toLocaleString('en-US')
}

function fmtDec(n: number, places = 1): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })
}

const CHEMS: {
  key: keyof Fire['chemicals']
  label: string
  color: string
  unit: string
  divisor?: number
  unitLabel?: string
}[] = [
  { key: 'pm25_mg', label: 'PM2.5', color: 'rgb(235,240,247)', unit: 'mg' },
  { key: 'pahs_mg', label: 'PAHs', color: 'rgb(255,179,51)', unit: 'mg' },
  { key: 'formaldehyde_mg', label: 'Formaldehyde', color: 'rgb(255,224,51)', unit: 'mg' },
  { key: 'benzene_mg', label: 'Benzene', color: 'rgb(77,179,255)', unit: 'mg' },
  { key: 'dioxins_ug', label: 'Dioxins', color: 'rgb(255,64,115)', unit: 'µg' },
]

function FireDetail({ fire, totals: t }: { fire: Fire; totals: Totals }) {
  const totalMap: Record<string, number> = {
    pm25_mg: t.pm25,
    pahs_mg: t.pahs,
    formaldehyde_mg: t.formaldehyde,
    benzene_mg: t.benzene,
    dioxins_ug: t.dioxins,
  }

  return (
    <div className="fire-detail">
      <div className="fire-detail-location">{fire.location}</div>
      <div className="fire-detail-dates">
        {fire.startDate} → {fire.endDate} · {fire.daysWorked} days · {fmt(fire.acres)} acres
      </div>
      <div className="fire-detail-chems">
        {CHEMS.map((ch) => {
          const val = fire.chemicals[ch.key]
          const total = totalMap[ch.key]
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

export default function Panel({
  selectedFireId,
  onSelectFire,
  visibleFires,
  totals: t,
  timeIndex,
}: Props) {
  return (
    <aside className="panel">
      <section className="panel-section">
        <div className="panel-title">Career totals</div>
        <div className="totals-meta">
          {fmt(t.days)} days deployed · {visibleFires.length} fires
        </div>
        <div className="totals-chems">
          {CHEMS.map((ch) => {
            const totalMap: Record<string, number> = {
              pm25_mg: t.pm25,
              pahs_mg: t.pahs,
              formaldehyde_mg: t.formaldehyde,
              benzene_mg: t.benzene,
              dioxins_ug: t.dioxins,
            }
            const val = totalMap[ch.key]
            const display =
              ch.key === 'pm25_mg'
                ? `${fmtDec(val / 1000, 1)} g`
                : `${fmtDec(val, val < 1 ? 2 : val < 100 ? 1 : 0)} ${ch.unit}`
            return (
              <div key={ch.key} className="total-chem-row">
                <span className="chem-dot" style={{ background: ch.color }} />
                <span className="chem-name">{ch.label}</span>
                <span className="chem-value">{display}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel-section">
        <div className="panel-title">Deployments</div>
        <ul className="fire-list">
          {FIRES.map((fire, i) => {
            const visible = i < timeIndex
            const selected = selectedFireId === fire.id
            return (
              <li key={fire.id}>
                <button
                  className={`fire-row ${selected ? 'selected' : ''} ${!visible ? 'future' : ''}`}
                  onClick={() => {
                    if (!visible) return
                    onSelectFire(selected ? null : fire.id)
                  }}
                >
                  <span className="fire-name">{fire.name}</span>
                  <span className="fire-meta">
                    {fire.year} · {fire.daysWorked}d
                  </span>
                </button>
                {selected && visible && (
                  <FireDetail fire={fire} totals={t} />
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </aside>
  )
}
