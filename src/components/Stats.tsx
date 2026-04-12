import { type Fire } from '../data/fires'

type Totals = {
  days: number
  pm25: number
  pahs: number
  formaldehyde: number
  benzene: number
  dioxins: number
}

type Props = {
  selectedFire: Fire | null
  visibleFires: Fire[]
  totals: Totals
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

function formatDecimal(n: number, places = 1): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })
}

export default function Stats({ selectedFire, visibleFires, totals: t }: Props) {
  if (selectedFire) {
    const c = selectedFire.chemicals
    return (
      <aside className="panel panel-right">
        <div className="panel-header">
          <div className="panel-title">Deployment detail</div>
        </div>

        <div className="detail-name">{selectedFire.name}</div>
        <div className="detail-location">{selectedFire.location}</div>

        <div className="detail-dates">
          {selectedFire.startDate} → {selectedFire.endDate}
          <span className="detail-days"> · {selectedFire.daysWorked} days</span>
        </div>

        <div className="stat-block">
          <div className="stat-label">Acres burned</div>
          <div className="stat-value">{formatNumber(selectedFire.acres)}</div>
        </div>

        <div className="chem-list">
          <div className="chem-header">Inhaled dose</div>
          <div className="chem-row">
            <span className="chem-dot" style={{ background: 'rgb(235,240,247)' }} />
            <span className="chem-name">PM2.5</span>
            <span className="chem-value">{formatDecimal(c.pm25_mg, 0)} mg</span>
          </div>
          <div className="chem-row">
            <span className="chem-dot" style={{ background: 'rgb(255,179,51)' }} />
            <span className="chem-name">PAHs</span>
            <span className="chem-value">{formatDecimal(c.pahs_mg)} mg</span>
          </div>
          <div className="chem-row">
            <span className="chem-dot" style={{ background: 'rgb(255,224,51)' }} />
            <span className="chem-name">Formaldehyde</span>
            <span className="chem-value">{formatDecimal(c.formaldehyde_mg)} mg</span>
          </div>
          <div className="chem-row chem-acute">
            <span className="chem-dot" style={{ background: 'rgb(77,179,255)' }} />
            <span className="chem-name">Benzene</span>
            <span className="chem-value">{formatDecimal(c.benzene_mg, 2)} mg</span>
          </div>
          <div className="chem-row chem-acute">
            <span className="chem-dot" style={{ background: 'rgb(255,64,115)' }} />
            <span className="chem-name">Dioxins</span>
            <span className="chem-value">{formatDecimal(c.dioxins_ug, 2)} µg</span>
          </div>
        </div>

        <div className="sources-block">
          <div className="sources-label">Sources</div>
          {selectedFire.sources.map((s, idx) => (
            <a
              key={idx}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="source-link"
            >
              {s.label}
            </a>
          ))}
        </div>
      </aside>
    )
  }

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <div className="panel-title">Career totals</div>
      </div>

      <div className="stat-grid">
        <div className="stat-cell">
          <div className="stat-cell-label">Fires</div>
          <div className="stat-cell-value">{visibleFires.length}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">Days deployed</div>
          <div className="stat-cell-value">{formatNumber(t.days)}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">Seasons</div>
          <div className="stat-cell-value">9</div>
        </div>
        <div className="stat-cell">
          <div className="stat-cell-label">Crew</div>
          <div className="stat-cell-value-sm">Los Padres IHC</div>
        </div>
      </div>

      <div className="chem-list">
        <div className="chem-header">Cumulative inhaled dose</div>
        <div className="chem-row">
          <span className="chem-dot" style={{ background: 'rgb(235,240,247)' }} />
          <span className="chem-name">PM2.5</span>
          <span className="chem-value">{formatDecimal(t.pm25 / 1000, 1)} g</span>
        </div>
        <div className="chem-row">
          <span className="chem-dot" style={{ background: 'rgb(255,179,51)' }} />
          <span className="chem-name">PAHs</span>
          <span className="chem-value">{formatDecimal(t.pahs, 0)} mg</span>
        </div>
        <div className="chem-row">
          <span className="chem-dot" style={{ background: 'rgb(255,224,51)' }} />
          <span className="chem-name">Formaldehyde</span>
          <span className="chem-value">{formatDecimal(t.formaldehyde, 0)} mg</span>
        </div>
        <div className="chem-row chem-acute">
          <span className="chem-dot" style={{ background: 'rgb(77,179,255)' }} />
          <span className="chem-name">Benzene</span>
          <span className="chem-value">{formatDecimal(t.benzene, 1)} mg</span>
        </div>
        <div className="chem-row chem-acute">
          <span className="chem-dot" style={{ background: 'rgb(255,64,115)' }} />
          <span className="chem-name">Dioxins</span>
          <span className="chem-value">{formatDecimal(t.dioxins, 1)} µg</span>
        </div>
      </div>

      <div className="hint">Click particles or a deployment to inspect.</div>
    </aside>
  )
}
