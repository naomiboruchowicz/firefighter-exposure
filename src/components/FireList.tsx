import { FIRES, type Fire } from '../data/fires'

type Props = {
  selectedFireId: string | null
  onSelectFire: (id: string | null) => void
  timeIndex: number
}

function dominantFuel(fire: Fire): string {
  const entries = Object.entries(fire.fuelMix) as [string, number][]
  entries.sort((a, b) => b[1] - a[1])
  return entries[0]?.[0] ?? ''
}

function fuelLabel(fuel: string): string {
  return (
    {
      wui: 'WUI',
      timber: 'Timber',
      grass: 'Grass',
      chaparral: 'Chaparral',
    }[fuel] ?? fuel
  )
}

export default function FireList({
  selectedFireId,
  onSelectFire,
  timeIndex,
}: Props) {
  return (
    <aside className="panel panel-left">
      <div className="panel-header">
        <div className="panel-title">Deployments</div>
        <button className="add-btn">+ Add deployment</button>
      </div>

      <ul className="fire-list">
        {FIRES.map((fire, i) => {
          const visible = i < timeIndex
          const selected = selectedFireId === fire.id
          const fuel = dominantFuel(fire)
          return (
            <li key={fire.id}>
              <button
                className={`fire-row ${selected ? 'selected' : ''} ${!visible ? 'future' : ''}`}
                onClick={() => {
                  if (!visible) return
                  onSelectFire(selected ? null : fire.id)
                }}
                aria-pressed={selected}
              >
                <div className="fire-row-main">
                  <span className="fire-name">{fire.name}</span>
                  <span className="fire-year">{fire.year}</span>
                </div>
                <div className="fire-row-meta">
                  <span className={`fuel-tag fuel-${fuel}`}>
                    {fuelLabel(fuel)}
                  </span>
                  <span className="fire-days">{fire.daysWorked}d</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="panel-footer">
        <div className="footer-label">Crew</div>
        <div className="footer-value">Los Padres Hotshots</div>
      </div>
    </aside>
  )
}
