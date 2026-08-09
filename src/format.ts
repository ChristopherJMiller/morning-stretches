/** Formats seconds as `m:ss`, used for the countdown and time remaining. */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safe / 60)
  return `${minutes}:${`${safe % 60}`.padStart(2, '0')}`
}

/** Formats a routine length as a rounded, human-readable duration. */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  return `${minutes} min`
}

/** Screen-reader friendly label for a move that is done on one side. */
export function sideLabel(side: 'left' | 'right' | undefined): string | null {
  if (side === undefined) return null
  return side === 'left' ? 'Left side' : 'Right side'
}
