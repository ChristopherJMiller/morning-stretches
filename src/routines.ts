import type { Move, Routine } from './types'

/** Input shape for `bothSides`, before the side suffix is applied. */
type SidedMove = Omit<Move, 'side'>

/**
 * Expands a one-sided movement into a left and a right repetition so the
 * routine prompts for each side separately.
 */
function bothSides(move: SidedMove): Move[] {
  return [
    { ...move, id: `${move.id}-left`, side: 'left' },
    { ...move, id: `${move.id}-right`, side: 'right' },
  ]
}

const wakeUp: Routine = {
  id: 'wake-up',
  name: 'Wake Up',
  summary: 'A short five-minute reset to shake off the night. Great on busy mornings.',
  moves: [
    {
      id: 'standing-reach',
      name: 'Standing Full-Body Reach',
      instructions: 'Stand tall, reach both arms overhead and lengthen from heels to fingertips.',
      cues: ['Breathe in as you reach', 'Relax your shoulders away from your ears'],
      seconds: 30,
    },
    {
      id: 'neck-rolls',
      name: 'Slow Neck Rolls',
      instructions: 'Drop your chin to your chest and roll your head slowly from shoulder to shoulder.',
      cues: ['Move at half the speed you think you need', 'Keep your jaw loose'],
      seconds: 30,
    },
    {
      id: 'shoulder-circles',
      name: 'Shoulder Circles',
      instructions: 'Circle both shoulders backwards, then forwards, making the circles as big as you can.',
      cues: ['Switch direction halfway through', 'Let your arms hang heavy'],
      seconds: 30,
    },
    {
      id: 'cat-cow',
      name: 'Cat-Cow',
      instructions: 'On hands and knees, alternate between arching and rounding your spine.',
      cues: ['Inhale to arch, exhale to round', 'Move one vertebra at a time'],
      seconds: 45,
    },
    ...bothSides({
      id: 'standing-side-bend',
      name: 'Standing Side Bend',
      instructions: 'Reach one arm overhead and lean gently to the opposite side.',
      cues: ['Keep both feet planted', 'Open through the ribs, not the lower back'],
      seconds: 25,
    }),
    {
      id: 'hip-circles',
      name: 'Hip Circles',
      instructions: 'Hands on hips, draw slow circles with your pelvis in both directions.',
      cues: ['Keep your knees soft', 'Change direction halfway through'],
      seconds: 30,
    },
    {
      id: 'forward-fold',
      name: 'Loose Forward Fold',
      instructions: 'Hinge at the hips and hang forward with a soft bend in the knees.',
      cues: ['Let your head and arms dangle', 'Roll up slowly at the end'],
      seconds: 40,
    },
    {
      id: 'deep-breaths',
      name: 'Three Deep Breaths',
      instructions: 'Stand tall and take slow breaths, expanding your ribs in every direction.',
      cues: ['In through the nose', 'Longer out-breath than in-breath'],
      seconds: 30,
    },
  ],
}

const fullMobility: Routine = {
  id: 'full-mobility',
  name: 'Full Morning Mobility',
  summary: 'Ten minutes covering spine, hips, shoulders and ankles. The everyday default.',
  moves: [
    {
      id: 'breathing-reset',
      name: 'Breathing Reset',
      instructions: 'Lie on your back with knees bent and breathe into your lower ribs.',
      cues: ['One hand on chest, one on belly', 'Exhale twice as long as you inhale'],
      seconds: 45,
    },
    {
      id: 'knee-rocks',
      name: 'Supine Knee Rocks',
      instructions: 'Knees bent and together, rock them slowly side to side.',
      cues: ['Keep both shoulders on the floor', 'Only go as far as feels easy'],
      seconds: 45,
    },
    {
      id: 'cat-cow',
      name: 'Cat-Cow',
      instructions: 'On hands and knees, alternate between arching and rounding your spine.',
      cues: ['Inhale to arch, exhale to round', 'Move one vertebra at a time'],
      seconds: 45,
    },
    ...bothSides({
      id: 'thread-the-needle',
      name: 'Thread the Needle',
      instructions: 'From hands and knees, slide one arm under your body and rest on the shoulder.',
      cues: ['Let the upper back rotate', 'Keep your hips stacked over your knees'],
      seconds: 35,
    }),
    {
      id: 'downward-dog',
      name: 'Downward Dog with Ankle Pedals',
      instructions: 'Press your hips up and back, then alternate bending one knee at a time.',
      cues: ['Push the floor away', 'Pedal slowly through each heel'],
      seconds: 45,
    },
    ...bothSides({
      id: 'low-lunge',
      name: 'Low Lunge',
      instructions: 'Step one foot forward and sink your hips down until you feel the front of the back hip open.',
      cues: ['Tuck the tailbone slightly', 'Keep the front knee over the ankle'],
      seconds: 40,
    }),
    ...bothSides({
      id: 'ninety-ninety',
      name: '90/90 Hip Switch',
      instructions: 'Sit with both knees bent at 90 degrees and lean gently over the front shin.',
      cues: ['Sit tall before you lean', 'Stop well before any pinching'],
      seconds: 40,
    }),
    {
      id: 'glute-bridge',
      name: 'Glute Bridges',
      instructions: 'On your back, press through your heels and lift your hips, then lower slowly.',
      cues: ['Squeeze the glutes at the top', 'Ribs stay down'],
      seconds: 40,
    },
    ...bothSides({
      id: 'figure-four',
      name: 'Figure-Four Stretch',
      instructions: 'Cross one ankle over the opposite knee and draw the legs towards your chest.',
      cues: ['Keep your head on the floor', 'Breathe into the stretch'],
      seconds: 40,
    }),
    {
      id: 'wall-angels',
      name: 'Wall Angels',
      instructions: 'Back against a wall, slide your arms up and down keeping wrists and elbows in contact.',
      cues: ['Move slowly', 'Only travel as far as you can stay in contact'],
      seconds: 40,
    },
    {
      id: 'calf-raises',
      name: 'Slow Calf Raises',
      instructions: 'Rise onto the balls of your feet and lower under control.',
      cues: ['Three seconds down', 'Hold a wall for balance if you need it'],
      seconds: 35,
    },
    {
      id: 'closing-reach',
      name: 'Closing Reach and Breathe',
      instructions: 'Stand tall, reach overhead on the inhale and let the arms float down on the exhale.',
      cues: ['Finish taller than you started', 'Notice how the body feels now'],
      seconds: 30,
    },
  ],
}

