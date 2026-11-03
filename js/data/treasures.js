// treasures.js — Real-World Treasure: chests that fill with gems and
// open into a real prize.
//
// Each chest has:
//   name    what it's called on screen
//   gems    how many gems open it (one per day you earn it)
//   from    what earns a gem; the button on Home says this
//   prize   the real thing you get when it opens
//   where   where you claim the prize
//   lines   what Mara says: when a gem drops, and when the chest opens
//
// "Match Hinge" on the chest screen sets the gem count by hand, so the
// app can agree with the Hinge Health app if they ever drift apart.

const TREASURES = {
  'yoga-mat': {
    name: 'Yoga Mat Chest',
    gems: 15,
    from: 'Did my PT exercises',
    prize: 'a yoga mat',
    where: 'the Hinge Health app',
    lines: {
      gem: 'A gem for the chest. Your knee thanks you, even if it won\'t say so.',
      open: 'The chest is open! Go claim your yoga mat in Hinge Health. You earned every thread of it.',
    },
  },
};

// The chest the PT button fills right now.
const CURRENT_TREASURE = 'yoga-mat';
