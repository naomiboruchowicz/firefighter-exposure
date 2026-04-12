import { FIRES } from '../data/fires'

type Props = {
  selectedFireId: string | null
  onSelectFire: (id: string | null) => void
  timeIndex: number
  onTimeIndexChange: (index: number) => void
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
}

export default function Timeline({
  selectedFireId,
  onSelectFire,
  timeIndex,
  onTimeIndexChange,
  isPlaying,
  onPlay,
  onPause,
}: Props) {
  return (
    <footer className="timeline">
      <div className="timeline-controls">
        <button
          className="play-btn"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? 'Pause' : 'Play accumulation'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <div className="timeline-label">
          <div className="timeline-title">Career timeline</div>
          <div className="timeline-sub">
            {timeIndex === 0
              ? 'Before deployment'
              : timeIndex >= FIRES.length
              ? `${FIRES.length} fires · Full career`
              : `${timeIndex} of ${FIRES.length} fires`}
          </div>
        </div>
      </div>

      <div className="timeline-track">
        <input
          type="range"
          className="timeline-slider"
          min={0}
          max={FIRES.length}
          value={timeIndex}
          onChange={(e) => onTimeIndexChange(Number(e.target.value))}
        />
        <div className="timeline-nodes">
          {FIRES.map((fire, i) => {
            const visible = i < timeIndex
            const selected = selectedFireId === fire.id
            const pct = ((i + 0.5) / FIRES.length) * 100
            return (
              <button
                key={fire.id}
                className={`timeline-node ${visible ? 'visible' : ''} ${selected ? 'selected' : ''}`}
                style={{ left: `${pct}%` }}
                onClick={() => {
                  onTimeIndexChange(i + 1)
                  onSelectFire(selected ? null : fire.id)
                }}
                title={`${fire.name} · ${fire.year}`}
              >
                <span className="node-dot" />
                <span className="node-label">{fire.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
