// yoga.js — The Bend: Mara's yoga quest line (v0.4).
//
//   Home / Outpost   the Yoga button opens the log sheet: minutes, type, "Something hurt", Log.
//                    Your last minutes and type are already picked, so a usual day is 2 taps.
//                    From your wind-down time, a "wind-down stretch?" card (if no yoga today).
//   #done/<id>       after logging: Mara's pose and line, the week, milestones, pain advice
//   #yoga            The Bend: chapter, this week, 8 weeks, poses, history (edit/delete), settings
//
// The rules:
//   - A full session is 10 minutes or more (7 on a trip, with 🧳 on). Same XP either way.
//     Most XP is for showing up; longer sessions add a little (tuning.js).
//   - Under a full session is a short stretch: a little XP, not counted toward the week.
//   - A weekly target (Monday to Sunday), not a streak. Nothing ever resets.
//   - Milestones (5, 10, 25, 50, 100 total sessions) are earned once and kept, each with a pose.
//   - A full session is a win: it lights the campfire and opens the loot chest.
//   - "Something hurt": Mara says back off and check with your PT or doctor. Never push through.
//     Knee pain also counts as a Sore knee check for strength days.
//
// XP rows use fixed ids, so nothing pays twice:
//   'yoga|<session id>'  'yoga-week|<monday>'  'yoga-ms|<n>'

/** Your yoga settings, with the starting values filled in. */
function yogaSettings(profile) {
  return { ...YOGA_DEFAULTS, ...((profile && profile.yoga) || {}) };
}

/** The Monday ('YYYY-MM-DD') of the week a day is in. */
function weekStart(key) {
  const d = parseDateKey(key);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dateKey(d);
}

/** Is this session long enough to be a full one? */
function isFullYoga(minutes, travel) {
  return minutes >= (travel ? TUNING.yogaTravelFull : TUNING.yogaFull);
}

/** XP for one session: full ones get the base plus the length bonus. */
function yogaXp(minutes, travel) {
  if (!isFullYoga(minutes, travel)) return TUNING.xpYogaShort;
  let bonus = 0;
  for (const [atLeast, extra] of Object.entries(TUNING.xpYogaBonus)) if (minutes >= Number(atLeast)) bonus = extra;
  return TUNING.xpYogaSession + bonus;
}

/** The days you did a full session (they light the campfire). */
function yogaDays(rows) {
  return rows.filter((r) => r.full).map((r) => r.date);
}

/** One of Mara's lines for this type of session (typed lines only match their type; type null = untyped only). */
function yogaLine(lines, type, seed) {
  const pool = lines.filter((l) => !/^(flow|stretch|restorative): /.test(l) || l.startsWith(`${type}: `));
  return pickLine(pool, seed).replace(/^(flow|stretch|restorative): /, '');
}

function yogaChapter(total) {
  return [...YOGA_CHAPTERS].reverse().find((c) => total >= c.from);
}

/** Everything the screens show, worked out from your rows. */
function yogaSummary(rows, cfg) {
  const today = dateKey();
  const full = rows.filter((r) => r.full);
  const thisWeek = weekStart(today);
  const lastWeek = addDays(thisWeek, -7);
  const inWeek = (start) => full.filter((r) => weekStart(r.date) === start).length;

  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const start = addDays(thisWeek, -7 * i);
    weeks.push({ start, count: inWeek(start) });
  }
  // Weeks in a row at your target, counting back from this week (or last week, if this one isn't done yet).
  let hitStreak = 0;
  for (let start = inWeek(thisWeek) >= cfg.weeklyTarget ? thisWeek : lastWeek; inWeek(start) >= cfg.weeklyTarget; start = addDays(start, -7)) hitStreak++;

  const total = full.length;
  const byType = {};
  for (const r of full) byType[r.type] = (byType[r.type] || 0) + 1;
  return {
    total,
    minutes: rows.reduce((sum, r) => sum + r.minutes, 0),
    byType,
    week: inWeek(thisWeek),
    thisWeek,
    lastWeek,
    weeks,
    hitStreak,
    chapter: yogaChapter(total),
    next: YOGA_MILESTONES.find((m) => total < m.n),
    unlocked: YOGA_MILESTONES.filter((m) => total >= m.n),
    todayDone: full.some((r) => r.date === today),
    // A missed week: you've practiced before, but not last week and not yet this week.
    missed: full.some((r) => r.date < lastWeek) && inWeek(lastWeek) === 0 && inWeek(thisWeek) === 0,
  };
}

