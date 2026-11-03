// home.js — the training hall. One job: get you started in one tap.
//
//   - the campfire (your forgiving streak) and how many Bedrolls you carry
//   - Mara, with a line for the day
//   - today's quest
//   - Continue, if a quest or walk is still open today
//   - the five energy buttons: tapping one STARTS the quest (or the walk)
//   - the Tiny Quest, always there
//   - Adventure: log a hike, skate or field day (15 / 30 / 60+ minutes)
//   - "Did my PT exercises": one gem a day for the yoga mat chest (treasure.js)
// While you're traveling (🧳 at the top), Home is The Outpost instead (outpost.js).

/** Save an Adventure as a win, give its XP, and show the Done screen. */
async function logAdventure(minutes) {
  const xp = TUNING.xpAdventure[minutes];
  const row = { id: uid(), kind: 'adventure', date: dateKey(), at: Date.now(), minutes, xp };
  await db.put('adventures', row);
  await addXp(xp, 'adventure', row.id);
  closeSheet();
  location.hash = `#done/${row.id}`;
}

/**
 * The "How long were you out?" pop-up. what = the line under the question.
 * Its buttons live in the pop-up sheet, outside main, so it listens there.
 * The screen that opens it clears sheet.onclick when you leave.
 */
function openAdventureSheet(what) {
  openSheet(`
    <h3>How long were you out?</h3>
    <p class="muted">${esc(what)} It all counts. ${badgeHtml('every-move-counts')}</p>
    <button class="btn" data-minutes="15">About 15 minutes</button>
    <button class="btn" data-minutes="30">About 30 minutes</button>
    <button class="btn" data-minutes="60">An hour or more</button>`);
  document.getElementById('sheet').onclick = (e) => {
    const pick = e.target.closest('[data-minutes]');
    if (pick) logAdventure(Number(pick.dataset.minutes));
  };
}

async function renderHome(main) {
  const profile = await db.get('profile', 'me');
  if (isTraveling(profile)) return renderOutpost(main, profile);

  const [sessions, adventures, inventory, treasures] = await Promise.all([
    db.getAll('sessions'), db.getAll('adventures'), db.getAll('inventory'), db.getAll('treasures'),
  ]);
  const quest = todaysQuest(sessions);
  const fire = campfire(sessions, adventures, inventory, { ptDays: ptDays(treasures), trips: profile.trips });
  const info = levelInfo(await totalXp());
  const today = dateKey();
  const open = sessions.find((s) => !s.finishedAt && s.date === today);
  const firstVisit = sessions.length === 0 && adventures.length === 0;
  const isWalkDay = quest.dayType === 'walk' || quest.dayType === 'walk-bonus';
  const bedrolls = inventory.filter((row) => row.kind === 'bedroll' && !row.usedOn).length;

  // A Bedroll just kept the fire from dimming: save that it's used, and say so.
  for (const row of fire.usedNow) await db.put('inventory', row);
  if (fire.usedNow.length) {
    const day = DAY_NAMES[parseDateKey(fire.usedNow[fire.usedNow.length - 1].usedOn).getDay()];
    toast(`A Bedroll kept the fire warm on ${day}.`);
  }

  function draw() {
    const energyButtons = [1, 2, 3, 4, 5].map((n) => `
      <button data-energy="${n}" aria-label="Energy ${n}: ${esc(TUNING.energyLabels[n])}">
        <b>${n}</b><small>${esc(TUNING.energyLabels[n])}</small>
      </button>`).join('');

    const walk = isWalkDay ? walkForEnergy(sessions, 3) : null;

    main.innerHTML = `
      <section class="stack">
        <div class="hearth">
          <canvas class="fire" width="16" height="16" role="img" aria-label="Campfire: ${esc(fire.name)}"></canvas>
          <div>
            <p class="fire-name">${esc(fire.name)}</p>
            <p class="muted small">${fire.litToday ? 'Lit today. Nicely done.' : 'Any win lights it.'}</p>
            ${bedrolls ? `<p class="muted small">Bedrolls: ${bedrolls}</p>` : ''}
          </div>
        </div>

        <canvas class="mara" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
        <p class="speech">${esc(firstVisit ? MARA_LINES.first : MARA_LINES[quest.dayType])}</p>

        <p class="today">${esc(quest.label)}</p>
        ${walk ? `<p class="center muted small">Walk Pad Trials · Week ${walk.week} · ${esc(walk.name)}</p>` : ''}

        ${open ? '<button class="btn-gold big" data-action="continue">Continue quest</button>' : ''}

        <p class="energy-label">Energy? Tap to start. ${badgeHtml('design-energy')}</p>
        <div class="energy-row">${energyButtons}</div>

        <button class="btn" data-action="tiny">Tiny Quest · 3 minutes</button>
        <p class="center">${badgeHtml('design-tiny')} <span class="muted small">A Tiny Quest is a full win.</span></p>
        ${isWalkDay ? `<button class="btn-quiet" data-action="strength-instead">Do ${esc(TEMPLATES[nextStrength(sessions)].name)} instead</button>` : ''}
        <button class="btn" data-action="adventure">Adventure · hike, skate, field day</button>
        ${ptButtonHtml(treasures)}

        <p class="level-line">Level ${info.level} · ${info.into} / ${info.needed} XP</p>
      </section>
    `;

    playSprite(main.querySelector('canvas.fire'), CAMPFIRE[fire.level - 1]);
    playSprite(main.querySelector('canvas.mara'), SPRITES.idle);
  }

  main.onclick = async (e) => {
    if (e.target.closest('[data-evidence]')) return; // badges open their own pop-up
    const energyButton = e.target.closest('[data-energy]');
    const action = e.target.closest('[data-action]');

    if (energyButton) {
      const energy = Number(energyButton.dataset.energy);
      if (isWalkDay) await startWalk(energy, walkForEnergy(sessions, energy));
      else await startQuest(energy === 1 ? 'tiny' : quest.templateId, energy);
      return;
    }
    if (!action) return;
    if (action.dataset.action === 'continue') location.hash = open.kind === 'walk' ? '#walk' : '#workout';
    if (action.dataset.action === 'tiny') await startQuest('tiny', 1);
    if (action.dataset.action === 'strength-instead') await startQuest(nextStrength(sessions), 3);
    if (action.dataset.action === 'adventure') openAdventureSheet('Hikes, skating, rollerblading, a field day on your feet.');
    if (action.dataset.action === 'pt') await earnGem();
  };

  draw();
  return () => { document.getElementById('sheet').onclick = null; };
}
