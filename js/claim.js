// claim.js — Scan to claim (#claim/...).
//
// When a workout ends, the TV shows a QR code: the battle walk's victory screen, the end of
// a strength video, or a card after a Down Dog class. Scanning it with the phone's camera
// opens this screen with the workout filled in. One tap claims it.
// Nothing is saved until you tap, and the same code only counts once.
//
// The code's address (tv-cue and battle.html make these):
//   #claim/walk?d=2026-11-20&lv=1&mi=1.31&min=27&f=Couch Slime&id=w1795...   a battle walk
//   #claim/yoga?d=2026-11-19&min=17&id=y1795...                               a Down Dog class
//   #claim/strength?d=2026-11-19&t=strength-b&id=s2026-11-19-strength-b      a strength video

/** The claim in the address. */
function claimFromHash() {
  const rest = location.hash.replace(/^#claim\/?/, '');
  const [kind, query = ''] = rest.split('?');
  const p = new URLSearchParams(query);
  return {
    kind,
    id: p.get('id') || '',
    date: p.get('d') || dateKey(),
    level: Number(p.get('lv')) || 0,
    miles: Number(p.get('mi')) || 0,
    minutes: Math.round(Number(p.get('min')) || 0),
    foe: p.get('f') || '',
    templateId: p.get('t') || '',
  };
}

/** Codes you've already claimed, so each one only counts once. Kept in the meta table. */
async function claimedIds() {
  const row = await db.get('meta', 'claims');
  return row ? row.ids : [];
}

async function markClaimed(id) {
  if (!id) return;
  const ids = (await claimedIds()).filter((x) => x !== id);
  ids.push(id);
  await db.put('meta', { key: 'claims', ids: ids.slice(-300) }); // the last 300 is plenty
}

async function renderClaim(main) {
  const c = claimFromHash();
  const template = c.kind === 'strength' ? TEMPLATES[c.templateId] : null;
  const makesSense = c.id && (c.kind === 'walk' || c.kind === 'yoga' || (c.kind === 'strength' && template));

  function card(title, say, facts, buttons) {
    main.innerHTML = `
      <section class="stack">
        <p class="step-count">Scan to claim</p>
        <h2>${esc(title)}</h2>
        <canvas class="mara" width="32" height="32" role="img" aria-label="Mara the Unbent"></canvas>
        <p class="cue">${esc(say)}</p>
        ${facts ? `<p class="center">${esc(facts)}</p>` : ''}
        ${buttons}
      </section>
    `;
    playSprite(main.querySelector('canvas.mara'), SPRITES['power-pose']);
  }
  const homeButton = '<button class="btn" data-action="home">Back to the hall</button>';

  if (!makesSense) {
    card('That code is a mystery', "I can't read that one. Log it the usual way.", '', homeButton);
  } else if ((await claimedIds()).includes(c.id)) {
    card('Already claimed', 'You already took the XP for this one. Nice try.', '', homeButton);
  } else {
    // A strength day you already logged on the phone doesn't need claiming
    const sessions = await db.getAll('sessions');
    const logged = template && sessions.find((s) => s.templateId === c.templateId && s.date === c.date && s.done.length);
    const from = c.date !== dateKey() ? ` From ${c.date}.` : '';

    if (c.kind === 'walk') {
      card(`Battle Walk · Level ${c.level}`, c.foe ? `${c.foe} is down. I watched. Take the XP.` : 'I watched. Take the XP.',
        `${c.miles.toFixed(2)} miles · ${c.minutes} min.${from}`,
        `<button class="btn-gold big" data-action="claim">Claim it · ${TUNING.xpWalk} XP</button>
         <button class="btn-quiet" data-action="home">Not now</button>`);
    } else if (c.kind === 'yoga') {
      card('Down Dog on the TV', 'You bent. Fine. Log it.', `${c.minutes} min.${from} Pick the type and log it.`,
        `<button class="btn-gold big" data-action="claim">Log it</button>
         <button class="btn-quiet" data-action="home">Not now</button>`);
    } else if (logged) {
      card(`${template.name} with Mara`, 'You already logged your sets. The iron remembers.', '',
        '<button class="btn-gold big" data-action="see">See it</button>');
    } else {
      card(`${template.name} with Mara`, 'Write down what you lifted, so the weights keep climbing.', `${from.trim()}`,
        `<button class="btn-gold big" data-action="claim">Log my sets</button>
         <button class="btn-quiet" data-action="home">Not now</button>`);
    }

    main.onclick = async (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;
      if (button.dataset.action === 'home') { location.hash = '#home'; return; }
      if (button.dataset.action === 'see') { await markClaimed(c.id); location.hash = `#done/${logged.id}`; return; }
      if (button.dataset.action !== 'claim') return;
      // Yoga opens the usual log sheet. The claim counts once you tap Log there.
      if (c.kind === 'yoga') return openYogaSheet({ from: 'tv', minutes: Math.max(1, c.minutes), claimId: c.id });
      button.disabled = true; // one tap, one claim
      if (c.kind === 'walk') return claimWalk(c);
      await markClaimed(c.id);
      return startQuest(c.templateId, 4); // 4 = as written, the same sets Mara coached on the TV
    };
    return null;
  }
  main.onclick = (e) => { if (e.target.closest('[data-action="home"]')) location.hash = '#home'; };
  return null;
}

/** Save the battle walk as a finished walk with its XP, then show the Done screen. */
async function claimWalk(c) {
  const profile = await db.get('profile', 'me');
  const now = Date.now();
  const session = {
    id: uid(),
    date: c.date,
    startedAt: now - c.minutes * 60000,
    finishedAt: now,
    templateId: null,
    kind: 'walk',
    energy: null,
    place: 'home',
    week: weekNumber(profile.startDate),
    walkWeek: null,           // the Uno's levels, not the Walk Pad Trials, so it doesn't unlock a Trials week
    walkName: `Battle Walk · Level ${c.level}`,
    parts: [],
    done: [{ walk: true, seconds: c.minutes * 60, at: now }],
    xp: TUNING.xpWalk,
    partial: false,
    source: 'tv',             // claimed from the TV
    padLevel: c.level,
    miles: c.miles,
    foe: c.foe,
  };
  await db.put('sessions', session);
  await addXp(TUNING.xpWalk, 'walk', session.id);
  await markClaimed(c.id);
  buzz([120, 80, 120, 80, 240]);
  location.hash = `#done/${session.id}`;
}
