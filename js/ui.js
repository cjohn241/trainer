// ui.js — small helpers every screen uses: escaping text, ids, dates,
// the message at the bottom, buzzing, keeping the screen awake, the
// XP pop, and the evidence pop-up.

/**
 * Make text safe to drop into HTML. ALWAYS wrap data in esc(...) when
 * building HTML strings, so odd text can't break the page.
 */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** A new unique id for a row. */
function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/** A Date -> 'YYYY-MM-DD' in your local time (one key per calendar day). */
function dateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 'YYYY-MM-DD' -> a Date at local midnight. */
function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Show a short message at the bottom for a few seconds. */
let toastTimer = null;
function toast(message) {
  const box = document.getElementById('toast');
  box.textContent = message;
  box.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('show'), 3200);
}

/** Buzz the phone (does nothing on a PC). Pattern: ms on, ms off, ms on ... */
function buzz(pattern = 60) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

/**
 * Keep the screen on while a timer runs. Returns a function that lets
 * the screen sleep again. Chrome drops the lock when you switch apps,
 * so we ask again when you come back.
 */
async function keepAwake() {
  let lock = null;
  async function ask() {
    try {
      if (navigator.wakeLock) lock = await navigator.wakeLock.request('screen');
    } catch (err) {
      // Not allowed right now (battery saver, PC without support). The app still works.
    }
  }
  const onVisible = () => { if (document.visibilityState === 'visible') ask(); };
  document.addEventListener('visibilitychange', onVisible);
  await ask();
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    if (lock) lock.release().catch(() => {});
  };
}

/** The gold "+10 XP" that floats up after a set. */
function xpPop(text) {
  const pop = document.createElement('div');
  pop.className = 'xp-pop';
  pop.textContent = text;
  document.body.appendChild(pop);
  setTimeout(() => pop.remove(), 1200);
}

// ---------- Evidence badges ----------

const BADGE_CLASS = { Strong: 'strong', Moderate: 'moderate', Emerging: 'emerging', 'Design choice': 'design' };

/** A small tappable badge for one evidence entry (see data/evidence.js). */
function badgeHtml(id) {
  const ev = EVIDENCE[id];
  if (!ev) return '';
  return `<button class="badge badge-${BADGE_CLASS[ev.label]}" data-evidence="${esc(id)}">${esc(ev.label)}</button>`;
}

/** Open the pop-up panel with some HTML in it. */
function openSheet(html) {
  const sheet = document.getElementById('sheet');
  sheet.innerHTML = `<div class="sheet-card">${html}<button class="btn" data-close-sheet>Close</button></div>`;
  sheet.hidden = false;
}

function closeSheet() {
  document.getElementById('sheet').hidden = true;
}

/** The pop-up for one evidence entry: the claim, the label and where it comes from. */
function showEvidence(id) {
  const ev = EVIDENCE[id];
  if (!ev) return;
  const source = ev.source ? `<p class="muted">${esc(ev.source)}${ev.year ? `, ${esc(ev.year)}` : ''}${ev.type ? ` · ${esc(ev.type)}` : ''}</p>` : '';
  const link = ev.url ? `<p><a href="${esc(ev.url)}" target="_blank" rel="noopener">Look it up</a></p>` : '';
  const checked = ev.label === 'Design choice' ? ''
    : ev.checked ? '' : '<p class="muted small">Not double-checked yet. Every source gets checked in v0.3.</p>';
  openSheet(`
    ${badgeHtml(id)}
    <h3>${esc(ev.claim)}</h3>
    ${source}
    ${ev.note ? `<p>${esc(ev.note)}</p>` : ''}
    ${link}
    ${checked}
  `);
}

// One listener for the whole page: any badge opens its pop-up,
// and tapping outside the card (or Close) shuts it.
document.addEventListener('click', (e) => {
  const badge = e.target.closest('[data-evidence]');
  if (badge) { showEvidence(badge.dataset.evidence); return; }
  if (e.target.closest('[data-close-sheet]') || e.target.id === 'sheet') closeSheet();
});
