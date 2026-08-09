import { useEffect, useRef } from 'react'

interface WakeLockSentinelLike {
  released: boolean
  release: () => Promise<void>
}

interface WakeLockNavigator {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> }
}

/**
 * Keeps the screen on while a routine is running. The browser drops the lock
 * when the tab is hidden, so it is re-requested whenever the page becomes
 * visible again.
 */
export function useWakeLock(active: boolean): void {
  const sentinel = useRef<WakeLockSentinelLike | null>(null)

  useEffect(() => {
    const wakeLock = (navigator as Navigator & WakeLockNavigator).wakeLock
    if (wakeLock === undefined || !active) return

    let cancelled = false

    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible') return
      try {
        sentinel.current = await wakeLock.request('screen')
      } catch {
        // Denied locks (low battery, restrictive policy) are not fatal.
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void acquire()
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibilityChange)
      const current = sentinel.current
      sentinel.current = null
      if (current !== null && !current.released) void current.release().catch(() => undefined)
    }
  }, [active])
}
