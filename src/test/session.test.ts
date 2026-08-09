import { describe, expect, it } from 'vitest'
import {
  createSession,
  currentMove,
  remainingTotal,
  sessionReducer,
  type SessionState,
} from '../session'
import type { Routine } from '../types'

const routine: Routine = {
  id: 'test',
  name: 'Test routine',
  summary: 'Three short moves.',
  moves: [
    { id: 'a', name: 'A', instructions: 'Do A', cues: [], seconds: 10 },
    { id: 'b', name: 'B', instructions: 'Do B', cues: [], seconds: 20 },
    { id: 'c', name: 'C', instructions: 'Do C', cues: [], seconds: 5 },
  ],
}

const tick = (state: SessionState, seconds: number) =>
  sessionReducer(routine, state, { type: 'tick', seconds })

describe('createSession', () => {
  it('starts running on the first move', () => {
    expect(createSession(routine)).toEqual({
      routineId: 'test',
      index: 0,
      remaining: 10,
      status: 'running',
    })
  })
})

describe('tick', () => {
  it('counts down within a move', () => {
    expect(tick(createSession(routine), 3).remaining).toBe(7)
  })

  it('rolls over into the next move when the timer runs out', () => {
    const state = tick(createSession(routine), 10)
    expect(state.index).toBe(1)
    expect(state.remaining).toBe(20)
    expect(state.status).toBe('running')
  })

  it('carries surplus time into the next move', () => {
    const state = tick(createSession(routine), 12)
    expect(state.index).toBe(1)
    expect(state.remaining).toBe(18)
  })

  it('catches up across several moves after a long pause in the tab', () => {
    const state = tick(createSession(routine), 31)
    expect(state.index).toBe(2)
    expect(state.remaining).toBe(4)
  })

  it('finishes once every move is done, without overshooting', () => {
    const state = tick(createSession(routine), 500)
    expect(state).toMatchObject({ index: 2, remaining: 0, status: 'finished' })
  })

  it('ignores ticks while paused', () => {
    const paused = sessionReducer(routine, createSession(routine), { type: 'pause' })
    expect(tick(paused, 5)).toBe(paused)
  })

  it('ignores non-positive elapsed time', () => {
    const state = createSession(routine)
    expect(tick(state, 0)).toBe(state)
    expect(tick(state, -5)).toBe(state)
  })
})

describe('pause and resume', () => {
  it('toggles the status', () => {
    const paused = sessionReducer(routine, createSession(routine), { type: 'pause' })
    expect(paused.status).toBe('paused')
    expect(sessionReducer(routine, paused, { type: 'resume' }).status).toBe('running')
  })

  it('leaves a finished session alone', () => {
    const finished = tick(createSession(routine), 500)
    expect(sessionReducer(routine, finished, { type: 'pause' })).toBe(finished)
  })
})

describe('next', () => {
  it('skips to the following move with a full timer', () => {
    const state = sessionReducer(routine, createSession(routine), { type: 'next' })
    expect(state).toMatchObject({ index: 1, remaining: 20 })
  })

  it('finishes from the last move', () => {
    let state = sessionReducer(routine, createSession(routine), { type: 'next' })
    state = sessionReducer(routine, state, { type: 'next' })
    state = sessionReducer(routine, state, { type: 'next' })
    expect(state.status).toBe('finished')
  })

  it('keeps the paused status while skipping', () => {
    const paused = sessionReducer(routine, createSession(routine), { type: 'pause' })
    expect(sessionReducer(routine, paused, { type: 'next' }).status).toBe('paused')
  })
})

describe('previous', () => {
  it('restarts the current move when it is already under way', () => {
    const state = sessionReducer(routine, tick(createSession(routine), 4), { type: 'previous' })
    expect(state).toMatchObject({ index: 0, remaining: 10 })
  })

  it('steps back a move when the current one has not started', () => {
    const second = sessionReducer(routine, createSession(routine), { type: 'next' })
    const state = sessionReducer(routine, second, { type: 'previous' })
    expect(state).toMatchObject({ index: 0, remaining: 10 })
  })

  it('stays on the first move instead of going out of range', () => {
    const state = sessionReducer(routine, createSession(routine), { type: 'previous' })
    expect(state).toMatchObject({ index: 0, remaining: 10 })
  })

  it('reopens the last move from a finished session', () => {
    const finished = tick(createSession(routine), 500)
    const state = sessionReducer(routine, finished, { type: 'previous' })
    expect(state).toMatchObject({ index: 2, remaining: 5, status: 'running' })
  })
})

describe('restart', () => {
  it('returns to the beginning', () => {
    const finished = tick(createSession(routine), 500)
    expect(sessionReducer(routine, finished, { type: 'restart' })).toEqual(createSession(routine))
  })
})

describe('selectors', () => {
  it('reports the move in progress', () => {
    expect(currentMove(routine, tick(createSession(routine), 15)).id).toBe('b')
  })

  it('clamps to the last move once finished', () => {
    expect(currentMove(routine, tick(createSession(routine), 500)).id).toBe('c')
  })

  it('sums the time left across the routine', () => {
    expect(remainingTotal(routine, createSession(routine))).toBe(35)
    expect(remainingTotal(routine, tick(createSession(routine), 12))).toBe(23)
    expect(remainingTotal(routine, tick(createSession(routine), 500))).toBe(0)
  })
})
