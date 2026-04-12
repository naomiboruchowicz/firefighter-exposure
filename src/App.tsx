import { useState, useMemo, useCallback, useRef } from 'react'
import Onboarding from './components/Onboarding'
import Scene from './components/Scene'
import Deployments from './components/Deployments'
import Totals from './components/Totals'
import { FIRES, DANIEL, totals, type Fire } from './data/fires'
import './App.css'

function getFirePcts(fires: Fire[]) {
  const timestamps = fires.map((f) => new Date(f.startDate).getTime())
  const minT = timestamps[0]
  const maxT = timestamps[timestamps.length - 1]
  const range = maxT - minT || 1
  return timestamps.map((t) => ((t - minT) / range) * 100)
}

function pctForIndex(pcts: number[], index: number): number {
  if (index <= 0) return 0
  if (index > pcts.length) return 100
  // timeIndex N means N fires are visible, so thumb sits on fire N-1's dot
  return pcts[index - 1]
}

function indexFromClickPct(pcts: number[], clickPct: number): number {
  // Find the closest fire dot to the click position, return timeIndex (i+1)
  let closest = 0
  let closestDist = Math.abs(pcts[0] - clickPct)
  for (let i = 1; i < pcts.length; i++) {
    const dist = Math.abs(pcts[i] - clickPct)
    if (dist < closestDist) {
      closest = i
      closestDist = dist
    }
  }
  return closest + 1
}

