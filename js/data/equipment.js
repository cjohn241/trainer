// equipment.js — what you have at home, and what hotels usually have.
// plates.js uses this to work out every weight you can build and which
// plates go on.

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

  // ----- The Outpost (travel mode) -----
  // Push-up ladders away from home. Never the bed: it sinks and wobbles.
  roomPushupLadder: ['Wall', 'Desk or dresser', 'Chair seat (pushed against a wall)', 'Floor'],
  gymPushupLadder: ['Wall', 'Bench, tipped up high', 'Flat bench', 'Floor'],

  // A hotel gym's dumbbell rack, in pounds (most US gyms). If a size is
  // missing, use the next one down, or tap "Not here".
  hotelDumbbellsLb: [5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50],
};