/** Dots for the week: ●●○ */
function weekDots(count, target) {
  const shown = Math.max(count, target);
  return Array.from({ length: shown }, (_, i) => (i < count ? '●' : '○')).join('');
}

/** Give or take back one week's target bonus to match how many sessions it has. Returns XP newly given. */
async function syncYogaWeek(start, rows, cfg) {
  const id = `yoga-week|${start}`;
  const count = rows.filter((r) => r.full && weekStart(r.date) === start).length;
  const has = await db.get('xpLedger', id);
  if (count >= cfg.weeklyTarget && !has) {
    await db.put('xpLedger', { id, at: Date.now(), date: dateKey(), amount: TUNING.xpYogaWeek, reason: 'yoga-week', refId: start });
    return TUNING.xpYogaWeek;
  }
  if (count < cfg.weeklyTarget && has) await db.remove('xpLedger', id);
  return 0;
}

/** Award any milestone you've reached (once each, kept forever). Returns the ones just reached. */
async function syncYogaMilestones(rows) {
  const total = rows.filter((r) => r.full).length;
  const reached = [];
  for (const m of YOGA_MILESTONES) {
    const id = `yoga-ms|${m.n}`;
    if (total < m.n || await db.get('xpLedger', id)) continue;
    await db.put('xpLedger', { id, at: Date.now(), date: dateKey(), amount: m.xp, reason: 'yoga-milestone', refId: String(m.n) });
    await db.put('inventory', { id, itemId: m.pose, kind: 'pose', at: Date.now(), from: 'yoga' });
    reached.push(m.n);
  }
  return reached;
}

/**
 * Save a session (new or edited): its XP, the week bonus, milestones, and knee pain.
 * oldDate: the date it had before an edit (that week's bonus is checked too).
 * Returns { weekXp, reached, kneeNote }.
 */
async function saveYoga(row, oldDate = null) {
  row.full = isFullYoga(row.minutes, row.travel);
  row.xp = yogaXp(row.minutes, row.travel);
  await db.put('yogaSessions', row);
  await db.put('xpLedger', { id: `yoga|${row.id}`, at: Date.now(), date: dateKey(), amount: row.xp, reason: 'yoga', refId: row.id });

  const [rows, profile] = await Promise.all([db.getAll('yogaSessions'), db.get('profile', 'me')]);
  const cfg = yogaSettings(profile);
  if (oldDate && weekStart(oldDate) !== weekStart(row.date)) await syncYogaWeek(weekStart(oldDate), rows, cfg);
  const weekXp = await syncYogaWeek(weekStart(row.date), rows, cfg);
  const reached = await syncYogaMilestones(rows);

  let kneeNote = '';
  if (row.pain && row.pain.areas.includes('knee')) {
    const mode = await updateKneeMode(await db.getAll('sessions'));
    kneeNote = !mode.before && mode.after ? 'Two sore days. Next strength day uses the gentler knee moves.' : YOGA_LINES.painKnee;
  }
  return { weekXp, reached, kneeNote };
}

/** Delete a session and its XP. The week's bonus follows; milestones are kept. */
async function deleteYoga(row) {
  await db.remove('yogaSessions', row.id);
  await db.remove('xpLedger', `yoga|${row.id}`);
  const [rows, profile] = await Promise.all([db.getAll('yogaSessions'), db.get('profile', 'me')]);
  await syncYogaWeek(weekStart(row.date), rows, yogaSettings(profile));
}

