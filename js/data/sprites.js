// sprites.js — PLACEHOLDER pixel art for Mara the Unbent and the campfire.
//
// Each frame is a list of rectangles: [color letter, x, y, width, height]
// on a 32x32 grid (16x16 for the campfire). Later rectangles paint over
// earlier ones. sprite.js turns them into pixels and adds the dark outline.
//
// These are rough two-frame stand-ins (start pose, end pose) so the app
// works now. The real animations come in v0.3 and v0.4 as letter grids
// (one letter per pixel, like the hub's sprites). sprite.js draws both.

const PAL = {
  s: '#7f9a63', // Mara's skin, green-grey
  h: '#2b1d14', // hair and braid
  l: '#7a4b2e', // leather wraps
  L: '#4a2e20', // dark leather trousers
  g: '#e6c36e', // gold bracers and belt
  w: '#f2ead8', // tusks
  e: '#15121d', // eyes
  i: '#9aa3ad', // iron weights
  c: '#5a4632', // furniture (counter, ottoman)
  b: '#c0566b', // resistance band
  r: '#b8402c', // fire, outer
  o: '#e8823a', // fire, middle
  y: '#ffe08a', // fire, core
  k: '#3a3350', // a locked pose's silhouette (yoga.js)
};

// ----- Body parts, so the poses below stay short -----

// Mara's head with its top-left corner at (x, y): hair, braid, eyes, tusks.
function maraHead(x, y) {
  return [
    ['h', x, y - 1, 8, 2], ['s', x, y, 8, 7], ['h', x + 8, y + 1, 2, 9],
    ['e', x + 2, y + 3, 1, 1], ['e', x + 5, y + 3, 1, 1],
    ['w', x + 2, y + 6, 1, 1], ['w', x + 5, y + 6, 1, 1],
  ];
}

// Facing you, upper body moved down by dy pixels, with arms in one of these positions:
// 'down', 'hold' (weight at chest), 'dumbbells', 'rack' (kettlebell at shoulder),
// 'up' (kettlebell overhead), 'hips' (fists on hips).
function maraFront(dy, arms) {
  const parts = [
    ...maraHead(12, 3 + dy),
    ['s', 14, 10 + dy, 4, 1],   // neck
    ['l', 11, 11 + dy, 10, 5],  // chest wrap
    ['s', 12, 16 + dy, 8, 3],   // middle
    ['g', 11, 19 + dy, 10, 1],  // belt
  ];
  const down = [['s', 8, 11 + dy, 3, 9], ['s', 21, 11 + dy, 3, 9], ['g', 8, 17 + dy, 3, 2], ['g', 21, 17 + dy, 3, 2]];
  const leftDown = [['s', 8, 11 + dy, 3, 9], ['g', 8, 17 + dy, 3, 2]];
  if (arms === 'down') parts.push(...down);
  if (arms === 'dumbbells') parts.push(...down, ['i', 7, 20 + dy, 5, 3], ['i', 20, 20 + dy, 5, 3]);
  if (arms === 'hold') parts.push(
    ['s', 8, 11 + dy, 3, 5], ['s', 21, 11 + dy, 3, 5], ['s', 11, 15 + dy, 3, 3], ['s', 18, 15 + dy, 3, 3],
    ['g', 11, 16 + dy, 3, 1], ['g', 18, 16 + dy, 3, 1], ['i', 13, 13 + dy, 6, 5],
  );
  if (arms === 'rack') parts.push(...leftDown, ['s', 21, 11 + dy, 3, 4], ['s', 21, 7 + dy, 3, 4], ['g', 21, 9 + dy, 3, 1], ['i', 20, 4 + dy, 5, 4]);
  if (arms === 'up') parts.push(...leftDown, ['s', 21, 3 + dy, 3, 8], ['g', 21, 5 + dy, 3, 2], ['i', 20, 0 + dy, 5, 3]);
  if (arms === 'hips') parts.push(
    ['s', 8, 11 + dy, 3, 5], ['s', 21, 11 + dy, 3, 5], ['s', 9, 16 + dy, 3, 3], ['s', 20, 16 + dy, 3, 3],
    ['g', 9, 16 + dy, 3, 1], ['g', 20, 16 + dy, 3, 1],
  );
  return parts;
}

