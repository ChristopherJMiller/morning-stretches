import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

// The chime uses Web Audio, which jsdom does not implement.
vi.mock('../audio', () => ({ playChime: vi.fn() }))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

/** Advances both the fake clock and the interval that drives the countdown. */
async function advance(seconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(seconds * 1000)
  })
}

describe('App', () => {
  it('shows the routine picker first', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Morning Stretches' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start routine' })).toBeInTheDocument()
  })

  it('counts down the first move once a routine starts', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Standing Only/ }))
    await user.click(screen.getByRole('button', { name: 'Start routine' }))

    expect(screen.getByText('Grounding Breaths')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()

    await advance(5)
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('stops counting while paused', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Standing Only/ }))
    await user.click(screen.getByRole('button', { name: 'Start routine' }))
    await advance(2)
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    await advance(10)

    expect(screen.getByText('28')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Resume' }))
    await advance(3)
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('moves to the next stretch when skipped', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Standing Only/ }))
    await user.click(screen.getByRole('button', { name: 'Start routine' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))

    expect(screen.getByText('Slow Neck Rolls')).toBeInTheDocument()
    expect(screen.getByText(/Move 2 of/)).toBeInTheDocument()
  })

  it('records a completed session and shows the streak', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)

    await user.click(screen.getByRole('button', { name: /Standing Only/ }))
    await user.click(screen.getByRole('button', { name: 'Start routine' }))
    await advance(20 * 60)

    expect(await screen.findByRole('heading', { name: 'Nice work' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Done' }))
    const stats = screen.getByRole('region', { name: 'Your progress' })
    expect(stats).toHaveTextContent('1day streak')
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('remembers the chosen routine and preferences across reloads', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const first = render(<App />)

    await user.click(screen.getByRole('button', { name: /Standing Only/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Chime between moves' }))
    first.unmount()

    render(<App />)
    expect(screen.getByRole('button', { name: /Standing Only/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('checkbox', { name: 'Chime between moves' })).not.toBeChecked()
  })

  it('leaves a session without recording it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Start routine' }))
    await user.click(screen.getByRole('button', { name: 'End' }))

    expect(screen.getByRole('heading', { name: 'Morning Stretches' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Your progress' })).toHaveTextContent('Not yet')
  })
})
