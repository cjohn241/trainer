// oath.js — The Oath: counting alcohol-free days (v0.3).
//
//   #oath                    the panel: total clear days, the 8-week grid, stats
//   #oath/checkin/<date>     the evening check-in (or "How was Tuesday?")
//   #oath/craving/new        starts (or resumes) the 15-minute craving timer
//   #oath/craving            the craving timer
//   #oath/body               the body check: who to call
//   #oath/settings           start date, price, calories, check-in time ...
//
// The rules:
//   - A running TOTAL of clear days. A slip costs that one day, never the pile.
//   - Milestones (7, 30, 90, 365 total) are earned once and kept forever.
//   - Nothing here touches the campfire, energy or loot odds.
//   - Mara never gives medical advice. The body check points you to your doctor, or 911.
//   - Private: stays on this phone. The Home Hub never sees it. Backups can leave it out.
//
// XP rows use fixed ids, so a day can never pay twice:
//   'oath-day|<date>'  'oath-honest|<date>'  'oath-ms|<days>'  'craving|<id>'

const OATH_STORES = ['oathDays', 'cravings', 'symptomLogs'];
const OATH_XP_REASONS = ['oath-day', 'oath-honest', 'oath-milestone', 'craving'];

/** Your Oath settings, with the starting values filled in. */
function oathSettings(profile) {
  return { ...OATH_DEFAULTS, ...((profile && profile.oath) || {}) };
}

