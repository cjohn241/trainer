// treasure.js — Real-World Treasure: the yoga mat chest (#treasure).
//
//   - "Did my PT exercises" (on Home and at the Outpost) drops one gem a day.
//     It's a full win: it lights the campfire, gives XP and opens the loot chest.
//   - The chest screen shows your gems, and "Match Hinge" lets you set the
//     count to whatever the Hinge Health app says.
//
// Everything lives in the treasures table:
//   gem rows    id 'gem|yoga-mat|2026-11-03'  one per day, so a day can't count twice
//   match rows  id 'match|yoga-mat'           the count you set with Match Hinge
// Your gem count = the matched number + every gem earned after you matched.

const gemId = (treasureId, date) => `gem|${treasureId}|${date}`;
const matchId = (treasureId) => `match|${treasureId}`;

/** How many gems a chest holds: { count, goal, open, today } (today = earned a gem today). */
function chestStatus(rows, treasureId = CURRENT_TREASURE) {
  const goal = TREASURES[treasureId].gems;
  const match = rows.find((r) => r.id === matchId(treasureId));
  const gems = rows.filter((r) => r.kind === 'gem' && r.treasure === treasureId);
  const after = match ? gems.filter((g) => g.at > match.at) : gems;
  const count = (match ? match.count : 0) + after.length;
  return { count, goal, open: count >= goal, today: gems.some((g) => g.date === dateKey()) };
}

/** The days you did your PT exercises (they light the campfire). */
function ptDays(rows) {
  return rows.filter((r) => r.kind === 'gem').map((r) => r.date);
}

/** A row of little gems: filled ones you've earned, hollow ones still to come. */
function gemRowHtml(status) {
  const shown = Math.min(status.count, status.goal);
  const gems = Array.from({ length: status.goal }, (_, i) => `<span class="${i < shown ? 'on' : ''}"></span>`).join('');
  return `<div class="gems" role="img" aria-label="${shown} of ${status.goal} gems">${gems}</div>`;
}

/** The PT button for Home and the Outpost. After today's gem, it opens the chest instead. */
function ptButtonHtml(rows) {
  const t = TREASURES[CURRENT_TREASURE];
  const status = chestStatus(rows);
  const tally = `${Math.min(status.count, status.goal)} of ${status.goal}`;
  if (status.today) return `<a class="btn" href="#treasure">${esc(t.name)} · ${tally} · today's gem is in ✓</a>`;
  return `<button class="btn" data-action="pt">${esc(t.from)} · gem ${tally}</button>`;
}

/** "Did my PT exercises": save today's gem, give its XP, and show the Done screen. */
async function earnGem() {
  const date = dateKey();
  const id = gemId(CURRENT_TREASURE, date);
  if (await db.get('treasures', id)) { location.hash = '#treasure'; return; } // one gem a day
  const row = { id, kind: 'gem', treasure: CURRENT_TREASURE, date, at: Date.now(), xp: TUNING.xpPtExercises };
  await db.put('treasures', row);
  await addXp(row.xp, 'pt', row.id);
  location.hash = `#done/${row.id}`;
}

async function renderTreasure(main) {
  const t = TREASURES[CURRENT_TREASURE];
  let status = chestStatus(await db.getAll('treasures'));
  let pickCount = status.count; // the number on the Match Hinge stepper

  function draw() {
    main.innerHTML = `
      <section class="stack">
        <h2>${esc(t.name)}</h2>
        <p class="today">${Math.min(status.count, status.goal)} of ${status.goal} gems</p>
        ${gemRowHtml(status)}
        <p class="speech">${esc(status.open ? t.lines.open
          : `One gem for each day you do your PT exercises. ${status.goal - status.count} more and ${t.prize} is yours.`)}</p>
        <p class="center">${badgeHtml('real-incentives')}</p>
        ${status.today ? '<p class="center muted">Today\'s gem is in the chest.</p>' : `<button class="btn-gold big" data-action="pt">${esc(t.from)}</button>`}
        <button class="btn" data-action="match">Match Hinge</button>
        <p class="muted small center">If the Hinge Health app shows a different count, Match Hinge sets this one to agree.</p>
        <button class="btn-quiet" data-action="home">Back to the hall</button>
      </section>
    `;
  }

  function matchSheet() {
    openSheet(`
      <h3>Match Hinge</h3>
      <p class="muted">Open ${esc(t.where)} and count the active days toward ${esc(t.prize)}. Set the same number here.</p>
      <div class="stepper" style="width:100%">
        <button data-match="down" aria-label="One fewer">−</button>
        <div class="value">${pickCount}<small>gems</small></div>
        <button data-match="up" aria-label="One more">+</button>
      </div>
      <button class="btn-gold" data-match="save">Save ${pickCount} gem${pickCount === 1 ? '' : 's'}</button>`);
  }

  main.onclick = async (e) => {
    if (e.target.closest('[data-evidence]')) return; // badges open their own pop-up
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'pt') await earnGem();
    if (action.dataset.action === 'home') location.hash = '#home';
    if (action.dataset.action === 'match') { pickCount = status.count; matchSheet(); }
  };

  // The Match Hinge buttons live in the pop-up sheet, outside main.
  const sheet = document.getElementById('sheet');
  sheet.onclick = async (e) => {
    const button = e.target.closest('[data-match]');
    if (!button) return;
    if (button.dataset.match === 'down') { pickCount = Math.max(0, pickCount - 1); return matchSheet(); }
    if (button.dataset.match === 'up') { pickCount = Math.min(status.goal, pickCount + 1); return matchSheet(); }
    await db.put('treasures', { id: matchId(CURRENT_TREASURE), kind: 'match', treasure: CURRENT_TREASURE, count: pickCount, at: Date.now() });
    status = chestStatus(await db.getAll('treasures'));
    closeSheet();
    toast(`Matched: ${pickCount} gem${pickCount === 1 ? '' : 's'}.`);
    draw();
  };

  draw();
  return () => { sheet.onclick = null; };
}
