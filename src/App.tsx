import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onTimeIndexChange(Math.min(timeIndex + 1, fires.length))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onTimeIndexChange(Math.max(timeIndex - 1, 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onTimeIndexChange(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onTimeIndexChange(fires.length)
    }
  }

  return (
    <div
      className="scrubber-track"
      ref={trackRef}
      onClick={handleTrackClick}
      role="slider"
      tabIndex={0}
      aria-label="Career timeline"
      aria-valuemin={0}
      aria-valuemax={fires.length}
      aria-valuenow={timeIndex}
      aria-valuetext={timeIndex === 0 ? 'Before deployment' : `${timeIndex} of ${fires.length} fires`}
      onKeyDown={handleKeyDown}
    >
      <div className="scrubber-line" />
      <div
        className="scrubber-thumb"
        style={{ left: `${thumbPct}%` }}
      />
      <div className="scrubber-dots" aria-hidden="true">
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
      <div className="scrubber-years" aria-hidden="true">
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
  const [playing, setPlaying] = useState(false)

  const activeFires = profile?.fires ?? FIRES
  const visibleFires = useMemo(() => activeFires.slice(0, timeIndex), [activeFires, timeIndex])
  const t = useMemo(() => totals(visibleFires), [visibleFires])

  const stopPlayback = useCallback(() => {
    if (playRef.current) clearInterval(playRef.current)
    playRef.current = null
    setPlaying(false)
    setCurrentFireLabel(null)
    setCurrentFireYear(null)
  }, [])

  const startPlayback = useCallback((fires: Fire[], fromStep = 0) => {
    if (playRef.current) clearInterval(playRef.current)
    let step = fromStep
    setPlaying(true)
    setSelectedFireId(null)

    const interval = Math.max(450, Math.min(1200, 7000 / fires.length))

    playRef.current = setInterval(() => {
      step++
      if (step > fires.length) {
        if (playRef.current) clearInterval(playRef.current)
        playRef.current = null
        setCurrentFireLabel(null)
        setCurrentFireYear(null)
        setIntroComplete(true)
        setPlaying(false)
        return
      }
      setTimeIndex(step)
      setCurrentFireLabel(fires[step - 1].name)
      setCurrentFireYear(fires[step - 1].year)
    }, interval)
  }, [])

  const startIntro = useCallback((fires: Fire[]) => {
    setTimeIndex(0)
    setIntroComplete(false)
    setCurrentFireLabel(null)
    setCurrentFireYear(null)
    setSelectedFireId(null)
    startPlayback(fires, 0)
  }, [startPlayback])

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

  const togglePlayback = useCallback(() => {
    if (!profile) return
    if (playing) {
      stopPlayback()
    } else {
      // If at the end, restart from beginning
      if (timeIndex >= profile.fires.length) {
        startIntro(profile.fires)
      } else {
        startPlayback(profile.fires, timeIndex)
      }
    }
  }, [profile, playing, timeIndex, stopPlayback, startPlayback, startIntro])

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
        <div className="loading-screen" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <div className="loading-text">Building your exposure record</div>
        </div>
      )}

      {profile && sceneReady && !introComplete && timeIndex === 0 && !currentFireLabel && (
        <div className="intro-context">
          <div className="intro-line">
            {activeFires.length} fires. {totalDays} days deployed.
          </div>
          <div className="intro-sub">Everything {profile.name} breathed.</div>
        </div>
      )}

      {currentFireLabel && (
        <div className="announce" key={currentFireLabel} aria-live="polite">
          <div className="announce-name">{currentFireLabel}</div>
          <div className="announce-year">{currentFireYear}</div>
        </div>
      )}

      {profile && sceneReady && (
        <>
          <header className={`header ${introComplete ? 'show' : 'intro'}`}>
            <h1 className="brand">BREATHLINE</h1>
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
            {introComplete && (
              <button className="play-btn" onClick={togglePlayback} aria-label={playing ? 'Pause timeline' : 'Play timeline'}>
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                    <rect x="2" y="1" width="3.5" height="12" rx="1" />
                    <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                    <path d="M3 1.5v11l9-5.5z" />
                  </svg>
                )}
              </button>
            )}
            <ScrubberTrack
              fires={activeFires}
              timeIndex={timeIndex}
              selectedFireId={selectedFireId}
              onTimeIndexChange={(val) => {
                stopPlayback()
                setTimeIndex(val)
                setSelectedFireId(null)
                if (val >= activeFires.length) setIntroComplete(true)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
