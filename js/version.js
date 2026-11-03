// version.js — which version of The Brawnforge this is.
//
// After each release, set releasedOn to that day. The app then counts
// 14 days (freezeDays) and shows "Update window open" in Settings.
// whatsNew is shown once, the first time the new version opens.
// Whenever version changes, bump CACHE_NAME in sw.js too, or the phone
// keeps running the old copy.

const APP = {
  name: 'The Brawnforge',
  version: '0.2.0',     // sw.js: brawnforge-v6
  releasedOn: '2026-11-02', // the day it went on your phone. v0.2 sets this when it ships.
  freezeDays: 14,
  whatsNew: 'The Outpost: tap 🧳 at the top when you travel. And the Yoga Mat Chest: tap "Did my PT exercises" for a gem a day.',
};
