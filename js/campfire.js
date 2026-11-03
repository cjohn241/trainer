// campfire.js — the forgiving streak.
//
//   - Any win lights the fire for that day: one logged set, a walk, an Adventure,
//     or "Did my PT exercises".
//   - Each lit day grows it one size, up to 5 (bonfire).
//   - An unlit Monday to Thursday shrinks it one size, but never below 1 (ember).
//   - Friday, Saturday and Sunday can never shrink it.
//   - Travel days (any day of a trip at the Outpost) count as rest: they never shrink it either.
//   - If you carry a Bedroll, it's used up automatically instead of shrinking.
// The fire is worked out fresh every time, never stored. Only the Bedrolls
// remember the day they were used (usedOn), so the same one isn't used twice.

const FIRE_NAMES = ['Ember', 'Small flame', 'Steady fire', 'Roaring fire', 'Bonfire'];

/** Was this day ('YYYY-MM-DD') part of a trip? trips = profile.trips: [{ start, end }]; end null = still away. */
function isTravelDay(trips = [], key) {
  return trips.some((t) => key >= t.start && (!t.end || key <= t.end));
}

/**
 * sessions, adventures = every row in those tables. inventory = every loot row.
 * extra.ptDays = the days you did your PT exercises (treasure.js ptDays).
 * extra.trips = your trips (profile.trips), whose days count as rest.
 * Returns { level, name, litToday, usedNow }. usedNow = Bedrolls this check
 * just used up: save them (home.js does) so they stay used.
 */
function campfire(sessions, adventures = [], inventory = [], extra = {}, today = dateKey()) {
  const litDays = new Set([
    ...sessions.filter((s) => s.done && s.done.length).map((s) => s.date),
    ...adventures.map((a) => a.date),
    ...(extra.ptDays || []),
  ]);
  const bedrolls = inventory.filter((row) => row.kind === 'bedroll').sort((a, b) => a.at - b.at);
  const usedNow = [];
  const days = [...litDays].sort();
  let level = 1;

  if (days.length) {
    const day = parseDateKey(days[0]);
    const end = parseDateKey(today);
    while (day <= end) {
      const key = dateKey(day);
      const weekday = day.getDay(); // 1-4 = Monday-Thursday
      if (litDays.has(key)) level = Math.min(5, level + 1);
      else if (key !== today && weekday >= 1 && weekday <= 4 && level > 1 && !isTravelDay(extra.trips, key)) {
        // A Bedroll already used for this day, or one you had by the end of it.
        const endOfDay = new Date(day).setHours(23, 59, 59, 999);
        const bedroll = bedrolls.find((b) => b.usedOn === key)
          || bedrolls.find((b) => !b.usedOn && b.at <= endOfDay);
        if (bedroll) {
          if (!bedroll.usedOn) { bedroll.usedOn = key; usedNow.push(bedroll); }
        } else level = level - 1;
      }
      day.setDate(day.getDate() + 1);
    }
  }

  return { level, name: FIRE_NAMES[level - 1], litToday: litDays.has(today), usedNow };
}
