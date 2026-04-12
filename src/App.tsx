import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Scene from './components/Scene'
import Deployments from './components/Deployments'
import Totals from './components/Totals'
// FireDetail is rendered inside Deployments as a popover
import { FIRES, DANIEL, totals } from './data/fires'
import './App.css'

export default function App() {
  const [selectedFireId, setSelectedFireId] = useState<string | null>(null)
  const [timeIndex, setTimeIndex] = useState(0)
  const [introComplete, setIntroComplete] = useState(false)
  const [currentFireLabel, setCurrentFireLabel] = useState<string | null>(null)
  const [currentFireYear, setCurrentFireYear] = useState<number | null>(null)
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const visibleFires = useMemo(() => FIRES.slice(0, timeIndex), [timeIndex])
  const t = useMemo(() => totals(visibleFires), [visibleFires])

  const startIntro = useCallback(() => {
    let step = 0
    if (playRef.current) clearInterval(playRef.current)
    playRef.current = setInterval(() => {
      step++
      if (step > FIRES.length) {
        if (playRef.current) clearInterval(playRef.current)
        setCurrentFireLabel(null)
        setCurrentFireYear(null)
        setIntroComplete(true)
        return
      }
      setTimeIndex(step)
      setCurrentFireLabel(FIRES[step - 1].name)
      setCurrentFireYear(FIRES[step - 1].year)
    }, 1500)
  }, [])

  useEffect(() => {
    const delay = setTimeout(startIntro, 2000)
    return () => {
      clearTimeout(delay)
      if (playRef.current) clearInterval(playRef.current)
    }
  }, [startIntro])

  const replay = useCallback(() => {
    setSelectedFireId(null)
    setTimeIndex(0)
    setIntroComplete(false)
    setCurrentFireLabel(null)
    setCurrentFireYear(null)
    setTimeout(startIntro, 300)
  }, [startIntro])

  const handleSelectFire = useCallback(
    (id: string | null) => {
      if (!introComplete) return
      setSelectedFireId(id)
    },
    [introComplete]
  )

  return (
    <div className="app" onClick={() => handleSelectFire(null)}>
      {/* Full-screen 3D body */}
      <div className="canvas-bg">
        <Scene
          selectedFireId={selectedFireId}
          onSelectFire={handleSelectFire}
          timeIndex={timeIndex}
        />
      </div>

      {/* Intro context line — appears before first fire */}
      {!introComplete && timeIndex === 0 && !currentFireLabel && (
        <div className="intro-context">
          <div className="intro-line">9 fires. 186 days deployed.</div>
          <div className="intro-sub">Everything Daniel Ramirez breathed.</div>
        </div>
      )}

      {/* Fire name announcement during intro */}
      {currentFireLabel && (
        <div className="announce" key={currentFireLabel}>
          <div className="announce-name">{currentFireLabel}</div>
          <div className="announce-year">{currentFireYear}</div>
        </div>
      )}

      {/* Header — always visible but minimal */}
      <header className={`header ${introComplete ? 'show' : 'intro'}`}>
        <div className="brand">THE RECORD</div>
        <div className="identity">
          <span className="identity-name">{DANIEL.name}</span>
          <span className="identity-sep"> · </span>
          <span className="identity-meta">{DANIEL.role}</span>
        </div>
      </header>

      {/* Overlays — fade in after intro */}
      <div className={`overlays ${introComplete ? 'show' : ''}`}>
        <Deployments
          selectedFireId={selectedFireId}
          onSelectFire={handleSelectFire}
          timeIndex={timeIndex}
          onTimeIndexChange={setTimeIndex}
          introComplete={introComplete}
          totals={t}
        />
        <Totals visibleFires={visibleFires} totals={t} />
      </div>

      {/* Scrubber — always visible */}
      <div className="scrubber">
        <div className="scrubber-track">
          <input
            type="range"
            className="scrubber-slider"
            min={0}
            max={FIRES.length}
            value={timeIndex}
            onChange={(e) => {
              const val = Number(e.target.value)
              setTimeIndex(val)
              setSelectedFireId(null)
              if (playRef.current) clearInterval(playRef.current)
              setCurrentFireLabel(null)
              setCurrentFireYear(null)
              if (val >= FIRES.length) setIntroComplete(true)
            }}
          />
          <div className="scrubber-years">
            {FIRES.map((fire, i) => {
              const prevYear = i > 0 ? FIRES[i - 1].year : null
              const showYear = fire.year !== prevYear
              const pct = ((i + 0.5) / FIRES.length) * 100
              return (
                <div
                  key={fire.id}
                  className="scrubber-mark"
                  style={{ left: `${pct}%` }}
                >
                  <div className={`scrubber-tick ${i < timeIndex ? 'active' : ''}`} />
                  {showYear && <span className="scrubber-year">{fire.year}</span>}
                </div>
              )
            })}
          </div>
        </div>
        {introComplete && (
          <button className="replay-btn" onClick={replay}>
            Replay
          </button>
        )}
      </div>
    </div>
  )
}
