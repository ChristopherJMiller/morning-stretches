import type { Move, Routine } from './types'

export type SessionStatus = 'running' | 'paused' | 'finished'

/** Progress through a routine. Owned by a reducer so it stays easy to test. */
export interface SessionState {
  routineId: string
  /** Index of the move in progress, clamped to the last move once finished. */
  index: number
  /** Seconds left on the current move. Zero once the routine is finished. */
  remaining: number
  status: SessionStatus
}

export type SessionAction =
  /** Consumes `seconds` of elapsed time, rolling over into later moves. */
  | { type: 'tick'; seconds: number }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'restart' }

/** Builds the starting state for a routine, already running. */
export function createSession(routine: Routine): SessionState {
  return {
    routineId: routine.id,
    index: 0,
    remaining: routine.moves[0].seconds,
    status: 'running',
  }
}

/** The move currently in progress (or the final move once finished). */
export function currentMove(routine: Routine, state: SessionState): Move {
  return routine.moves[Math.min(state.index, routine.moves.length - 1)]
}

/** Seconds remaining in the whole routine, including the current move. */
export function remainingTotal(routine: Routine, state: SessionState): number {
  if (state.status === 'finished') return 0
  const later = routine.moves
    .slice(state.index + 1)
    .reduce((total, move) => total + move.seconds, 0)
  return state.remaining + later
}

function moveAt(routine: Routine, index: number): SessionState['index'] {
  return Math.max(0, Math.min(index, routine.moves.length - 1))
}

function startOfMove(routine: Routine, state: SessionState, index: number): SessionState {
  const safeIndex = moveAt(routine, index)
  return {
    ...state,
    index: safeIndex,
    remaining: routine.moves[safeIndex].seconds,
    status: state.status === 'finished' ? 'running' : state.status,
  }
}

function finish(routine: Routine, state: SessionState): SessionState {
  return {
    ...state,
    index: routine.moves.length - 1,
    remaining: 0,
    status: 'finished',
  }
}

/**
 * Advances past the current move. Used both by the countdown and by the
 * "skip" control, so skipping behaves exactly like the timer running out.
 */
function goToNext(routine: Routine, state: SessionState): SessionState {
  if (state.index >= routine.moves.length - 1) return finish(routine, state)
  return startOfMove(routine, state, state.index + 1)
}

function tick(routine: Routine, state: SessionState, seconds: number): SessionState {
  if (state.status !== 'running' || seconds <= 0) return state

  let next = state
  let budget = Math.floor(seconds)

  while (budget > 0) {
    if (budget < next.remaining) {
      return { ...next, remaining: next.remaining - budget }
    }
    budget -= next.remaining
    next = goToNext(routine, next)
    if (next.status === 'finished') return next
  }

  return next
}

/** Pure state machine driving a routine session. */
export function sessionReducer(
  routine: Routine,
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'tick':
      return tick(routine, state, action.seconds)
    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state
    case 'resume':
      return state.status === 'paused' ? { ...state, status: 'running' } : state
    case 'next':
      return state.status === 'finished' ? state : goToNext(routine, state)
    case 'previous':
      if (state.status === 'finished') {
        return { ...startOfMove(routine, state, routine.moves.length - 1), status: 'running' }
      }
      // Restarting the current move first mirrors how music players behave:
      // the first press repeats, the second press steps back.
      return state.remaining < routine.moves[state.index].seconds
        ? startOfMove(routine, state, state.index)
        : startOfMove(routine, state, state.index - 1)
    case 'restart':
      return createSession(routine)
  }
}
