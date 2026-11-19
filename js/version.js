// version.js — which version of The Brawnforge this is.
//
// After each release, set releasedOn to that day. The app then counts
// 14 days (freezeDays) and shows "Update window open" in Settings.
// whatsNew is shown once, the first time the new version opens.
// Whenever version changes, bump CACHE_NAME in sw.js too, or the phone
// keeps running the old copy.

const APP = {
  name: 'The Brawnforge',
  version: '0.5',       // sw.js: brawnforge-v10
  releasedOn: '2026-11-03', // kept from v0.2 on purpose: the Oath (v0.3) and The Bend (v0.4) skipped the freeze and don't restart it. Freeze ends 2026-11-17. Scan to claim (v0.5) skipped it too.
  freezeDays: 14,
  whatsNew: 'Scan to claim: when a walk battle, a strength video or a Down Dog class ends on the TV, Mara shows a code. Scan it with your camera and the workout lands here. One tap and it counts.',
};
