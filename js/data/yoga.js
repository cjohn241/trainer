// yoga.js (data) — The Bend: Mara's yoga quest line (v0.4). Words, numbers
// and choices you can change freely. The screens live in js/yoga.js; the
// XP per session lives in tuning.js. {total}, {next}, {weeksHit}, {target}
// in a line are filled in with your numbers.

const YOGA_DEFAULTS = {
  weeklyTarget: 3,       // sessions a week (Monday to Sunday). A missed day never resets anything.
  cooldownOn: true,      // after a strength day, the Done screen suggests a cooldown stretch
  winddownOn: true,      // from winddownTime, Home suggests a wind-down stretch (if no yoga today)
  winddownTime: '21:00',
  lastMinutes: 10,       // the log sheet starts on what you picked last time
  lastType: 'flow',
};

const YOGA_TYPES = { flow: 'Flow', stretch: 'Stretch', restorative: 'Restorative' };
const YOGA_MINUTES = [10, 15, 20, 30, 45, 60];
const YOGA_TRAVEL_MINUTES = [7, 10, 15, 20, 30];

// Mara's arc. Her lines after a session come from the chapter you're in.
// A line starting with 'flow:', 'stretch:' or 'restorative:' is only said after that type.
const YOGA_CHAPTERS = [
  { from: 0, name: 'Chapter I · The Unbent Objects', lines: [
    'Logged. I watched from over here. Bending isn\'t for the Unbent. …It\'s in the book, though.',
    'Ten minutes on a mat. Fine. Fine. That counts. I said it out loud.',
    'restorative: Restorative. Lying on the floor on purpose. I\'ve done that for years. I call it Tuesday.',
    'Showing up is the whole trick. You showed up. Trick done.',
    'You bent. I didn\'t. We both had a good time. Mostly you.',
  ] },
  { from: 5, name: 'Chapter II · Something Creaked', lines: [
    'Something creaked when I tried that. Probably the floor.',
    'I tried the forward fold while you weren\'t looking. Don\'t ask how far I got.',
    'Session {total}. My hamstrings have filed a complaint. Yours look smug.',
    'flow: Flow day. You moved like water. I move like a wardrobe. Different gifts.',
    'Logged. I\'m not saying I like it. I\'m saying I put my mat next to yours.',
  ] },
  { from: 10, name: 'Chapter III · Warrior, Finally', lines: [
    'Session {total}. The mat and I have reached an understanding.',
    'A pose named Warrior. I\'ve been doing it wrong for years. I\'ve been doing it with an axe.',
    'In the book. Bending is just lifting, slower, with more breathing.',
    'Good session. I did one too. Quietly. Tell no one.',
    'You keep showing up. The mat keeps winning. I\'m starting to root for the mat.',
  ] },
  { from: 25, name: 'Chapter IV · The Wobbling Tree', lines: [
    'Session {total}. A tree that wobbles still stands. So do you.',
    'I stood on one leg for a full breath today. I want a parade.',
    'Logged. I asked the fire if it does yoga. It just flickered. Rude.',
    'restorative: Restorative day. Floor time. Best kind of time.',
    'That\'s {total} sessions. I used to count reps. Now I count breaths too.',
  ] },
  { from: 50, name: 'Chapter V · Dog Days', lines: [
    'Session {total}. My braid and the floor are on a first-name basis now.',
    'Logged. Fifty-plus sessions and you still roll the mat out. That\'s the real strength.',
    'A Downward Dog a day. I made that up. It\'s good though.',
    'You came, you bent, you breathed. Mara approves. Loudly. HRAAA.',
    'In the book. I tell the other trainers I do yoga now. They\'re scared.',
  ] },
  { from: 100, name: 'Chapter VI · Mostly Unbent', lines: [
    'Session {total}. Mara the Unbent… mostly. Come sit a minute.',
    'Logged. Somewhere, a mat is very proud of you. So am I.',
    'Another one. The forge is quiet tonight, and that\'s a good sound.',
    'You showed up again. I stopped being surprised. Never stopped being glad.',
    'Breathe in, breathe out, HRAAA. That\'s the advanced version.',
  ] },
];

