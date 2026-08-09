import { formatDuration, sideLabel } from '../format'
import { routineDuration, routines } from '../routines'
import type { AppState } from '../types'

interface HomeViewProps {
  appState: AppState
  streak: number
  completedToday: boolean
  selectedRoutineId: string
  onSelectRoutine: (routineId: string) => void
  onToggleSound: (enabled: boolean) => void
  onStart: () => void
}

export function HomeView({
  appState,
  streak,
  completedToday,
  selectedRoutineId,
  onSelectRoutine,
  onToggleSound,
  onStart,
}: HomeViewProps) {
  return (
    <div className="view home">
      <header className="home__header">
        <p className="home__eyebrow">Good morning</p>
        <h1 className="home__title">Morning Stretches</h1>
        <p className="home__subtitle">
          A guided mobility routine to start the day. Pick one and follow along.
        </p>
      </header>

      <section className="stats" aria-label="Your progress">
        <div className="stats__item">
          <span className="stats__value">{streak}</span>
          <span className="stats__label">day streak</span>
        </div>
        <div className="stats__item">
          <span className="stats__value">{appState.totalSessions}</span>
          <span className="stats__label">sessions</span>
        </div>
        <div className="stats__item">
          <span className="stats__value">{completedToday ? 'Done' : 'Not yet'}</span>
          <span className="stats__label">today</span>
        </div>
      </section>

      <section aria-label="Routines">
        <h2 className="section-title">Choose a routine</h2>
        <ul className="routine-list">
          {routines.map((routine) => {
            const selected = routine.id === selectedRoutineId
            return (
              <li key={routine.id}>
                <button
                  type="button"
                  className={`routine-card${selected ? ' routine-card--selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => onSelectRoutine(routine.id)}
                >
                  <span className="routine-card__name">{routine.name}</span>
                  <span className="routine-card__meta">
                    {formatDuration(routineDuration(routine))} · {routine.moves.length} moves
                  </span>
                  <span className="routine-card__summary">{routine.summary}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <label className="toggle">
        <input
          type="checkbox"
          checked={appState.soundEnabled}
          onChange={(event) => onToggleSound(event.target.checked)}
        />
        <span>Chime between moves</span>
      </label>

      <button type="button" className="button button--primary button--wide" onClick={onStart}>
        Start routine
      </button>

      <details className="preview">
        <summary>What&apos;s in this routine?</summary>
        <ol className="preview__list">
          {routines
            .find((routine) => routine.id === selectedRoutineId)
            ?.moves.map((move) => (
              <li key={move.id}>
                <span>{move.name}</span>
                {sideLabel(move.side) !== null && (
                  <span className="preview__side">{sideLabel(move.side)}</span>
                )}
                <span className="preview__seconds">{move.seconds}s</span>
              </li>
            ))}
        </ol>
      </details>

      <p className="disclaimer">
        Move gently and stay within a comfortable range. Skip anything that hurts.
      </p>
    </div>
  )
}
