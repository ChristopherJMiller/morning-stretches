import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { createSession, currentMove, remainingTotal, sessionReducer } from '../session'
import type { SessionAction, SessionState } from '../session'
import type { Move, Routine } from '../types'

export interface RoutineSession {
  state: SessionState
  move: Move
  /** Seconds left in the whole routine. */
  remainingTotal: number
  /** Completed fraction of the routine, between 0 and 1. */
  progress: number
  dispatch: (action: SessionAction) => void
}

/**
 * Runs the countdown for a routine. Elapsed time is measured against the wall
 * clock rather than counted per interval, so a throttled or backgrounded tab
 * catches up instead of drifting behind.
 */
export function useRoutineSession(routine: Routine): RoutineSession {
  const reducer = useCallback(
    (state: SessionState, action: SessionAction) => sessionReducer(routine, state, action),
    [routine],
  )
  const [state, dispatch] = useReducer(reducer, routine, createSession)

  useEffect(() => {
    if (state.status !== 'running') return

    let last = Date.now()
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - last) / 1000)
      if (elapsed <= 0) return
      last += elapsed * 1000
      dispatch({ type: 'tick', seconds: elapsed })
    }, 200)

    return () => window.clearInterval(id)
  }, [state.status])

  const total = useMemo(
    () => routine.moves.reduce((sum, move) => sum + move.seconds, 0),
    [routine],
  )
  const left = remainingTotal(routine, state)

  return {
    state,
    move: currentMove(routine, state),
    remainingTotal: left,
    progress: total === 0 ? 1 : (total - left) / total,
    dispatch,
  }
}
