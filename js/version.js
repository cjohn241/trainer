// version.js — which version of The Brawnforge this is.
//
// After each release, set releasedOn to that day. The app then counts
// 14 days (freezeDays) and shows "Update window open" in Settings.
// whatsNew is shown once, the first time the new version opens.
// Whenever version changes, bump CACHE_NAME in sw.js too, or the phone
// keeps running the old copy.

const APP = {
  name: 'The Brawnforge',
  version: '0.2.1',     // sw.js: brawnforge-v7 (0.2.1 = v0.2 with its release date set)
  releasedOn: '2026-11-03', // the day it went on your phone. Freeze ends 2026-11-17.
  freezeDays: 14,
  whatsNew: 'v0.2 is released. The 2-week freeze starts today: ideas go in 💡 Someday.',
};
