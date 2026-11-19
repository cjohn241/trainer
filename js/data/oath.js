// oath.js (data) — The Oath: Mara's lines, milestones and the body check.
//
// The Oath counts alcohol-free days as a running TOTAL. A slip costs one
// day, never the pile. Change any line here and reload; nothing else needs
// to change. {total} is replaced with your clear-day count.
// The screens are in js/oath.js. XP numbers are in js/data/tuning.js.

// Settings you fill in on the Oath settings screen. These are the starting values.
const OATH_DEFAULTS = {
  startDate: null,        // the first day that counts. null = the Oath hasn't started yet
  usualPerDay: 3,         // drinks on a usual day before the Oath (for "drinks skipped")
  pricePerDrink: 6,       // dollars
  kcalPerDrink: 150,      // a typical beer or glass of wine
  checkinTime: '17:30',   // from this time on, Home shows Mara with her lantern
  doctorPhone: '',        // the body check's "Call my doctor" button
  showRun: true,          // show current and longest run (small, under the total)
  inBackup: true,         // false: backup files leave Oath data out
  medEnabled: false,      // the daily "Taken / Witnessed" medication check
  medLabel: '',           // what to call it, e.g. the medication's name
};

// Each milestone counts TOTAL clear days, not days in a row. Earned once, kept forever.
const OATH_MILESTONES = [
  { days: 7, xp: 100,
    item: { id: 'oath-iron-token', name: 'Iron Week Token', line: 'Seven clear days, stamped in iron.' },
    line: 'SEVEN! A full week of clear mornings. Brace yourself, I\'m doing the loud noise. HRAAA!' },
  { days: 30, xp: 300,
    item: { id: 'oath-moonsilver-flask', name: 'Moonsilver Flask', line: 'Water only, obviously.' },
    line: 'Thirty days. A whole moon. That earns the Moonsilver Flask. Water only, obviously.' },
  { days: 90, xp: 750,
    item: { id: 'oath-seasonward-cloak', name: 'Seasonward Cloak', line: 'Ninety days of weather, and you\'re still standing in it.' },
    line: 'Ninety days. A full season. You changed the weather in here.' },
  { days: 365, xp: 2000,
    item: { id: 'oath-long-year-crown', name: 'Crown of the Long Year', line: 'A year of days. Wear it however you like.' },
    line: 'Three hundred sixty-five. A year of days, one at a time. I\'m not crying. It\'s forge smoke.' },
];

const OATH_LINES = {
  // The check-in question
  ask: [
    'Lantern\'s lit. How\'s tonight going?',
    'Dinner hour. Just you and me. How is it?',
    'Quick check before the evening runs off. How are we?',
  ],

  clear: [
    'Another clear day in the book. The forge remembers every one.',
    'Dinner came and went, and you stayed you. That\'s a rep that counts.',
    'Day logged. Add it to the pile. Piles get tall.',
    'No trumpets needed. One more stone on the wall.',
    'You walked past the tavern again. My legs are jealous of yours.',
    'Clear tonight, clear tomorrow morning. Good trade.',
    'That\'s {total}. I\'m writing it in big letters.',
    'Quiet win. My favorite kind.',
  ],

  // Said with any milestone, after its own line
  milestoneAny: [
    'These didn\'t have to be in a row. They just had to be yours. And they are.',
    'Count it with me: {total}. Every one was a choice you made.',
  ],

  slip: [
    'Logged. One day off. {total} still standing, and they aren\'t going anywhere.',
    'Even the Unbent stumbles. You told me straight. That\'s the strong part.',
    'One day. That\'s the whole cost. Not the wall. One stone.',
    'If the night\'s still going: every one you skip from here still counts. I\'m keeping track.',
    'Water, food, sleep. Then we go again.',
    'No speech. You know the way back, and it\'s short. It\'s called tomorrow.',
    'Thanks for the honest log. True maps get you home.',
    'Tomorrow\'s a clean page. I\'ll be here when you open it.',
  ],

  // Asked after "I had a drink"
  slipCount: 'Got it. No lecture. How many, if you want to say? Skipping is fine.',

  cravingStart: 'Sit with me. Fifteen minutes. Urges are loud, but they don\'t last.',
  // One every 3 minutes while the timer runs
  cravingDuring: [
    'It\'s a wave. We don\'t fight waves. We watch them shrink.',
    'Cold water. Big glass. Old barbarian trick.',
    'Where do you feel it? Chest, hands, jaw? Just notice it. I\'ve got the timer.',
    'Halfway. It\'s already smaller than when we started. You can feel that, right?',
    'Walk a lap with me. Big steps. Swing those arms.',
  ],
  cravingAsk: 'Fifteen minutes. How is it now?',
  cravingPassed: [
    'Fifteen minutes. You outlasted it. That one goes on the wall.',
    'Wave\'s gone. You\'re still here. That\'s how it works.',
    'Rode it out. I\'d cheer, but I don\'t want to wake the neighbors. Fine. HRAA.',
  ],
  cravingStill: 'Still hanging around? Fine. Another round. It gets tired before we do.',

  // The Oath panel
  panelFirst: 'Day one counts the moment dinner\'s done. I\'ll be here with the lantern.',
  panel: '{total} clear days. Not a streak. A pile. Piles don\'t fall over.',

  setup: 'An oath, then. No streaks to break, just a pile of clear days that only grows. A slip costs one day, never the pile.',

  // The body check. Mara's a trainer, not a healer: she points you to people who are.
  bodyAsk: 'Tick anything you feel right now. I\'ll tell you who to call.',
  bodyDoctor: 'I\'m a trainer, not a healer. Shakes, sweats, a racing heart: that\'s your doctor\'s call, today. Calling is the strong move.',
  bodyEmergency: 'This one isn\'t mine. Call 911 now, or get someone to call for you.',
  bodyNone: 'Nothing on the list. Good. If anything shows up, come back here or call your doctor.',
};

// The body check list. Any "emergency" tick shows Call 911. Any "doctor" tick shows Call your doctor.
const OATH_SYMPTOMS = {
  doctor: [
    { id: 'shakes', label: 'Shaky hands or body' },
    { id: 'sweats', label: 'Sweats' },
    { id: 'racing-heart', label: 'Racing or pounding heart' },
    { id: 'vomiting', label: 'Throwing up' },
    { id: 'no-sleep', label: 'Can\'t sleep, very on edge' },
  ],
  emergency: [
    { id: 'confusion', label: 'Confused, or don\'t know where I am' },
    { id: 'hallucinations', label: 'Seeing, hearing or feeling things that aren\'t there' },
    { id: 'seizure', label: 'A seizure, or close to one' },
    { id: 'chest', label: 'Chest pain or trouble breathing' },
  ],
};

// Free, confidential, 24/7 (US). Shown on the body check's doctor card.
const OATH_HELPLINE = { name: 'SAMHSA National Helpline', phone: '1-800-662-4357', tel: '18006624357' };
