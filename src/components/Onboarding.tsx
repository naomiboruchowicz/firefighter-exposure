import { useState, useMemo, useRef, useEffect } from 'react'
import { ALL_FIRES, CREWS, type Fire } from '../data/fires'

type Props = {
  onComplete: (name: string, crew: string, selectedFires: Fire[]) => void
  onViewDemo: () => void
}

function groupByYear(fires: Fire[]): Map<number, Fire[]> {
  const groups = new Map<number, Fire[]>()
  for (const fire of fires) {
    const existing = groups.get(fire.year)
    if (existing) existing.push(fire)
    else groups.set(fire.year, [fire])
  }
  return groups
}

export default function Onboarding({ onComplete, onViewDemo }: Props) {
  const [name, setName] = useState('')
  const [crew, setCrew] = useState('')
  const [crewOpen, setCrewOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [firesOpen, setFiresOpen] = useState(false)
  const [selected, setSelected] = useState<Map<string, number | null>>(new Map())
  const crewRef = useRef<HTMLDivElement>(null)
  const firesRef = useRef<HTMLDivElement>(null)

  const filteredFires = search.trim()
    ? ALL_FIRES.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.location.toLowerCase().includes(search.toLowerCase()) ||
          String(f.year).includes(search)
      )
    : ALL_FIRES

  const yearGroups = useMemo(() => groupByYear(filteredFires), [filteredFires])

  const filteredCrews = crew.trim()
    ? CREWS.filter((c) => c.toLowerCase().includes(crew.toLowerCase()))
    : CREWS

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, null)
      return next
    })
  }

  const setDays = (id: string, days: number | null) => {
    setSelected((prev) => {
      const next = new Map(prev)
      next.set(id, days)
      return next
    })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (crewRef.current && !crewRef.current.contains(e.target as Node)) {
        setCrewOpen(false)
      }
      if (firesRef.current && !firesRef.current.contains(e.target as Node)) {
        setFiresOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFiresKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFiresOpen(false)
    }
  }

  const handleCrewKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setCrewOpen(false)
    }
  }

  const canSubmit = name.trim().length > 0 && selected.size > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    const fires = ALL_FIRES
      .filter((f) => selected.has(f.id))
      .map((f) => {
        const customDays = selected.get(f.id)
        if (customDays != null && customDays !== f.daysWorked) {
          const ratio = customDays / f.daysWorked
          return {
            ...f,
            daysWorked: customDays,
            chemicals: {
              pm25_mg: Math.round(f.chemicals.pm25_mg * ratio * 10) / 10,
              pahs_mg: Math.round(f.chemicals.pahs_mg * ratio * 10) / 10,
              formaldehyde_mg: Math.round(f.chemicals.formaldehyde_mg * ratio * 10) / 10,
              benzene_mg: Math.round(f.chemicals.benzene_mg * ratio * 100) / 100,
              dioxins_ug: Math.round(f.chemicals.dioxins_ug * ratio * 100) / 100,
            },
          }
        }
        return f
      })
      .sort((a, b) => a.year - b.year || a.startDate.localeCompare(b.startDate))
    onComplete(name.trim(), crew.trim(), fires)
  }

  const selectedFires = ALL_FIRES.filter((f) => selected.has(f.id))

  const buttonLabel = selected.size === 0
    ? 'Select at least one fire'
    : name.trim().length === 0
    ? 'Enter your name to continue'
    : `Show my exposure record (${selected.size} fire${selected.size > 1 ? 's' : ''})`

  return (
    <div className="onboarding">
      <div className="onboarding-inner">
        <h1 className="onboarding-brand">BREATHLINE</h1>
        <div className="onboarding-sub">Wildland exposure record</div>

        <p className="onboarding-desc">
          Every fire season, wildland firefighters inhale the equivalent
          of <span className="onboarding-stat">hundreds of cigarettes</span> in
          particulate matter alone. Select the fires you were deployed to.
          We will reconstruct what you breathed.
        </p>

        {/* ---- Fire selection combobox ---- */}
        <label className="field-label" htmlFor="fire-search" style={{ marginTop: 4 }}>
          Select your deployments
        </label>
        <div
          className="fire-combobox"
          ref={firesRef}
          role="combobox"
          aria-expanded={firesOpen}
          aria-haspopup="listbox"
          aria-owns={firesOpen ? 'fire-listbox' : undefined}
          onKeyDown={handleFiresKeyDown}
        >
          <input
            id="fire-search"
            className="field-input fire-search"
            type="text"
            placeholder="Search fires by name, location, or year..."
            value={search}
            aria-autocomplete="list"
            aria-controls={firesOpen ? 'fire-listbox' : undefined}
            onChange={(e) => {
              setSearch(e.target.value)
              setFiresOpen(true)
            }}
            onFocus={() => setFiresOpen(true)}
          />
          {firesOpen && (
            <div className="fire-dropdown">
              <ul className="fire-dropdown-list" id="fire-listbox" role="listbox" aria-label="Fires">
                {Array.from(yearGroups.entries()).map(([year, fires]) => (
                  <li key={year} className="year-group" role="group" aria-label={String(year)}>
                    <div className="year-group-label" aria-hidden="true">{year}</div>
                    {fires.map((fire) => {
                      const checked = selected.has(fire.id)
                      return (
                        <button
                          key={fire.id}
                          role="option"
                          aria-selected={checked}
                          className={`onboarding-fire-row ${checked ? 'checked' : ''}`}
                          onClick={() => toggle(fire.id)}
                        >
                          <span className={`checkbox ${checked ? 'checked' : ''}`} aria-hidden="true">
                            {checked ? '✓' : ''}
                          </span>
                          <span className="onboarding-fire-name">{fire.name}</span>
                          <span className="onboarding-fire-meta">
                            {fire.location.split(',')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </li>
                ))}
                {filteredFires.length === 0 && (
                  <li className="no-results" role="option" aria-disabled="true">No fires found for "{search}"</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Selected fires summary */}
        {selectedFires.length > 0 && (
          <div className="selected-panel has-fires">
            <div className="selected-fires-list">
              {selectedFires.map((f) => {
                const customDays = selected.get(f.id)
                const days = customDays ?? f.daysWorked
                return (
                  <div key={f.id} className="selected-fire-row">
                    <div className="selected-fire-info">
                      <span className="selected-fire-name">{f.name}</span>
                      <span className="selected-fire-year">{f.year}</span>
                    </div>
                    <div className="selected-fire-days">
                      <input
                        type="number"
                        className="days-input"
                        value={days === 0 ? '' : days}
                        min={0}
                        max={90}
                        aria-label={`Days deployed for ${f.name}`}
                        onChange={(e) => {
                          if (e.target.value === '') {
                            setDays(f.id, 0)
                            return
                          }
                          const v = parseInt(e.target.value)
                          if (!isNaN(v) && v >= 0) setDays(f.id, v)
                        }}
                      />
                      <span className="days-label" aria-hidden="true">days</span>
                    </div>
                    <button className="remove-fire" onClick={() => toggle(f.id)} aria-label={`Remove ${f.name}`}>
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ---- Identity (deferred) ---- */}
        <div className="onboarding-identity">
          <div className="field">
            <label className="field-label" htmlFor="firefighter-name">Your name</label>
            <input
              id="firefighter-name"
              className="field-input"
              type="text"
              placeholder="e.g. Daniel Ramirez"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div
            className="field"
            ref={crewRef}
            role="combobox"
            aria-expanded={crewOpen && filteredCrews.length > 0}
            aria-haspopup="listbox"
            aria-owns={crewOpen && filteredCrews.length > 0 ? 'crew-listbox' : undefined}
            onKeyDown={handleCrewKeyDown}
          >
            <label className="field-label" htmlFor="crew-input">Crew (optional)</label>
            <input
              id="crew-input"
              className="field-input"
              type="text"
              placeholder="Search crews..."
              value={crew}
              aria-autocomplete="list"
              aria-controls={crewOpen && filteredCrews.length > 0 ? 'crew-listbox' : undefined}
              onChange={(e) => {
                setCrew(e.target.value)
                setCrewOpen(true)
              }}
              onFocus={() => setCrewOpen(true)}
            />
            {crewOpen && filteredCrews.length > 0 && (
              <ul className="crew-dropdown" id="crew-listbox" role="listbox" aria-label="Crews">
                {filteredCrews.slice(0, 8).map((c) => (
                  <li key={c} role="option" aria-selected={crew === c}>
                    <button
                      className="crew-option"
                      tabIndex={-1}
                      onClick={() => {
                        setCrew(c)
                        setCrewOpen(false)
                      }}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          className={`generate-btn ${!canSubmit ? 'disabled' : ''}`}
          aria-disabled={!canSubmit}
          onClick={() => { if (canSubmit) handleSubmit() }}
        >
          {buttonLabel}
        </button>

        <button className="demo-link" onClick={onViewDemo}>
          Or view demo with sample data
        </button>
      </div>
    </div>
  )
}