function ScrubberTrack({
  fires,
  timeIndex,
  selectedFireId,
  onTimeIndexChange,
}: {
  fires: Fire[]
  timeIndex: number
  selectedFireId: string | null
  onTimeIndexChange: (val: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const pcts = useMemo(() => getFirePcts(fires), [fires])
  const thumbPct = pctForIndex(pcts, timeIndex)

  const handleTrackClick = (e: React.MouseEvent) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const clickPct = ((e.clientX - rect.left) / rect.width) * 100
    const idx = indexFromClickPct(pcts, clickPct)
    onTimeIndexChange(idx)
  }

  return (
    <div className="scrubber-track" ref={trackRef} onClick={handleTrackClick}>
      <div className="scrubber-line" />
      <div
        className="scrubber-thumb"
        style={{ left: `${thumbPct}%` }}
      />
      <div className="scrubber-dots">
        {fires.map((fire, i) => {
          const selected = selectedFireId === fire.id
          return (
            <div
              key={fire.id}
              className={`scrubber-dot ${i < timeIndex ? 'active' : ''} ${selected ? 'selected' : ''}`}
              style={{ left: `${pcts[i]}%` }}
            />
          )
        })}
      </div>
      <div className="scrubber-years">
        {fires.map((fire, i) => {
          const prevYear = i > 0 ? fires[i - 1].year : null
          if (fire.year === prevYear) return null
          return (
            <span
              key={`${fire.year}-${i}`}
              className="scrubber-year"
              style={{ left: `${pcts[i]}%` }}
            >
              {fire.year}
            </span>
          )
        })}
      </div>
    </div>
  )
}

type UserProfile = {
  name: string
  crew: string
  fires: Fire[]
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [selectedFireId, setSelectedFireId] = useState<string | null>(null)
  const [timeIndex, setTimeIndex] = useState(0)
  const [introComplete, setIntroComplete] = useState(false)
  const [currentFireLabel, setCurrentFireLabel] = useState<string | null>(null)
  const [currentFireYear, setCurrentFireYear] = useState<number | null>(null)
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingFires = useRef<Fire[] | null>(null)

  const activeFires = profile?.fires ?? FIRES
  const visibleFires = useMemo(() => activeFires.slice(0, timeIndex), [activeFires, timeIndex])
  const t = useMemo(() => totals(visibleFires), [visibleFires])

  const startIntro = useCallback((fires: Fire[]) => {
    let step = 0
    if (playRef.current) clearInterval(playRef.current)
    setTimeIndex(0)
    setIntroComplete(false)
    setCurrentFireLabel(null)
    setCurrentFireYear(null)
    setSelectedFireId(null)

    // Total animation stays ~7s regardless of fire count
    const interval = Math.max(450, Math.min(1200, 7000 / fires.length))

    playRef.current = setInterval(() => {
      step++
      if (step > fires.length) {
        if (playRef.current) clearInterval(playRef.current)
        setCurrentFireLabel(null)
        setCurrentFireYear(null)
        setIntroComplete(true)
        return
      }
      setTimeIndex(step)
      setCurrentFireLabel(fires[step - 1].name)
      setCurrentFireYear(fires[step - 1].year)
    }, interval)

    return () => {
      if (playRef.current) clearInterval(playRef.current)
    }
  }, [])

  const handleSceneReady = useCallback(() => {
    setSceneReady(true)
    if (pendingFires.current) {
      startIntro(pendingFires.current)
      pendingFires.current = null
    }
    setLoading(false)
  }, [startIntro])

  const handleViewDemo = useCallback(() => {
    pendingFires.current = FIRES
    setLoading(true)
    setProfile({ name: DANIEL.name, crew: DANIEL.role, fires: FIRES })
  }, [])

  const handleOnboardingComplete = useCallback(
    (name: string, crew: string, fires: Fire[]) => {
      pendingFires.current = fires
      setLoading(true)
      setProfile({ name, crew, fires })
    },
    []
  )

  const replay = useCallback(() => {
    if (!profile) return
    startIntro(profile.fires)
  }, [profile, startIntro])

  const handleSelectFire = useCallback(
    (id: string | null) => {
      if (!introComplete) return
      setSelectedFireId(id)
    },
    [introComplete]
  )

  const totalDays = activeFires.reduce((s, f) => s + f.daysWorked, 0)

  return (
    <div className="app" onClick={profile ? () => handleSelectFire(null) : undefined}>
      {profile && (
        <div className="canvas-bg">
          <Scene
            fires={activeFires}
            selectedFireId={selectedFireId}
            onSelectFire={handleSelectFire}
            timeIndex={timeIndex}
            onReady={handleSceneReady}
          />
        </div>
      )}

      {!profile && !loading && (
        <Onboarding onComplete={handleOnboardingComplete} onViewDemo={handleViewDemo} />
      )}

      {loading && !sceneReady && (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <div className="loading-text">Building your exposure record</div>
        </div>
      )}

      {profile && !introComplete && timeIndex === 0 && !currentFireLabel && (
        <div className="intro-context">
          <div className="intro-line">
            {activeFires.length} fires. {totalDays} days deployed.
          </div>
          <div className="intro-sub">Everything {profile.name} breathed.</div>
        </div>
      )}

      {currentFireLabel && (
        <div className="announce" key={currentFireLabel}>
          <div className="announce-name">{currentFireLabel}</div>
          <div className="announce-year">{currentFireYear}</div>
        </div>
      )}

      {profile && (
        <>
          <header className={`header ${introComplete ? 'show' : 'intro'}`}>
            <div className="brand">BREATHLINE</div>
            <div className="identity">
              <span className="identity-name">{profile.name}</span>
              {profile.crew && (
                <>
                  <span className="identity-sep"> · </span>
                  <span className="identity-meta">{profile.crew}</span>
                </>
              )}
            </div>
          </header>

          <div className={`overlays ${introComplete ? 'show' : ''}`}>
            <Deployments
              fires={activeFires}
              selectedFireId={selectedFireId}
              onSelectFire={handleSelectFire}
              timeIndex={timeIndex}
              onTimeIndexChange={setTimeIndex}
              introComplete={introComplete}
              totals={t}
            />
            <Totals visibleFires={visibleFires} totals={t} name={profile.name} crew={profile.crew} allFires={activeFires} />
          </div>

          <div className="scrubber">
            <ScrubberTrack
              fires={activeFires}
              timeIndex={timeIndex}
              selectedFireId={selectedFireId}
              onTimeIndexChange={(val) => {
                setTimeIndex(val)
                setSelectedFireId(null)
                if (playRef.current) clearInterval(playRef.current)
                setCurrentFireLabel(null)
                setCurrentFireYear(null)
                if (val >= activeFires.length) setIntroComplete(true)
              }}
            />
            {introComplete && (
              <button className="replay-btn" onClick={replay}>
                Replay
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
