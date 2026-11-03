// walk.js — the walk pad screen (Walk Pad Trials).
//
// One part on screen at a time: its pace, a tip, and a draining bar.
// When the part changes, the phone buzzes so you don't have to watch.
// The screen stays awake while you walk. The time comes from the clock,
// not a counter, so closing the app and coming back picks up where you are.
// "End early" still counts: same XP, same campfire.

/**
 * How far you are in the Trials, worked out from your walks:
 * a week unlocks the next one after WALKS_TO_UNLOCK full walks.
 * Returns { unlocked } (the week you're on now, 1–6).
 */
function walkProgress(sessions) {
  const full = (week) => sessions.filter((s) => s.kind === 'walk' && s.walkWeek === week && s.finishedAt && !s.partial).length;
  let unlocked = 1;
  while (unlocked < WALK_WEEKS.length && full(unlocked) >= WALKS_TO_UNLOCK) unlocked++;
  return { unlocked };
}

/** The walk for an energy tap. 1: five easy minutes. 2: the week before. 3–5: your week. */
function walkForEnergy(sessions, energy) {
  const { unlocked } = walkProgress(sessions);
  if (energy === 1) return WALK_TINY;
  if (energy === 2) return WALK_WEEKS[Math.max(1, unlocked - 1) - 1];
  return WALK_WEEKS[unlocked - 1];
}

/** Start a walk and save it, then open the walk screen. week: a WALK_WEEKS entry or WALK_TINY. */
async function startWalk(energy, walk) {
  await closeOpenQuests();
  const profile = await db.get('profile', 'me');
  const session = {
    id: uid(),
    date: dateKey(),
    startedAt: Date.now(),
    finishedAt: null,
    templateId: null,
    kind: 'walk',
    energy,
    place: 'home',
    week: weekNumber(profile.startDate),
    walkWeek: walk.week,      // 0 = the five-minute walk
    walkName: walk.name,
    parts: walk.parts.map((p) => ({ ...p })),
    done: [],                 // filled in when you finish: { walk: true, seconds, at }
    xp: 0,
  };
  await db.put('sessions', session);
  await db.put('checkins', { date: session.date, energy, at: Date.now() });
  if (location.hash === '#walk') show(); // already here (you picked a new week): redraw
  else location.hash = '#walk';
}

async function renderWalk(main) {
  const open = (await db.getAll('sessions')).filter((s) => !s.finishedAt && s.kind === 'walk');
  const session = open.sort((a, b) => b.startedAt - a.startedAt)[0];
  if (!session) { location.hash = '#home'; return null; }

  const letScreenSleep = await keepAwake();
  const totalSec = session.parts.reduce((sum, p) => sum + p.min * 60, 0);
  let shown = -1;     // which part is on screen
  let timer = null;

  const elapsed = () => (Date.now() - session.startedAt) / 1000;

  /** Which part the clock is in: { i, start, end } in seconds from the start. */
  function partAt(sec) {
    let start = 0;
    for (let i = 0; i < session.parts.length; i++) {
      const end = start + session.parts[i].min * 60;
      if (sec < end) return { i, start, end };
      start = end;
    }
    return null; // finished
  }

  function title() {
    return session.walkWeek ? `Walk Pad Trials · Week ${session.walkWeek} · ${session.walkName}` : session.walkName;
  }

  function draw(part) {
    const p = session.parts[part.i];
    const pace = PACES[p.kind];
    const next = session.parts[part.i + 1];
    const partLen = part.end - part.start;
    const gone = elapsed() - part.start;
    const allGone = elapsed();

    main.innerHTML = `
      <section class="stack">
        <p class="step-count">${esc(title())} · part ${part.i + 1} of ${session.parts.length}</p>
        <h2>${esc(pace.name)}</h2>
        <canvas class="mara" width="32" height="32" role="img" aria-label="Mara walking with you"></canvas>
        <p class="cue">${esc(pace.cue)}</p>
        <div class="drain"><span style="animation-duration:${partLen}s; animation-delay:-${gone.toFixed(2)}s"></span></div>
        <p class="center muted">${next ? `Next: ${esc(PACES[next.kind].name)}. I'll buzz.` : 'Last part. Nearly there.'}</p>
        <div class="drain thin" aria-label="Whole walk"><span style="animation-duration:${totalSec}s; animation-delay:-${allGone.toFixed(2)}s"></span></div>
        <button class="btn" data-action="end">End early. It still counts.</button>
        ${session.walkWeek && part.i === 0 ? '<button class="btn-quiet" data-action="pick">Pick a different week</button>' : ''}
      </section>
    `;
    playSprite(main.querySelector('canvas.mara'), SPRITES.idle);
  }

  /** Save the walk as a win, give the XP, then show the Done screen. */
  async function finish(early) {
    clearInterval(timer);
    session.finishedAt = Date.now();
    session.partial = early;
    session.done.push({ walk: true, seconds: Math.round(Math.min(elapsed(), totalSec)), at: Date.now() });
    session.xp = TUNING.xpWalk;
    await db.put('sessions', session);
    await addXp(TUNING.xpWalk, 'walk', session.id);
    buzz([120, 80, 120, 80, 240]);
    location.hash = `#done/${session.id}`;
  }

  // Four times a second: has the part changed, or is the walk over?
  function tick() {
    const part = partAt(elapsed());
    if (!part) return finish(false);
    if (part.i !== shown) {
      if (shown !== -1) buzz([200, 100, 200]);
      shown = part.i;
      draw(part);
    }
  }

  // Coming back to the app: the bars restart from the right place.
  const onVisible = () => { if (document.visibilityState === 'visible') { shown = -1; tick(); } };
  document.addEventListener('visibilitychange', onVisible);

  main.onclick = async (e) => {
    const button = e.target.closest('[data-action], [data-week]');
    if (!button) return;
    if (button.dataset.week) {
      // Restart with the week you picked (startWalk closes this one). Repeating a week is always fine.
      closeSheet();
      clearInterval(timer);
      return startWalk(session.energy, WALK_WEEKS[Number(button.dataset.week) - 1]);
    }
    if (button.dataset.action === 'end') return finish(true);
    if (button.dataset.action === 'pick') {
      const { unlocked } = walkProgress(await db.getAll('sessions'));
      const weeks = WALK_WEEKS.slice(0, unlocked).map((w) =>
        `<button class="btn" data-week="${w.week}">Week ${w.week} · ${esc(w.name)}</button>`).join('');
      openSheet(`<h3>Pick a week</h3><p class="muted">Any week you've reached. Repeating one is always fine.</p>${weeks}`);
    }
  };

  // The week picker lives in the pop-up sheet, outside main, so listen there too.
  const sheet = document.getElementById('sheet');
  sheet.onclick = (e) => { if (e.target.closest('[data-week]')) main.onclick(e); };

  tick();
  timer = setInterval(tick, 250);
  return () => {
    clearInterval(timer);
    letScreenSleep();
    document.removeEventListener('visibilitychange', onVisible);
    sheet.onclick = null;
  };
}