/** Your first session (Nov 8, 2026, 17 minutes) goes in once, so the count starts at 1. Change its type in #yoga. */
async function yogaSeedOnce() {
  const profile = await db.get('profile', 'me');
  if (!profile || (profile.yoga && profile.yoga.seeded) || dateKey() < '2026-11-08') return;
  const id = 'seed-2026-11-08';
  if (!(await db.get('yogaSessions', id))) {
    await saveYoga({ id, kind: 'yoga', date: '2026-11-08', at: parseDateKey('2026-11-08').getTime() + 12 * 3600000,
      minutes: 17, type: 'flow', travel: false, from: 'first', pain: null, loot: 'none' });
  }
  const fresh = await db.get('profile', 'me');
  fresh.yoga = { ...yogaSettings(fresh), seeded: true };
  await db.put('profile', fresh);
}

// ---------- The log sheet ----------

/**
 * The pop-up for logging (or editing) a session.
 * opts: { from: 'home'|'cooldown'|'winddown'|'outpost'|'tv', minutes, type, edit: row, claimId }
 * claimId: from a TV code (claim.js). It's marked claimed when you tap Log.
 */
async function openYogaSheet(opts = {}) {
  const profile = await db.get('profile', 'me');
  const cfg = yogaSettings(profile);
  const edit = opts.edit || null;
  const travel = edit ? Boolean(edit.travel) : isTraveling(profile);
  const st = {
    minutes: edit ? edit.minutes : opts.minutes || cfg.lastMinutes,
    type: edit ? edit.type : opts.type || cfg.lastType,
    hurt: Boolean(edit && edit.pain),
    areas: edit && edit.pain ? [...edit.pain.areas] : [],
    date: edit ? edit.date : dateKey(),
    quest: edit ? edit.quest || null : null,
    confirmDelete: false,
  };
  const sheet = document.getElementById('sheet');

  function draw() {
    const full = isFullYoga(st.minutes, travel);
    const choices = travel ? YOGA_TRAVEL_MINUTES : YOGA_MINUTES;
    const chip = (attr, value, label, on) =>
      `<button class="chip${on ? ' on' : ''}" data-${attr}="${esc(value)}" aria-pressed="${on}">${esc(label)}</button>`;
    const quests = travel && !edit ? `
      <p class="energy-label">Hotel quests</p>
      <div class="chips center-chips">${YOGA_HOTEL_QUESTS.map((q) => chip('quest', q.id, q.name, st.quest === q.id)).join('')}</div>
      ${st.quest ? `<p class="center muted small">${esc(YOGA_HOTEL_QUESTS.find((q) => q.id === st.quest).about)}</p>` : ''}` : '';
    const areas = st.hurt ? `
      <p class="muted small">Where? (optional)</p>
      <div class="chips">${Object.entries(YOGA_PAIN_AREAS).map(([k, label]) => chip('area', k, label, st.areas.includes(k))).join('')}</div>` : '';

    sheet.innerHTML = `<div class="sheet-card">
      <h3>${edit ? 'Change this session' : travel ? 'Yoga at the Outpost' : 'Log yoga'}</h3>
      ${quests}
      <p class="energy-label">Minutes</p>
      <div class="chips center-chips">${choices.map((m) => chip('minutes', m, m, st.minutes === m)).join('')}</div>
      <div class="stepper">
        <button data-step="-1" aria-label="One minute less">−</button>
        <div class="value">${st.minutes}<small>minutes</small></div>
        <button data-step="1" aria-label="One minute more">+</button>
      </div>
      <p class="energy-label">Type</p>
      <div class="chips center-chips">${Object.entries(YOGA_TYPES).map(([k, label]) => chip('type', k, label, st.type === k)).join('')}</div>
      <label class="check"><input type="checkbox" data-hurt ${st.hurt ? 'checked' : ''}> Something hurt</label>
      ${areas}
      ${edit ? `<label class="field">Day<input type="date" name="yoga-date" value="${esc(st.date)}" max="${dateKey()}"></label>` : ''}
      <button class="btn-gold big" data-yoga-save>${edit ? 'Save' : `Log ${st.minutes} min · ${esc(YOGA_TYPES[st.type])}`}</button>
      <p class="center muted small">${full ? `A full session: ${yogaXp(st.minutes, travel)} XP.`
        : `Under ${travel ? TUNING.yogaTravelFull : TUNING.yogaFull} minutes is a short stretch: ${TUNING.xpYogaShort} XP.`}</p>
      ${edit ? `<button class="btn-quiet" data-yoga-delete>${st.confirmDelete ? 'Tap again to delete it' : 'Delete this session'}</button>` : ''}
      <button class="btn" data-close-sheet>Close</button>
    </div>`;
    sheet.hidden = false;
  }

  sheet.onchange = (e) => { if (e.target.name === 'yoga-date' && e.target.value) st.date = e.target.value; };
  sheet.onclick = async (e) => {
    const t = e.target;
    if (t.closest('[data-close-sheet]') || t.id === 'sheet') return;
    if (t.matches('[data-hurt]')) { st.hurt = t.checked; if (!st.hurt) st.areas = []; return draw(); }
    const pick = t.closest('[data-minutes],[data-type],[data-step],[data-quest],[data-area]');
    if (pick) {
      if (pick.dataset.minutes) { st.minutes = Number(pick.dataset.minutes); st.quest = null; }
      if (pick.dataset.type) st.type = pick.dataset.type;
      if (pick.dataset.step) { st.minutes = Math.max(1, Math.min(240, st.minutes + Number(pick.dataset.step))); st.quest = null; }
      if (pick.dataset.quest) {
        const q = YOGA_HOTEL_QUESTS.find((x) => x.id === pick.dataset.quest);
        Object.assign(st, { quest: q.id, minutes: q.minutes, type: q.type });
      }
      if (pick.dataset.area) {
        const a = pick.dataset.area;
        st.areas = st.areas.includes(a) ? st.areas.filter((x) => x !== a) : [...st.areas, a];
      }
      return draw();
    }
    if (t.closest('[data-yoga-delete]')) {
      if (!st.confirmDelete) { st.confirmDelete = true; return draw(); }
      await deleteYoga(edit);
      sheet.onclick = null;
      closeSheet();
      toast('Deleted.');
      return show();
    }
    if (!t.closest('[data-yoga-save]')) return;
    sheet.onclick = null; // one tap, one session
    const pain = st.hurt ? { areas: st.areas } : null;

    if (edit) {
      const oldDate = edit.date;
      Object.assign(edit, { minutes: st.minutes, type: st.type, pain, date: st.date <= dateKey() ? st.date : oldDate, editedAt: Date.now() });
      await saveYoga(edit, oldDate);
      closeSheet();
      toast('Saved.');
      return show();
    }

    const row = { id: uid(), kind: 'yoga', date: dateKey(), at: Date.now(), minutes: st.minutes, type: st.type,
      travel, from: st.quest ? `hotel-${st.quest}` : opts.from || 'home', quest: st.quest, pain };
    const result = await saveYoga(row);
    if (opts.claimId) await markClaimed(opts.claimId); // a code from the TV only counts once
    Object.assign(row, result);
    await db.put('yogaSessions', row);

    const fresh = await db.get('profile', 'me');
    fresh.yoga = { ...yogaSettings(fresh), lastMinutes: st.minutes, lastType: st.type };
    // A few weeks in a row at your target: Mara asks (once per target) if you'd like one more.
    const sum = yogaSummary(await db.getAll('yogaSessions'), fresh.yoga);
    if (result.weekXp && sum.hitStreak >= 3 && fresh.yoga.weeklyTarget < 7 && fresh.yoga.askedAt !== fresh.yoga.weeklyTarget) {
      row.askMore = sum.hitStreak;
      fresh.yoga.askedAt = fresh.yoga.weeklyTarget;
      await db.put('yogaSessions', row);
    }
    await db.put('profile', fresh);
    closeSheet();
    location.hash = `#done/${row.id}`;
  };
  draw();
}