const standingOnly: Routine = {
  id: 'standing-only',
  name: 'Standing Only',
  summary: 'No floor needed. Ideal for hotel rooms, small spaces, or stiff mornings.',
  moves: [
    {
      id: 'standing-breathing',
      name: 'Grounding Breaths',
      instructions: 'Stand with feet hip-width apart and take slow, even breaths.',
      cues: ['Feel all four corners of each foot', 'Unlock your knees'],
      seconds: 30,
    },
    {
      id: 'neck-rolls',
      name: 'Slow Neck Rolls',
      instructions: 'Drop your chin to your chest and roll your head slowly from shoulder to shoulder.',
      cues: ['Move at half the speed you think you need', 'Keep your jaw loose'],
      seconds: 30,
    },
    {
      id: 'arm-swings',
      name: 'Cross-Body Arm Swings',
      instructions: 'Swing your arms open wide and then wrap them across your chest.',
      cues: ['Let the ribcage follow the arms', 'Keep it rhythmic and relaxed'],
      seconds: 35,
    },
    ...bothSides({
      id: 'standing-side-bend',
      name: 'Standing Side Bend',
      instructions: 'Reach one arm overhead and lean gently to the opposite side.',
      cues: ['Keep both feet planted', 'Open through the ribs, not the lower back'],
      seconds: 30,
    }),
    {
      id: 'standing-twists',
      name: 'Gentle Standing Twists',
      instructions: 'Rotate your torso side to side, letting your arms swing loosely around you.',
      cues: ['Turn from the ribs, not the arms', 'Keep the hips mostly still'],
      seconds: 35,
    },
    ...bothSides({
      id: 'standing-quad',
      name: 'Standing Quad Stretch',
      instructions: 'Hold one ankle behind you and gently draw the heel towards your glute.',
      cues: ['Stand tall, knees close together', 'Hold something for balance if needed'],
      seconds: 30,
    }),
    ...bothSides({
      id: 'standing-hamstring',
      name: 'Standing Hamstring Reach',
      instructions: 'Place one heel forward with a straight leg and hinge at the hips.',
      cues: ['Lead with the chest', 'Keep the back long, not rounded'],
      seconds: 30,
    }),
    ...bothSides({
      id: 'wall-calf',
      name: 'Wall Calf Stretch',
      instructions: 'Press your hands into a wall and step one foot back, heel down.',
      cues: ['Back leg straight', 'Toes pointing forwards'],
      seconds: 30,
    }),
    {
      id: 'march-in-place',
      name: 'Slow March in Place',
      instructions: 'Lift each knee to hip height, alternating sides at a steady pace.',
      cues: ['Stay tall through the spine', 'Swing the opposite arm'],
      seconds: 40,
    },
    {
      id: 'closing-reach',
      name: 'Closing Reach and Breathe',
      instructions: 'Reach overhead on the inhale and let the arms float down on the exhale.',
      cues: ['Finish taller than you started', 'Notice how the body feels now'],
      seconds: 30,
    },
  ],
}

/** Every routine the app offers, in the order they are shown. */
export const routines: Routine[] = [wakeUp, fullMobility, standingOnly]

/** The routine selected when no preference has been saved yet. */
export const defaultRoutineId = fullMobility.id

/** Finds a routine by id, falling back to the default routine. */
export function getRoutine(id: string | null | undefined): Routine {
  return (
    routines.find((routine) => routine.id === id) ??
    routines.find((routine) => routine.id === defaultRoutineId) ??
    routines[0]
  )
}

/** Total length of a routine in seconds. */
export function routineDuration(routine: Routine): number {
  return routine.moves.reduce((total, move) => total + move.seconds, 0)
}
