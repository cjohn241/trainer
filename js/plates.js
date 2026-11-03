// plates.js — which weights you can build from your plates, and which
// plates go on. Uses EQUIPMENT in data/equipment.js.
//
//   'db-one'   one dumbbell: 2 ends, so each end can take half of each plate size
//   'db-pair'  two dumbbells: 4 ends, so each end can take a quarter
//   'kb'       the kettlebell: one center stack, can take every plate
// Both ends of a dumbbell always match, so it stays balanced.

const optionCache = {};

/** Every weight you can build for one tool, lightest first: [{ kg, plates }]. */
function loadOptions(kind) {
  if (optionCache[kind]) return optionCache[kind];

  const ends = kind === 'db-pair' ? 4 : kind === 'db-one' ? 2 : 1;
  const endsPerBell = kind === 'kb' ? 1 : 2;
  const base = kind === 'kb' ? EQUIPMENT.kettlebellBaseKg : EQUIPMENT.dumbbellHandleKg;
  const best = new Map(); // kg -> the combo that uses the fewest plates

  // Try every mix of plates on one end (or in the stack).
  function tryMix(index, onEnd) {
    if (index === EQUIPMENT.plates.length) {
      if (!onEnd.length) return;
      const perEnd = onEnd.reduce((sum, kg) => sum + kg, 0);
      const kg = Math.round((base + perEnd * endsPerBell) * 10) / 10;
      const old = best.get(kg);
      if (!old || onEnd.length < old.plates.length) best.set(kg, { kg, plates: [...onEnd] });
      return;
    }
    const plate = EQUIPMENT.plates[index];
    const most = Math.floor(plate.count / ends);
    for (let n = 0; n <= most; n++) {
      tryMix(index + 1, [...onEnd, ...Array(n).fill(plate.kg)]);
    }
  }
  tryMix(0, []);

  optionCache[kind] = [...best.values()].sort((a, b) => a.kg - b.kg);
  return optionCache[kind];
}

/** The buildable weight closest to kg. */
function nearestLoad(kind, kg) {
  const options = loadOptions(kind);
  return options.reduce((a, b) => (Math.abs(b.kg - kg) < Math.abs(a.kg - kg) ? b : a), options[0]).kg;
}

/** One step lighter (dir -1) or heavier (dir +1). Stays put at either end. */
function stepLoad(kind, kg, dir) {
  const options = loadOptions(kind);
  const i = options.findIndex((o) => o.kg === kg);
  const next = Math.min(options.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir));
  return options[next].kg;
}

/** 7 -> "7", 4.5 -> "4.5" */
function kgText(kg) {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

/** What to show for a weight: the big number, and which plates go on. */
function describeLoad(kind, kg) {
  const option = loadOptions(kind).find((o) => o.kg === kg);
  const plates = option ? option.plates.map(kgText).join(' + ') : '';
  if (kind === 'kb') return { big: `${kgText(kg)} kg`, plates: `Stack: ${plates}` };
  if (kind === 'db-pair') return { big: `${kgText(kg)} kg each`, plates: `Each end, both bells: ${plates}` };
  return { big: `${kgText(kg)} kg`, plates: `Each end: ${plates}` };
}
