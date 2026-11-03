// version.js — which version of The Brawnforge this is.
//
// After each release, set releasedOn to that day. The app then counts
// 14 days (freezeDays) and shows "Update window open" in Settings.
// whatsNew is shown once, the first time the new version opens.
// Whenever version changes, bump CACHE_NAME in sw.js too, or the phone
// keeps running the old copy.

const APP = {
  name: 'The Brawnforge',
  version: '0.1.0',     // sw.js: brawnforge-v3
  releasedOn: null,     // e.g. '2026-11-08' once it's on your phone
  freezeDays: 14,
  whatsNew: '',
};
