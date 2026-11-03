// backup.js — your data in one file you keep yourself.
//
// "Save backup" writes every table into one JSON file (plain text that
// holds data). "Load backup" reads that file back and MERGES it in: rows
// with the same id are replaced by the file's copy, and everything else
// stays. Nothing gets erased. The file also records the database version
// (schema), so a newer app can still read an older file.

const BACKUP_KIND = 'brawnforge-backup';

/** Every row of every table. */
async function makeBackup() {
  const stores = {};
  for (const name of db.storeNames) stores[name] = await db.getAll(name);
  return {
    kind: BACKUP_KIND,
    schema: db.version,
    appVersion: APP.version,
    savedAt: new Date().toISOString(),
    stores,
  };
}

/** Merge a backup file's rows in. Returns how many rows were loaded. */
async function restoreBackup(data) {
  if (!data || data.kind !== BACKUP_KIND) throw new Error('not a Brawnforge backup file');
  if (data.schema > db.version) throw new Error('this backup is from a newer version of the app');
  const rows = {};
  let count = 0;
  for (const name of db.storeNames) {
    if (Array.isArray(data.stores[name])) { rows[name] = data.stores[name]; count += rows[name].length; }
  }
  await db.putMany(rows);
  return count;
}

/** The file to save, named with today's date. */
async function backupFile() {
  const json = JSON.stringify(await makeBackup());
  await db.put('meta', { key: 'lastBackup', at: Date.now() });
  return new File([json], `brawnforge-backup-${dateKey()}.json`, { type: 'application/json' });
}

/** Save the file to Downloads. */
async function saveBackup() {
  const file = await backupFile();
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return file.name;
}

/** On the phone: send the file straight to Google Drive, Quick Share, email... */
async function shareBackup() {
  const file = await backupFile();
  await navigator.share({ files: [file], title: 'The Brawnforge backup' });
}

/** Can this browser share files? (Phones yes, most PCs no.) */
function canShareFiles() {
  return Boolean(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.json', { type: 'application/json' })] }));
}
