// app.js — starts the app and shows the screen named in the address:
//   #home       the training hall: campfire, energy buttons, Tiny Quest, Adventure
//               (while you're traveling, The Outpost instead: see outpost.js)
//   #workout    the quest you're doing right now, one exercise at a time
//   #walk       the walk pad, one part at a time
//   #done/<id>  after a win: loot, knee check, Open Hub
//   #treasure   the yoga mat chest: your gems and Match Hinge
//   #settings   backup, Someday, version, equipment

const main = document.getElementById('screen');
document.getElementById('app-version').textContent = `${APP.name} v${APP.version}`;
let leaveScreen = null; // cleanup from the screen we're on (timers, screen-awake lock)

/** Make sure your profile row exists. The first time the app opens, it starts week 1. */
async function ensureProfile() {
  let profile = await db.get('profile', 'me');
  if (!profile) {
    profile = {
      id: 'me',
      startDate: dateKey(),   // week 1 starts the first day you open the app
      ptRegions: ['knee'],    // your PT flag area: moves that load it get "Mention to your PT"
      kneeEasy: false,        // true after two Sore knee checks: knee moves use their easier version
      createdAt: Date.now(),
    };
    await db.put('profile', profile);
  }
  return profile;
}

/** The first time a new version opens, show its one-line "What's new". */
async function whatsNewOnce() {
  const seen = await db.get('meta', 'seenVersion');
  if (seen && seen.version === APP.version) return;
  await db.put('meta', { key: 'seenVersion', version: APP.version });
  if (seen && APP.whatsNew) openSheet(`<h3>What's new in v${esc(APP.version)}</h3><p>${esc(APP.whatsNew)}</p>`);
}

async function show() {
  if (leaveScreen) { leaveScreen(); leaveScreen = null; }
  main.onclick = null;
  closeSheet();

  const [name, id] = location.hash.slice(1).split('/');

  try {
    if (name === 'workout') leaveScreen = await renderWorkout(main);
    else if (name === 'walk') leaveScreen = await renderWalk(main);
    else if (name === 'done') leaveScreen = await renderDone(main, id);
    else if (name === 'settings') leaveScreen = await renderSettings(main);
    else if (name === 'treasure') leaveScreen = await renderTreasure(main);
    else leaveScreen = await renderHome(main);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<section class="panel"><h2>Something went wrong</h2><p class="muted">${esc(err.message)}</p></section>`;
  }
  window.scrollTo(0, 0);
  updateSuitcase(await db.get('profile', 'me'));
}

window.addEventListener('hashchange', show);

// The 💡 at the top opens the Someday catcher on any screen.
document.getElementById('lightbulb').addEventListener('click', openSomeday);

// The 🧳 at the top turns The Outpost (travel mode) on or off in one tap.
document.getElementById('suitcase').addEventListener('click', toggleTravel);

// Ask Chrome not to clear our data when the disk gets tight.
// Installed apps usually get this automatically.
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

// The service worker (sw.js) keeps a copy of the app on the phone, so it opens offline.
// It can't run from a double-clicked file, only from a web address.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker failed', err));
}

ensureProfile().then(show).then(whatsNewOnce);
