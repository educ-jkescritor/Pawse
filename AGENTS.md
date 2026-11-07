# PAWSE — Agent Guidelines & Repository Rules

Guidelines for **any AI coding agent** (Claude, Gemini, Codex, Cursor, Copilot, etc.) working on the **PAWSE** codebase. Read this whole file before changing code. `CLAUDE.md` and `GEMINI.md` only point here; this file is the single source of truth.

---

## 1. Project Overview

PAWSE is a cross-platform (Windows, macOS, Linux) Electron desktop Pomodoro app with animated pixel-art cat companions, local durable session state, and local SQLite analytics. Everything runs offline; there is **no cloud sync on `main`** (see §8).

| Companion | `?cat=` key | DB `cat_type` | Work / Short / Long |
| :--- | :--- | :--- | :--- |
| Tux | `tuxedo` | `tuxedo_cat` | 25 / 5 / 20 min |
| Ginger | `orange` | `orange_cat` | 15 / 3 / 12 min |
| Void | `black` | `black_cat` | 50 / 10 / 40 min |

A full set is 4 work cycles; the long break comes after the 4th work session.

---

## 2. Source Map

| Path | Role |
| :--- | :--- |
| `src/main/main.js` | Main process: windows, IPC handlers, notifications, power/display events, auto-updater, launch on startup |
| `src/main/database.js` | SQLite open, schema migration, `generateAnalytics()` |
| `src/main/preload.js` | The only bridge to the renderer: exposes `window.mainAPI` via `contextBridge` |
| `src/renderer/index.{html,js}` | Companion picker (menu). On load: resets `timerRunning`, salvages orphaned sessions to the DB |
| `src/renderer/timer/timer.{html,js}` | Timer state machine, durable snapshot, audio, strict mode, mini-modes, notifications |
| `src/renderer/timer/dialogue{Data,Engine}.js` | Companion speech-bubble content and selection |
| `src/renderer/settings.{html,js}` | Settings + analytics dashboard (separate window) |
| `src/renderer/titlebar.js` | Frameless title-bar buttons shared by pages |
| `src/assets/` | Sprites, sounds, fonts, icons |
| `start.js` | Dev launcher (`npm start`); strips `ELECTRON_RUN_AS_NODE` |
| `tests/` | Jest unit/integration tests (see §7 for their limits) |

**Windows:** one main window shows *either* the menu *or* the timer (never both); settings is a second window.

| View | Size |
| :--- | :--- |
| Main (menu / timer) | 310 × 430 |
| Settings & dashboard | 736 × 430 |
| Timer-only widget | 240 × 100 |
| Cat-only widget | 240 × 240 |

UI changes must fit these exact sizes with no scrollbars or overflow.

---

## 3. Before You Change Anything

1. **Read the code you are changing and its callers.** Do not refactor broadly or delete working code without explaining why and getting confirmation.
2. **Check `git status` first.** If earlier fixes are still uncommitted, raise it before starting new work (see §9).
3. **Stack is fixed:** vanilla HTML/CSS/JS + CommonJS. Do not add frameworks, bundlers, or UI libraries unless the user explicitly asks.
4. **Preserve comments, author credits, and docstrings.** Document new IPC channels, schema changes, and time/state math.
5. **Reference files with relative paths** (e.g. `src/main/main.js:406`), never machine-specific absolute paths.
6. **Verify, don't assume.** Prove behavior in the running app (§7), and report honestly what was and wasn't tested.
7. **Explain plainly.** When describing a bug or change to the developer: say what the app's user experiences first, then the technical reason briefly. Keep it short, and end with one clear decision or question.

---

## 4. Security Rules (Non-Negotiable)

- Every `BrowserWindow` keeps `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`, and `devTools: !app.isPackaged`.
- The renderer never gets `require`, `fs`, `sqlite3`, or raw `ipcRenderer`. New capabilities go through a named method on `window.mainAPI` in `preload.js` plus a handler in `main.js`. Validate IPC input in the handler.
- Every HTML file keeps its strict CSP meta tag. Never allow `'unsafe-eval'` or remote sources.
- Navigation is blocked; external links only via `setWindowOpenHandler` → `shell.openExternal()` for the allowlisted hosts (GitHub, LinkedIn). Deny everything else.
- All SQL is parameterized (`?` placeholders). Never build SQL by string concatenation.
- **Never commit or package secrets or personal data:** `.env*`, keys, `config.js`, `*session*.json`, `*.db*`. Removing a file in a later commit does **not** remove it from git history.

