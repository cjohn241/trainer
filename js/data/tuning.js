// tuning.js — the game's numbers, all in one place. Change any of these
// and reload: nothing else needs to change.

const TUNING = {
  xpPerSet: 10,        // after every set you log
  xpTinyQuest: 50,     // a whole Tiny Quest, sets included
  xpWalk: 60,          // a walk pad session (Session 2)
  xpAdventure: { 15: 20, 30: 40, 60: 60 }, // minutes -> XP (Session 2)
  xpPtExercises: 20,   // "Did my PT exercises": one gem, once a day (v0.2)

  // The Oath (v0.3): milestone XP lives in data/oath.js
  xpOathDay: 25,       // each alcohol-free day
  xpOathHonest: 5,     // logging a slip honestly (rewards telling the truth, not drinking)
  xpCraving: 10,       // a craving waited out with Mara
  cravingMinutes: 15,  // one round of the craving timer

  // The Bend (v0.4): yoga. Milestone XP lives in data/yoga.js.
  xpYogaSession: 30,             // a full session: 10 minutes or more (7 when traveling)
  xpYogaBonus: { 20: 5, 30: 10 }, // a small bonus for longer sessions (minutes -> extra XP, the highest that fits)
  xpYogaShort: 10,               // a short stretch, under a full session (not counted toward the week)
  xpYogaWeek: 40,                // hitting your weekly target, once a week
  yogaFull: 10,                  // minutes that make a full session at home
  yogaTravelFull: 7,             // ... and on a trip

  xpPerLevel: 100,    // level 1 -> 2 needs 100 XP, 2 -> 3 needs 200, and so on

  // The words under each energy button on Home
  energyLabels: { 1: 'Tiny', 2: 'Low', 3: 'Okay', 4: 'Good', 5: 'Fired up' },

  // Weeks 1 and 2 use at most this many sets per exercise, to ease in.
  easeInWeeks: 2,
  easeInSets: 2,

  // Loot: every win opens the chest once (see data/loot.js).
  rareChance: 0.15,    // 15% of drops are rare
  maxBedrolls: 3,      // you can carry this many Bedrolls; past that the chest gives something else

  // Knee check: this many Sore in a row switches to easier knee moves,
  // this many Fine in a row switches back.
  kneeSoreToEase: 2,
  kneeFineToReturn: 2,

  // The Outpost (travel mode): a travel week asks for this many strength
  // days, on any days you like, plus any movement at all.
  travelStrengthDays: 2,
};