// ---------- Home, the Outpost and the Done screen ----------

/**
 * What Home shows for yoga: { button, winddown }.
 *   button    "Yoga · 2 of 3 this week ●●○", a missed-week note, and a link to The Bend
 *   winddown  the wind-down card, from your wind-down time if no yoga today
 */
async function yogaHomeHtml(profile, rows) {
  const cfg = yogaSettings(profile);
  const sum = yogaSummary(rows, cfg);
  const today = dateKey();
  const travel = isTraveling(profile);

  // A missed week is noted once: on the first day you open the app after it.
  let missedLine = '';
  if (sum.missed) {
    const noted = cfg.missedNoted;
    if (!noted || noted.week !== sum.lastWeek) {
      profile.yoga = { ...cfg, missedNoted: { week: sum.lastWeek, date: today } };
      await db.put('profile', profile);
    }
    if (!noted || noted.week !== sum.lastWeek || noted.date === today) {
      missedLine = fillLine(pickLine(YOGA_LINES.missed, sum.lastWeek), { total: sum.total, next: sum.total + 1 });
    }
  }

  const [h, m] = String(cfg.winddownTime || '21:00').split(':').map(Number);
  const now = new Date();
  const late = now.getHours() * 60 + now.getMinutes() >= h * 60 + (m || 0);
  const winddown = cfg.winddownOn && late && !sum.todayDone && cfg.winddownHidden !== today ? `
    <section class="panel stack yoga-card">
      <p class="speech">${esc(YOGA_LINES.winddown)}</p>
      <button class="btn" data-action="yoga-winddown">Log a wind-down stretch</button>
      <button class="btn-quiet" data-action="yoga-winddown-hide">Not tonight</button>
    </section>` : '';

  const travelLine = travel ? `<p class="center muted small">${esc(pickLine(YOGA_LINES.travel, today))}</p>` : '';
  const button = `
    <button class="btn" data-action="yoga">Yoga · ${Math.min(sum.week, 99)} of ${cfg.weeklyTarget} this week <span class="dots">${weekDots(sum.week, cfg.weeklyTarget)}</span></button>
    ${travelLine}
    ${missedLine ? `<p class="center muted small">${esc(missedLine)}</p>` : ''}
    <a class="btn-quiet" href="#yoga">The Bend · ${sum.total} session${sum.total === 1 ? '' : 's'} · poses and history</a>`;
  return { button, winddown };
}

