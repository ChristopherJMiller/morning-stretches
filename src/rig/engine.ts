/**
 * Framework-free 3D rig engine. Loads the (clip-less) stick-man skeleton, restores
 * its bind pose, and poses it procedurally from `Pose` data — with 2-bone IK that
 * anchors the hands to the floor for the on-all-fours poses. The React wrapper just
 * drives `setPose`/`setPaused`/`dispose`; all three.js lives here.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STICKMAN_GLB_BASE64 } from './stickmanGlb'
import type { Axis, Pose, Step } from './poses'

const DEG = Math.PI / 180
const AXES: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
}

interface ArmChain {
  upper: string
  lower: string
  hand: string
  L1: number
  L2: number
  axisUpper: THREE.Vector3
  axisLower: THREE.Vector3
}
interface IkTarget {
  arm: ArmChain
  pos: THREE.Vector3
  pole?: THREE.Vector3
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

export class RigScene {
  private readonly container: HTMLElement
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100)
  private readonly controls: OrbitControls
  private readonly shadow: THREE.Mesh
  private readonly target = new THREE.Vector3(0, 0.8, 0)
  private radius = 3.4

  private modelRoot: THREE.Object3D | null = null
  private readonly boneMap: Record<string, THREE.Bone> = {}
  private readonly bind: Record<string, THREE.Quaternion> = {}
  private arms: ArmChain[] = []
  private ikTargets: IkTarget[] = []
  private floorY = 0

  private pose: Pose | null = null
  private pendingPose: Pose | null = null
  private paused = false
  private clock = 0
  private lastTs = 0
  private raf = 0
  private disposed = false
  private userActive = false
  private viewAz = 30
  private viewEl = 14
  private swayT = 0
  private readonly reduced: boolean
  private readonly observer: ResizeObserver

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.enablePan = false
    this.controls.minDistance = 1.2
    this.controls.maxDistance = 9
    // The figure gently sways around each pose's best angle; while the user is
    // dragging we hand control fully to OrbitControls and stop the sway.
    this.controls.addEventListener('start', () => { this.userActive = true })
    this.controls.addEventListener('end', () => { this.userActive = false })
    this.reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

    this.scene.add(new THREE.HemisphereLight(0xdfe6f2, 0x3a4152, 1.15))
    const key = new THREE.DirectionalLight(0xfff4e6, 1.65)
    key.position.set(3, 6, 4)
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0x9fb4d8, 0.55)
    rim.position.set(-4, 2, -3)
    this.scene.add(rim)
    this.shadow = this.makeShadow()
    this.scene.add(this.shadow)

    this.observer = new ResizeObserver(() => {
      this.resize()
      if (this.pose) this.frameCamera()
    })
    this.observer.observe(container)
    this.resize()

    new GLTFLoader().parse(base64ToArrayBuffer(STICKMAN_GLB_BASE64), '', (gltf) => {
      if (this.disposed) return
      this.onModelLoaded(gltf.scene)
    })

    this.raf = requestAnimationFrame(this.animate)
  }

  private makeShadow(): THREE.Mesh {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    if (g) {
      const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62)
      grad.addColorStop(0, 'rgba(0,0,0,0.4)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, 128, 128)
    }
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = 0.004
    return mesh
  }

  private onModelLoaded(model: THREE.Object3D) {
    this.modelRoot = model
    this.scene.add(model)
    let skinned: THREE.SkinnedMesh | null = null
    model.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned = o as THREE.SkinnedMesh
    })
    // This rig ships with bone nodes at identity; the rest pose lives in the inverse-
    // bind matrices. skeleton.pose() reconstructs the modelled T-pose.
    if (skinned) (skinned as THREE.SkinnedMesh).skeleton.pose()
    model.updateMatrixWorld(true)
    model.traverse((o) => {
      const bone = o as THREE.Bone
      if (bone.isBone) {
        this.boneMap[bone.name] = bone
        this.bind[bone.name] = bone.quaternion.clone()
      }
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = new THREE.MeshStandardMaterial({ color: 0xbcc3d0, roughness: 0.72, metalness: 0.02 })
      }
    })
    this.precomputeIK()
    this.setPose(this.pendingPose ?? this.pose ?? null)
  }

  // ---- posing primitives ----
  private worldPos(name: string): THREE.Vector3 {
    return this.boneMap[name].getWorldPosition(new THREE.Vector3())
  }

  private rotateWorld(name: string, axis: Axis, deg: number) {
    const bone = this.boneMap[name]
    if (!bone || !bone.parent) return
    const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion())
    const wd = new THREE.Quaternion().setFromAxisAngle(AXES[axis], deg * DEG)
    bone.quaternion.premultiply(pq.clone().invert().multiply(wd).multiply(pq))
    this.modelRoot?.updateMatrixWorld(true)
  }

  private applyTorso(steps: readonly Step[]) {
    for (const name in this.bind) this.boneMap[name].quaternion.copy(this.bind[name])
    this.modelRoot?.updateMatrixWorld(true)
    for (const [name, axis, deg] of steps) this.rotateWorld(name, axis, deg)
  }

  // ---- 2-bone IK (plants the hands, keeps elbows anatomically valid) ----
  private precomputeIK() {
    const spec = [
      { upper: 'LeftArm_08', lower: 'LeftForeArm_09', hand: 'LeftHand_010' },
      { upper: 'RightArm_012', lower: 'RightForeArm_013', hand: 'RightHand_014' },
    ]
    this.arms = spec.map(({ upper, lower, hand }) => {
      const U = this.worldPos(upper)
      const Lo = this.worldPos(lower)
      const H = this.worldPos(hand)
      const uq = this.boneMap[upper].getWorldQuaternion(new THREE.Quaternion())
      const lq = this.boneMap[lower].getWorldQuaternion(new THREE.Quaternion())
      return {
        upper, lower, hand,
        L1: U.distanceTo(Lo),
        L2: Lo.distanceTo(H),
        axisUpper: new THREE.Vector3().subVectors(Lo, U).applyQuaternion(uq.clone().invert()).normalize(),
        axisLower: new THREE.Vector3().subVectors(H, Lo).applyQuaternion(lq.clone().invert()).normalize(),
      }
    })
  }

  private aimBone(name: string, axisLocal: THREE.Vector3, worldDir: THREE.Vector3) {
    const bone = this.boneMap[name]
    if (!bone.parent) return
    const bwq = bone.getWorldQuaternion(new THREE.Quaternion())
    const cur = axisLocal.clone().applyQuaternion(bwq).normalize()
    const dq = new THREE.Quaternion().setFromUnitVectors(cur, worldDir.clone().normalize())
    const newWorld = dq.multiply(bwq)
    const pwq = bone.parent.getWorldQuaternion(new THREE.Quaternion())
    bone.quaternion.copy(pwq.invert().multiply(newWorld))
    bone.updateMatrixWorld(true)
  }

  private ikArm(arm: ArmChain, tgt: THREE.Vector3, pole: THREE.Vector3) {
    const S = this.worldPos(arm.upper)
    const toT = new THREE.Vector3().subVectors(tgt, S)
    // Clamp reach into the joint's real range so the elbow can neither hyperextend
    // (locked straight) nor fold past a natural limit.
    const reachMax = (arm.L1 + arm.L2) * 0.985
    const reachMin = Math.sqrt(arm.L1 * arm.L1 + arm.L2 * arm.L2 - 2 * arm.L1 * arm.L2 * Math.cos(0.35))
    const d = Math.min(Math.max(toT.length(), reachMin), reachMax)
    const dir = toT.clone().normalize()
    const a = (arm.L1 * arm.L1 - arm.L2 * arm.L2 + d * d) / (2 * d)
    const h = Math.sqrt(Math.max(0, arm.L1 * arm.L1 - a * a))
    const bend = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)))
    if (bend.lengthSq() < 1e-6) bend.set(0, -1, 0)
    bend.normalize()
    const elbow = S.clone().add(dir.clone().multiplyScalar(a)).add(bend.multiplyScalar(h))
    this.aimBone(arm.upper, arm.axisUpper, new THREE.Vector3().subVectors(elbow, S))
    const elbowNow = this.worldPos(arm.lower)
    this.aimBone(arm.lower, arm.axisLower, new THREE.Vector3().subVectors(tgt, elbowNow))
  }

  private bodyPole(): THREE.Vector3 {
    const back = new THREE.Vector3().subVectors(this.worldPos('Root_00'), this.worldPos('Spine2_03'))
    back.y = 0
    if (back.lengthSq() < 1e-6) back.set(0, 0, -1)
    return back.normalize().multiplyScalar(0.6).add(new THREE.Vector3(0, -1, 0)).normalize()
  }

  private kneeFloor(): number {
    return Math.min(this.worldPos('LeftLeg_016').y, this.worldPos('RightLeg_019').y) - 0.03
  }

  private lowestBoneY(): number {
    let min = Infinity
    const v = new THREE.Vector3()
    for (const name in this.boneMap) min = Math.min(min, this.boneMap[name].getWorldPosition(v).y)
    return min - 0.05
  }

  private buildTargets(pose: Pose) {
    this.ikTargets = []
    if (pose.kind === 'catcow') {
      for (const arm of this.arms) {
        const s = this.worldPos(arm.upper)
        this.ikTargets.push({ arm, pos: new THREE.Vector3(s.x, this.floorY, s.z + 0.06) })
      }
    } else if (pose.kind === 'thread') {
      const s0 = this.worldPos(this.arms[0].upper)
      const s1 = this.worldPos(this.arms[1].upper)
      const lowI = s0.y <= s1.y ? 0 : 1
      const highI = 1 - lowI
      const low = lowI === 0 ? s0 : s1
      const high = highI === 0 ? s0 : s1
      const outX = Math.sign(high.x - low.x) || 1
      this.ikTargets.push({ arm: this.arms[highI], pos: new THREE.Vector3(high.x, this.floorY, high.z + 0.16) })
      this.ikTargets.push({
        arm: this.arms[lowI],
        pos: new THREE.Vector3(low.x + outX * 0.3, this.floorY, low.z + 0.05),
        pole: new THREE.Vector3(0, -1, 0.15).normalize(),
      })
    }
  }

  private poseFrame(phase: number) {
    if (!this.pose) return
    this.applyTorso(this.pose.steps(phase))
    if (this.ikTargets.length) {
      const dpole = this.bodyPole()
      for (const t of this.ikTargets) this.ikArm(t.arm, t.pos, t.pole ?? dpole)
    }
  }

  private frameCamera() {
    if (!this.modelRoot) return
    const box = new THREE.Box3()
    const v = new THREE.Vector3()
    for (const name in this.boneMap) box.expandByPoint(this.boneMap[name].getWorldPosition(v))
    box.getCenter(this.target)
    const size = box.getSize(new THREE.Vector3())
    // Fit the bounding sphere within BOTH axes of the frustum, so the pose stays
    // fully framed in the short, wide session stage as well as tall viewports.
    // The sphere is padded for mesh that extends past the bones (rounded limbs and,
    // especially, the large head sphere sitting above the head bone).
    const sphereR = size.length() * 0.5 + 0.12
    const vHalf = (this.camera.fov * DEG) / 2
    const hHalf = Math.atan(Math.tan(vHalf) * (this.camera.aspect || 1))
    this.radius = (sphereR / Math.min(Math.tan(vHalf), Math.tan(hHalf))) * 1.12
    this.shadow.position.y = this.floorY - 0.02
    this.shadow.scale.setScalar(Math.max(size.x, size.z) * 0.9 + 0.35)
    this.orbitTo(this.viewAz, this.viewEl)
  }

  private orbitTo(azDeg: number, elDeg: number) {
    const az = azDeg * DEG
    const el = elDeg * DEG
    this.camera.position.set(
      this.target.x + this.radius * Math.cos(el) * Math.sin(az),
      this.target.y + this.radius * Math.sin(el),
      this.target.z + this.radius * Math.cos(el) * Math.cos(az),
    )
    this.camera.lookAt(this.target)
    this.controls.target.copy(this.target)
    this.controls.update()
  }

  // ---- public API ----
  setPose(pose: Pose | null) {
    if (!pose) return
    if (!this.modelRoot) {
      this.pendingPose = pose
      this.pose = pose
      return
    }
    this.pose = pose
    this.clock = 0
    this.swayT = 0
    this.viewAz = pose.view
    this.viewEl = pose.kind === 'standing' ? 12 : 20  // look down a bit more at floor poses
    this.modelRoot.position.y = 0
    this.applyTorso(pose.steps(0.5))
    this.floorY =
      pose.kind === 'standing' ? 0.04 : pose.kind === 'floor' ? this.lowestBoneY() : this.kneeFloor()
    this.buildTargets(pose)
    this.poseFrame(0.5)
    this.resize()
    this.frameCamera()
  }

  setPaused(paused: boolean) {
    this.paused = paused
  }

  private resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (w === 0 || h === 0) return
    this.renderer.setSize(w, h)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  private readonly animate = (ts: number) => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.animate)
    if (!this.lastTs) this.lastTs = ts
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000)
    this.lastTs = ts
    if (this.pose?.animated && !this.paused && !this.reduced) {
      this.clock += dt
      this.poseFrame(Math.sin(this.clock * 1.05) * 0.5 + 0.5)
    }
    if (!this.userActive && !this.reduced) {
      this.swayT += dt
      this.orbitTo(this.viewAz + 18 * Math.sin(this.swayT * 0.5), this.viewEl)
    }
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.observer.disconnect()
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