---

## 5. Packaging & Release

- **`app.asar` is a plain archive, not protection.** Anyone can extract it. Treat everything packaged as public.
- `package.json` → `build.files` is an **allowlist** (`src/**/*`, `package.json`, excluding `*.db*`). electron-builder does **not** read `.gitignore`. Keep the allowlist; never switch back to "include everything". After build changes, verify with:
  `npx @electron/asar list dist/<platform>-unpacked/resources/app.asar | grep -v node_modules`
- `sqlite3` is a **native module**: build each OS/arch on that OS (no cross-building from WSL). `.node` binaries must stay in `app.asar.unpacked`.
- **Versioning:** the latest public release is **v1.1.0**, but `package.json` says `1.0.0`. The next release must be **higher than 1.1.0**, or the auto-updater won't offer it.
- Windows Store builds (`process.windowsStore`) are updated by the Store; electron-updater is skipped there.

---

## 6. Data, State & Timing Rules

### 6.1 Database (`src/main/database.js`)
- Dev uses `./pawse.db` in the project root; packaged builds use `app.getPath('userData')/pawse.db`. The asar is read-only.
- Table `session`; rows are keyed by `uuid` (unique). `save-session` is an **upsert of running totals** (not increments) → saving the same snapshot again is idempotent. Keep it that way.
- `total_pomodoro` uses `MAX()` on conflict so a completed set can't be un-credited.
- Dates are stored as UTC `YYYY-MM-DD HH:MM:SS`; analytics converts to local days in JS.
- Known caveat: on upsert, `date_completed` becomes the latest save time (the `COALESCE` fallback to the old value never applies).
- Migrations are ad hoc (`PRAGMA table_info` + `ALTER TABLE`). Schema changes must be backward-compatible with existing user DBs.

### 6.2 Durable snapshot (`localStorage['pawseDurableState']`)
- Written every second by `timer.js`. Fields: `catType, sessionUuid, remainingTime, workingTime, cycleCount, isRunning, actualWork, actualBreak, flushedWorkSeconds, flushedBreakSeconds, workCount, breakCount, strictMode, timestamp`.
- Restored only for the **same cat** within **12 h**. Crash time is frozen, not deducted.
- **Strict sessions** restore running; normal sessions restore paused.
- The menu (`index.js`) salvages any snapshot with work/break time to the DB **before** a timer page can overwrite or discard it.
- Removed on normal exit (`beforeunload`) and on Home/Return to Menu.
- Chromium writes localStorage to disk **in batches**: a hard kill can lose the last ~15 s. Don't promise "exact" recovery.
- Any new timer state must be added to **both** runtime variables and the snapshot.

### 6.3 Other localStorage keys
`timerRunning` (locks the Strict Mode toggle; `'true'` only while a timer page is open), `strictMode`, `alwaysOnTop`, `launchOnStartup`, `ambientVolume`, `purrVolume`, `alarmVolume`, `tickVolume`, `companionVolume`, `clickSound`, `pawseLastUpdateCheck`. `autoStartPomodoros` / `autoStartBreaks` are saved by Settings but **not used anywhere yet**.