/** Home's and the Outpost's yoga buttons. Returns true if it was one of them. */
async function yogaAction(action) {
  if (action === 'yoga') { await openYogaSheet({ from: 'home' }); return true; }
  if (action === 'yoga-winddown') { await openYogaSheet({ from: 'winddown', minutes: 10, type: 'restorative' }); return true; }
  if (action === 'yoga-cooldown') { await openYogaSheet({ from: 'cooldown', minutes: 10, type: 'stretch' }); return true; }
  if (action === 'yoga-winddown-hide') {
    const profile = await db.get('profile', 'me');
    profile.yoga = { ...yogaSettings(profile), winddownHidden: dateKey() };
    await db.put('profile', profile);
    show();
    return true;
  }
  return false;
}

/** The Done screen after a strength day: "cooldown stretch?" (if it's on and no yoga today). */
async function yogaCooldownHtml() {
  const cfg = yogaSettings(await db.get('profile', 'me'));
  if (!cfg.cooldownOn) return '';
  const today = dateKey();
  if ((await db.getAll('yogaSessions')).some((r) => r.full && r.date === today)) return '';
  return `<section class="panel stack yoga-card">
    <p class="speech">${esc(YOGA_LINES.cooldown)}</p>
    <button class="btn" data-action="yoga-cooldown">Log a cooldown stretch</button>
  </section>`;
}

