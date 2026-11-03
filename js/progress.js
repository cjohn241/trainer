// progress.js — remembers the weight and reps for each exercise, and moves
// you up when you've earned it ("double progression"):
//
//   1. Stay in the rep range, e.g. 8–12.
//   2. When EVERY set reaches the top of the range and it felt Easy or Good,
//      next time goes up one plate step (or one push-up rung) and back to
//      the bottom of the range.
//   3. Hard means stay where you are. Nothing ever moves you down by itself.

/** The row for one exercise at one place (home for now; hotels come in v0.2). */
function stateId(exerciseId, place = 'home') {
  return `${exerciseId}|${place}`;
}

const WEIGHT_LOADS = ['db-one', 'db-pair', 'kb'];

/** What to start with next time: { load, reps }. load is kg, a ladder rung, or null. */
async function getExerciseState(exerciseId) {
  const saved = await db.get('exerciseState', stateId(exerciseId));
  if (saved) return saved;
  const ex = EXERCISES[exerciseId];
  let load = null;
  if (WEIGHT_LOADS.includes(ex.load)) load = nearestLoad(ex.load, ex.startKg);
  if (ex.load === 'ladder') load = ex.startRung;
  return { id: stateId(exerciseId), exerciseId, place: 'home', load, reps: ex.reps[0] };
}

/**
 * Call after the last set of an exercise. sets = the sets you just logged,
 * effort = 'easy' | 'good' | 'hard'. Returns a message to celebrate a
 * step up, or null.
 */
async function finishExercise(exerciseId, sets, effort) {
  const ex = EXERCISES[exerciseId];
  const state = await getExerciseState(exerciseId);
  const last = sets[sets.length - 1];
  if (!last) return null;

  // Start from what you actually did.
  state.load = last.load;
  state.reps = last.reps;

  let message = null;
  const allAtTop = sets.every((s) => s.reps >= ex.reps[1]);
  if (allAtTop && effort !== 'hard') {
    if (WEIGHT_LOADS.includes(ex.load)) {
      const next = stepLoad(ex.load, last.load, +1);
      if (next > last.load) {
        state.load = next;
        state.reps = ex.reps[0];
        message = `Next time: ${describeLoad(ex.load, next).big}. You earned it.`;
      }
    } else if (ex.load === 'ladder' && last.load < EQUIPMENT.pushupLadder.length - 1) {
      state.load = last.load + 1;
      state.reps = ex.reps[0];
      message = `Next time: hands on the ${EQUIPMENT.pushupLadder[state.load].toLowerCase()}. You earned it.`;
    }
  }

  state.updatedAt = Date.now();
  await db.put('exerciseState', state);
  return message;
}
