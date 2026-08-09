import { describe, expect, it } from 'vitest'
import { defaultRoutineId, getRoutine, routineDuration, routines } from '../routines'

describe('routines', () => {
  it('offers more than one routine', () => {
    expect(routines.length).toBeGreaterThan(1)
  })

  it('uses unique routine ids', () => {
    const ids = routines.map((routine) => routine.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses unique move ids within each routine', () => {
    for (const routine of routines) {
      const ids = routine.moves.map((move) => move.id)
      expect(new Set(ids).size, `duplicate move id in ${routine.id}`).toBe(ids.length)
    }
  })

  it('gives every move a positive duration and instructions', () => {
    for (const routine of routines) {
      expect(routine.moves.length).toBeGreaterThan(0)
      for (const move of routine.moves) {
        expect(move.seconds).toBeGreaterThan(0)
        expect(move.instructions.length).toBeGreaterThan(0)
      }
    }
  })

  it('pairs every one-sided move with its opposite side', () => {
    for (const routine of routines) {
      const left = routine.moves.filter((move) => move.side === 'left').length
      const right = routine.moves.filter((move) => move.side === 'right').length
      expect(left, `unbalanced sides in ${routine.id}`).toBe(right)
    }
  })

  it('keeps every routine under fifteen minutes', () => {
    for (const routine of routines) {
      expect(routineDuration(routine)).toBeLessThanOrEqual(15 * 60)
    }
  })

  it('resolves a routine by id', () => {
    expect(getRoutine('standing-only').id).toBe('standing-only')
  })

  it('falls back to the default routine for unknown or missing ids', () => {
    expect(getRoutine('does-not-exist').id).toBe(defaultRoutineId)
    expect(getRoutine(null).id).toBe(defaultRoutineId)
    expect(getRoutine(undefined).id).toBe(defaultRoutineId)
  })
})
