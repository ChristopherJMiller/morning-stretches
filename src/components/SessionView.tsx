import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { playChime } from '../audio'
import { formatClock, sideLabel } from '../format'
import { useRoutineSession } from '../hooks/useSession'
import { useWakeLock } from '../hooks/useWakeLock'
import { supportsWebGL } from '../rig/webgl'
import type { Routine } from '../types'

// The 3D figure pulls in three.js; load it only once a session actually starts.
const MoveFigure = lazy(() => import('../rig/MoveFigure'))

const RING_RADIUS = 84
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface SessionViewProps {
  routine: Routine
  soundEnabled: boolean
  onExit: () => void
  onComplete: () => void
}

export function SessionView({ routine, soundEnabled, onExit, onComplete }: SessionViewProps) {
  const { state, move, remainingTotal, progress, dispatch } = useRoutineSession(routine)
  const previousMoveId = useRef(move.id)
  const completed = useRef(false)
  // Decided once: WebGL-less environments (and jsdom in tests) simply skip the figure.
  const [show3D] = useState(supportsWebGL)

  useWakeLock(state.status === 'running')

  useEffect(() => {
    if (state.status === 'finished') return
    if (previousMoveId.current === move.id) return
    previousMoveId.current = move.id
    if (soundEnabled) playChime()
  }, [move.id, soundEnabled, state.status])

  useEffect(() => {
    if (state.status !== 'finished' || completed.current) return
    completed.current = true
    if (soundEnabled) playChime(true)
    onComplete()
  }, [onComplete, soundEnabled, state.status])

  const running = state.status === 'running'
  const finished = state.status === 'finished'
  const nextMove = routine.moves[state.index + 1]
  const side = sideLabel(move.side)
  const moveProgress = finished ? 1 : 1 - state.remaining / move.seconds

  return (
    <div className="view session">
      <header className="session__header">
        <button type="button" className="button button--quiet" onClick={onExit}>
          End
        </button>
        <p className="session__counter">
          Move {Math.min(state.index + 1, routine.moves.length)} of {routine.moves.length}
        </p>
        <p className="session__remaining">{formatClock(remainingTotal)} left</p>
      </header>

      <div
        className="progress"
        role="progressbar"
        aria-label="Routine progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className="progress__bar" style={{ width: `${progress * 100}%` }} />
      </div>

      {show3D && !finished && (
        <div className="move-figure">
          <Suspense fallback={<div className="move-figure__placeholder" aria-hidden="true" />}>
            <MoveFigure moveId={move.id} side={move.side} paused={!running} />
          </Suspense>
        </div>
      )}

      <div className="timer">
        <svg className="timer__ring" viewBox="0 0 200 200" aria-hidden="true">
          <circle className="timer__track" cx="100" cy="100" r={RING_RADIUS} />
          <circle
            className="timer__value"
            cx="100"
            cy="100"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * moveProgress}
          />
        </svg>
        <div className="timer__readout">
          <span className="timer__seconds">{finished ? 0 : state.remaining}</span>
          <span className="timer__unit">seconds</span>
        </div>
      </div>

      <div className="move" aria-live="polite">
        <h1 className="move__name">
          {move.name}
          {side !== null && <span className="move__side">{side}</span>}
        </h1>
        <p className="move__instructions">{move.instructions}</p>
        <ul className="move__cues">
          {move.cues.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </div>

      <p className="session__next">
        {nextMove === undefined
          ? 'Last move — finish strong.'
          : `Next: ${nextMove.name}${sideLabel(nextMove.side) === null ? '' : ` (${sideLabel(nextMove.side)})`}`}
      </p>

      <div className="controls">
        <button
          type="button"
          className="button"
          onClick={() => dispatch({ type: 'previous' })}
          disabled={finished}
        >
          Back
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => dispatch({ type: running ? 'pause' : 'resume' })}
          disabled={finished}
        >
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          type="button"
          className="button"
          onClick={() => dispatch({ type: 'next' })}
          disabled={finished}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
