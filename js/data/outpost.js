// outpost.js (data) — The Outpost, travel mode. Words and choices you
// might want to change. The workouts themselves are in templates.js.
//
// Places you can pick at the Outpost. Each one names:
//   label      the chip's text
//   template   the workout it starts (templates.js)
//   place      whose weights it remembers: 'room' or 'gym' (progress.js)
//   about      the line under the chips

const OUTPOST_PLACES = {
  room: {
    label: 'Room + bands', template: 'outpost-room', place: 'room',
    about: 'Hotel Room Quest · about 15–20 min · bands, the desk, a sturdy chair. Never the bed.',
  },
  suitcase: {
    label: 'Room, no bands', template: 'suitcase-quest', place: 'room',
    about: 'Suitcase Quest · about 15–20 min · just you, the desk and your backpack. Never the bed.',
  },
  gym: {
    label: 'Hotel gym', template: 'hotel-gym', place: 'gym',
    about: 'Hotel Gym Quest · about 30 min · dumbbells in pounds. Missing something? Tap "Not here".',
  },
};

// Mara's lines at the Outpost.
const OUTPOST_LINES = {
  arrive: 'The Outpost. Smaller hall, same fire. I packed snacks.',
  strength: 'Any day works for strength out here. How much fire have you got?',
  bonus: 'Two strength days done this week. Anything else is a bonus. Go see the place.',
  home: 'Home again. The hall missed you.',
};
