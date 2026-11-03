// outpost.js — The Outpost: travel mode. While you're away, it replaces Home.
//
//   - 🧳 at the top turns it on or off in one tap. Each trip is saved on
//     your profile as { start, end } (end is null while you're still away).
//   - Travel days count as rest: the campfire never dims on them (campfire.js).
//   - A travel week asks for any 2 strength days, on whatever days work,
//     plus any movement at all. No fixed Tuesday and Thursday.
//   - Pick where you are: hotel room with bands, room without (Suitcase
//     Quest), or the hotel gym. Then tap your energy and the quest starts.
//   - Hotel weights are remembered apart from home (progress.js), in pounds at the gym.

/** Are you away right now? True while your latest trip has no end. */
function isTraveling(profile) {
  const trips = (profile && profile.trips) || [];
  const last = trips[trips.length - 1];
  return Boolean(last && !last.end);
}

/** Light up the 🧳 at the top while you're away. */
function updateSuitcase(profile) {
  const button = document.getElementById('suitcase');
  const away = isTraveling(profile);
  button.classList.toggle('on', away);
  button.setAttribute('aria-pressed', String(away));
}

/** The 🧳 button: start a trip, or come home. Today counts as a travel day either way. */
async function toggleTravel() {
  const profile = await db.get('profile', 'me');
  profile.trips = profile.trips || [];
  const today = dateKey();
  const last = profile.trips[profile.trips.length - 1];
  if (isTraveling(profile)) {
    last.end = today;
    toast(OUTPOST_LINES.home);
  } else {
    // Came home and left again the same day? Keep it one trip.
    if (last && last.end === today) last.end = null;
    else profile.trips.push({ start: today, end: null });
    toast('Off to the Outpost. Mara is coming too.');
  }
  await db.put('profile', profile);
  updateSuitcase(profile);
  if (['', '#', '#home'].includes(location.hash)) show(); // redraw Home as the hall or the Outpost
  else location.hash = '#home';
}

/** This week (Monday to today): how many days had strength, and how many had movement. */
function travelWeek(sessions, adventures) {
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const start = dateKey(monday);
  const days = (rows) => new Set(rows.filter((r) => r.date >= start).map((r) => r.date)).size;
  const won = sessions.filter((s) => s.done && s.done.length);
  return {
    strength: days(won.filter((s) => s.kind === 'strength' || s.kind === 'tiny')),
    movement: days([...won.filter((s) => s.kind === 'walk'), ...adventures]),
  };
}

async function renderOutpost(main, profile) {
  const [sessions, adventures, inventory, treasures] = await Promise.all([
    db.getAll('sessions'), db.getAll('adventures'), db.getAll('inventory'), db.getAll('treasures'),
  ]);
  const fire = campfire(sessions, adventures, inventory, { ptDays: ptDays(treasures), trips: profile.trips });
  const info = levelInfo(await totalXp());
  const week = travelWeek(sessions, adventures);
  const trip = profile.trips[profile.trips.length - 1];
  const open = sessions.find((s) => !s.finishedAt && s.date === dateKey());
  const bedrolls = inventory.filter((row) => row.kind === 'bedroll' && !row.usedOn).length;
  let where = OUTPOST_PLACES[profile.outpostPlace] ? profile.outpostPlace : 'room';

  // A Bedroll just kept the fire from dimming (before the trip): save that it's used.
  for (const row of fire.usedNow) await db.put('inventory', row);

  function line() {
    if (week.strength >= TUNING.travelStrengthDays) return OUTPOST_LINES.bonus;
    if (trip.start === dateKey()) return OUTPOST_LINES.arrive;
    return OUTPOST_LINES.strength;
  }

  function draw() {
    const energyButtons = [1, 2, 3, 4, 5].map((n) => `
      <button data-energy="${n}" aria-label="Energy ${n}: ${esc(TUNING.energyLabels[n])}">
        <b>${n}</b><small>${esc(TUNING.energyLabels[n])}</small>
      </button>`).join('');
    const chips = Object.entries(OUTPOST_PLACES).map(([key, p]) =>
      `<button class="chip${key === where ? ' on' : ''}" data-where="${key}" aria-pressed="${key === where}">${esc(p.label)}</button>`).join('');
    const strengthLeft = Math.max(0, TUNING.travelStrengthDays - week.strength);

    main.innerHTML = `
      <section class="stack">
        <h2>The Outpost</h2>
        <div class="hearth">
          <canvas class="fire" width="16" height="16" role="img" aria-label="Campfire: ${esc(fire.name)}"></canvas>
          <div>
            <p class="fire-name">${esc(fire.name)}</p>
            <p class="muted small">${fire.litToday ? 'Lit today. Nicely done.' : 'Travel days count as rest. The fire waits for you.'}</p>
            ${bedrolls ? `<p class="muted small">Bedrolls: ${bedrolls}</p>` : ''}
          </div>
        </div>

        <canvas class="mara small" width="32" height="32" role="img" aria-label="Mara the Unbent, your Outpost trainer"></canvas>
        <p class="speech">${esc(line())}</p>

        <section class="panel stack">
          <p class="center"><b>This week:</b> strength ${Math.min(week.strength, TUNING.travelStrengthDays)} of ${TUNING.travelStrengthDays} · movement days ${week.movement}</p>
          <p class="center muted small">${strengthLeft ? `${strengthLeft} strength day${strengthLeft === 1 ? '' : 's'} to go, any days you like.` : 'Strength is done. Any movement is a bonus.'} ${badgeHtml('strength-breaks')}</p>
        </section>

        ${open ? '<button class="btn-gold big" data-action="continue">Continue quest</button>' : ''}

        <p class="energy-label">Where are you training?</p>
        <div class="chips center-chips">${chips}</div>
        <p class="center muted small">${esc(OUTPOST_PLACES[where].about)}</p>

        <p class="energy-label">Energy? Tap to start. ${badgeHtml('design-energy')}</p>
        <div class="energy-row">${energyButtons}</div>

        <button class="btn" data-action="tiny">Tiny Quest · 3 minutes</button>
        <button class="btn" data-action="move">Movement · walk, treadmill, exploring</button>
        ${ptButtonHtml(treasures)}

        <p class="level-line">Level ${info.level} · ${info.into} / ${info.needed} XP</p>
        <p class="center muted small">Home again? Tap 🧳 at the top.</p>
      </section>
    `;

    playSprite(main.querySelector('canvas.fire'), CAMPFIRE[fire.level - 1]);
    playSprite(main.querySelector('canvas.mara'), SPRITES.idle);
  }

  main.onclick = async (e) => {
    if (e.target.closest('[data-evidence]')) return; // badges open their own pop-up
    const place = OUTPOST_PLACES[where];

    const chip = e.target.closest('[data-where]');
    if (chip) {
      where = chip.dataset.where;
      profile.outpostPlace = where; // remembered for next time
      await db.put('profile', profile);
      return draw();
    }

    const energyButton = e.target.closest('[data-energy]');
    if (energyButton) {
      const energy = Number(energyButton.dataset.energy);
      await startQuest(energy === 1 ? 'tiny' : place.template, energy, place.place);
      return;
    }

    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'continue') location.hash = open.kind === 'walk' ? '#walk' : '#workout';
    if (action.dataset.action === 'tiny') await startQuest('tiny', 1, place.place);
    if (action.dataset.action === 'move') openAdventureSheet('A walk around town, the hotel treadmill, a long airport trek.');
    if (action.dataset.action === 'pt') await earnGem();
  };

  draw();
  return () => { document.getElementById('sheet').onclick = null; };
}
