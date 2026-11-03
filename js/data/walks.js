// walks.js — Walk Pad Trials, the first part of the run-walk questline.
//
// Each week is a list of parts done in order. kind is one of the PACES
// below; min is how many minutes it lasts. Every week is about 25–30
// minutes, and any week can be repeated as often as you like.
//
// Your Starpower pad is assumed to top out at 3.8 mph, so "Brisk" means
// the pad's top speed. Change the words here if the pad turns out faster.

const PACES = {
  warm: { name: 'Warm up', cue: 'Easy pace. Loosen your shoulders.' },
  easy: { name: 'Easy', cue: 'Slow it down. Breathe through your nose.' },
  brisk: { name: 'Brisk', cue: 'Top speed. Tall, quick steps.' },
  power: { name: 'Power walk', cue: 'Top speed. Pump your arms, squeeze your glutes.' },
  cool: { name: 'Cool down', cue: 'Easy pace. You did it.' },
};

/** Repeat a little block of parts n times: repeat(3, ['brisk', 2], ['easy', 2]) */
function walkRepeat(n, ...parts) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(...parts.map(([kind, min]) => ({ kind, min })));
  return out;
}

const WALK_WEEKS = [
  { week: 1, name: 'First Steps', parts: [{ kind: 'warm', min: 5 }, ...walkRepeat(4, ['brisk', 2], ['easy', 2]), { kind: 'cool', min: 4 }] },
  { week: 2, name: 'Longer Strides', parts: [{ kind: 'warm', min: 5 }, ...walkRepeat(4, ['brisk', 3], ['easy', 2]), { kind: 'cool', min: 3 }] },
  { week: 3, name: 'Steady Road', parts: [{ kind: 'warm', min: 4 }, ...walkRepeat(3, ['brisk', 5], ['easy', 2]), { kind: 'cool', min: 3 }] },
  { week: 4, name: 'First Power', parts: [{ kind: 'warm', min: 4 }, ...walkRepeat(3, ['brisk', 4], ['power', 1], ['easy', 2]), { kind: 'cool', min: 3 }] },
  { week: 5, name: 'Iron Legs', parts: [{ kind: 'warm', min: 4 }, ...walkRepeat(3, ['brisk', 3], ['power', 2], ['easy', 2]), { kind: 'cool', min: 4 }] },
  { week: 6, name: 'Trial of the Pad', parts: [{ kind: 'warm', min: 3 }, ...walkRepeat(4, ['power', 3], ['brisk', 2]), { kind: 'cool', min: 4 }] },
];

// Energy 1 on a walk day: just five easy minutes. A full win.
const WALK_TINY = { week: 0, name: 'Five-Minute Walk', parts: [{ kind: 'easy', min: 5 }] };

// Finish this many full walks of a week to unlock the next one.
const WALKS_TO_UNLOCK = 2;
