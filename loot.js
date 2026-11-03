// loot.js — everything the chest can drop (the Done screen arrives in
// Session 2). rarity: 'common' or 'rare'. kind:
//   'cosmetic'  just for the joy of owning it
//   'bedroll'   used up automatically to keep the campfire from dimming
// Each item has a line Mara says when it drops.

const LOOT = [
  { id: 'bedroll', name: 'Bedroll of Rest', rarity: 'common', kind: 'bedroll',
    line: 'Keep this. Some days the fire needs a blanket, not a log.' },
  { id: 'second-wind', name: 'Potion of Second Wind', rarity: 'common', kind: 'cosmetic',
    line: 'Smells like oranges and stubbornness.' },
  { id: 'steady-bracers', name: 'Bracers of the Steady Row', rarity: 'common', kind: 'cosmetic',
    line: 'Steady pulls. Steady back. Steady you.' },
  { id: 'ember-charm', name: 'Ember Charm', rarity: 'common', kind: 'cosmetic',
    line: 'A small fire still cooks the stew.' },
  { id: 'tusk-pendant', name: 'Tusk Pendant', rarity: 'common', kind: 'cosmetic',
    line: 'One of mine. Don\'t ask how I lost it.' },
  { id: 'map-fragment', name: 'Map Fragment', rarity: 'common', kind: 'cosmetic',
    line: 'Part of a road. The rest you walk yourself.' },
  { id: 'ironwood-tankard', name: 'Ironwood Tankard', rarity: 'common', kind: 'cosmetic',
    line: 'For water. Mostly water.' },
  { id: 'courage-torch', name: 'Torch of Courage', rarity: 'rare', kind: 'cosmetic',
    line: 'For the day you run outside. It\'s coming.' },
  { id: 'unbent-banner', name: 'Unbent Banner', rarity: 'rare', kind: 'cosmetic',
    line: 'We bend. We come back. We do not break.' },
  { id: 'golden-kettlebell', name: 'Golden Kettlebell', rarity: 'rare', kind: 'cosmetic',
    line: 'Too pretty to lift. Lift it anyway.' },
  { id: 'stevens-banner', name: "Steven's Banner of Questionable Naming", rarity: 'rare', kind: 'cosmetic',
    line: '"Brawnforge." He was very proud. We let him have it.' },
];
