// someday.js — the lightbulb: catch an idea without leaving what you're doing.
//
// Tap 💡 at the top of any screen, pick Broken / Wish / Again, type a line,
// Save. During a freeze, ideas wait here. At the next update session,
// Settings → Copy all puts the whole list on your clipboard to paste to Claude.
//   Broken  something that doesn't work (fixing is always allowed)
//   Wish    something new you'd like
//   Again   something you loved and want more of

const SOMEDAY_TYPES = ['Broken', 'Wish', 'Again'];

function openSomeday() {
  let type = 'Wish';
  const typeButtons = () => SOMEDAY_TYPES.map((t) =>
    `<button class="chip${t === type ? ' on' : ''}" data-someday-type="${t}" aria-pressed="${t === type}">${t}</button>`).join('');

  openSheet(`
    <h3>💡 Someday</h3>
    <div class="chips">${typeButtons()}</div>
    <textarea id="someday-text" rows="3" placeholder="One line is plenty"></textarea>
    <button class="btn-gold" data-someday-save>Save idea</button>
  `);

  const sheet = document.getElementById('sheet');
  const old = sheet.onclick; // the screen underneath may listen to the sheet too
  sheet.onclick = async (e) => {
    const pick = e.target.closest('[data-someday-type]');
    if (pick) {
      type = pick.dataset.somedayType;
      sheet.querySelector('.chips').innerHTML = typeButtons();
      return;
    }
    if (e.target.closest('[data-someday-save]')) {
      const text = sheet.querySelector('#someday-text').value.trim();
      if (!text) { toast('Type a few words first.'); return; }
      await db.put('someday', { id: uid(), type, text, at: Date.now(), date: dateKey() });
      sheet.onclick = old;
      closeSheet();
      toast('Saved to Someday.');
      if (location.hash === '#settings') show(); // redraw the list
    }
    if (e.target.closest('[data-close-sheet]') || e.target.id === 'sheet') sheet.onclick = old;
  };
  setTimeout(() => sheet.querySelector('#someday-text').focus(), 50);
}

/** The whole list as text, ready to paste to Claude. */
function somedayText(rows) {
  return rows.sort((a, b) => a.at - b.at).map((r) => `- ${r.type}: ${r.text} (${r.date})`).join('\n');
}
