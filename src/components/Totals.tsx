import type { Fire } from '../data/fires'
import { exportExposureRecord } from '../lib/exportPdf'

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
  name: string
  crew: string
  allFires: Fire[]
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

const DIOXIN_SAFE_DAILY_UG = 0.7 * 80 * 1e-6
const PM25_PER_CIGARETTE_MG = 12

function pm25Context(mg: number): string {
  const cigs = Math.round(mg / PM25_PER_CIGARETTE_MG)
  return `Equivalent to smoking ${fmt(cigs)} cigarettes`
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
    context: () => 'Classified Group 1 carcinogen by WHO',
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
    context: () => 'No safe exposure level exists (EPA)',
  },
  {
    key: 'dioxins',
    label: 'Dioxins',
    color: 'rgb(255,64,115)',
    unit: 'µg',
    context: (v, d) => dioxinContext(v, d),
  },
]

export default function Totals({ visibleFires, totals: t, name, crew, allFires }: Props) {
  const pm25Cigs = t.pm25 > 0 ? Math.round(t.pm25 / PM25_PER_CIGARETTE_MG) : 0

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

      {pm25Cigs > 0 && (
        <div className="totals-headline">
          <span className="totals-headline-number">{fmt(pm25Cigs)}</span>
          <span className="totals-headline-unit">cigarettes worth of particulate inhaled</span>
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
              {context && (
                <div className="chem-context">
                  {context}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        className="export-btn"
        onClick={() => {
          const allTotals = allFires.reduce(
            (acc, f) => {
              acc.days += f.daysWorked
              acc.pm25 += f.chemicals.pm25_mg
              acc.pahs += f.chemicals.pahs_mg
              acc.formaldehyde += f.chemicals.formaldehyde_mg
              acc.benzene += f.chemicals.benzene_mg
              acc.dioxins += f.chemicals.dioxins_ug
              return acc
            },
            { days: 0, pm25: 0, pahs: 0, formaldehyde: 0, benzene: 0, dioxins: 0, cigarettes: 0 }
          )
          allTotals.cigarettes = Math.round(allTotals.pm25 / PM25_PER_CIGARETTE_MG)
          exportExposureRecord(name, crew, allFires, allTotals)
        }}
      >
        Export exposure record
      </button>

      <div className="totals-sources">
        <div className="sources-label">Data sources</div>
        <div className="sources-inline">
          <a href="https://doi.org/10.5194/acp-11-4039-2011" target="_blank" rel="noreferrer" className="source-link">Akagi et al. 2011</a>
          <a href="https://doi.org/10.1016/j.foreco.2013.06.043" target="_blank" rel="noreferrer" className="source-link">Urbanski 2014</a>
          <a href="https://doi.org/10.1289/EHP2298" target="_blank" rel="noreferrer" className="source-link">Rappold et al. 2017</a>
          <a href="https://www.epa.gov/iris" target="_blank" rel="noreferrer" className="source-link">EPA IRIS</a>
        </div>
      </div>
    </div>
  )
}
