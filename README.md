# The Brawnforge

Mara the Unbent's training hall: strength days, walk pad days and Tiny Quests,
in the Shawnee Home Hub's torch-lit dungeon look. Plain HTML, CSS and JavaScript.
It installs on an Android phone and works offline.
No accounts: your workouts are saved only on the phone. Back them up from Settings.

The plan and every decision live in `PLAN.md`, which stays on the computer (it isn't uploaded).

---

## Part 1. Put the app on GitHub Pages (one time, about 10 minutes)

Same steps as The Bard's Tongue. A phone app needs an `https://` address, and GitHub Pages gives you one for free.

1. Sign in at <https://github.com>. Click **+** at the top right, then **New repository**.
2. **Repository name:** `trainer`. Choose **Public**. Leave "Add a README file" unticked. Click **Create repository**.
3. Click **uploading an existing file**. Open this folder on your computer, select **everything inside it** and drag it into the browser window:
   `index.html`, `manifest.webmanifest`, `sw.js`, `start.bat`, `README.md`, and the folders `css`, `js`, `icons` and `tools`.
   Drag the *contents*, not the folder itself. `index.html` has to end up at the top level.

   > **Leave these on your computer:** `PLAN.md` (it has your knee history and goals, and the repository is public),
   > any `brawnforge-backup-…json` file (your workouts), and the `.claude` folder (only for Claude on this computer).
4. Type `First upload` under "Commit changes" and click **Commit changes**.
5. Click **Settings → Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, and click **Save**.
6. Wait 1 to 2 minutes and refresh. Your address appears at the top:
   `https://YOUR-USERNAME.github.io/trainer/`

---

## Part 2. Install it on your phone

1. On the phone, open that address in **Chrome**.
2. Tap **⋮**, then **Add to home screen**, then **Install**. (If Chrome shows an **Install app** banner, tap that instead.)
3. Open **Brawnforge** from the home screen. Mara's face is the icon. It opens full screen.
4. Check offline: open the app once while online, turn on airplane mode, close it and open it again. It should still work.

---

## Part 3. Everyday use

- **Home:** tap your energy (1–5) and today's quest starts. Tiny Quest is always there, and always a full win.
- **Walk pad days (Mon, Wed, Fri bonus):** one part at a time with a draining bar. The phone buzzes when the pace changes, and the screen stays on. "End early" still counts.
- **Adventure:** hikes, skating, field days. Pick 15, 30 or 60+ minutes.
- **Done screen:** loot, Mara's power pose (tap her to skip it), the knee check, and **Open Hub** (a link to the Home Hub; its "Trained today" check-off arrives in v0.2).
- **💡 (top right):** catch an idea for later. Broken, Wish or Again.
- **⚙ Settings:** backup, your Someday list (Copy all), version and freeze days, equipment.

**Back up now and then.** Settings → *Save backup to Drive or Quick Share*. To move to a new phone
(or the Android app later), install the app there and use **Load backup file**. Loading adds; it never erases.

---

## Part 4. Using it on the computer

Double-click **start.bat**. It opens the app in Chrome at `http://localhost:8780`.
Keep the black window open while you use it. The computer keeps its own separate data.

---

## Part 5. Changing the app later

1. Edit the file(s) on your computer.
2. Open `sw.js` and change `CACHE_NAME` (for example `brawnforge-v1` to `brawnforge-v2`).
   In `js/version.js`, bump `version` and set `whatsNew` to one line.
   **This step matters.** The phone keeps its offline copy until `CACHE_NAME` changes.
   The version shows at the bottom of every screen, so you can see which one the phone is running.
3. On GitHub, open the repository, click **Add file → Upload files**, and drag in the changed files, keeping their folders. Commit.
4. Open the app on the phone while online, close it, and open it again. The second launch runs the new version. Your workouts aren't touched.

---

## How the code is organized

```
index.html             page shell: header, an empty <main> each screen draws into, the scripts in order
manifest.webmanifest   app name, icons, full-screen mode (lets Android install it)
sw.js                  service worker: saves the app files for offline use
start.bat              runs the app on the computer at http://localhost:8780
css/styles.css         the Home Hub look (colors and fonts at the top)
js/version.js          version, release date, freeze days
js/db.js               the on-phone database (IndexedDB), explained as SQL-style tables
js/ui.js               small helpers: escaping, dates, toast, buzz, screen-awake, evidence pop-up
js/sprite.js           draws Mara and the campfire from js/data/sprites.js
js/plates.js           which weights your plates can build
js/xp.js, progress.js  XP and levels; weight and rep progression
js/campfire.js         the forgiving streak, with Bedrolls
js/today.js            today's quest and how energy shapes it
js/backup.js           save and load backup files
js/someday.js          the 💡 idea catcher
js/home.js             Home
js/workout.js          strength quests and Tiny Quests
js/walk.js             walk pad
js/done.js             Done screen: loot, knee check, Open Hub
js/settings.js         Settings
js/app.js              starts the app and shows the screen for #home, #walk, #settings ...
js/data/               numbers and words you might change: exercises, walks, loot, tuning, links ...
icons/                 home-screen icons
tools/make_icons.py    draws the icons from Mara's portrait
```

### Troubleshooting
- **No "Install" option:** make sure the address starts with `https://` and ends with `/trainer/`. Wait a few minutes after turning on Pages.
- **Blank page:** `index.html` probably ended up inside a subfolder. It has to be at the top level of the repository.
- **Old version keeps showing:** bump `CACHE_NAME` in `sw.js`.
- **Workouts disappeared:** Settings → Load backup file, and pick your latest backup.
