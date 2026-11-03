// done.js — the Done screen, after any win (#done/<id>).
//
//   - Mara's power pose (tap her to skip it)
//   - XP, and a level-up if you got one
//   - the loot chest: one roll per win, saved to your inventory
//   - the knee check, after strength and walk days: Fine / Noticed it / Sore
//   - Open Hub, a link to the Shawnee Home Hub ("Trained today" arrives there in v0.2)
// The loot and the knee answer are saved on the quest itself, so a reload
// shows the same chest and never rolls twice.

/** Pick one item from the chest. Bedrolls stop dropping once you carry TUNING.maxBedrolls. */
function rollLoot(inventory) {
  const carried = inventory.filter((row) => row.kind === 'bedroll' && !row.usedOn).length;
  const rarity = Math.random() < TUNING.rareChance ? 'rare' : 'common';
  const pool = LOOT.filter((item) => item.rarity === rarity && !(item.kind === 'bedroll' && carried >= TUNING.maxBedrolls));
  return pool[Math.floor(Math.random() * pool.length)];
}

/** After a knee answer: two Sore in a row eases knee moves, two Fine in a row brings them back. */
async function updateKneeMode(sessions) {
  const answers = sessions.filter((s) => s.knee).sort((a, b) => b.finishedAt - a.finishedAt).map((s) => s.knee);
  const lastAre = (answer, n) => answers.length >= n && answers.slice(0, n).every((a) => a === answer);
  const profile = await db.get('profile', 'me');
  const before = Boolean(profile.kneeEasy);
  if (lastAre('sore', TUNING.kneeSoreToEase)) profile.kneeEasy = true;
  if (lastAre('fine', TUNING.kneeFineToReturn)) profile.kneeEasy = false;
  await db.put('profile', profile);
  return { before, after: Boolean(profile.kneeEasy) };
}

async function renderDone(main, id) {
  // A win is either a quest/walk (sessions) or an Adventure (adventures).
  let store = 'sessions';
  let win = await db.get('sessions', id);
  if (!win) { store = 'adventures'; win = await db.get('adventures', id); }
  if (!win) { location.hash = '#home'; return null; }

  const counts = win.kind === 'adventure' || (win.done && win.done.length > 0);
  const askKnee = counts && (win.kind === 'strength' || win.kind === 'walk');
  let kneeMessage = '';

  // Open the chest once per win.
  if (counts && !win.loot) {
    const item = rollLoot(await db.getAll('inventory'));
    await db.put('inventory', { id: uid(), itemId: item.id, kind: item.kind, at: Date.now(), from: win.id });
    win.loot = item.id;
    await db.put(store, win);
  }

  const total = await totalXp();
  const now = levelInfo(total);
  const before = levelInfo(total - (win.xp || 0));
  const levelUp = counts && now.level > before.level;

  function titleText() {
    if (win.kind === 'adventure') return 'Adventure logged!';
    if (win.kind === 'walk') return win.partial ? 'Walk ended. It still counts.' : 'Walk complete!';
    if (!win.partial) return 'Quest complete!';
    return counts ? 'Quest ended. It still counts.' : 'Come back anytime.';
  }

  function kneePanel() {
    if (!askKnee) return '';
    if (win.knee) {
      return `<section class="panel stack">
        <p class="center">Knee: <b>${esc({ fine: 'Fine', noticed: 'Noticed it', sore: 'Sore' }[win.knee])}</b>. Thanks for telling me.</p>
        ${kneeMessage ? `<p class="center notice">${esc(kneeMessage)}</p>` : ''}
      </section>`;
    }
    return `<section class="panel stack">
      <h3 class="center">How's your left knee?</h3>
      <div class="knee">
        <button data-knee="fine">Fine</button>
        <button data-knee="noticed">Noticed it</button>
        <button data-knee="sore">Sore</button>
      </div>
      <p class="muted small">Get calf swelling, redness, warmth or pain checked promptly.</p>
    </section>`;
  }

  function draw() {
    const item = LOOT.find((l) => l.id === win.loot);
    main.innerHTML = `
      <section class="stack">
        <h2>${esc(titleText())}</h2>
        <canvas class="mara" width="32" height="32" role="img" aria-label="Mara the Unbent. Tap to skip her pose." data-action="skip-pose"></canvas>
        ${counts ? `<p class="today">+${win.xp || 0} XP</p>` : ''}
        ${levelUp ? `<p class="notice">Level up! You're level ${now.level}.</p>` : ''}
        <p class="center">${counts ? 'The fire is lit for today.' : 'Mara will keep the fire warm.'}</p>

        ${item ? `<section class="panel loot loot-${item.rarity}">
          <p class="muted small">${item.rarity === 'rare' ? 'Rare find!' : 'From the chest'}</p>
          <h3>${esc(item.name)}</h3>
          <p class="speech">${esc(item.line)}</p>
        </section>` : ''}

        ${kneePanel()}

        <p class="level-line">Level ${now.level} · ${now.into} / ${now.needed} XP</p>
        <a class="btn" href="${esc(LINKS.hub)}" target="_blank" rel="noopener">Open Hub</a>
        <button class="btn-gold big" data-action="home">Back to the hall</button>
      </section>
    `;
    playSprite(main.querySelector('canvas.mara'), counts ? SPRITES['power-pose'] : SPRITES.idle);
  }

  main.onclick = async (e) => {
    if (e.target.closest('[data-evidence]')) return; // badges open their own pop-up
    const knee = e.target.closest('[data-knee]');
    if (knee) {
      win.knee = knee.dataset.knee;
      await db.put(store, win);
      const mode = await updateKneeMode(await db.getAll('sessions'));
      if (!mode.before && mode.after) kneeMessage = 'Two sore days. Next strength day uses the gentler knee moves.';
      if (mode.before && !mode.after) kneeMessage = 'Two fine days. Your regular knee moves are back.';
      return draw();
    }
    const action = e.target.closest('[data-action]');
    if (!action) return;
    if (action.dataset.action === 'home') location.hash = '#home';
    if (action.dataset.action === 'skip-pose') playSprite(action, SPRITES.idle);
  };

  draw();
  return null;
}
