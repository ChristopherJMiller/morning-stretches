type AudioContextConstructor = typeof AudioContext

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  const Ctor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext

  if (Ctor === undefined) return null
  context ??= new Ctor()
  return context
}

/**
 * Plays a short two-tone chime. Called when a move ends and when the routine
 * finishes, so it must stay cheap and never throw.
 */
export function playChime(finish = false): void {
  const audio = getContext()
  if (audio === null) return

  // Browsers start the context suspended until a user gesture unlocks it.
  void audio.resume().catch(() => undefined)

  const start = audio.currentTime
  const tones = finish ? [523.25, 659.25, 783.99] : [660, 880]

  tones.forEach((frequency, step) => {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    const at = start + step * 0.14

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, at)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.2, at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3)

    oscillator.connect(gain).connect(audio.destination)
    oscillator.start(at)
    oscillator.stop(at + 0.32)
  })
}
