import { formatDuration } from '../format'
import { routineDuration } from '../routines'
import type { Routine } from '../types'

interface CompleteViewProps {
  routine: Routine
  streak: number
  totalSessions: number
  onRepeat: () => void
  onHome: () => void
}

export function CompleteView({
  routine,
  streak,
  totalSessions,
  onRepeat,
  onHome,
}: CompleteViewProps) {
  return (
    <div className="view complete">
      <h1 className="complete__title">Nice work</h1>
      <p className="complete__subtitle">
        You finished {routine.name} — {formatDuration(routineDuration(routine))} of movement before
        the day even started.
      </p>

      <section className="stats" aria-label="Your progress">
        <div className="stats__item">
          <span className="stats__value">{streak}</span>
          <span className="stats__label">day streak</span>
        </div>
        <div className="stats__item">
          <span className="stats__value">{totalSessions}</span>
          <span className="stats__label">sessions</span>
        </div>
      </section>

      <div className="controls controls--stacked">
        <button type="button" className="button button--primary button--wide" onClick={onHome}>
          Done
        </button>
        <button type="button" className="button button--wide" onClick={onRepeat}>
          Repeat routine
        </button>
      </div>
    </div>
  )
}
