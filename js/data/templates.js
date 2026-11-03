// templates.js — the workouts, and which one belongs to each day.
//
// A workout is a list of slots. Each slot names its movement pattern
// (so travel mode and swaps can fill it differently later), the exercise
// used at home, how many sets, and the rest between sets in seconds.
// Tiny Quest slots use `seconds` instead of reps: one minute of steady work.

const TEMPLATES = {
  'strength-a': {
    name: 'Strength A',
    slots: [
      { pattern: 'squat', exercise: 'goblet-squat', sets: 3, restSec: 90 },
      { pattern: 'push', exercise: 'incline-pushup', sets: 3, restSec: 75 },
      { pattern: 'pull', exercise: 'one-arm-row', sets: 3, restSec: 60 },
      { pattern: 'core', exercise: 'dead-bug', sets: 2, restSec: 45 },
    ],
  },
  'strength-b': {
    name: 'Strength B',
    slots: [
      { pattern: 'hinge', exercise: 'db-rdl', sets: 3, restSec: 90 },
      { pattern: 'press', exercise: 'kb-press', sets: 3, restSec: 60 },
      { pattern: 'bridge', exercise: 'glute-bridge', sets: 3, restSec: 60 },
      { pattern: 'hips', exercise: 'lateral-walk', sets: 2, restSec: 45 },
    ],
  },
  // ----- The Outpost (travel mode). Never the bed: it's too soft to push or bridge on. -----
  'outpost-room': {
    name: 'Hotel Room Quest',
    slots: [
      { pattern: 'squat', exercise: 'sit-to-stand', sets: 3, restSec: 60 },
      { pattern: 'push', exercise: 'incline-pushup', sets: 3, restSec: 60 },
      { pattern: 'pull', exercise: 'band-row', sets: 3, restSec: 45 },
      { pattern: 'bridge', exercise: 'glute-bridge', sets: 2, restSec: 45 },
      { pattern: 'hips', exercise: 'lateral-walk', sets: 2, restSec: 45 },
    ],
  },
  'suitcase-quest': {
    name: 'Suitcase Quest',
    slots: [
      { pattern: 'squat', exercise: 'sit-to-stand', sets: 3, restSec: 60 },
      { pattern: 'push', exercise: 'incline-pushup', sets: 3, restSec: 60 },
      { pattern: 'pull', exercise: 'backpack-row', sets: 3, restSec: 45 },
      { pattern: 'bridge', exercise: 'glute-bridge', sets: 2, restSec: 45 },
      { pattern: 'hips', exercise: 'side-leg-raise', sets: 2, restSec: 45 },
    ],
  },
  'hotel-gym': {
    name: 'Hotel Gym Quest',
    slots: [
      { pattern: 'squat', exercise: 'goblet-squat', sets: 3, restSec: 90 },
      { pattern: 'hinge', exercise: 'db-rdl', sets: 3, restSec: 90 },
      { pattern: 'push', exercise: 'incline-pushup', sets: 3, restSec: 75 },
      { pattern: 'pull', exercise: 'one-arm-row', sets: 3, restSec: 60 },
      { pattern: 'core', exercise: 'dead-bug', sets: 2, restSec: 45 },
    ],
  },
  'tiny': {
    name: 'Tiny Quest',
    slots: [
      { pattern: 'bridge', exercise: 'glute-bridge', sets: 1, seconds: 60, restSec: 15 },
      { pattern: 'push', exercise: 'incline-pushup', sets: 1, seconds: 60, restSec: 15 },
      { pattern: 'core', exercise: 'dead-bug', sets: 1, seconds: 60, restSec: 15 },
    ],
  },
};

// What each day of the week is for. Sunday = 0 ... Saturday = 6.
//   'walk'        walk pad day (Mon, Wed)
//   'walk-bonus'  Friday's bonus walk: skipping it is part of the plan
//   'free'        weekend: Adventures, or catch up on a strength day
const WEEK_PLAN = ['free', 'walk', 'strength-a', 'walk', 'strength-b', 'walk-bonus', 'free'];

// Mara's line on Home, by day type.
const MARA_LINES = {
  first: 'Welcome to the Brawnforge. We forge strong, not huge.',
  'strength-a': 'Strength day. How much fire have you got?',
  'strength-b': 'Strength day. How much fire have you got?',
  walk: 'Walk pad day. Every step feeds the fire.',
  'walk-bonus': 'Bonus quest day. Skipping it is part of the plan.',
  free: 'A free day. Go adventure, or lift with me. Your call.',
};
