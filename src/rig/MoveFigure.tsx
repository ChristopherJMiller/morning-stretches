import { useEffect, useRef } from 'react'
import { RigScene } from './engine'
import { poseForMove } from './poses'

interface MoveFigureProps {
  /** Move id (may carry a `-left`/`-right` suffix). */
  moveId: string
  side?: 'left' | 'right'
  /** Freeze the spine animation while the timer is paused. */
  paused: boolean
}

/**
 * Lazy-loaded 3D figure for the current move. Owns a single `RigScene` for its
 * lifetime, re-poses when the move changes, and tears three.js down on unmount.
 */
export default function MoveFigure({ moveId, side, paused }: MoveFigureProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<RigScene | null>(null)

  useEffect(() => {
    if (!hostRef.current) return
    const scene = new RigScene(hostRef.current)
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setPose(poseForMove(moveId, side))
  }, [moveId, side])

  useEffect(() => {
    sceneRef.current?.setPaused(paused)
  }, [paused])

  return <div ref={hostRef} className="move-figure__canvas" aria-hidden="true" />
}
