// exercises.js — every move Mara can teach.
//
// Each exercise has:
//   name      what it's called on screen
//   pattern   squat, hinge, bridge, push, pull, press, hips or core
//   load      how you make it harder:
//               'db-one'  one dumbbell        'db-pair'  two dumbbells
//               'kb'      the kettlebell      'ladder'   push-up surface height
//               'band'    a resistance band   'body'     bodyweight only
//   startKg   first weight to try (weight loads), or startRung (ladder)
//   reps      [fewest, most] reps to aim for
//   perSide   shown next to the set count, e.g. 'each arm'
//   cues      1–2 short form tips. The first shows; the second is one tap away.
//   easier    the exercise the Easier button swaps in (null = none)
//   sprite    which animation in sprites.js to play
//   knee      true if it loads the knee (your PT flag area)
//   ptAlways  true if it always says "mention to your PT"
//   evidence  ids from evidence.js shown as badges

const EXERCISES = {
  // ----- Squat -----
  'goblet-squat': {
    name: 'Goblet Squat to Box', pattern: 'squat', load: 'db-one', startKg: 6, reps: [8, 12],
    cues: ['Sit back to the box, then stand tall', 'Elbows inside your knees'],
    easier: 'sit-to-stand', sprite: 'goblet-squat', knee: true,
    evidence: ['acsm-novice', 'loads-near-failure'],
  },
  'sit-to-stand': {
    name: 'Sit-to-Stand', pattern: 'squat', load: 'body', reps: [8, 12],
    cues: ['Feet flat, lean forward, stand up', 'Sit down slowly, about 3 seconds'],
    easier: null, sprite: 'goblet-squat', knee: true,
    evidence: ['acsm-novice'],
  },

  // ----- Hinge and bridge -----
  'db-rdl': {
    name: 'Dumbbell Romanian Deadlift', pattern: 'hinge', load: 'db-pair', startKg: 6, reps: [8, 12],
    cues: ['Push your hips back, like closing a car door with your butt', 'Weights slide down your thighs'],
    easier: 'glute-bridge', sprite: 'db-rdl',
    evidence: ['acsm-novice', 'loads-near-failure'],
  },
  'glute-bridge': {
    name: 'Glute Bridge', pattern: 'bridge', load: 'body', reps: [10, 15],
    cues: ['Squeeze your glutes to lift', 'Ribs down, don\'t arch your back'],
    easier: 'short-bridge', sprite: 'glute-bridge',
    evidence: ['acsm-novice', 'loads-near-failure'],
  },
  'short-bridge': {
    name: 'Short Bridge with a Hold', pattern: 'bridge', load: 'body', reps: [8, 12],
    cues: ['Lift just a little and hold for 3 seconds'],
    easier: null, sprite: 'glute-bridge',
    evidence: ['acsm-novice'],
  },

  // ----- Push -----
  'incline-pushup': {
    name: 'Incline Push-up', pattern: 'push', load: 'ladder', startRung: 1, reps: [8, 15],
    cues: ['Body in one straight line, like a plank', 'Chest to the edge, then push away'],
    easier: null, sprite: 'incline-pushup', // the ladder handles easier: hands go higher
    evidence: ['acsm-novice', 'loads-near-failure'],
  },

  // ----- Pull -----
  'one-arm-row': {
    name: 'One-Arm Row', pattern: 'pull', load: 'db-one', startKg: 6, reps: [8, 12], perSide: 'each arm',
    cues: ['Pull your elbow back toward your hip', 'Keep your back flat like a table'],
    easier: 'band-row', sprite: 'one-arm-row',
    evidence: ['acsm-novice', 'loads-near-failure'],
  },
  'band-row': {
    name: 'Band Row', pattern: 'pull', load: 'band', reps: [10, 15],
    cues: ['Squeeze your shoulder blades together', 'Pull to your ribs, let it back slowly'],
    easier: null, sprite: 'one-arm-row',
    evidence: ['bands'],
  },

  // ----- Press -----
  'kb-press': {
    name: 'Kettlebell Overhead Press', pattern: 'press', load: 'kb', startKg: 3, reps: [8, 15], perSide: 'each arm',
    cues: ['Squeeze glutes, ribs down, press up', 'Finish with your bicep by your ear'],
    easier: 'band-press', sprite: 'kb-press', ptAlways: true, ptNote: 'Overhead pressing',
    evidence: ['acsm-novice', 'loads-near-failure'],
  },
  'band-press': {
    name: 'Band Press', pattern: 'press', load: 'band', reps: [10, 15], perSide: 'each arm',
    cues: ['Stand on the band, press up slowly'],
    easier: null, sprite: 'kb-press', ptAlways: true, ptNote: 'Overhead pressing',
    evidence: ['bands'],
  },

  // ----- Hips -----
  'lateral-walk': {
    name: 'Banded Lateral Walk', pattern: 'hips', load: 'band', reps: [10, 15], perSide: 'steps each way',
    cues: ['Small steps, toes pointing forward', 'Stay a little low, like you\'re half sitting'],
    easier: 'side-leg-raise', sprite: 'lateral-walk',
    evidence: ['hip-knee', 'bands'],
  },
  'side-leg-raise': {
    name: 'Side-Lying Leg Raise', pattern: 'hips', load: 'body', reps: [10, 15], perSide: 'each side, left first',
    cues: ['Lie on your side and lift your top leg slowly', 'Toes point forward, not up'],
    easier: null, sprite: 'lateral-walk',
    evidence: ['hip-knee'],
  },

  // ----- Core -----
  'dead-bug': {
    name: 'Dead Bug', pattern: 'core', load: 'body', reps: [6, 10], perSide: 'each side',
    cues: ['Press your low back into the floor', 'Move slowly and breathe out as you reach'],
    easier: 'heel-taps', sprite: 'dead-bug',
    evidence: ['acsm-novice'],
  },
  'heel-taps': {
    name: 'Heel Taps', pattern: 'core', load: 'body', reps: [6, 10], perSide: 'each side',
    cues: ['Knees bent, tap one heel down at a time', 'Low back stays on the floor'],
    easier: null, sprite: 'dead-bug',
    evidence: ['acsm-novice'],
  },
};