// Facing you, legs only.
const LEGS = {
  stand: [['L', 12, 20, 3, 8], ['L', 17, 20, 3, 8], ['l', 11, 28, 4, 2], ['l', 17, 28, 4, 2]],
  wide: [['L', 10, 20, 3, 8], ['L', 19, 20, 3, 8], ['l', 9, 28, 4, 2], ['l', 19, 28, 4, 2]],
  halfNarrow: [['L', 12, 22, 3, 6], ['L', 17, 22, 3, 6], ['l', 11, 28, 4, 2], ['l', 17, 28, 4, 2]],
  halfWide: [['L', 9, 22, 3, 6], ['L', 20, 22, 3, 6], ['l', 8, 28, 4, 2], ['l', 20, 28, 4, 2]],
  squat: [['L', 8, 24, 7, 3], ['L', 17, 24, 7, 3], ['L', 8, 27, 3, 1], ['L', 21, 27, 3, 1], ['l', 7, 28, 4, 2], ['l', 21, 28, 4, 2]],
};

// From the side, facing left, bent forward at the hips (deadlift, row).
function maraHinged() {
  return [
    ...maraHead(2, 10),
    ['l', 9, 12, 10, 5], ['g', 19, 12, 1, 5], ['L', 19, 12, 4, 5], ['L', 19, 17, 3, 11], ['l', 17, 28, 6, 2],
  ];
}

// Lying on her back, from the side, head on the left (bridge, dead bug).
function maraLying() {
  return [...maraHead(1, 22), ['l', 9, 24, 10, 5], ['g', 19, 24, 1, 5], ['L', 20, 24, 3, 5]];
}

// ----- The Bend (v0.4): yoga poses, unlocked at 5 / 10 / 25 / 50 / 100 sessions -----

const YOGA_MAT = ['b', 2, 30, 28, 1];

/** Move rectangles sideways by dx pixels (the tree pose's wobble). */
const shiftX = (parts, dx) => parts.map(([c, x, y, w, h]) => [c, x + dx, y, w, h]);

// From the side, facing left, folded in half: legs straight, back hanging down in front,
// head near the shins, hands stuck at the knees. She's grumbling.
function maraFold(dy, puff) {
  const parts = [
    ['L', 18, 13, 4, 15], ['l', 15, 28, 7, 2],      // straight legs, feet
    ['L', 17, 9, 5, 5], ['g', 16, 10, 1, 4],        // hips up top, belt
    ['l', 12, 10 + dy, 5, 9],                        // back, hanging down
    ['s', 11, 19 + dy, 6, 6], ['h', 11, 25 + dy, 6, 1], // head, upside down
    ['e', 15, 21 + dy, 1, 1], ['w', 15, 23 + dy, 1, 1],
    ['h', 12, 26 + dy, 2, 3 - dy],                   // braid, down to the mat
    ['s', 13, 17 + dy, 5, 2], ['g', 14, 17 + dy, 1, 2], // arm, hand on the knee
  ];
  if (puff) parts.push(['w', 8, 22 + dy, 2, 1], ['w', 7, 21 + dy, 1, 1]); // hmph
  return parts;
}

// Facing you, the wide lunge, arms straight out like two swords.
function maraWarrior(dy) {
  return [
    ['L', 7, 22, 6, 3], ['L', 7, 25, 3, 3], ['l', 5, 28, 5, 2],                         // front leg, bent
    ['L', 18, 22, 3, 3], ['L', 20, 24, 3, 3], ['L', 22, 26, 3, 2], ['l', 23, 28, 5, 2], // back leg, straight
    ...maraFront(2 + dy, 'none'),
    ['s', 1, 13 + dy, 10, 2], ['s', 21, 13 + dy, 10, 2], ['g', 3, 13 + dy, 2, 2], ['g', 27, 13 + dy, 2, 2],
  ];
}

// Facing you, on one leg, hands together over her head.
function maraTree() {
  return [
    ['L', 9, 20, 4, 3], ['L', 10, 23, 3, 2], ['L', 12, 24, 4, 2], ['l', 15, 23, 2, 2], // bent leg, foot on the calf
    ...maraFront(0, 'none'),
    ['s', 8, 4, 2, 8], ['s', 23, 4, 2, 8], ['s', 10, 1, 2, 3], ['s', 21, 1, 2, 3], ['s', 12, 0, 9, 1], // arms up, palms together
    ['g', 8, 7, 2, 1], ['g', 23, 7, 2, 1],
  ];
}

// From the side: an upside-down V, hands on the mat at the left, braid on the floor.
function maraDog(sway) {
  return [
    ['L', 16, 9, 4, 4], ['L', 18, 12, 3, 4], ['L', 20, 15, 3, 4], ['L', 21, 18, 3, 4],
    ['L', 22, 21, 3, 4], ['L', 23, 24, 3, 4], ['l', 23, 28, 5, 2],                    // hips and legs
    ['g', 15, 10, 1, 4],
    ['l', 13, 11, 4, 4], ['l', 11, 14, 4, 4], ['l', 9, 17, 4, 4],                     // back
    ['s', 7, 19, 3, 4], ['s', 5, 22, 3, 4], ['s', 4, 25, 3, 4], ['g', 4, 26, 3, 1],   // arm, hand on the mat
    ['s', 9, 21, 6, 5], ['h', 9, 26, 6, 1], ['e', 13, 22, 1, 1], ['w', 13, 24, 1, 1], // head, hanging
    ['h', 11 + sway, 27, 2, 3],                                                        // braid on the floor
  ];
}

