import type { Fire } from '../data/fires'

type TotalsData = {
  days: number
  pm25: number
  pahs: number
  formaldehyde: number
  benzene: number
  dioxins: number
}

type Props = {
  visibleFires: Fire[]
  totals: TotalsData
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

const CITY_AIR_PM25_PER_DAY = 0.15
const DIOXIN_SAFE_DAILY_UG = 0.7 * 80 * 1e-6

function pm25Context(mg: number): string {
  const years = Math.round(mg / CITY_AIR_PM25_PER_DAY / 365)
  return `${years} years of breathing city air`
}

function dioxinContext(ug: number, days: number): string {
  const safeDoseForPeriod = DIOXIN_SAFE_DAILY_UG * days
  const multiple = Math.round(ug / safeDoseForPeriod)
  return `${fmt(multiple)}x the EPA safe dose for this period`
}

type ChemConfig = {
  key: keyof TotalsData
  label: string
  color: string
  unit: string
  transform?: (v: number) => { value: string; unit: string }
  context: (val: number, days: number) => string | null
  contextColor?: string
}

const CHEMS: ChemConfig[] = [
  {
    key: 'pm25',
    label: 'PM2.5',
    color: 'rgb(235,240,247)',
    unit: 'g',
    transform: (v) => ({ value: fmtDec(v / 1000, 1), unit: 'g' }),
    context: (v) => pm25Context(v),
  },
  {
    key: 'pahs',
    label: 'PAHs',
    color: 'rgb(255,179,51)',
    unit: 'mg',
    context: () => 'Group 1 carcinogen (WHO/IARC)',
  },
  {
    key: 'formaldehyde',
    label: 'Formaldehyde',
    color: 'rgb(255,224,51)',
    unit: 'mg',
    context: () => 'Known human carcinogen (IARC)',
  },
  {
    key: 'benzene',
    label: 'Benzene',
    color: 'rgb(77,179,255)',
    unit: 'mg',
    context: () => 'Any exposure above zero increases cancer risk (EPA)',
    contextColor: 'rgb(77,179,255)',
  },
  {
    key: 'dioxins',
    label: 'Dioxins',
    color: 'rgb(255,64,115)',
    unit: 'µg',
    context: (v, d) => dioxinContext(v, d),
    contextColor: 'rgb(255,64,115)',
  },
]

export default function Totals({ visibleFires, totals: t }: Props) {
  const pm25Years = t.pm25 > 0 ? Math.round(t.pm25 / CITY_AIR_PM25_PER_DAY / 365) : 0

  return (
    <div className="totals" onClick={(e) => e.stopPropagation()}>
      <div className="totals-title">Career totals</div>

      <div className="totals-stats">
        <div>
          <div className="totals-stat-value">{visibleFires.length}</div>
          <div className="totals-stat-label">fires</div>
        </div>
        <div>
          <div className="totals-stat-value">{fmt(t.days)}</div>
          <div className="totals-stat-label">days</div>
        </div>
      </div>

      {pm25Years > 0 && (
        <div className="totals-headline">
          <span className="totals-headline-number">{pm25Years}</span>
          <span className="totals-headline-unit">years of city air inhaled</span>
        </div>
      )}

      <div className="totals-section-label">Cumulative dose</div>
      <div className="totals-chems">
        {CHEMS.map((ch) => {
          const raw = t[ch.key] as number
          const display = ch.transform
            ? ch.transform(raw)
            : {
                value: fmtDec(raw, raw < 1 ? 2 : raw < 100 ? 1 : 0),
                unit: ch.unit,
              }
          const context = ch.context(raw, t.days)
          return (
            <div key={ch.key} className="total-chem-group">
              <div className="total-chem-row">
                <span className="chem-dot" style={{ background: ch.color }} />
                <span className="chem-name">{ch.label}</span>
                <span className="chem-value">
                  {display.value} {display.unit}
                </span>
              </div>
              {context && ch.key !== 'pm25' && (
                <div
                  className="chem-context"
                  style={ch.contextColor ? { color: ch.contextColor, opacity: 0.75 } : undefined}
                >
                  {context}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button className="export-btn">Export exposure record</button>
    </div>
  )
}
