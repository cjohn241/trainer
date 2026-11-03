// today.js — what today's quest is, and how your energy tap shapes it.

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * On a free day (or when you swap a walk for strength), pick the strength
 * workout you did least recently, so A and B take turns.
 */
function nextStrength(sessions) {
  const lastDate = (id) => sessions.filter((s) => s.templateId === id && s.done.length)
    .map((s) => s.startedAt).sort((a, b) => b - a)[0] || 0;
  return lastDate('strength-a') <= lastDate('strength-b') ? 'strength-a' : 'strength-b';
}

/** Today's quest: { dayType, templateId, label }. */
function todaysQuest(sessions, date = new Date()) {
  const dayType = WEEK_PLAN[date.getDay()];
  const day = DAY_NAMES[date.getDay()];
  if (dayType === 'strength-a' || dayType === 'strength-b') {
    return { dayType, templateId: dayType, label: `${day} · ${TEMPLATES[dayType].name} with Mara` };
  }
  if (dayType === 'walk') return { dayType, templateId: null, label: `${day} · Walk pad` };
  if (dayType === 'walk-bonus') return { dayType, templateId: null, label: `${day} · Bonus walk (skippable)` };
  const templateId = nextStrength(sessions);
  return { dayType, templateId, label: `${day} · Free day, or ${TEMPLATES[templateId].name}` };
}

/** Which week of training you're in, counting from your first day. */
function weekNumber(startDate) {
  const days = Math.floor((parseDateKey(dateKey()) - parseDateKey(startDate)) / 86400000);
  return Math.floor(Math.max(0, days) / 7) + 1;
}

/**
 * Turn a workout plus your energy (1-5) into today's list of steps.
 *   1: Tiny Quest   2: 1 set each   3: one set fewer   4: as written   5: one bonus set
 * Weeks 1-2 cap the sets to ease you in.
 */
function buildSteps(templateId, energy, week, kneeEasy = false) {
  if (templateId === 'tiny' || energy === 1) {
    return TEMPLATES.tiny.slots.map((slot) => ({ ...slot }));
  }
  return TEMPLATES[templateId].slots.map((slot) => {
    let sets = slot.sets;
    if (week <= TUNING.easeInWeeks) sets = Math.min(sets, TUNING.easeInSets);
    if (energy === 2) sets = 1;
    if (energy === 3) sets = Math.max(1, sets - 1);
    if (energy === 5) sets += 1;
    // Knee check said Sore twice: moves that load the knee use their easier version.
    const ex = EXERCISES[slot.exercise];
    const exercise = kneeEasy && ex.knee && ex.easier ? ex.easier : slot.exercise;
    return { ...slot, sets, exercise };
  });
}

/**
 * Close any quest or walk still open. A quest you leave halfway still
 * counts for every set you logged.
 */
async function closeOpenQuests() {
  const sessions = await db.getAll('sessions');
  for (const open of sessions.filter((s) => !s.finishedAt)) {
    open.finishedAt = Date.now();
    open.partial = true;
    await db.put('sessions', open);
  }
}

/** Start a new quest and save it. Any quest still open is closed first. */
async function startQuest(templateId, energy) {
  await closeOpenQuests();
  const profile = await db.get('profile', 'me');
  const id = energy === 1 ? 'tiny' : templateId;
  const session = {
    id: uid(),
    date: dateKey(),
    startedAt: Date.now(),
    finishedAt: null,
    templateId: id,
    kind: id === 'tiny' ? 'tiny' : 'strength',
    energy,
    place: 'home',
    week: weekNumber(profile.startDate),
    steps: buildSteps(id, energy, weekNumber(profile.startDate), profile.kneeEasy),
    done: [],     // every set you log: { step, exercise, reps, load, seconds, at }
    efforts: {},  // step number -> 'easy' | 'good' | 'hard'
    swaps: {},    // step number -> the easier exercise you switched to
    xp: 0,
  };
  await db.put('sessions', session);
  await db.put('checkins', { date: session.date, energy, at: Date.now() });
  location.hash = '#workout';
}
