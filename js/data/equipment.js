// equipment.js — what you have at home. plates.js uses this to work out
// every weight you can build and which plates go on.

const EQUIPMENT = {
  // Your plates. All three tools share them.
  plates: [
    { kg: 1.5, count: 4 },
    { kg: 2, count: 4 },
    { kg: 3, count: 4 },
    { kg: 3.5, count: 4 },
  ],
  dumbbellHandleKg: 0,   // "negligible". Weigh one on a scale someday and put it here.
  kettlebellBaseKg: 0,   // same

  // The push-up ladder, easiest first. Moving right = harder.
  pushupLadder: ['Wall', 'Kitchen counter', 'Table or desk', 'Ottoman (against a wall)', 'Floor'],
};
