import { useCallback, useEffect, useMemo, useState } from 'react'
import { CompleteView } from './components/CompleteView'
import { HomeView } from './components/HomeView'
import { SessionView } from './components/SessionView'
import { getRoutine } from './routines'
import { computeStreak, loadAppState, recordCompletion, saveAppState, toDateKey } from './storage'
import type { AppState } from './types'

type Screen = 'home' | 'session' | 'complete'

export default function App() {
  const [appState, setAppState] = useState<AppState>(loadAppState)
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    () => getRoutine(appState.lastRoutineId).id,
  )
  // Changing the key restarts the session component from the first move.
  const [sessionKey, setSessionKey] = useState(0)

  useEffect(() => {
    saveAppState(appState)
  }, [appState])

  const routine = useMemo(() => getRoutine(selectedRoutineId), [selectedRoutineId])
  const today = toDateKey(new Date())
  const streak = useMemo(
    () => computeStreak(appState.completedDates, today),
    [appState.completedDates, today],
  )

  const selectRoutine = useCallback((routineId: string) => {
    setSelectedRoutineId(routineId)
    setAppState((state) => ({ ...state, lastRoutineId: routineId }))
  }, [])

  const startSession = useCallback(() => {
    setSessionKey((key) => key + 1)
    setScreen('session')
  }, [])

  const completeSession = useCallback(() => {
    setAppState((state) => recordCompletion(state, toDateKey(new Date())))
    setScreen('complete')
  }, [])

  const goHome = useCallback(() => setScreen('home'), [])

  if (screen === 'session') {
    return (
      <SessionView
        key={sessionKey}
        routine={routine}
        soundEnabled={appState.soundEnabled}
        onExit={goHome}
        onComplete={completeSession}
      />
    )
  }

  if (screen === 'complete') {
    return (
      <CompleteView
        routine={routine}
        streak={streak}
        totalSessions={appState.totalSessions}
        onRepeat={startSession}
        onHome={goHome}
      />
    )
  }

  return (
    <HomeView
      appState={appState}
      streak={streak}
      completedToday={appState.completedDates.includes(today)}
      selectedRoutineId={routine.id}
      onSelectRoutine={selectRoutine}
      onToggleSound={(soundEnabled) => setAppState((state) => ({ ...state, soundEnabled }))}
      onStart={startSession}
    />
  )
}
