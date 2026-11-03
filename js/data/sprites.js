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
