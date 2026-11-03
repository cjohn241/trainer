// progress.js — remembers the weight and reps for each exercise, and moves
// you up when you've earned it ("double progression"):
//
//   1. Stay in the rep range, e.g. 8–12.
//   2. When EVERY set reaches the top of the range and it felt Easy or Good,
//      next time goes up one plate step (or one push-up rung) and back to
//      the bottom of the range.
//   3. Hard means stay where you are. Nothing ever moves you down by itself.

// Places you train. Each one remembers its own weights and push-up rung,
// so a hotel never changes your numbers at home.
//   'home'      your plates and furniture
//   'room'      a hotel room (with or without bands)
//   'gym'       a hotel gym: dumbbells in pounds

/** The row for one exercise at one place. */
function stateId(exerciseId, place = 'home') {
  return `${exerciseId}|${place}`;
}

const WEIGHT_LOADS = ['db-one', 'db-pair', 'kb', 'lb', 'lb-pair'];

/** How a move is loaded at a place. At the hotel gym, dumbbell and kettlebell moves use the rack, in pounds. */
function loadKind(ex, place = 'home') {
  if (place !== 'gym') return ex.load;
  if (ex.load === 'db-pair') return 'lb-pair';
  if (ex.load === 'db-one' || ex.load === 'kb') return 'lb';
  return ex.load;
}

/** The push-up ladder for a place, easiest first. */
function ladderFor(place = 'home') {
  if (place === 'room') return EQUIPMENT.roomPushupLadder;
  if (place === 'gym') return EQUIPMENT.gymPushupLadder;
  return EQUIPMENT.pushupLadder;
}

/** What to start with next time: { load, reps }. load is kg (lb at the gym), a ladder rung, or null. */
async function getExerciseState(exerciseId, place = 'home') {
  const saved = await db.get('exerciseState', stateId(exerciseId, place));
  if (saved) return saved;
  const ex = EXERCISES[exerciseId];
  const kind = loadKind(ex, place);
  let load = null;
  if (kind === 'lb' || kind === 'lb-pair') load = nearestLoad(kind, ex.startKg * 2.2046);
  else if (WEIGHT_LOADS.includes(kind)) load = nearestLoad(kind, ex.startKg);
  if (kind === 'ladder') load = Math.min(ex.startRung, ladderFor(place).length - 1);
  return { id: stateId(exerciseId, place), exerciseId, place, load, reps: ex.reps[0] };
}

/**
 * Call after the last set of an exercise. sets = the sets you just logged,
 * effort = 'easy' | 'good' | 'hard'. Returns a message to celebrate a
 * step up, or null.
 */
async function finishExercise(exerciseId, sets, effort, place = 'home') {
  const ex = EXERCISES[exerciseId];
  const kind = loadKind(ex, place);
  const ladder = ladderFor(place);
  const state = await getExerciseState(exerciseId, place);
  const last = sets[sets.length - 1];
  if (!last) return null;

  // Start from what you actually did.
  state.load = last.load;
  state.reps = last.reps;

  let message = null;
  const allAtTop = sets.every((s) => s.reps >= ex.reps[1]);
  if (allAtTop && effort !== 'hard') {
    if (WEIGHT_LOADS.includes(kind)) {
      const next = stepLoad(kind, last.load, +1);
      if (next > last.load) {
        state.load = next;
        state.reps = ex.reps[0];
        message = `Next time: ${describeLoad(kind, next).big}. You earned it.`;
      }
    } else if (kind === 'ladder' && last.load < ladder.length - 1) {
      state.load = last.load + 1;
      state.reps = ex.reps[0];
      message = `Next time: hands on the ${ladder[state.load].toLowerCase()}. You earned it.`;
    }
  }

  state.updatedAt = Date.now();
  await db.put('exerciseState', state);
  return message;
}