// Facing you, cross-legged, eyes closed, hands on her knees.
function maraSeat(glint) {
  const head = maraHead(12, 9).filter(([c]) => c !== 'e');
  const parts = [
    ['L', 6, 26, 20, 3], ['l', 9, 28, 6, 1], ['l', 17, 28, 6, 1], // crossed legs
    ...head, ['e', 13, 12, 2, 1], ['e', 17, 12, 2, 1],            // eyes closed
    ['s', 14, 16, 4, 1], ['l', 11, 17, 10, 5], ['s', 12, 22, 8, 3], ['g', 11, 25, 10, 1],
    ['s', 8, 17, 3, 7], ['s', 21, 17, 3, 7], ['s', 6, 24, 4, 2], ['s', 22, 24, 4, 2],
    ['g', 8, 21, 3, 2], ['g', 21, 21, 3, 2],
  ];
  if (glint === 1) parts.push(['y', 9, 21, 1, 1], ['y', 22, 22, 1, 1]);
  if (glint === 2) parts.push(['w', 10, 21, 1, 1], ['w', 23, 21, 1, 1], ['y', 9, 20, 1, 1]);
  return parts;
}

// ----- The animations: fps = frames per second, frames = the poses -----

const SPRITES = {
  idle: { fps: 1.5, frames: [
    [...LEGS.stand, ...maraFront(0, 'down')],
    [...LEGS.stand, ...maraFront(1, 'down')],
  ] },

  'power-pose': { fps: 1.5, frames: [
    [...LEGS.stand, ...maraFront(0, 'down')],
    [...LEGS.wide, ...maraFront(0, 'hips')],
  ] },

  // The Oath's check-in: Mara holding a lantern. The flame flickers between frames.
  lantern: { fps: 2, frames: [
    [...LEGS.stand, ...maraFront(0, 'down'), ['c', 22, 20, 1, 1], ['g', 21, 21, 3, 1], ['y', 21, 22, 3, 3], ['g', 21, 25, 3, 1]],
    [...LEGS.stand, ...maraFront(1, 'down'), ['c', 22, 21, 1, 1], ['g', 21, 22, 3, 1], ['o', 21, 23, 3, 3], ['y', 22, 24, 1, 1], ['g', 21, 26, 3, 1]],
  ] },

  // The craving timer: idle, slowed to a calm breath (in for 2.5 s, out for 2.5 s).
  breathe: { fps: 0.4, frames: [
    [...LEGS.stand, ...maraFront(0, 'down')],
    [...LEGS.stand, ...maraFront(1, 'down')],
  ] },

  // The Bend's poses (yoga.js). Each one is on its mat.
  'yoga-fold': { fps: 1, frames: [[YOGA_MAT, ...maraFold(0, false)], [YOGA_MAT, ...maraFold(1, true)]] },
  'yoga-warrior': { fps: 0.5, frames: [[YOGA_MAT, ...maraWarrior(0)], [YOGA_MAT, ...maraWarrior(1)]] },
  'yoga-tree': { fps: 1.5, frames: [
    [YOGA_MAT, ['L', 17, 20, 3, 8], ['l', 17, 28, 4, 2], ...shiftX(maraTree(), -1)],
    [YOGA_MAT, ['L', 17, 20, 3, 8], ['l', 17, 28, 4, 2], ...maraTree()],
    [YOGA_MAT, ['L', 17, 20, 3, 8], ['l', 17, 28, 4, 2], ...shiftX(maraTree(), 1)],
  ] },
  'yoga-dog': { fps: 0.8, frames: [[YOGA_MAT, ...maraDog(0)], [YOGA_MAT, ...maraDog(-1)]] },
  'yoga-seat': { fps: 1, frames: [[YOGA_MAT, ...maraSeat(0)], [YOGA_MAT, ...maraSeat(1)], [YOGA_MAT, ...maraSeat(2)]] },

  'goblet-squat': { fps: 1.2, frames: [
    [...LEGS.stand, ...maraFront(0, 'hold')],
    [['c', 7, 25, 18, 5], ...LEGS.squat, ...maraFront(5, 'hold')],
  ] },

  'db-rdl': { fps: 1.2, frames: [
    [ // standing tall, from the side
      ...maraHead(10, 3), ['l', 11, 11, 7, 6], ['s', 11, 17, 7, 2], ['g', 11, 19, 7, 1],
      ['L', 12, 20, 5, 8], ['l', 10, 28, 7, 2], ['s', 13, 11, 3, 10], ['g', 13, 18, 3, 1], ['i', 11, 21, 7, 3],
    ],
    [...maraHinged(), ['s', 10, 17, 3, 7], ['g', 10, 22, 3, 1], ['i', 8, 24, 7, 3]],
  ] },

  'glute-bridge': { fps: 1.2, frames: [
    [...maraLying(), ['L', 21, 21, 5, 3], ['L', 24, 21, 3, 8], ['l', 23, 28, 6, 2], ['s', 10, 28, 9, 1]],
    [
      ...maraHead(1, 22), ['l', 9, 24, 4, 5], ['l', 12, 21, 6, 5], ['g', 18, 20, 1, 5], ['L', 18, 19, 4, 5],
      ['L', 21, 19, 4, 3], ['L', 24, 19, 3, 10], ['l', 23, 28, 6, 2], ['s', 9, 28, 10, 1],
    ],
  ] },

  'incline-pushup': { fps: 1.2, frames: [
    [ // arms straight, hands on the counter
      ['c', 0, 16, 7, 14], ['L', 0, 15, 8, 1], ...maraHead(6, 4),
      ['l', 12, 9, 6, 5], ['l', 16, 12, 5, 4], ['L', 19, 15, 4, 4], ['L', 22, 18, 4, 4], ['L', 25, 21, 3, 4],
      ['L', 27, 25, 2, 3], ['l', 27, 28, 4, 2], ['s', 7, 10, 3, 5], ['g', 7, 13, 3, 1],
    ],
    [ // chest down to the edge
      ['c', 0, 16, 7, 14], ['L', 0, 15, 8, 1], ...maraHead(4, 7),
      ['l', 10, 12, 6, 5], ['l', 15, 14, 5, 4], ['L', 19, 16, 4, 4], ['L', 22, 19, 4, 4], ['L', 25, 22, 3, 4],
      ['L', 27, 25, 2, 3], ['l', 27, 28, 4, 2], ['s', 6, 13, 4, 2], ['g', 6, 13, 2, 1],
    ],
  ] },

  'one-arm-row': { fps: 1.2, frames: [
    [['c', 1, 24, 8, 6], ...maraHinged(), ['s', 6, 15, 3, 9], ['s', 13, 16, 3, 7], ['g', 13, 21, 3, 1], ['i', 11, 23, 7, 3]],
    [['c', 1, 24, 8, 6], ...maraHinged(), ['s', 6, 15, 3, 9], ['s', 15, 8, 3, 5], ['s', 13, 12, 3, 5], ['g', 13, 13, 3, 1], ['i', 11, 16, 7, 3]],
  ] },

  'kb-press': { fps: 1.2, frames: [
    [...LEGS.stand, ...maraFront(0, 'rack')],
    [...LEGS.stand, ...maraFront(0, 'up')],
  ] },

  'lateral-walk': { fps: 1.5, frames: [
    [...LEGS.halfNarrow, ['b', 14, 25, 4, 1], ...maraFront(2, 'hips')],
    [...LEGS.halfWide, ['b', 12, 25, 8, 1], ...maraFront(2, 'hips')],
  ] },

  'dead-bug': { fps: 1.2, frames: [
    [...maraLying(), ['s', 11, 14, 3, 10], ['g', 11, 17, 3, 1], ['L', 20, 17, 3, 7], ['L', 20, 14, 8, 3], ['l', 27, 13, 2, 4]],
    [
      ...maraLying(), ['s', 11, 14, 3, 10], ['s', 1, 20, 9, 2], ['g', 3, 20, 2, 2],
      ['L', 20, 17, 3, 7], ['L', 20, 14, 8, 3], ['L', 23, 25, 8, 3], ['l', 30, 23, 2, 4],
    ],
  ] },
};

// ----- The campfire: 5 sizes, ember (1) to bonfire (5), two flicker frames each -----

function campfireFrame(level, flicker) {
  const h = [2, 4, 6, 8, 10][level - 1];
  const w = [4, 6, 8, 10, 12][level - 1];
  const x = 8 - w / 2;
  const top = 12 - h;
  const parts = [
    ['r', x, top + 1, w, h],
    ['o', x + 1, top + 1 + flicker, w - 2, h - 1 - flicker],
    ['o', 7 + flicker, top, 2, 1], // the flickering tip
  ];
  if (w > 4) parts.push(['y', x + 2, top + 3, w - 4, Math.max(1, h - 3)]);
  parts.push(['L', 2, 13, 12, 2], ['c', 3, 12, 10, 1]); // the logs, in front
  return parts;
}

const CAMPFIRE = [1, 2, 3, 4, 5].map((level) => ({
  fps: 3,
  frames: [campfireFrame(level, 0), campfireFrame(level, 1)],
}));