// Milestones count TOTAL full sessions. Earned once, kept forever. Each one unlocks a pose (data/sprites.js).
const YOGA_MILESTONES = [
  { n: 5, xp: 50, pose: 'yoga-fold', name: 'Grumbling Forward Fold',
    line: 'Five sessions. I bent. A little. Toward the floor. Don\'t tell the hall.' },
  { n: 10, xp: 100, pose: 'yoga-warrior', name: 'Warrior II',
    line: 'Ten! And there\'s a pose named Warrior. Now we\'re talking. Look at me.' },
  { n: 25, xp: 200, pose: 'yoga-tree', name: 'Tree Pose',
    line: 'Twenty-five. I stood on one leg for you. I wobbled. A tree that wobbles still stands.' },
  { n: 50, xp: 350, pose: 'yoga-dog', name: 'Downward Dog',
    line: 'Fifty. I tried Downward Dog. My braid touched the floor. I\'m still processing.' },
  { n: 100, xp: 600, pose: 'yoga-seat', name: 'Easy Seat',
    line: 'One hundred. Mara the Unbent… mostly. Come sit with me a minute.' },
];

// Hotel-room quests (when 🧳 is on). Each one says what to pick in Down Dog.
// Out here, 7 minutes is a full session (TUNING.yogaTravelFull).
const YOGA_HOTEL_QUESTS = [
  { id: 'jetlag', name: 'Jet-Lag Unknot', minutes: 7, type: 'stretch',
    about: 'Down Dog: Stretch, 7 min. A strip of floor between the bed and the desk.' },
  { id: 'desk-chair', name: 'Desk-Chair Hips', minutes: 8, type: 'flow',
    about: 'Down Dog: Hips focus, 8 min. Hands on the desk chair if the floor is tight.' },
  { id: 'lights-out', name: 'Lights-Out Floor', minutes: 10, type: 'restorative',
    about: 'Down Dog: Restorative, 10 min. Lights low, phone on the floor.' },
  { id: 'towel', name: 'Towel Mat Special', minutes: 15, type: 'flow',
    about: 'No mat? A bath towel folded long. Any Down Dog practice.' },
];

const YOGA_LINES = {
  short: [
    'Short stretch logged. Not a full session, but your back says thanks.',
    'A few minutes counts for something. Ten gets you the full win next time.',
    'Stretch in the book. Small bends add up.',
  ],
  weekHit: [
    '{target} this week! Brace yourself. HRAAA! …Quietly. Because yoga.',
    'That\'s the week. Anything more is extra, and I\'ll still cheer.',
    'I\'m told this is where I say "namaste." I\'m saying HRAAA instead.',
    'Week done. Bonus on the pile. Don\'t let it go to your hamstrings.',
    '{weeksHit} weeks hit. I\'m starting to believe in bending.',
    'Target down. Even my braid is impressed, and it\'s hard to impress.',
  ],
  missed: [
    'Last week was quiet on the mat. Nothing\'s lost. Session {next} is right here.',
    'No yoga last week. Weeks do that. Ten minutes gets us rolling.',
    'The mat waited. Mats are patient. So am I.',
    'Missed week noted. That\'s all it is, a note. All {total} sessions are still yours.',
    'New week, clean count. Want the short one first?',
    'I didn\'t bend last week either. Let\'s both start with ten.',
  ],
  travel: [
    'Hotel floor, towel for a mat. I\'ve trained in worse. Seven minutes is a full session out here.',
    'Planes fold you up. Let\'s unfold you. Short one, same XP.',
    'Clear a strip of floor between the bed and the desk. That\'s your hall tonight.',
    'Time zone wrecked you? Restorative. Lie on the floor on purpose.',
    'Small room, same fire. Bend a little and I\'ll count it.',
    'Road rules: seven minutes, full credit. I made the rules. I\'m the trainer.',
  ],
  cooldown: 'Strength\'s done. Ten minutes of stretch to cool down? Your call.',
  winddown: 'Night\'s coming. A restorative ten before bed? Lights low, no heroics.',
  askMore: '{weeksHit} weeks in a row at {target}. Want to try {more} a week? Totally fine to stay.',
  pain: 'Back off. Stop what hurt, and skip it until you\'ve checked with your PT or doctor. Today still counts in full.',
  painEmergency: 'Chest pain, feeling faint or dizzy: stop and call 911 now. Don\'t wait it out.',
  painKnee: 'Your knee is logged as Sore for strength days too.',
  screen: 'Down Dog does the teaching. I do the counting. And the grumbling.',
};

// "Something hurt": where. 'chest' is the emergency one.
const YOGA_PAIN_AREAS = {
  back: 'Back', neck: 'Neck', hip: 'Hip', knee: 'Knee', shoulder: 'Shoulder', wrist: 'Wrist', other: 'Other',
  chest: 'Chest pain, faint or dizzy',
};