/** Which pose Mara shows on the Done screen after this session. */
function yogaDonePose(win, sum) {
  if (win.reached && win.reached.length) {
    return YOGA_MILESTONES.find((m) => m.n === win.reached[win.reached.length - 1]).pose;
  }
  if (sum.unlocked.length) return pickLine(sum.unlocked, win.id).pose;
  return win.full ? 'power-pose' : 'idle';
}

/** The Done screen's yoga part: Mara's line, the week, milestones, pain, and "try one more?". */
async function yogaDoneHtml(win) {
  const cfg = yogaSettings(await db.get('profile', 'me'));
  const rows = await db.getAll('yogaSessions');
  const sum = yogaSummary(rows, cfg);
  const totalThen = rows.filter((r) => r.full && (r.at < win.at || r.id === win.id)).length;
  const vars = { total: totalThen, target: cfg.weeklyTarget, weeksHit: Math.max(1, sum.hitStreak), next: totalThen + 1 };
  const weekCount = rows.filter((r) => r.full && weekStart(r.date) === weekStart(win.date)).length;
  const line = win.full ? yogaLine(yogaChapter(totalThen).lines, win.type, win.id) : pickLine(YOGA_LINES.short, win.id);
  const parts = [];

  parts.push(`<p class="speech">${esc(fillLine(line, vars))}</p>`);
  parts.push(`<p class="center"><b>This week:</b> <span class="dots">${weekDots(weekCount, cfg.weeklyTarget)}</span> ${weekCount} of ${cfg.weeklyTarget}</p>`);

  if (win.weekXp) {
    parts.push(`<section class="panel loot loot-rare">
      <p class="muted small">Weekly target</p>
      <h3>Week done! +${win.weekXp} XP</h3>
      <p class="speech">${esc(fillLine(pickLine(YOGA_LINES.weekHit, win.id), vars))}</p>
    </section>`);
  }
  for (const n of win.reached || []) {
    const m = YOGA_MILESTONES.find((x) => x.n === n);
    parts.push(`<section class="panel loot loot-rare">
      <p class="muted small">${n} sessions · +${m.xp} XP</p>
      <h3>New pose: ${esc(m.name)}</h3>
      <p class="speech">${esc(m.line)}</p>
    </section>`);
  }
  if (win.pain) {
    const emergency = win.pain.areas.includes('chest');
    const where = win.pain.areas.filter((a) => a !== 'chest').map((a) => YOGA_PAIN_AREAS[a].toLowerCase());
    parts.push(`<section class="panel stack">
      <h3>Something hurt${where.length ? `: ${esc(where.join(', '))}` : ''}</h3>
      ${emergency ? `<p class="notice">${esc(YOGA_LINES.painEmergency)}</p><a class="btn-gold" href="tel:911">Call 911</a>` : ''}
      <p class="speech">${esc(YOGA_LINES.pain)}</p>
      ${win.kneeNote ? `<p class="center muted small">${esc(win.kneeNote)}</p>` : ''}
    </section>`);
  }
  if (win.askMore) {
    parts.push(`<section class="panel stack">
      <p class="speech">${esc(fillLine(YOGA_LINES.askMore, { ...vars, weeksHit: win.askMore, more: cfg.weeklyTarget + 1 }))}</p>
      <button class="btn" data-action="yoga-more">Try ${cfg.weeklyTarget + 1} a week</button>
      <button class="btn-quiet" data-action="yoga-keep">Keep ${cfg.weeklyTarget}</button>
    </section>`);
  }
  return { html: parts.join(''), pose: yogaDonePose(win, sum), extraXp: (win.weekXp || 0) + (win.reached || []).reduce((s, n) => s + YOGA_MILESTONES.find((m) => m.n === n).xp, 0) };
}

