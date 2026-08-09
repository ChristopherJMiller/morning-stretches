/**
 * Cheap WebGL capability check. Kept free of any three.js import so the caller can
 * decide whether to even load the (heavy, lazy) 3D module. In jsdom this returns
 * false, so tests and non-WebGL browsers degrade to no figure rather than crashing.
 */
export function supportsWebGL(): boolean {
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) return false
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