### 6.4 Timing
- The countdown uses **`performance.now()`** (monotonic, immune to clock changes, doesn't advance during OS suspend). Do not switch it back to `Date.now()`.
- Calendar logic (midnight rollover, 12 h staleness, analytics days) uses `Date`, which is correct for dates.
- A gap of more than 15 s between ticks is a freeze: it's never counted as work. Normal mode pauses; strict mode discards the gap and keeps running.

### 6.5 Strict Mode invariants
- Strict mode blocks **pausing and skipping, never resuming**. The app itself can pause (OS sleep, crash restore), so Play must stay usable when the timer isn't running, or users get locked out.
- Strict mode belongs to the **session**: `strictMode` = setting **or** the restored snapshot's flag.
- Strict mode auto-resumes on `system-resume`, but only for OS-caused pauses (`autoPausedBySystem`), never over a pending modal or ringing alarm.
- Exiting is always allowed; the honest cost is shown in the exit modal.

### 6.6 JavaScript gotcha in `timer.js`: temporal dead zone
`startTimer()` can run during page load, **before** the `let`/`const` button bindings and `strictMode` are declared further down. Touching them early throws. `syncStrictModeButtons()` is guarded by `var controlsReady`. Callbacks (intervals, timeouts, IPC events) run after the script finishes and are safe. Keep this in mind when calling UI helpers from timer functions.

---

## 7. Testing & Verification

### 7.1 Current state of the repo's tests (read this first)
- `npm test` runs Jest (62 tests). **They copy logic inline instead of importing the real modules**, and `tests/integration/database.test.js` builds its own schema instead of loading `src/main/database.js`. If `timer.js` breaks, these tests still pass.
- There are **no end-to-end (E2E) tests and no CI**.
- So **"tests pass" does not mean "the app works."** Never present Jest results as proof of a behavior change.
- Industry standard (planned, post-deadline): unit tests that import real modules, an integration test against the real `database.js`, Playwright `_electron` E2E tests in `tests/e2e/`, and CI running them on Windows, macOS, and Linux.

### 7.2 Test levels: what each proves

| Level | What it is | Proves | Does NOT prove |
| :--- | :--- | :--- | :--- |
| **L0** | `node --check <file>` | The file parses | Any behavior |
| **L1** | Jest (`npm test`) | The copied logic is correct | That the real app works (§7.1) |
| **L2** | Sandbox, dev mode (§7.4) | Real app behavior on the agent's OS (usually Linux/WSL) | Packaged build; other OSes |
| **L3** | Sandbox, packaged build (`npx electron-builder --dir`) | The build users get, on the agent's OS | Windows/macOS timing and OS integrations |
| **L4** | Manual on the target OS with the real installer | Production behavior | Only as reliable as the steps followed |

### 7.3 Rules when the developer asks for a test
1. **Run the highest level you can** (normally L2, L3 for packaging or startup changes) without asking. Don't stop at L0/L1.
2. **Never touch the developer's real data.** No real `pawse.db`, no real app profile. Always use the sandbox.
3. **For fixes, test before AND after.** Reproduce the bug first, then show it gone with the same steps.
4. **Timing and race bugs: repeat and report a rate** (e.g. 20 runs, "3/20 failed"), never a single pass/fail. A sandbox pass does not prove a race is gone on slower machines.
5. **Test both strict and normal mode**, and confirm existing behavior didn't change (regression check).
6. **If L4 is needed** (Windows/macOS-specific behavior, installers, notifications, auto-update, launch on startup), give the developer exact numbered manual steps and the expected result.
7. **Report honestly** with the standard disclaimer (§7.5). Include failures and any test-harness problems, not just successes.
8. Test scripts go in a temp/scratch directory, not the repo, until `tests/e2e/` exists.

### 7.4 Sandbox recipe (L2/L3)
1. **Copy the app:** create a temp dir, copy `src/` and `package.json`, and symlink `node_modules` to the repo's. For L3, run `npx electron-builder --linux --dir -c.directories.output=<temp>` and use `<temp>/linux-unpacked/`.
2. **Launch isolated:** `env -u ELECTRON_RUN_AS_NODE <app>/node_modules/electron/dist/electron . --user-data-dir=<temp-profile> --remote-debugging-port=9333 --inspect=9334`
   - `--user-data-dir` gives a fresh localStorage and, for packaged builds, a fresh `userData/pawse.db` (verified: `app.getPath('userData')` returns the given directory). In dev mode the DB is `<copy>/pawse.db`, inside the copy, not the repo.
   - Wait 2–3 s after launch before querying; inspector calls made before the app is ready can return nothing.
3. **Drive the renderer** over the Chrome DevTools Protocol: `GET http://127.0.0.1:9333/json` → the page's `webSocketDebuggerUrl` → `Runtime.evaluate`. Top-level `let`/`const` in `timer.js` (e.g. `cycleCount`, `isRunning`) can be read by name. Node 22 has a global `WebSocket`, so no packages are needed.
4. **Drive the main process** over the Node inspector (port 9334), e.g. simulate OS sleep/wake:
   `process.mainModule.require('electron').BrowserWindow.getAllWindows()[0].webContents.send('system-suspend')`
5. **Simulate events:**
   - Freeze: CDP `Debugger.pause` for 20 s, then `Debugger.resume`
   - Crash: `pkill -9` on the launched Electron (wait 10–15 s first; localStorage writes to disk in batches)
   - Clock change: override `Date.now` in the page
   - Normal close: click the real UI (✕ → confirm), don't kill
6. **Check results** by reading the sandbox DB with `sqlite3` (read-only) and/or `localStorage`.
7. **Clean up:** kill all launched processes and leave no stray Electron running. Make kill patterns unable to match your own shell command line (e.g. `pkill -9 -f "remote-debugging-port=933[3]"`). Matching your own command kills the test runner.
8. Use a **fresh profile directory per run** so runs don't affect each other.

Think in **state × event** pairs when choosing scenarios. States: work running, break running, paused, mid-set modal / alarm, final modal, mini-mode waiting at 00:00. Events: crash, sleep/wake, freeze, clock change, midnight, quit, update restart, settings change.

### 7.5 Standard disclaimer for every test report
End every test report with the level reached and what was not covered, for example:

> **Verified at L2** (sandbox, dev mode, Linux/WSL), 20/20 runs passed, strict and normal mode.
> **Not verified:** packaged build (L3), Windows and macOS (L4). Jest (L1) does not cover this code path.

Never describe a change as "production-ready" or "fully tested" unless L4 was done on every affected OS.

---

## 8. Platform Notes & Known Open Issues

Platform notes:
- **Linux/Wayland:** `alwaysOnTop`, window positioning, and `flashFrame` are ignored. AppImage needs `libfuse2` and hits the Chromium sandbox restriction on Ubuntu 24.04+.
- **macOS:** builds are unsigned and not notarized, so downloaded builds won't open and auto-update needs signing. Floating widgets don't follow across Spaces.
- **Windows:** NSIS installer is unsigned (SmartScreen warning). In the Store (MSIX) build, launch on startup needs a `StartupTask` manifest entry. Verify toast activation in the Store build.

Known open issues (check before "fixing" adjacent code):
- Crash while the **final** "Pawsome Job!" modal is open → restore pushes `cycleCount` past 4 and the pomodoro is never credited.
- After a restore, the fish counter shows 0 until the next phase change.
- The last save on quit (`beforeunload` → fire-and-forget IPC) can lose the race with app exit; "Restart & Update" doesn't warn mid-session.
- `.deb` updater gets stuck on "Downloading…" (`autoDownload` is off and `download-update` has no handler).
- The Windows toast re-present loop has no retry cap (Focus Assist / DND).
- No logging or crash handling in packaged builds; `console.log` is silenced.
- Midnight rollover is only checked while the timer is ticking.
- Supabase sync existed on `feature/supabase-integration` / `release/v1.1.0` but is **not on `main`**. If it's reintroduced: guest (`email = 'guest'`) data must never sync, sync must be incremental via `uuid` + `is_synced`, keys must not be committed, and RLS must be enabled on every table.

---

## 9. Git: Staging & Commit Rules

- **Never commit or push unless the user explicitly asks.** "Do not commit" is common during review. The user sometimes commits manually.
- **One fix per commit.** Don't let multiple fixes pile up uncommitted; if they have, propose splitting them into separate commits before continuing.
- **Stage explicit paths only.** Never `git add -A` / `git add .`: the working tree can contain `pawse.db`, build output, or secrets.
- Before committing, run `git status` and `git diff --stat`, and confirm only the intended files and lines changed.
- Commit message style: lowercase conventional prefix, e.g. `fix: ...`, `feat: ...`, `task: ...`, `update: ...`.
- **Line endings:** `src/renderer/index.js` has **mixed CRLF/LF** and `core.autocrlf=true` is set. Editors and agent tools may normalize the whole file, making the diff show every line changed. If `git diff --stat` shows whole-file churn, restore the original endings before committing.
- Work on a branch, not `main`. Don't rewrite published history without explicit approval.

---

## 10. Pre-Commit Checklist

- [ ] Security settings, CSP, and the preload-only IPC rule are intact.
- [ ] All SQL is parameterized; schema changes are backward-compatible.
- [ ] New timer state is in both runtime memory and the durable snapshot.
- [ ] The timer still restores correctly after a hard kill (strict and normal).
- [ ] Works offline; no new network calls or secrets.
- [ ] UI fits the fixed window sizes; uses existing CSS tokens (`--text-black`, `--sys-blue-*`, `--theme-*`) and fonts (`Pixelify Sans` for timer/headers, `Inter` for body).
- [ ] Verified in the running app (L2+), not just with Jest; test report includes the §7.5 disclaimer.
- [ ] One fix per commit; explicit paths staged; no line-ending churn.
