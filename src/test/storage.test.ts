import { describe, expect, it } from 'vitest'
import {
  computeStreak,
  initialAppState,
  loadAppState,
  parseAppState,
  recordCompletion,
  saveAppState,
  toDateKey,
} from '../storage'

describe('toDateKey', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
  })
})

describe('computeStreak', () => {
  it('is zero without history', () => {
    expect(computeStreak([], '2026-03-10')).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-03-08', '2026-03-09', '2026-03-10'], '2026-03-10')).toBe(3)
  })

  it('keeps the streak alive until the end of the following day', () => {
    expect(computeStreak(['2026-03-08', '2026-03-09'], '2026-03-10')).toBe(2)
  })

  it('breaks after a missed day', () => {
    expect(computeStreak(['2026-03-06', '2026-03-07'], '2026-03-10')).toBe(0)
  })

  it('stops counting at the first gap', () => {
    expect(computeStreak(['2026-03-01', '2026-03-09', '2026-03-10'], '2026-03-10')).toBe(2)
  })

  it('ignores duplicate entries', () => {
    expect(computeStreak(['2026-03-10', '2026-03-10', '2026-03-09'], '2026-03-10')).toBe(2)
  })

  it('counts across a month boundary', () => {
    expect(computeStreak(['2026-02-28', '2026-03-01'], '2026-03-01')).toBe(2)
  })
})

describe('recordCompletion', () => {
  it('adds today and counts the session', () => {
    const state = recordCompletion(initialAppState, '2026-03-10')
    expect(state.completedDates).toEqual(['2026-03-10'])
    expect(state.totalSessions).toBe(1)
  })

  it('does not duplicate a day when a second routine is finished', () => {
    const first = recordCompletion(initialAppState, '2026-03-10')
    const second = recordCompletion(first, '2026-03-10')
    expect(second.completedDates).toEqual(['2026-03-10'])
    expect(second.totalSessions).toBe(2)
  })
})

describe('parseAppState', () => {
  it('falls back to defaults for unusable data', () => {
    expect(parseAppState(null)).toEqual(initialAppState)
    expect(parseAppState('nonsense')).toEqual(initialAppState)
  })

  it('drops entries that are not date keys', () => {
    const state = parseAppState({ completedDates: ['2026-03-10', 'yesterday', 42] })
    expect(state.completedDates).toEqual(['2026-03-10'])
  })

  it('keeps valid preferences', () => {
    const state = parseAppState({
      completedDates: ['2026-03-10'],
      totalSessions: 7,
      soundEnabled: false,
      lastRoutineId: 'standing-only',
    })
    expect(state).toEqual({
      completedDates: ['2026-03-10'],
      totalSessions: 7,
      soundEnabled: false,
      lastRoutineId: 'standing-only',
    })
  })
})

describe('persistence', () => {
  it('round-trips through localStorage', () => {
    const state = recordCompletion({ ...initialAppState, lastRoutineId: 'wake-up' }, '2026-03-10')
    saveAppState(state)
    expect(loadAppState()).toEqual(state)
  })

  it('returns defaults when nothing has been saved', () => {
    expect(loadAppState()).toEqual(initialAppState)
  })

  it('recovers from corrupted storage', () => {
    window.localStorage.setItem('morning-stretches.v1', '{not json')
    expect(loadAppState()).toEqual(initialAppState)
  })
})
