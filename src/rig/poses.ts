/**
 * Declarative poses for the 3D figure. Following the project's "data is the source
 * of truth" principle, a pose is plain data: a list of joint rotations (optionally a
 * function of an animation phase) plus a `kind` that tells the engine how to anchor
 * the hands and frame the camera. Adding a pose for a move is a data edit here.
 *
 * Rotations are applied in world axes by the engine, in order, on top of the model's
 * rest pose. `x` ≈ flexion (forward/back), `y` ≈ twist, `z` ≈ side-to-side.
 */

export type Axis = 'x' | 'y' | 'z'
export type Step = readonly [bone: string, axis: Axis, deg: number]

/**
 * How the engine treats a pose:
 * - `catcow` / `thread`: on all fours, hands anchored to the floor with IK.
 * - `standing`: upright, feet planted from the rest pose, no IK.
 * - `floor`: any other posed shape, grounded by its lowest joint, no IK — for poses
 *   authored entirely by direct joint rotations (down-dog, glute bridge, lunges, …).
 */
export type PoseKind = 'catcow' | 'thread' | 'standing' | 'floor'

export interface Pose {
  kind: PoseKind
  /** Loop the phase to animate (e.g. the cat-cow spine flex). */
  animated: boolean
  /** Joint rotations for a given phase in [0,1]. Static poses ignore the phase. */
  steps: (phase: number) => Step[]
  /** Camera azimuth (deg) the pose reads best from; the figure gently sways around it. */
  view: number
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// On all-fours: torso tipped forward, thighs down to the knees, shins back.
const QUAD: Step[] = [
  ['Root_00', 'x', -82],
  ['LeftUpLeg_015', 'x', 84], ['RightUpLeg_018', 'x', 84],
  ['LeftLeg_016', 'x', -84], ['RightLeg_019', 'x', -84],
]

const catcow: Pose = {
  kind: 'catcow',
  animated: true,
  view: 35,
  steps: (p) => {
    const flex = lerp(15, -15, p) // + sags (cow), − humps (cat)
    return [
      ...QUAD,
      ['Spine_01', 'x', flex * 0.7], ['Spine1_02', 'x', flex], ['Spine2_03', 'x', flex],
      ['Neck_04', 'x', lerp(42, 6, p)], ['Head_05', 'x', lerp(12, -8, p)],
    ]
  },
}

// Hips stay up (knees supporting); the upper torso rolls onto its side so one
// shoulder drops to the floor and the arm threads through. The engine picks the
// support vs. threading arm from which shoulder ends up lower.
const thread: Pose = {
  kind: 'thread',
  animated: false,
  view: 40,
  steps: () => [
    ['Root_00', 'x', -70],
    ['LeftUpLeg_015', 'x', 76], ['RightUpLeg_018', 'x', 76],
    ['LeftLeg_016', 'x', -80], ['RightLeg_019', 'x', -80],
    ['Spine1_02', 'z', 36], ['Spine2_03', 'z', 78],
    ['Neck_04', 'x', 8], ['Head_05', 'z', 40],
  ],
}

// ---- upright poses (feet stay planted from the rest pose; no floor IK) ----
const ARMS_DOWN: Step[] = [['LeftArm_08', 'z', -72], ['RightArm_012', 'z', 72]]
const ARMS_UP: Step[] = [['LeftArm_08', 'z', 82], ['RightArm_012', 'z', -82]]

function standing(steps: Step[], view = 30): Pose {
  return { kind: 'standing', animated: false, steps: () => steps, view }
}
function floor(steps: Step[], view = 30): Pose {
  return { kind: 'floor', animated: false, steps: () => steps, view }
}

const neutral = standing([...ARMS_DOWN])
const reach = standing([...ARMS_UP, ['Spine1_02', 'x', -6], ['Neck_04', 'x', -8]], 20)
const forwardFold = standing([
  ['Root_00', 'x', -58], ['Spine1_02', 'x', -10], ['Neck_04', 'x', -18],
  ['LeftArm_08', 'z', -92], ['RightArm_012', 'z', 92],
], 90)
const sideBend = standing([
  ...ARMS_UP, ['Spine_01', 'z', -12], ['Spine1_02', 'z', -14], ['Neck_04', 'z', -6],
], 20)
const twist = standing([
  ...ARMS_DOWN, ['Spine1_02', 'y', 26], ['Spine2_03', 'y', 24], ['Neck_04', 'y', 14],
], 40)

/** Reflect a pose across the body's midline for the opposite side. */
function mirrorStep([bone, axis, deg]: Step): Step {
  const swapped = bone.includes('Left')
    ? bone.replace('Left', 'Right')
    : bone.replace('Right', 'Left')
  return [swapped, axis, axis === 'x' ? deg : -deg]
}
function mirrored(pose: Pose): Pose {
  return { ...pose, steps: (p) => pose.steps(p).map(mirrorStep), view: -pose.view }
}

// Move id → canonical pose. Unmapped moves fall back to a calm neutral stance
// (intentionally so for calf-raises and figure-four: the rig has no foot bones, so
// a toe-rise / ankle-over-knee contact can't read — neutral is the honest fallback).
const POSE_BY_MOVE: Record<string, Pose> = {
  // upright
  'standing-reach': reach,
  'closing-reach': reach,
  'forward-fold': forwardFold,
  'standing-hamstring': forwardFold,
  'standing-side-bend': sideBend,
  'standing-twists': twist,
  'standing-breathing': standing([['LeftArm_08', 'z', -60], ['LeftForeArm_09', 'x', -46], ['LeftForeArm_09', 'y', -52], ['RightArm_012', 'z', 60], ['RightForeArm_013', 'x', -46], ['RightForeArm_013', 'y', 52]], 45),
  'deep-breaths': standing([['LeftArm_08', 'z', -46], ['RightArm_012', 'z', 46], ['Spine1_02', 'x', 9], ['Spine2_03', 'x', 6], ['Neck_04', 'x', -8], ['Head_05', 'x', -6]], 55),
  'shoulder-circles': standing([['LeftShoulder_07', 'z', 26], ['RightShoulder_011', 'z', -26], ['LeftArm_08', 'z', -83], ['RightArm_012', 'z', 83]], 10),
  'arm-swings': standing([['LeftArm_08', 'z', -14], ['LeftArm_08', 'y', -70], ['LeftForeArm_09', 'y', -90], ['RightArm_012', 'z', 14], ['RightArm_012', 'y', 70], ['RightForeArm_013', 'y', 90]], 25),
  'neck-rolls': standing([['LeftArm_08', 'z', -72], ['RightArm_012', 'z', 72], ['Neck_04', 'x', 14], ['Neck_04', 'z', -10], ['Head_05', 'x', 18], ['Head_05', 'z', -26]], 25),
  'hip-circles': standing([['LeftArm_08', 'z', -55], ['RightArm_012', 'z', 55], ['LeftForeArm_09', 'y', -82], ['RightForeArm_013', 'y', 82], ['Root_00', 'z', 12], ['Spine_01', 'z', -6], ['Spine1_02', 'z', -6], ['Neck_04', 'z', -4]], 25),
  'march-in-place': standing([['LeftArm_08', 'z', -72], ['LeftArm_08', 'x', 30], ['RightArm_012', 'z', 72], ['RightArm_012', 'x', -45], ['LeftUpLeg_015', 'x', -85], ['LeftLeg_016', 'x', 85]], 90),
  'wall-angels': standing([['LeftArm_08', 'z', -6], ['LeftForeArm_09', 'z', 95], ['RightArm_012', 'z', 6], ['RightForeArm_013', 'z', -95]], 25),
  'standing-quad': standing([['RightArm_012', 'z', 72], ['LeftArm_08', 'z', -72], ['LeftArm_08', 'x', -48], ['LeftForeArm_09', 'x', -28], ['LeftLeg_016', 'x', -175]], 25),
  // on all fours / floor
  'cat-cow': catcow,
  'thread-the-needle': thread,
  'wall-calf': floor([['Root_00', 'x', -32], ['LeftUpLeg_015', 'x', 40], ['RightLeg_019', 'x', -18], ['LeftArm_08', 'z', 82], ['RightArm_012', 'z', -82]], 90),
  'breathing-reset': floor([['LeftArm_08', 'z', -72], ['RightArm_012', 'z', 72], ['LeftUpLeg_015', 'x', 55], ['RightUpLeg_018', 'x', 55], ['LeftLeg_016', 'x', -110], ['RightLeg_019', 'x', -110], ['Root_00', 'x', 90]], 120),
  'knee-rocks': floor([['LeftUpLeg_015', 'x', 55], ['RightUpLeg_018', 'x', 55], ['LeftLeg_016', 'x', -110], ['RightLeg_019', 'x', -110], ['Root_00', 'x', 90], ['LeftUpLeg_015', 'z', 62], ['RightUpLeg_018', 'z', 62]], 120),
  'glute-bridge': floor([['LeftArm_08', 'z', -72], ['RightArm_012', 'z', 72], ['LeftUpLeg_015', 'x', -40], ['RightUpLeg_018', 'x', -40], ['LeftLeg_016', 'x', -80], ['RightLeg_019', 'x', -80], ['Root_00', 'x', 118]], 120),
  'downward-dog': floor([['Root_00', 'x', -132], ['LeftUpLeg_015', 'x', 90], ['RightUpLeg_018', 'x', 90], ['LeftArm_08', 'z', -72], ['RightArm_012', 'z', 72], ['LeftArm_08', 'x', 60], ['RightArm_012', 'x', 60], ['Neck_04', 'x', 15], ['Head_05', 'x', 45]], 90),
  'low-lunge': floor([['Root_00', 'x', -16], ['LeftUpLeg_015', 'x', 80], ['LeftLeg_016', 'x', -92], ['RightUpLeg_018', 'x', -48], ['RightLeg_019', 'x', -68], ['LeftArm_08', 'z', -72], ['RightArm_012', 'z', 72], ['LeftArm_08', 'x', 22], ['RightArm_012', 'x', 22]], 90),
  'ninety-ninety': floor([['Root_00', 'x', -12], ['LeftUpLeg_015', 'x', 90], ['LeftLeg_016', 'y', -90], ['RightUpLeg_018', 'z', -90], ['RightLeg_019', 'y', -90], ['LeftArm_08', 'z', -72], ['RightArm_012', 'z', 72], ['LeftArm_08', 'x', 38], ['RightArm_012', 'x', 38]], 20),
}

/**
 * Resolve the pose for a move, mirroring right-sided variants. One-sided moves are
 * authored once and expanded into `<id>-left` / `<id>-right` by `bothSides()`, so we
 * strip that suffix to look the pose up by its base id.
 */
export function poseForMove(moveId: string, side?: 'left' | 'right'): Pose {
  const baseId = moveId.replace(/-(left|right)$/, '')
  const base = POSE_BY_MOVE[baseId] ?? neutral
  return side === 'right' ? mirrored(base) : base
}
