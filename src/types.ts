/** A single movement or stretch performed for a fixed amount of time. */
export interface Move {
  /** Stable identifier, unique within a routine. */
  id: string
  /** Short display name, e.g. "Cat-Cow". */
  name: string
  /** One-sentence description of how to perform the movement. */
  instructions: string
  /** Short reminders shown while the movement is in progress. */
  cues: string[]
  /** How long to hold or repeat the movement, in seconds. */
  seconds: number
  /**
   * Set for one-sided movements so the routine can prompt each side
   * separately. `undefined` means the movement is performed bilaterally.
   */
  side?: 'left' | 'right'
}

/** An ordered collection of moves that make up a full session. */
export interface Routine {
  id: string
  name: string
  /** One-sentence summary shown on the routine picker. */
  summary: string
  moves: Move[]
}

/** Persisted preferences and completion history. */
export interface AppState {
  /** ISO `YYYY-MM-DD` dates on which at least one routine was completed. */
  completedDates: string[]
  /** Total number of routines finished, across all days. */
  totalSessions: number
  /** Whether a chime plays when a move ends. */
  soundEnabled: boolean
  /** Id of the routine selected the last time the app was used. */
  lastRoutineId: string | null
}