/** The Done screen's "try one more a week?" buttons. Returns true if it was one of them. */
async function yogaDoneAction(action, win) {
  if (action !== 'yoga-more' && action !== 'yoga-keep') return false;
  const profile = await db.get('profile', 'me');
  const cfg = yogaSettings(profile);
  if (action === 'yoga-more') cfg.weeklyTarget = Math.min(7, cfg.weeklyTarget + 1);
  profile.yoga = cfg;
  await db.put('profile', profile);
  delete win.askMore;
  await db.put('yogaSessions', win);
  toast(action === 'yoga-more' ? `${cfg.weeklyTarget} a week it is.` : `${cfg.weeklyTarget} a week. Steady.`);
  return true;
}

// ---------- The Bend screen (#yoga) ----------

async function renderYoga(main) {
  const profile = await db.get('profile', 'me');
  const cfg = yogaSettings(profile);
  const rows = (await db.getAll('yogaSessions')).sort((a, b) => b.date.localeCompare(a.date) || b.at - a.at);
  const sum = yogaSummary(rows, cfg);
  const prevN = sum.unlocked.length ? sum.unlocked[sum.unlocked.length - 1].n : 0;
  const pct = sum.next ? Math.round(((sum.total - prevN) / (sum.next.n - prevN)) * 100) : 100;
  const tick = (name, on, label) => `<label class="check"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}> ${label}</label>`;
  const shortDate = (key) => parseDateKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  const weekBoxes = sum.weeks.map((w) => {
    const cls = w.count >= cfg.weeklyTarget ? 'hit' : w.count ? 'some' : '';
    const label = `Week of ${shortDate(w.start)}: ${w.count} session${w.count === 1 ? '' : 's'}`;
    return `<span class="wk ${cls}${w.start === sum.thisWeek ? ' now' : ''}" title="${esc(label)}" aria-label="${esc(label)}">${w.count || ''}</span>`;
  }).join('');

  const poses = YOGA_MILESTONES.map((m) => `
    <figure class="pose${sum.total >= m.n ? '' : ' locked'}">
      <canvas width="32" height="32" data-pose="${m.pose}" role="img" aria-label="${esc(m.name)}${sum.total >= m.n ? '' : `, unlocks at ${m.n}`}"></canvas>
      <figcaption>${sum.total >= m.n ? esc(m.name) : `at ${m.n}`}</figcaption>
    </figure>`).join('');

  const history = rows.slice(0, 40).map((r) => `
    <li><button class="row-btn" data-edit="${esc(r.id)}">
      <span>${esc(shortDate(r.date))}</span>
      <span>${r.minutes} min · ${esc(YOGA_TYPES[r.type] || r.type)}${r.travel ? ' · 🧳' : ''}${r.full ? '' : ' · short'}${r.pain ? ' · hurt' : ''}</span>
    </button></li>`).join('');

  const types = Object.entries(YOGA_TYPES).map(([k, label]) => `${label} ${sum.byType[k] || 0}`).join(' · ');

  main.innerHTML = `
    <section class="stack">
      <h2>The Bend</h2>
      <p class="center muted">${esc(sum.chapter.name)}</p>
      <canvas class="mara" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
      <p class="speech">${esc(sum.total ? fillLine(yogaLine(sum.chapter.lines, null, dateKey()), { total: sum.total }) : YOGA_LINES.screen)}</p>

      <section class="panel stack">
        <div class="oath-hero"><b>${sum.total}</b><span>session${sum.total === 1 ? '' : 's'} · ${sum.minutes} minutes</span></div>
        ${sum.next ? `<div class="meter" role="img" aria-label="${sum.total} of ${sum.next.n}"><span style="width:${pct}%"></span></div>
          <p class="center muted small">${sum.next.n - sum.total} more to ${esc(sum.next.name)}</p>` : '<p class="center muted small">Every pose unlocked.</p>'}
        <p class="center muted small">${esc(types)}</p>
      </section>

      <button class="btn-gold big" data-action="yoga">Log yoga</button>

      <section class="panel stack">
        <h3>This week</h3>
        <p class="center"><span class="dots big">${weekDots(sum.week, cfg.weeklyTarget)}</span></p>
        <p class="center">${sum.week} of ${cfg.weeklyTarget}${sum.week >= cfg.weeklyTarget ? ' · done!' : ''}</p>
        <p class="center muted small">Monday to Sunday. A missed day never resets anything. ${badgeHtml('yoga-weekly')}</p>
        <div class="weeks" role="img" aria-label="The last 8 weeks">${weekBoxes}</div>
        <div class="legend"><span><i class="key hit"></i>target hit</span><span><i class="key some"></i>some</span><span><i class="key"></i>none</span></div>
      </section>

      <section class="panel stack">
        <h3>Mara's poses</h3>
        <div class="poses">${poses}</div>
      </section>

      <section class="panel stack">
        <h3>History</h3>
        ${history ? `<ul class="history">${history}</ul><p class="muted small">Tap one to change or delete it.</p>` : '<p class="muted">Nothing logged yet.</p>'}
      </section>

      <form class="panel stack" id="yoga-form">
        <h3>Yoga settings</h3>
        <label class="field">Sessions a week
          <input type="number" name="weeklyTarget" value="${cfg.weeklyTarget}" min="1" max="7" step="1" inputmode="numeric"></label>
        ${tick('cooldownOn', cfg.cooldownOn, 'Suggest a cooldown stretch after strength days')}
        ${tick('winddownOn', cfg.winddownOn, 'Suggest a wind-down stretch in the evening')}
        <label class="field">Wind-down time
          <input type="time" name="winddownTime" value="${esc(cfg.winddownTime)}"></label>
        <button class="btn" type="submit">Save</button>
      </form>
      <p class="center">${badgeHtml('yoga-benefits')} <span class="muted small">Mara counts. Down Dog teaches. Pain means back off.</span></p>
      <button class="btn-quiet" data-action="home">Back to the hall</button>
    </section>`;

  playSprite(main.querySelector('canvas.mara'), SPRITES[sum.unlocked.length ? sum.unlocked[sum.unlocked.length - 1].pose : 'idle']);
  for (const canvas of main.querySelectorAll('canvas[data-pose]')) {
    const anim = SPRITES[canvas.dataset.pose];
    const unlocked = !canvas.closest('.locked');
    // Locked poses are a still silhouette.
    playSprite(canvas, unlocked ? anim : { fps: 0, frames: [anim.frames[0].map(([, ...r]) => ['k', ...r])] });
  }

  main.onclick = async (e) => {
    if (e.target.closest('[data-evidence]')) return;
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) return openYogaSheet({ edit: rows.find((r) => r.id === editBtn.dataset.edit) });
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'home') location.hash = '#home';
    else await yogaAction(action.dataset.action);
  };

  main.querySelector('#yoga-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target.elements;
    const fresh = await db.get('profile', 'me');
    const target = Math.round(Number(f.weeklyTarget.value));
    fresh.yoga = {
      ...yogaSettings(fresh),
      weeklyTarget: target >= 1 && target <= 7 ? target : cfg.weeklyTarget,
      cooldownOn: f.cooldownOn.checked,
      winddownOn: f.winddownOn.checked,
      winddownTime: f.winddownTime.value || YOGA_DEFAULTS.winddownTime,
    };
    await db.put('profile', fresh);
    toast('Saved.');
    show();
  });

  return () => { document.getElementById('sheet').onclick = null; document.getElementById('sheet').onchange = null; };
}
