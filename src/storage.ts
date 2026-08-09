import type { AppState } from './types'

const STORAGE_KEY = 'morning-stretches.v1'

export const initialAppState: AppState = {
  completedDates: [],
  totalSessions: 0,
  soundEnabled: true,
  lastRoutineId: null,
}

/** Formats a date as `YYYY-MM-DD` in the viewer's own timezone. */
export function toDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Whole days between two `YYYY-MM-DD` keys, ignoring time and DST shifts. */
function daysBetween(earlier: string, later: string): number {
  const millis = fromDateKey(later).getTime() - fromDateKey(earlier).getTime()
  return Math.round(millis / 86_400_000)
}

/**
 * Number of consecutive days finishing today (or yesterday, so the streak is
 * not lost before the day is over).
 */
export function computeStreak(completedDates: string[], today: string): number {
  const days = [...new Set(completedDates)].sort().reverse()
  if (days.length === 0) return 0

  const gapToMostRecent = daysBetween(days[0], today)
  if (gapToMostRecent > 1 || gapToMostRecent < 0) return 0

  let streak = 1
  for (let i = 1; i < days.length; i += 1) {
    if (daysBetween(days[i], days[i - 1]) !== 1) break
    streak += 1
  }
  return streak
}

/** Records a finished routine, keeping one entry per day. */
export function recordCompletion(state: AppState, today: string): AppState {
  return {
    ...state,
    completedDates: state.completedDates.includes(today)
      ? state.completedDates
      : [...state.completedDates, today].sort(),
    totalSessions: state.totalSessions + 1,
  }
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Coerces unknown persisted data into a valid `AppState`. */
export function parseAppState(raw: unknown): AppState {
  if (typeof raw !== 'object' || raw === null) return initialAppState
  const value = raw as Partial<Record<keyof AppState, unknown>>

  const completedDates = Array.isArray(value.completedDates)
    ? value.completedDates.filter(
        (entry): entry is string => typeof entry === 'string' && DATE_KEY_PATTERN.test(entry),
      )
    : []

  return {
    completedDates: [...new Set(completedDates)].sort(),
    totalSessions:
      typeof value.totalSessions === 'number' && Number.isFinite(value.totalSessions)
        ? Math.max(0, Math.floor(value.totalSessions))
        : completedDates.length,
    soundEnabled: typeof value.soundEnabled === 'boolean' ? value.soundEnabled : true,
    lastRoutineId: typeof value.lastRoutineId === 'string' ? value.lastRoutineId : null,
  }
}

/** Reads saved state, returning defaults when storage is empty or unusable. */
export function loadAppState(): AppState {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === null ? initialAppState : parseAppState(JSON.parse(stored))
  } catch {
    // Private browsing modes and disabled storage should not break the app.
    return initialAppState
  }
}

/** Persists state, ignoring failures such as a full or blocked storage area. */
export function saveAppState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Nothing actionable: the app keeps working from in-memory state.
  }
}
