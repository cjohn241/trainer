// db.js — the on-phone database (IndexedDB, built into Chrome).
//
// Same idea as The Bard's Tongue: each "store" is a table, each row is a
// JavaScript object, and the keyPath is the primary key column.
//
//   profile        key: id    one row ('me'): start date, PT region, settings
//   checkins       key: date  your energy tap for each day
//   sessions       key: id    one row per quest: its plan and every set you logged
//   exerciseState  key: id    'goblet-squat|home' -> the weight and reps to use next
//   xpLedger       key: id    every XP you've earned, one row per event
//   inventory      key: id    loot you own; Bedrolls remember usedOn
//   adventures     key: id    hikes, skates, field days
//   questProgress  key: id    (spare for now: walk pad weeks are worked out from your walks)
//   someday        key: id    your idea list: Broken / Wish / Again
//   meta           key: key   app bookkeeping, like the last backup date
//   treasures      key: id    Real-World Treasure: one gem per PT day, and your Match Hinge count (v0.2)
//   oathDays       key: date  The Oath: one row per day, clear or slip, and the medication check (v0.3)
//   cravings       key: id    The Oath: each craving timer and how it ended (v0.3)
//   symptomLogs    key: id    The Oath: each body check you filled in (v0.3)
//   yogaSessions   key: id    The Bend: each yoga session you logged (v0.4)
//
// The database is named 'brawnforge', so it never mixes with The Bard's
// Tongue even though both live at the same GitHub Pages address.

const db = (() => {
  const DB_NAME = 'brawnforge';
  const DB_VERSION = 4; // bump this only if the table list below changes (2: treasures, 3: the Oath, 4: yoga)

  const STORES = {
    profile: 'id',
    checkins: 'date',
    sessions: 'id',
    exerciseState: 'id',
    xpLedger: 'id',
    inventory: 'id',
    adventures: 'id',
    questProgress: 'id',
    someday: 'id',
    meta: 'key',
    treasures: 'id',
    oathDays: 'date',
    cravings: 'id',
    symptomLogs: 'id',
    yogaSessions: 'id',
  };

  let dbPromise = null;

  /** Open the database once and reuse it. Creates the tables on first run. */
  function open() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const idb = req.result;
          for (const [name, keyPath] of Object.entries(STORES)) {
            if (!idb.objectStoreNames.contains(name)) idb.createObjectStore(name, { keyPath });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  // Turn one IndexedDB request into a promise we can await.
  function requestDone(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Wait for a whole transaction to finish (like COMMIT).
  function transactionDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  return {
    /** The database's version number and table names (the backup file uses these). */
    version: DB_VERSION,
    storeNames: Object.keys(STORES),

    /** INSERT OR REPLACE many rows into many tables at once: { store: [rows] }. All or nothing. */
    async putMany(rowsByStore) {
      const idb = await open();
      const names = Object.keys(rowsByStore);
      const tx = idb.transaction(names, 'readwrite');
      for (const name of names) {
        for (const row of rowsByStore[name]) tx.objectStore(name).put(row);
      }
      await transactionDone(tx);
    },

    /** SELECT * FROM store */
    async getAll(store) {
      const idb = await open();
      return requestDone(idb.transaction(store).objectStore(store).getAll());
    },

    /** SELECT * FROM store WHERE key = ? (undefined if missing) */
    async get(store, key) {
      const idb = await open();
      return requestDone(idb.transaction(store).objectStore(store).get(key));
    },

    /** INSERT OR REPLACE one row */
    async put(store, value) {
      const idb = await open();
      const tx = idb.transaction(store, 'readwrite');
      tx.objectStore(store).put(value);
      await transactionDone(tx);
      return value;
    },

    /** DELETE FROM store WHERE key = ? */
    async remove(store, key) {
      const idb = await open();
      const tx = idb.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      await transactionDone(tx);
    },
  };
})();
