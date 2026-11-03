// settings.js — the Settings screen (#settings).
//
//   - Backup: save your data to a file, or load one back in
//   - Treasure: a way into the yoga mat chest (and Match Hinge)
//   - Someday: your idea list, and Copy all
//   - Version: which release this is, and whether the update window is open
//   - Equipment: what the app thinks you own (change it in js/data/equipment.js)

/** Freeze status: { text, open }. A release is used for freezeDays before new features. */
function freezeStatus() {
  if (!APP.releasedOn) return { text: 'Not released yet.', open: true };
  const days = Math.floor((parseDateKey(dateKey()) - parseDateKey(APP.releasedOn)) / 86400000);
  const left = APP.freezeDays - days;
  if (left > 0) return { text: `Freeze: ${left} day${left === 1 ? '' : 's'} left. Fix broken things only; ideas go in Someday.`, open: false };
  return { text: 'Update window open. Bring your Someday list to Claude.', open: true };
}

async function renderSettings(main) {
  const [someday, lastBackup, profile, treasures] = await Promise.all([
    db.getAll('someday'), db.get('meta', 'lastBackup'), db.get('profile', 'me'), db.getAll('treasures'),
  ]);
  const freeze = freezeStatus();
  const kgList = (kind) => loadOptions(kind).map((o) => kgText(o.kg)).join(' · ');
  const kgRange = (kind) => {
    const options = loadOptions(kind);
    return `${kgText(options[0].kg)} to ${kgText(options[options.length - 1].kg)} kg, ${options.length} steps`;
  };
  const plates = EQUIPMENT.plates.map((p) => `${p.count} × ${kgText(p.kg)} kg`).join(' · ');
  const ideas = someday.sort((a, b) => b.at - a.at).map((r) =>
    `<li><b>${esc(r.type)}</b> ${esc(r.text)} <span class="muted small">${esc(r.date)}</span></li>`).join('');

  main.innerHTML = `
    <section class="stack">
      <h2>Settings</h2>

      <section class="panel stack">
        <h3>Backup</h3>
        <p class="muted">Your data lives only on this phone. Save a backup now and then, and keep the file somewhere safe, like Google Drive.</p>
        <p class="small">Last backup: <b>${lastBackup ? esc(new Date(lastBackup.at).toLocaleDateString()) : 'never'}</b></p>
        ${canShareFiles() ? '<button class="btn-gold" data-action="share">Save backup to Drive or Quick Share</button>' : ''}
        <button class="${canShareFiles() ? 'btn' : 'btn-gold'}" data-action="save">Save backup file to Downloads</button>
        <label class="btn file-btn">Load backup file<input type="file" id="restore-file" accept=".json,.txt,application/json,text/plain"></label>
        <p class="muted small">Loading adds the file's data. Nothing here is erased.</p>
      </section>

      <section class="panel stack">
        <h3>Treasure</h3>
        ${gemRowHtml(chestStatus(treasures))}
        <a class="btn" href="#treasure">${esc(TREASURES[CURRENT_TREASURE].name)} · Match Hinge</a>
      </section>

      <section class="panel stack">
        <h3>💡 Someday</h3>
        ${ideas ? `<ul class="ideas">${ideas}</ul>` : '<p class="muted">No ideas yet. Tap 💡 at the top of any screen.</p>'}
        <button class="btn" data-action="add-idea">Add an idea</button>
        ${ideas ? '<button class="btn" data-action="copy">Copy all</button>' : ''}
      </section>

      <section class="panel stack">
        <h3>Version</h3>
        <p>${esc(APP.name)} v${esc(APP.version)}${APP.releasedOn ? ` · released ${esc(APP.releasedOn)}` : ''}</p>
        <p class="${freeze.open ? 'notice' : 'muted'}">${esc(freeze.text)}</p>
        ${APP.whatsNew ? `<p class="small">What's new: ${esc(APP.whatsNew)}</p>` : ''}
      </section>

      <section class="panel stack">
        <h3>Knee</h3>
        <p class="muted">${profile.kneeEasy
          ? 'Gentler knee moves are on. Two Fine knee checks in a row turn them off.'
          : 'Regular knee moves. Two Sore knee checks in a row switch to gentler ones.'}</p>
      </section>

      <section class="panel stack">
        <h3>Equipment</h3>
        <p class="small"><b>Plates:</b> ${esc(plates)}</p>
        <p class="small"><b>Pair of dumbbells, each:</b> ${esc(kgList('db-pair'))} kg</p>
        <p class="small"><b>One dumbbell:</b> ${esc(kgRange('db-one'))}</p>
        <p class="small"><b>Kettlebell:</b> ${esc(kgRange('kb'))}</p>
        <p class="small"><b>Push-up ladder:</b> ${esc(EQUIPMENT.pushupLadder.join(' → '))}</p>
        <p class="small"><b>Hotel room ladder:</b> ${esc(EQUIPMENT.roomPushupLadder.join(' → '))}</p>
        <p class="small"><b>Hotel gym ladder:</b> ${esc(EQUIPMENT.gymPushupLadder.join(' → '))}</p>
        <p class="small"><b>Hotel gym dumbbells:</b> ${esc(EQUIPMENT.hotelDumbbellsLb.join(' · '))} lb</p>
        <p class="muted small">To change these, edit js/data/equipment.js.</p>
      </section>

      <button class="btn-gold big" data-action="home">Back to the hall</button>
    </section>
  `;

  const status = (text) => toast(text);

  // Pack the share file now, so tapping Share can open the Share sheet right away.
  const shareFile = canShareFiles() ? await backupFile('txt') : null;

  main.onclick = async (e) => {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'home') location.hash = '#home';
    if (action === 'add-idea') openSomeday();
    if (action === 'save') { status(`Saved ${await saveBackup()} to Downloads.`); show(); }
    if (action === 'share') {
      try {
        await shareBackup(shareFile);
        status('Backup shared.');
        show();
      } catch (err) {
        if (err.name === 'AbortError') return; // you closed the Share sheet: nothing to do
        // Sharing didn't work here, so save to Downloads instead. You still get your backup.
        console.warn('Share failed', err);
        status(`Sharing didn't work (${err.name}), so it went to Downloads: ${await saveBackup()}`);
        show();
      }
    }
    if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(somedayText(await db.getAll('someday')));
        status('Copied. Paste it to Claude at your next update session.');
      } catch (err) {
        status("Couldn't copy here. Select the list and copy it by hand.");
      }
    }
  };

  main.querySelector('#restore-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const count = await restoreBackup(JSON.parse(await file.text()));
      status(`Loaded ${count} rows from the backup.`);
      show();
    } catch (err) {
      console.error(err);
      status(`That file didn't load (${err.message}). Pick a brawnforge-backup file.`);
    }
  });

  return null;
}