/** 'YYYY-MM-DD' plus n days. */
function addDays(key, n) {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** 'tonight', 'yesterday', or the weekday name (a date further back than a week). */
function dayLabel(key) {
  const today = dateKey();
  if (key === today) return 'tonight';
  if (key === addDays(today, -1)) return 'yesterday';
  const name = DAY_NAMES[parseDateKey(key).getDay()];
  return key >= addDays(today, -6) ? name : `${name} ${parseDateKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

/** The same line every time for the same seed (so a redraw doesn't change Mara's mind). */
function pickLine(list, seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return list[h % list.length];
}

/** Put the numbers into a line: '{total}' -> 23. */
function fillLine(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

const money = (n) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Everything the screens show, worked out from your rows (nothing stored that could drift).
 * Days before your start date and in the future never count.
 */
function oathSummary(dayRows, cfg, cravings = []) {
  const today = dateKey();
  const start = cfg.startDate;
  const byDate = new Map();
  if (start) {
    for (const r of dayRows) if (r.status && r.date >= start && r.date <= today) byDate.set(r.date, r);
  }

  let clear = 0;
  let slips = 0;
  let skipped = 0;
  for (const r of byDate.values()) {
    if (r.status === 'clear') { clear++; skipped += cfg.usualPerDay; } else {
      slips++;
      // Stopping early still counts: usual minus what you had. No count given = none skipped.
      if (r.drinks != null) skipped += Math.max(0, cfg.usualPerDay - r.drinks);
    }
  }

  // Current run: back from today (or from yesterday, if tonight isn't logged yet).
  let run = 0;
  for (let d = byDate.has(today) ? today : addDays(today, -1); byDate.get(d)?.status === 'clear'; d = addDays(d, -1)) run++;

  let longest = 0;
  let current = 0;
  if (start) {
    for (let d = start; d <= today; d = addDays(d, 1)) {
      current = byDate.get(d)?.status === 'clear' ? current + 1 : 0;
      longest = Math.max(longest, current);
    }
  }

  // Days in the last week with no answer yet. They're never assumed either way.
  const missed = [];
  if (start) {
    for (let i = 7; i >= 1; i--) {
      const d = addDays(today, -i);
      if (d >= start && !byDate.has(d)) missed.push(d);
    }
  }

  return {
    today, byDate, clear, slips, run, longest, missed,
    skipped, kcal: skipped * cfg.kcalPerDrink, money: skipped * cfg.pricePerDrink,
    todayRow: byDate.get(today) || null,
    next: OATH_MILESTONES.find((m) => m.days > clear) || null,
    earned: OATH_MILESTONES.filter((m) => m.days <= clear),
    ridden: cravings.filter((c) => c.outcome === 'passed').length,
  };
}

/** Is it past your check-in time? */
function isEvening(cfg, now = new Date()) {
  const [h, m] = String(cfg.checkinTime || '17:30').split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + (m || 0);
}

/**
 * Save one day as 'clear' or 'slip' (drinks: a number, or null for "skip the count").
 * Moves that day's XP to match, and awards any milestone you just reached.
 * Returns { reached: [milestones], levelUp: new level or 0 }.
 */
async function logOathDay(date, status, drinks = null) {
  const before = levelInfo(await totalXp()).level;
  const now = Date.now();
  const row = (await db.get('oathDays', date)) || { date };
  if (row.loggedAt) row.editedAt = now; else row.loggedAt = now;
  row.status = status;
  row.drinks = status === 'slip' ? drinks : 0;
  await db.put('oathDays', row);

  const xpRow = (kind, amount) => ({ id: `${kind}|${date}`, at: now, date: dateKey(), amount, reason: kind, refId: date });
  if (status === 'clear') {
    await db.remove('xpLedger', `oath-honest|${date}`);
    await db.put('xpLedger', xpRow('oath-day', TUNING.xpOathDay));
  } else {
    await db.remove('xpLedger', `oath-day|${date}`);
    await db.put('xpLedger', xpRow('oath-honest', TUNING.xpOathHonest));
  }

  const cfg = oathSettings(await db.get('profile', 'me'));
  const sum = oathSummary(await db.getAll('oathDays'), cfg);
  const reached = [];
  for (const m of OATH_MILESTONES) {
    const id = `oath-ms|${m.days}`;
    if (sum.clear < m.days || await db.get('xpLedger', id)) continue;
    await db.put('xpLedger', { id, at: now, date: dateKey(), amount: m.xp, reason: 'oath-milestone', refId: String(m.days) });
    await db.put('inventory', { id, itemId: m.item.id, kind: 'cosmetic', at: now, from: 'oath' });
    reached.push(m);
  }
  const after = levelInfo(await totalXp()).level;
  return { reached, levelUp: after > before ? after : 0 };
}

// ---------- Home and the Outpost ----------

/**
 * What Home shows for the Oath: { top, tile }.
 *   top   the big lantern card (evening, tonight not logged) or "How was Tuesday?"
 *   tile  the small "The Oath · 23 days" button otherwise
 * Call playOathBanner(main) after drawing.
 */
async function oathHomeHtml(profile) {
  const cfg = oathSettings(profile);
  if (!cfg.startDate) return { top: '', tile: '<a class="btn" href="#oath">The Oath · count clear days with Mara</a>' };
  const sum = oathSummary(await db.getAll('oathDays'), cfg);
  const days = `${sum.clear} day${sum.clear === 1 ? '' : 's'}`;

  if (!sum.todayRow && isEvening(cfg)) {
    return { tile: '', top: `
      <div class="oath-card">
        <canvas class="lantern" width="32" height="32" role="img" aria-label="Mara holding a lantern"></canvas>
        <div class="stack">
          <p class="fire-name">Evening check-in</p>
          <p class="muted small">The Oath · ${days}</p>
          <a class="btn-gold" href="#oath/checkin/${sum.today}">Check in</a>
          <a class="btn-quiet" href="#oath/craving/new">Craving? 15 minutes with Mara</a>
        </div>
      </div>` };
  }
  if (sum.missed.length) {
    const d = sum.missed[sum.missed.length - 1];
    return { tile: '', top: `
      <div class="oath-card">
        <canvas class="lantern" width="32" height="32" role="img" aria-label="Mara holding a lantern"></canvas>
        <div class="stack">
          <p class="fire-name">How was ${esc(dayLabel(d))}?</p>
          <p class="muted small">The Oath · ${days}</p>
          <a class="btn-gold" href="#oath/checkin/${d}">Tell Mara</a>
        </div>
      </div>` };
  }
  return { top: '', tile: `<a class="btn" href="#oath">The Oath · ${days}${sum.todayRow ? ' · tonight is in ✓' : ''}</a>` };
}

function playOathBanner(main) {
  playSprite(main.querySelector('canvas.lantern'), SPRITES.lantern);
}

// ---------- The screens ----------

async function renderOath(main, page, arg) {
  const profile = await db.get('profile', 'me');
  const cfg = oathSettings(profile);
  if (page === 'settings' || !cfg.startDate) return renderOathSettings(main, profile, !cfg.startDate);
  if (page === 'checkin') return renderOathCheckin(main, cfg, arg);
  if (page === 'craving') return renderCraving(main, arg);
  if (page === 'body') return renderOathBody(main, cfg);
  return renderOathPanel(main, cfg);
}

/** The panel: your total, the next milestone, the grid and the stats. */
async function renderOathPanel(main, cfg) {
  const [rows, cravings, inventory] = await Promise.all([db.getAll('oathDays'), db.getAll('cravings'), db.getAll('inventory')]);
  const sum = oathSummary(rows, cfg, cravings);
  const prevDays = sum.earned.length ? sum.earned[sum.earned.length - 1].days : 0;
  const pct = sum.next ? Math.round(((sum.clear - prevDays) / (sum.next.days - prevDays)) * 100) : 100;
  const items = OATH_MILESTONES.filter((m) => inventory.some((r) => r.id === `oath-ms|${m.days}`));

  // Up to 8 weeks, Monday first, starting from the week you took the Oath.
  // Only days from your start date to today can be tapped.
  const dow = (parseDateKey(sum.today).getDay() + 6) % 7;
  const sinceStart = Math.round((parseDateKey(sum.today) - parseDateKey(cfg.startDate)) / 86400000);
  const weeksBack = Math.min(7, Math.floor((sinceStart - dow + 6) / 7));
  const first = addDays(sum.today, -dow - 7 * Math.max(0, weeksBack));
  const cells = [];
  for (let i = 0; i < 7 * (Math.max(0, weeksBack) + 1); i++) {
    const d = addDays(first, i);
    if (d > sum.today || d < cfg.startDate) { cells.push('<span class="day out"></span>'); continue; }
    const r = sum.byDate.get(d);
    const kind = r ? r.status : 'blank';
    const word = { clear: 'clear', slip: 'slip', blank: 'not logged' }[kind];
    cells.push(`<a class="day ${kind}${d === sum.today ? ' today' : ''}" href="#oath/checkin/${d}" aria-label="${esc(d)}: ${word}"></a>`);
  }
  const heads = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h) => `<span class="head">${h}</span>`).join('');

  const checkinBtn = sum.todayRow
    ? `<a class="btn" href="#oath/checkin/${sum.today}">Tonight: ${sum.todayRow.status === 'clear' ? 'clear ✓' : 'logged'} · change</a>`
    : `<a class="btn-gold big" href="#oath/checkin/${sum.today}">Evening check-in</a>`;
  const missedBtn = sum.missed.length
    ? `<a class="btn" href="#oath/checkin/${sum.missed[sum.missed.length - 1]}">How was ${esc(dayLabel(sum.missed[sum.missed.length - 1]))}?</a>` : '';

  main.innerHTML = `
    <section class="stack">
      <h2>The Oath</h2>
      <canvas class="mara small" width="32" height="32" role="img" aria-label="Mara holding a lantern"></canvas>
      <p class="speech">${esc(fillLine(sum.clear ? OATH_LINES.panel : OATH_LINES.panelFirst, { total: sum.clear }))}</p>

      <div class="oath-hero"><b>${sum.clear}</b><span>clear day${sum.clear === 1 ? '' : 's'}</span></div>
      ${sum.next ? `<div class="meter" role="img" aria-label="${pct}% of the way to ${sum.next.days}"><span style="width:${pct}%"></span></div>
        <p class="center muted small">${sum.next.days - sum.clear} more to ${sum.next.days} · ${esc(sum.next.item.name)}</p>`
        : '<p class="center notice">Every milestone earned. The pile keeps growing.</p>'}
      ${cfg.showRun ? `<p class="center muted small">Current run ${sum.run} · longest ${sum.longest}</p>` : ''}
      <p class="center">${badgeHtml('oath-total')}</p>

      ${checkinBtn}
      ${missedBtn}
      <a class="btn" href="#oath/craving/new">Craving · 15 minutes with Mara</a>

      <section class="panel stack">
        <h3>Your weeks</h3>
        <div class="oath-grid">${heads}${cells.join('')}</div>
        <p class="legend"><span><i class="key clear"></i>Clear</span><span><i class="key slip"></i>Slip</span><span><i class="key"></i>Not logged</span></p>
        <p class="muted small center">Tap a day to fill it in or change it.</p>
      </section>

      <section class="panel stack">
        <h3>What you've kept</h3>
        <div class="stats">
          <div><b>${sum.skipped.toLocaleString()}</b><small>drinks skipped</small></div>
          <div><b>${sum.kcal.toLocaleString()}</b><small>calories avoided</small></div>
          <div><b>${esc(money(sum.money))}</b><small>money saved</small></div>
          <div><b>${sum.ridden}</b><small>cravings ridden out</small></div>
        </div>
        <p class="muted small">Counted against your usual ${cfg.usualPerDay} a day, at ${esc(money(cfg.pricePerDrink))} and ${cfg.kcalPerDrink} calories each. Stopping early on a slip day still counts. ${badgeHtml('urge-surfing')}</p>
      </section>

      ${items.length ? `<section class="panel stack">
        <h3>Oath treasures</h3>
        ${items.map((m) => `<p><b>${esc(m.item.name)}</b> <span class="muted small">· ${m.days} days · ${esc(m.item.line)}</span></p>`).join('')}
      </section>` : ''}

      <a class="btn-quiet" href="#oath/body">My body feels off</a>
      <a class="btn" href="#oath/settings">Oath settings</a>
      <a class="btn-gold big" href="#home">Back to the hall</a>
    </section>
  `;
  playSprite(main.querySelector('canvas.mara'), SPRITES.lantern);
  return null;
}

/** The check-in for one day: Clear / I had a drink / Craving now, then Mara's reply. */
async function renderOathCheckin(main, cfg, date) {
  const today = dateKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date > today) date = today;
  if (date < cfg.startDate) { location.hash = '#oath'; return null; }
  const isToday = date === today;

  let row = await db.get('oathDays', date);
  let mode = row && row.status ? 'result' : 'ask';
  let drinks = 1;
  let result = null; // { reached, levelUp } right after saving
  let sum = null;

  async function refresh() {
    row = await db.get('oathDays', date);
    sum = oathSummary(await db.getAll('oathDays'), cfg, await db.getAll('cravings'));
  }

  function medPanel() {
    if (!cfg.medEnabled) return '';
    return `<section class="panel stack">
      <h3>${esc(cfg.medLabel || 'Medication')}</h3>
      <label class="check"><input type="checkbox" data-med="medTaken" ${row && row.medTaken ? 'checked' : ''}> Taken ${isToday ? 'today' : esc(dayLabel(date))}</label>
      <label class="check"><input type="checkbox" data-med="medWitnessed" ${row && row.medWitnessed ? 'checked' : ''}> Witnessed</label>
    </section>`;
  }

  function askHtml() {
    return `
      <h2>${isToday ? 'Evening check-in' : `How was ${esc(dayLabel(date))}?`}</h2>
      <canvas class="mara" width="32" height="32" role="img" aria-label="Mara holding a lantern"></canvas>
      <p class="speech">${esc(pickLine(OATH_LINES.ask, date))}</p>
      <button class="btn-gold big" data-oath="clear">${isToday ? 'Clear today' : 'It was clear'}</button>
      <button class="btn" data-oath="drank">I had a drink</button>
      ${isToday ? '<a class="btn" href="#oath/craving/new">Craving now · 15 minutes with Mara</a>' : ''}
      ${medPanel()}
      <a class="btn-quiet" href="#oath/body">My body feels off</a>
      <a class="btn-quiet" href="#home">Not now</a>`;
  }

  function countHtml() {
    return `
      <h2>Got it.</h2>
      <canvas class="mara" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
      <p class="speech">${esc(OATH_LINES.slipCount)}</p>
      <div class="stepper">
        <button data-oath="down" aria-label="One fewer">−</button>
        <div class="value">${drinks}<small>drink${drinks === 1 ? '' : 's'}</small></div>
        <button data-oath="up" aria-label="One more">+</button>
      </div>
      <button class="btn-gold" data-oath="save-slip">Save</button>
      <button class="btn" data-oath="skip-count">Skip the count</button>
      <button class="btn-quiet" data-oath="back">Back</button>`;
  }

  function resultHtml() {
    const clear = row.status === 'clear';
    const vars = { total: sum.clear };
    const milestones = (result ? result.reached : []).map((m) => `
      <section class="panel loot loot-rare">
        <p class="muted small">${m.days} clear days · +${m.xp} XP</p>
        <h3>${esc(m.item.name)}</h3>
        <p class="speech">${esc(m.line)}</p>
        <p class="speech">${esc(fillLine(pickLine(OATH_LINES.milestoneAny, m.days), vars))}</p>
      </section>`).join('');
    const xp = result ? (clear ? `+${TUNING.xpOathDay} XP` : `+${TUNING.xpOathHonest} XP for the honest log`) : '';
    const other = sum.missed.filter((d) => d !== date);
    return `
      <h2>${clear ? 'Clear day logged' : 'Logged.'}</h2>
      <canvas class="mara" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
      ${xp ? `<p class="today">${esc(xp)}</p>` : ''}
      ${result && result.levelUp ? `<p class="notice">Level up! You're level ${result.levelUp}.</p>` : ''}
      <p class="speech">${esc(fillLine(pickLine(clear ? OATH_LINES.clear : OATH_LINES.slip, date), vars))}</p>
      ${milestones}
      <p class="center"><b>${sum.clear}</b> clear day${sum.clear === 1 ? '' : 's'} on the pile.</p>
      ${!clear && isToday ? '<a class="btn" href="#oath/craving/new">Craving now? Sit with me 15 minutes</a>' : ''}
      ${medPanel()}
      ${other.length ? `<a class="btn" href="#oath/checkin/${other[other.length - 1]}">How was ${esc(dayLabel(other[other.length - 1]))}?</a>` : ''}
      <a class="btn" href="#oath">See the Oath</a>
      <a class="btn-gold big" href="#home">Back to the hall</a>
      <button class="btn-quiet" data-oath="change">Change this answer</button>
      <a class="btn-quiet" href="#oath/body">My body feels off</a>`;
  }

  function draw() {
    main.innerHTML = `<section class="stack">${mode === 'ask' ? askHtml() : mode === 'count' ? countHtml() : resultHtml()}</section>`;
    const pose = mode === 'ask' ? SPRITES.lantern
      : mode === 'result' && row.status === 'clear' && result ? SPRITES['power-pose'] : SPRITES.idle;
    playSprite(main.querySelector('canvas.mara'), pose);
  }

  async function save(status, count) {
    result = await logOathDay(date, status, count);
    await refresh();
    mode = 'result';
    if (status === 'clear') xpPop(`+${TUNING.xpOathDay} XP`);
    buzz(status === 'clear' ? [80, 60, 160] : 60);
    draw();
  }

  main.onclick = async (e) => {
    const b = e.target.closest('[data-oath]');
    if (!b) return;
    const a = b.dataset.oath;
    if (a === 'clear') return save('clear', 0);
    if (a === 'drank') { mode = 'count'; return draw(); }
    if (a === 'down') { drinks = Math.max(1, drinks - 1); return draw(); }
    if (a === 'up') { drinks = Math.min(30, drinks + 1); return draw(); }
    if (a === 'save-slip') return save('slip', drinks);
    if (a === 'skip-count') return save('slip', null);
    if (a === 'back') { mode = 'ask'; return draw(); }
    if (a === 'change') { mode = 'ask'; result = null; return draw(); }
  };

  // The medication boxes save the moment you tick them, without changing the day's answer.
  main.onchange = async (e) => {
    const box = e.target.closest('[data-med]');
    if (!box) return;
    const r = (await db.get('oathDays', date)) || { date };
    r[box.dataset.med] = box.checked;
    await db.put('oathDays', r);
    row = r;
    toast(box.checked ? 'Ticked.' : 'Unticked.');
  };

  await refresh();
  draw();
  return () => { main.onchange = null; };
}

/** The craving timer. 'new' starts one (or picks up the one already running). */
async function renderCraving(main, arg) {
  const all = await db.getAll('cravings');
  let row = all.filter((c) => !c.outcome).sort((a, b) => b.startedAt - a.startedAt)[0];
  // A timer left open for more than 2 hours is over: close it quietly.
  if (row && Date.now() - row.roundStartedAt > 2 * 3600 * 1000) {
    row.outcome = 'left';
    row.endedAt = Date.now();
    await db.put('cravings', row);
    row = null;
  }
  if (arg === 'new') {
    if (!row) {
      const now = Date.now();
      row = { id: uid(), startedAt: now, roundStartedAt: now, rounds: 1, minutes: TUNING.cravingMinutes, outcome: null };
      await db.put('cravings', row);
    }
    location.replace('#oath/craving'); // so Back doesn't start another one
    return null;
  }
  if (!row) { location.hash = '#oath'; return null; }

  const letScreenSleep = await keepAwake();
  const roundSec = row.minutes * 60;
  const elapsed = () => (Date.now() - row.roundStartedAt) / 1000;
  let mode = elapsed() >= roundSec ? 'ask' : 'timer';
  let lineIndex = -1;
  let timer = null;

  function timerLine() {
    const i = Math.floor(elapsed() / 180); // a new line every 3 minutes
    if (i === 0) return row.rounds > 1 ? OATH_LINES.cravingStill : OATH_LINES.cravingStart;
    return OATH_LINES.cravingDuring[(i - 1 + (row.rounds - 1) * 2) % OATH_LINES.cravingDuring.length];
  }

  const minutesLeft = () => Math.max(1, Math.ceil((roundSec - elapsed()) / 60));

  function draw() {
    if (mode === 'timer') {
      lineIndex = Math.floor(elapsed() / 180);
      main.innerHTML = `
        <section class="stack">
          <h2>Sit with me</h2>
          <div class="ring">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle class="track" cx="60" cy="60" r="54"></circle>
              <circle class="left" cx="60" cy="60" r="54" style="animation-duration:${roundSec}s; animation-delay:-${elapsed().toFixed(2)}s"></circle>
            </svg>
            <canvas width="32" height="32" role="img" aria-label="Mara breathing slowly"></canvas>
          </div>
          <p class="ring-time" id="craving-left">About ${minutesLeft()} min left</p>
          <p class="speech" id="craving-line">${esc(timerLine())}</p>
          <p class="center muted small">Breathe with her: in as she rises, out as she settles. ${badgeHtml('urge-surfing')}</p>
          <button class="btn-gold" data-craving="passed">It passed</button>
          <a class="btn-quiet" href="#oath/body">My body feels off</a>
          <button class="btn-quiet" data-craving="stop">Stop the timer</button>
        </section>`;
      playSprite(main.querySelector('.ring canvas'), SPRITES.breathe);
      return;
    }
    if (mode === 'ask') {
      main.innerHTML = `
        <section class="stack">
          <h2>Fifteen minutes</h2>
          <canvas class="mara" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
          <p class="speech">${esc(OATH_LINES.cravingAsk)}</p>
          <button class="btn-gold big" data-craving="passed">It passed</button>
          <button class="btn" data-craving="again">Still there · another 15</button>
          <a class="btn-quiet" href="#oath/body">My body feels off</a>
        </section>`;
      playSprite(main.querySelector('canvas.mara'), SPRITES.idle);
      return;
    }
    // passed
    main.innerHTML = `
      <section class="stack">
        <h2>You outlasted it</h2>
        <canvas class="mara" width="32" height="32" role="img" aria-label="Mara in her power pose"></canvas>
        <p class="today">+${TUNING.xpCraving} XP</p>
        <p class="speech">${esc(pickLine(OATH_LINES.cravingPassed, row.id))}</p>
        <a class="btn" href="#oath">See the Oath</a>
        <a class="btn-gold big" href="#home">Back to the hall</a>
      </section>`;
    playSprite(main.querySelector('canvas.mara'), SPRITES['power-pose']);
  }

  function tick() {
    if (mode !== 'timer') return;
    if (elapsed() >= roundSec) { mode = 'ask'; buzz([200, 100, 200, 100, 300]); return draw(); }
    const left = document.getElementById('craving-left');
    if (left) left.textContent = `About ${minutesLeft()} min left`;
    if (Math.floor(elapsed() / 180) !== lineIndex) {
      lineIndex = Math.floor(elapsed() / 180);
      const line = document.getElementById('craving-line');
      if (line) line.textContent = timerLine();
      buzz(40);
    }
  }

  main.onclick = async (e) => {
    const b = e.target.closest('[data-craving]');
    if (!b) return;
    const a = b.dataset.craving;
    if (a === 'passed') {
      row.outcome = 'passed';
      row.endedAt = Date.now();
      await db.put('cravings', row);
      await db.put('xpLedger', { id: `craving|${row.id}`, at: Date.now(), date: dateKey(), amount: TUNING.xpCraving, reason: 'craving', refId: row.id });
      mode = 'passed';
      xpPop(`+${TUNING.xpCraving} XP`);
      return draw();
    }
    if (a === 'again') {
      row.roundStartedAt = Date.now();
      row.rounds += 1;
      await db.put('cravings', row);
      mode = 'timer';
      return draw();
    }
    if (a === 'stop') {
      row.outcome = 'left';
      row.endedAt = Date.now();
      await db.put('cravings', row);
      location.hash = '#home';
    }
  };

  // Coming back to the app: redraw so the ring restarts from the right place.
  const onVisible = () => { if (document.visibilityState === 'visible' && mode === 'timer') { tick(); if (mode === 'timer') draw(); } };
  document.addEventListener('visibilitychange', onVisible);

  draw();
  timer = setInterval(tick, 1000);
  return () => {
    clearInterval(timer);
    letScreenSleep();
    document.removeEventListener('visibilitychange', onVisible);
  };
}

/** The body check. Mara gives no medical advice: she says who to call. */
async function renderOathBody(main, cfg) {
  const openCraving = (await db.getAll('cravings')).some((c) => !c.outcome);
  const back = openCraving
    ? '<a class="btn-gold big" href="#oath/craving">Back to the timer</a>'
    : '<a class="btn-gold big" href="#home">Back to the hall</a>';
  const box = (s) => `<label class="check"><input type="checkbox" value="${esc(s.id)}"> ${esc(s.label)}</label>`;

  function drawAsk() {
    main.innerHTML = `
      <section class="stack">
        <h2>How's your body?</h2>
        <canvas class="mara small" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
        <p class="speech">${esc(OATH_LINES.bodyAsk)}</p>
        <section class="panel stack">${OATH_SYMPTOMS.doctor.map(box).join('')}</section>
        <section class="panel stack">
          <p class="muted small">Any of these?</p>
          ${OATH_SYMPTOMS.emergency.map(box).join('')}
        </section>
        <button class="btn-gold big" data-body="tell">Tell Mara</button>
        ${back.replace('btn-gold big', 'btn-quiet')}
      </section>`;
    playSprite(main.querySelector('canvas.mara'), SPRITES.idle);
  }

  function drawAnswer(level) {
    const doctorBtn = cfg.doctorPhone
      ? `<a class="btn-gold big" href="tel:${esc(cfg.doctorPhone.replace(/[^\d+]/g, ''))}">Call my doctor</a>`
      : '<p class="notice">Call your doctor\'s office. (Add their number in Oath settings, and this becomes a button.)</p>';
    const body = {
      emergency: `
        <h2>Call 911 now</h2>
        <canvas class="mara small" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
        <p class="speech">${esc(OATH_LINES.bodyEmergency)}</p>
        <a class="btn-gold big" href="tel:911">Call 911</a>
        <p class="center muted">If someone is with you, tell them now.</p>`,
      doctor: `
        <h2>Call your doctor today</h2>
        <canvas class="mara small" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
        <p class="speech">${esc(OATH_LINES.bodyDoctor)}</p>
        ${doctorBtn}
        <a class="btn" href="tel:${OATH_HELPLINE.tel}">${esc(OATH_HELPLINE.name)} · ${esc(OATH_HELPLINE.phone)}</a>
        <p class="center muted small">Free, confidential, 24/7.</p>
        <p class="center muted small">If you get confused, see things that aren't there, have a seizure, or have chest pain: call 911.</p>`,
      none: `
        <h2>Nothing on the list</h2>
        <canvas class="mara small" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
        <p class="speech">${esc(OATH_LINES.bodyNone)}</p>`,
    }[level];
    main.innerHTML = `<section class="stack">${body}${back}</section>`;
    playSprite(main.querySelector('canvas.mara'), SPRITES.idle);
  }

  main.onclick = async (e) => {
    if (!e.target.closest('[data-body="tell"]')) return;
    const picked = [...main.querySelectorAll('input[type=checkbox]:checked')].map((i) => i.value);
    const isIn = (list) => picked.some((id) => list.some((s) => s.id === id));
    const level = isIn(OATH_SYMPTOMS.emergency) ? 'emergency' : isIn(OATH_SYMPTOMS.doctor) ? 'doctor' : 'none';
    if (picked.length) await db.put('symptomLogs', { id: uid(), at: Date.now(), date: dateKey(), symptoms: picked, shown: level });
    drawAnswer(level);
  };

  drawAsk();
  return null;
}

