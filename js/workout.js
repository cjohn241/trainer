// workout.js — the quest you're doing now, one exercise per screen.
//
// It moves between four views:
//   set     Mara demos the move; you set weight and reps, then tap Set done
//   rest    a draining bar between sets (tap "I'm ready" to skip)
//   effort  Easy / Good / Hard after an exercise's last set
//   finish  quest complete
// Every set is saved the moment you tap Set done, so closing the app never
// loses anything. Opening #workout again picks up exactly where you were.

async function renderWorkout(main) {
  const open = (await db.getAll('sessions')).filter((s) => !s.finishedAt && s.kind !== 'walk').sort((a, b) => b.startedAt - a.startedAt);
  const session = open[0];
  if (!session) { location.hash = '#home'; return null; }

  const profile = await db.get('profile', 'me');
  const letScreenSleep = await keepAwake();
  const templateName = TEMPLATES[session.templateId] ? TEMPLATES[session.templateId].name : 'Quest';

  let resting = false;      // true while the rest bar is showing
  let restFor = 0;          // seconds of rest
  let timer = null;         // checks the rest or work bar 4 times a second
  let showSecondCue = false;
  let notice = '';          // a one-time message, like "Next time: 7 kg"
  let pick = null;          // the weight and reps on screen for the current set

  const exerciseAt = (i) => session.swaps[i] || session.steps[i].exercise;
  const setsAt = (i) => session.done.filter((d) => d.step === i);

  /** Where are we? The first step with sets left, or one still waiting for its effort tap. */
  function position() {
    for (let i = 0; i < session.steps.length; i++) {
      const step = session.steps[i];
      if (setsAt(i).length < step.sets) return { i, view: 'set' };
      if (!step.seconds && !session.efforts[i]) return { i, view: 'effort' };
    }
    return { i: -1, view: 'finish' };
  }

  function stopTimer() { clearInterval(timer); timer = null; }
  async function save() { await db.put('sessions', session); }

  async function draw() {
    stopTimer();
    const pos = position();
    if (session.partial || pos.view === 'finish') return drawFinish();
    if (resting) return drawRest(pos);
    if (pos.view === 'effort') return drawEffort(pos.i);
    return drawSet(pos.i);
  }

  // ---------- Set ----------

  // A big − and + around a value.
  function stepper(what, big, small) {
    return `
      <div class="stepper">
        <button data-action="${what}-down" aria-label="Less">−</button>
        <div class="value">${esc(big)}<small>${esc(small)}</small></div>
        <button data-action="${what}-up" aria-label="More">+</button>
      </div>`;
  }

  // Home, hotel room or hotel gym: each has its own weights and push-up ladder (progress.js).
  const place = session.place || 'home';
  const ladder = ladderFor(place);

  function loadRow(ex) {
    const kind = loadKind(ex, place);
    if (WEIGHT_LOADS.includes(kind)) {
      const d = describeLoad(kind, pick.load);
      return stepper('load', d.big, d.plates);
    }
    if (kind === 'ladder') return stepper('load', ladder[pick.load], 'Hands on this · − easier, + harder');
    if (ex.load === 'band') return '<p class="center muted">Grab your band</p>';
    return '';
  }

  async function drawSet(i) {
    const step = session.steps[i];
    const exId = exerciseAt(i);
    const ex = EXERCISES[exId];
    const done = setsAt(i);

    // Fill in the numbers: what you did last set, or what progress.js saved for next time.
    if (!pick || pick.step !== i || pick.exercise !== exId) {
      const state = await getExerciseState(exId, place);
      const last = done.filter((d) => d.exercise === exId).pop();
      pick = { step: i, exercise: exId, load: last ? last.load : state.load, reps: last && last.reps ? last.reps : state.reps };
      showSecondCue = false;
    }

    const flagged = ex.ptAlways || (ex.knee && profile.ptRegions.includes('knee'));
    const ptNote = ex.ptAlways ? ex.ptNote : 'Loads the knee';
    const secondCue = ex.cues[1]
      ? (showSecondCue ? `<p class="cue">${esc(ex.cues[1])}</p>` : '<button class="btn-quiet" data-action="cue">One more tip</button>')
      : '';
    const note = notice;
    notice = '';

    // Timed moves (Tiny Quest): a draining work bar instead of reps.
    let work = '';
    if (step.seconds) {
      if (!pick.workEnd) pick.workEnd = Date.now() + step.seconds * 1000;
      const gone = step.seconds - Math.max(0, (pick.workEnd - Date.now()) / 1000);
      work = `
        <div class="drain"><span style="animation-duration:${step.seconds}s; animation-delay:-${gone.toFixed(2)}s"></span></div>
        <p class="center muted">Steady for one minute. Tap Done anytime.</p>`;
    }

    main.innerHTML = `
      <section class="stack">
        ${note ? `<p class="notice">${esc(note)}</p>` : ''}
        <p class="step-count">${esc(templateName)} · move ${i + 1} of ${session.steps.length}</p>
        <h2>${esc(ex.name)}</h2>
        ${flagged ? `<p class="pt-tag">Mention to your PT · ${esc(ptNote)}</p>` : ''}
        <canvas class="mara" width="32" height="32" role="img" aria-label="Mara demonstrating ${esc(ex.name)}"></canvas>
        <p class="cue">${esc(ex.cues[0])}</p>
        ${secondCue}
        <div class="badges">${ex.evidence.map(badgeHtml).join('')}</div>

        <p class="set-count">Set ${done.length + 1} of ${step.sets}${ex.perSide ? ` · ${esc(ex.perSide)}` : ''}</p>
        ${step.seconds ? work : loadRow(ex) + stepper('reps', String(pick.reps), `reps · aim for ${ex.reps[0]}–${ex.reps[1]}`)}

        <button class="btn-gold big" data-action="set-done">${step.seconds ? 'Done' : 'Set done'}</button>
        <button class="btn-quiet" data-action="easier">Easier version</button>
        ${place !== 'home' && ex.notHere ? '<button class="btn-quiet" data-action="not-here">Not here (no gear for this one)</button>' : ''}
        <button class="btn-quiet" data-action="end">End the quest here. It still counts.</button>
      </section>
    `;
    playSprite(main.querySelector('canvas.mara'), exerciseSprite(exId));

    if (step.seconds) {
      timer = setInterval(() => {
        if (Date.now() >= pick.workEnd) { buzz([80, 60, 80]); setDone(); }
      }, 250);
    }
  }

  /** Log the set on screen: save it, give XP, then rest or move on. */
  async function setDone() {
    stopTimer();
    const pos = position();
    if (pos.view !== 'set') return;
    const i = pos.i;
    const step = session.steps[i];
    session.done.push({
      step: i, exercise: exerciseAt(i),
      reps: step.seconds ? null : pick.reps,
      load: pick.load, seconds: step.seconds || null, at: Date.now(),
    });
    session.xp += TUNING.xpPerSet;
    await save();
    await addXp(TUNING.xpPerSet, 'set', session.id);
    xpPop(`+${TUNING.xpPerSet} XP`);
    buzz(60);
    pick.workEnd = null;

    const moreSets = setsAt(i).length < step.sets;
    const moreMoves = session.kind === 'tiny' && i < session.steps.length - 1;
    if (moreSets || moreMoves) { resting = true; restFor = step.restSec; }
    draw();
  }

  // ---------- Rest ----------

  function drawRest(pos) {
    const endAt = Date.now() + restFor * 1000;
    let next = '';
    if (pos.view === 'set') {
      const ex = EXERCISES[exerciseAt(pos.i)];
      next = `Next: ${ex.name}, set ${setsAt(pos.i).length + 1} of ${session.steps[pos.i].sets}`;
    }
    main.innerHTML = `
      <section class="stack">
        <p class="step-count">Rest</p>
        <h2>Breathe. Shake it out.</h2>
        <canvas class="mara small" width="32" height="32" role="img" aria-label="Mara resting"></canvas>
        <div class="drain rest"><span style="animation-duration:${restFor}s"></span></div>
        <p class="center">${esc(next)}</p>
        <button class="btn-gold big" data-action="skip-rest">I'm ready</button>
      </section>
    `;
    playSprite(main.querySelector('canvas.mara'), SPRITES.idle);
    timer = setInterval(() => {
      if (Date.now() >= endAt) { buzz([80, 60, 80]); resting = false; draw(); }
    }, 250);
  }

  // ---------- Effort ----------

  function drawEffort(i) {
    const ex = EXERCISES[exerciseAt(i)];
    main.innerHTML = `
      <section class="stack">
        <p class="step-count">${esc(templateName)} · move ${i + 1} of ${session.steps.length}</p>
        <h2>How did that feel?</h2>
        <p class="center muted">${esc(ex.name)} ${badgeHtml('rpe')}</p>
        <div class="effort">
          <button data-effort="easy"><b>Easy</b><small>Could do 4 or more extra reps</small></button>
          <button data-effort="good"><b>Good</b><small>2 or 3 reps left in the tank</small></button>
          <button data-effort="hard"><b>Hard</b><small>1 or 0 left</small></button>
        </div>
      </section>
    `;
  }

  // ---------- Finish ----------

  // Close the quest, then the Done screen (done.js) takes over: loot, knee check, Open Hub.
  async function drawFinish() {
    if (!session.finishedAt) {
      session.finishedAt = Date.now();
      if (session.kind === 'tiny' && !session.partial) {
        const bonus = Math.max(0, TUNING.xpTinyQuest - session.xp); // tops the quest up to 50 XP
        await addXp(bonus, 'tiny', session.id);
        session.xp += bonus;
      }
      await save();
    }
    location.hash = `#done/${session.id}`;
  }

  // ---------- Taps ----------

  main.onclick = async (e) => {
    if (e.target.closest('[data-evidence]')) return; // badges open their own pop-up

    const effortButton = e.target.closest('[data-effort]');
    if (effortButton) {
      const i = position().i;
      const exId = exerciseAt(i);
      session.efforts[i] = effortButton.dataset.effort;
      await save();
      const message = await finishExercise(exId, setsAt(i).filter((d) => d.exercise === exId), session.efforts[i], place);
      if (message) { notice = message; buzz([60, 40, 60, 40, 120]); }
      draw();
      return;
    }

    const button = e.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const pos = position();
    const ex = pos.i >= 0 ? EXERCISES[exerciseAt(pos.i)] : null;

    if (action === 'set-done') return setDone();
    if (action === 'skip-rest') { resting = false; return draw(); }
    if (action === 'home') { location.hash = '#home'; return; }
    if (action === 'cue') { showSecondCue = true; return draw(); }

    if (action === 'reps-down') pick.reps = Math.max(1, pick.reps - 1);
    if (action === 'reps-up') pick.reps += 1;
    if (action === 'load-down' || action === 'load-up') {
      const dir = action === 'load-up' ? 1 : -1;
      if (ex.load === 'ladder') pick.load = Math.min(ladder.length - 1, Math.max(0, pick.load + dir));
      else pick.load = stepLoad(loadKind(ex, place), pick.load, dir);
    }

    if (action === 'easier') {
      if (ex.load === 'ladder' && pick.load > 0) {
        pick.load -= 1;
        toast('Hands higher. Still a full set.');
      } else if (ex.easier) {
        session.swaps[pos.i] = ex.easier;
        await save();
        toast(`Switched to ${EXERCISES[ex.easier].name}. Same win.`);
      } else {
        toast('This is already the gentlest version, and it counts.');
      }
    }

    // Away from home: the hotel doesn't have what this move needs, so swap in one that works anywhere.
    if (action === 'not-here' && ex.notHere) {
      session.swaps[pos.i] = ex.notHere;
      await save();
      toast(`Swapped to ${EXERCISES[ex.notHere].name}. Same win.`);
    }

    if (action === 'end') {
      session.partial = true;
      await save();
    }
    draw();
  };

  draw();
  return () => { stopTimer(); letScreenSleep(); };
}
