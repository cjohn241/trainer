// xp.js — earning XP and working out your level.
//
// Every XP you earn is its own row in the xpLedger table, so your total is
// always the sum of real events. Nothing is stored that could drift.

/** Earn XP. reason: 'set', 'tiny', 'walk', 'adventure' ... refId: the session it came from. */
async function addXp(amount, reason, refId) {
  if (!amount) return;
  await db.put('xpLedger', { id: uid(), at: Date.now(), date: dateKey(), amount, reason, refId });
}

/** All the XP you've ever earned. */
async function totalXp() {
  const rows = await db.getAll('xpLedger');
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

/** Your level, plus how far into it you are. Level 1 -> 2 needs 100 XP, 2 -> 3 needs 200 ... */
function levelInfo(total) {
  let level = 1;
  let left = total;
  while (left >= level * TUNING.xpPerLevel) {
    left -= level * TUNING.xpPerLevel;
    level++;
  }
  return { level, into: left, needed: level * TUNING.xpPerLevel };
}