/** Oath settings. The first time, this is "Take the Oath". */
async function renderOathSettings(main, profile, setup) {
  const cfg = oathSettings(profile);
  const today = dateKey();
  const tick = (name, on, label) => `<label class="check"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}> ${label}</label>`;

  main.innerHTML = `
    <section class="stack">
      <h2>${setup ? 'Take the Oath' : 'Oath settings'}</h2>
      ${setup ? `<canvas class="mara" width="32" height="32" role="img" aria-label="Mara holding a lantern"></canvas>
        <p class="speech">${esc(OATH_LINES.setup)}</p>` : ''}
      <form class="panel stack" id="oath-form">
        <label class="field">Start counting from
          <input type="date" name="startDate" value="${esc(cfg.startDate || today)}" max="${today}" required>
          <small>Already clear for a few days? Pick that day, then tap each one in the grid.</small></label>
        <label class="field">Drinks on a usual day, before the Oath
          <input type="number" name="usualPerDay" value="${cfg.usualPerDay}" min="0" max="30" step="1" inputmode="numeric"></label>
        <label class="field">Price per drink ($)
          <input type="number" name="pricePerDrink" value="${cfg.pricePerDrink}" min="0" step="0.25" inputmode="decimal"></label>
        <label class="field">Calories per drink
          <input type="number" name="kcalPerDrink" value="${cfg.kcalPerDrink}" min="0" step="10" inputmode="numeric">
          <small>About 150 for a beer or a glass of wine.</small></label>
        <label class="field">Evening check-in time
          <input type="time" name="checkinTime" value="${esc(cfg.checkinTime)}">
          <small>From this time on, Home shows Mara with her lantern until you check in.</small></label>
        <label class="field">Doctor's phone
          <input type="tel" name="doctorPhone" value="${esc(cfg.doctorPhone)}" autocomplete="off">
          <small>For the body check's "Call my doctor" button.</small></label>
        ${tick('showRun', cfg.showRun, 'Show current and longest run')}
        ${tick('inBackup', cfg.inBackup, 'Include Oath data in backup files')}
        ${tick('medEnabled', cfg.medEnabled, 'Daily medication check (Taken · Witnessed)')}
        <label class="field">Medication check label
          <input type="text" name="medLabel" value="${esc(cfg.medLabel)}" placeholder="Medication" maxlength="40">
          <small>Only if your doctor starts you on one. Mara never gives medication advice.</small></label>
        <button class="btn-gold big" type="submit">${setup ? 'Take the Oath' : 'Save'}</button>
      </form>
      <p class="muted small center">Private: this stays on this phone. The Home Hub never sees it.</p>
      <a class="btn-quiet" href="${setup ? '#home' : '#oath'}">${setup ? 'Not now' : 'Back to the Oath'}</a>
    </section>`;
  if (setup) playSprite(main.querySelector('canvas.mara'), SPRITES.lantern);

  main.querySelector('#oath-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target.elements;
    const num = (name, fallback) => {
      const n = Number(f[name].value);
      return Number.isFinite(n) && n >= 0 ? n : fallback;
    };
    const fresh = await db.get('profile', 'me');
    fresh.oath = {
      ...oathSettings(fresh),
      startDate: f.startDate.value && f.startDate.value <= today ? f.startDate.value : today,
      usualPerDay: Math.round(num('usualPerDay', OATH_DEFAULTS.usualPerDay)),
      pricePerDrink: num('pricePerDrink', OATH_DEFAULTS.pricePerDrink),
      kcalPerDrink: Math.round(num('kcalPerDrink', OATH_DEFAULTS.kcalPerDrink)),
      checkinTime: f.checkinTime.value || OATH_DEFAULTS.checkinTime,
      doctorPhone: f.doctorPhone.value.trim(),
      showRun: f.showRun.checked,
      inBackup: f.inBackup.checked,
      medEnabled: f.medEnabled.checked,
      medLabel: f.medLabel.value.trim(),
    };
    await db.put('profile', fresh);
    toast(setup ? 'The Oath is taken. See you at dinner.' : 'Saved.');
    if (location.hash === '#oath') show(); else location.hash = '#oath';
  });
  return null;
}
