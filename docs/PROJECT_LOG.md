# PAWSE — Project Log

The project's shared memory for **any AI agent or developer**: what was found, decided, tested, and fixed, and why. It survives across sessions and across AI tools.

- **Read Parts 1–4 before starting work.** Read Part 5 when touching an area with history.
- **After each fix:** update Parts 1, 3, and 6 **in the same commit** as the fix.
- Git is the source of truth for *what* changed; this log records *why*, *what was learned*, and *what's still open*. Link commits by short hash.
- **This repo is public.** Never write secrets, IDs, emails, personal data, or machine paths here. Describe security incidents in general terms. Refer to people by role.

Rules for how to work live in [`AGENTS.md`](../AGENTS.md). This file is status and history.

---

## Part 1 — Current Status

_Last updated: 2026-11-13 (unused sprites removed)_

**Next up (agreed path to release):**
1. ~~**N1:** crash during the final "Pawsome Job!" modal loses the Pomodoro~~ ✅ done
2. ~~**README:** remove overclaims~~ ✅ done
3. ~~Version bump~~ not needed: **v1.0.0 is the first official release** (D16)
4. **Manual testing (L4):** checklist written in [`docs/RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) for Windows, macOS, and Linux. **Not run yet.** Windows can be tested now; macOS and real-Linux testing are **deferred** (no test machines). Run at least Windows before publishing v1.0.0 following D16 (delete the old v1.1.0 release and tags first)
5. ~~**N8:** saves could roll stored focus time back~~ ✅ done (`478cf5d`)
6. ~~**N3:** crash backup written through the main process to a file every second~~ ✅ done (`796810a`)
7. ~~**N7:** crash during a break's skip confirmation resumed one cycle ahead~~ ✅ done (`47748f1`)
8. ~~**Wording:** README and `AGENTS.md` §6.2 describe the file-based crash backup~~ ✅ done (`63ce2e4`)
9. ~~**N2:** fish counter showed 0 after a crash restore~~ ✅ done (`eaef332`)
10. ~~**N4:** exit dialog said progress wouldn't be saved~~ ✅ done (`e1e80a2`)
11. **Phase 2 (dashboard and data), decided 2026-11-13:** ~~N6 latest week request wins~~ ✅ (`81cc5c4`) → ~~N5 "Couldn't load" state~~ ✅ (`75774eb`) → ~~A10 (+ A9) a session never crosses midnight~~ ✅ (`ddf779a`)
12. **Phase 3 (polish):** ~~Q5 window titles~~ ✅ (`0284590`) → ~~Q3 IPC sender checks~~ ✅ (`1d9d49a`) → Q4 (auto-start: hide in v1.0.0; build on branch `feature/auto-start-timer`, created 2026-11-13 from `ddf779a`) → Q8 `LICENSE` (needs the copyright holder name)
13. **Release prep:** ~~release checklist updated for the recent fixes~~ ✅ (`1941571`) → ~~new Tux sprites wired in~~ ✅ (`06f2fc5`; art `4731224`, `6833a72`) → ~~menu and About animations random, no two cats starting together~~ ✅ (`76cc88a`) → ~~petting animation plays once (no first-frame flash)~~ ✅ (`6db9ccb`; Tux break art `4ee0fd7`) → ~~11 unreferenced sprites removed~~ ✅ (_(this commit)_) → Q8 license + asset notices (on hold: names, sound sources) → user exports sprites → Windows checklist (R5) → delete old GitHub release/tags → version bump + preview notes → publish. Open decision: the old Auto-Start Timer toggle (does nothing) ships in v1.0.0 unless hidden

After release: R2 icon (needs a designer asset), then the 💤 items below.

Legend: ✅ done · ⏳ in progress / partly done · ❌ open · 💤 deferred (post-deadline)

### Release blockers (deadline)

| ID | Issue (user impact) | Status | Commits / notes |
| :--- | :--- | :--- | :--- |
| A1 | Builds packed everything in the project folder (including a local dev DB) into `app.asar` | ✅ | `a1b7d0d`: `build.files` allowlist |
| A1b | An older public release contained bundled credential/session files | ⏳ | Credentials revoked and RLS verified. **Still to do:** delete the old v1.1.0 release and the v1.1.0 / v1.0.0 tags before publishing v1.0.0 (D16) |
| A2 | Strict Mode: after sleep/crash the timer was paused with Play disabled (user locked out) | ✅ | `9ea9609`, `117bcbd` |
| A3 | Crash + picking a different cat (or returning after 12 h) lost unsaved work | ✅ | `6c636dd`: menu salvages the snapshot to the DB |
| A4a | "Restart & Update" ended a running session without warning | ✅ | `4c76f49`: two-click confirm, red "Restart Anyway". The red styles were accidentally deleted by `06d15c2` (sidebar update) and restored in `8d6a188` |
| A4b | Quitting while a save was in flight crashed the app on exit (abort, code 134) | ✅ | `4412524`: wait for saves, close DB, 4 s limit |
| A5 | Windows: notification re-shown in a tight loop when Windows closes it immediately (DND / Focus Assist / notifications off) | ✅ | `3fb78d4`: respect DND (stop if closed < 2 s), cap 6 re-shows, handle `failed`. Simulated: 285 → 1 notification (D13) |
| A5b | macOS/Linux: any notification close (including auto-expiry or DND) stopped the alarm sound after a few seconds | ✅ | Same commit as A5: only a confirmed user dismissal (Windows `userCanceled`) silences the alarm (D13) |
| A6 | Linux `.deb`: update check stuck on "Downloading…" forever | ✅ | `61ccd47`: macOS and `.deb` builds show a **Download** button that opens the GitHub release page; Windows `.exe` and AppImage keep in-app updates (D9) |
| N1 | Crash while the **final** "Pawsome Job!" modal is open → restore pushes `cycleCount` past 4; the completed Pomodoro is never credited | ✅ | `125d970`: the Pomodoro is saved when the set completes naturally (not on "Return to Menu"), and the crash snapshot is retired so a finished set is never resumed. The menu also credits old-style "cycle 4, 00:00" snapshots (D15) |
| R1 | Windows in-app updates would fail: the installer was named with spaces (`Pawse Setup X.exe`), GitHub's web upload turns spaces into dots, but `latest.yml` points to a dashed name. Confirmed on the published v1.1.0 release | ✅ | `nsis.artifactName = "${productName}-Setup-${version}.${ext}"` (D14) |
| — | Release version | ✅ | No bump: the GitHub v1.1.0 release was a test build, so the first official release is **v1.0.0** after the old release and tags are deleted (D16) |
| R2 | App icon `logo.png` is 370×350 (not square, small). macOS wants ≥ 512×512 (1024×1024 standard); Windows wants square | ❌ | Needs a square 1024×1024 PNG |
| R3 | Microsoft Store tile images: no `build/appx/` assets, so the Store package may use electron-builder placeholders | ❌ | Check the Store listing |
| R4 | Intel (x64) macOS build has never been run | ❌ | L4 on an Intel Mac |
| R5 | **Manual testing (L4) not done on any OS yet.** Every fix so far is verified only at L2 (Linux/WSL, dev mode) | ❌ | Run `docs/RELEASE_CHECKLIST.md`: Windows (machine available), macOS and real Linux (deferred, no machines). Record results in the checklist and in Part 3 |
| — | README overclaims ("exact elapsed-time" recovery, cat facts on petting, "lightweight") | ✅ | `7e39326`: recovery section rewritten to match the code (time frozen, salvage to stats, strict resumes running, finished sets saved at completion, last few seconds may be lost); cat facts → companion dialogue; per-platform update behavior; Strict Mode blocks pausing and skipping; settings size 736; `docs/` folder; per-OS build commands; Node 20+. Version badge stays 1.0.0. Still open: missing `LICENSE` file (Q8) |

### Fixed along the way
| ID | Issue | Commit |
| :--- | :--- | :--- |
| A8 | Countdown used the wall clock: clock changes grew the timer or let users finish early and inflate stats | `b809bac` |
| A11 | `timerRunning` stayed `'true'` after a crash, locking the Strict Mode toggle | `225be0c` |
| S1 | Strict Mode could be escaped by force-quitting, turning strict off, and resuming the same session | `117bcbd` |
| — | `GEMINI.md` was stale (described features not on `main`); replaced by tool-agnostic `AGENTS.md` | `7778bac`, `d2b7a84` |

### Open: data & state
| ID | Issue | Status |
| :--- | :--- | :--- |
| N2 | After any restore, the fish (cycle) counter showed 0 until the next phase change: `updateSessionCounter()` was only called when a cycle completed or a skip was cancelled, never when the timer screen opened | ✅ | `eaef332`: call `updateSessionCounter()` once at load, next to the initial time paint (new session → 0 fish; restored → real count) |
| N3 | The crash backup lived only in localStorage, which Chromium writes to disk about once a minute, so after a crash the timer resumed up to a minute behind (measured: crash at 15 s → rewound 12 s; at 45 s → rewound 43 s) | ✅ | `796810a`: the timer also sends its snapshot every second to the main process, which writes `durable-state.json` in the user-data folder (temp file + rename, so never half-written). The file is the authority once it exists; clearing writes a `{"cleared":true}` marker. localStorage is still written (Settings dashboard live time) and read only when no file exists (first launch after updating from a version without the file). After: crash at 15/45/~58 s resumes **exactly** where it stopped (D18) |
| N9 | Ending a session (Home / normal close / finished set) and crashing within about a minute **resurrected the ended session**: the localStorage deletion hadn't reached disk, so picking the same cat resumed it (pre-existing; reproduced on the pre-N3 code) | ✅ | Same commit as N3: the file's "cleared" marker is authoritative, so a stale localStorage copy is ignored (D18) |
| N4 | Normal-mode exit dialog said "Your progress won't be saved", but leaving the timer always saves the focus time (`beforeunload` → `flushSessionData`) | ✅ | `e1e80a2`: `timer.html` text is now "Returning home ends this session. Your focus time so far is still saved." (matches the strict-mode wording) |
| N5 | When the stats couldn't be read, the dashboard showed a brand-new user (zeros, "No sessions yet", "No sessions recorded for this week") or stayed at its blank defaults (week label "Date"), with no message: users could think their history was wiped. Cause: `generateAnalytics()` turned query errors into zeros, and `loadAnalytics()` had no error handling | ✅ | `75774eb`: `database.js` rejects when the first query fails; `loadAnalytics()` catches it and calls `showDashboardLoadError()` (D20). Drawing code split into `renderDashboard()` unchanged, so the failure state draws the normal empty layout first |
| N6 | Fast week navigation: several dashboard loads in flight answered in any order and the last-arriving (possibly older) one was drawn, while the app believed it was on the newest week. Measured: answers scrambled in 20/20 bursts of concurrent loads; at realistic click speed 0/20 today (a load takes ~7 ms), more likely with years of history or slow/busy machines | ✅ | `81cc5c4`: each `loadAnalytics` call gets a request number; only the newest may draw |
| N7 | Crash while a break's **skip confirmation** ("End Break Early?" / "Finish Session?") was open resumed **one cycle ahead**: pressing Skip already ran `cycleCount++`, so the backup saved "still in the break" together with "cycle already counted". On the long break this led to "5 cycles". Normal mode only (Skip is blocked in strict) | ✅ | `47748f1`: on a manual skip the cycle is only counted when the user **confirms** (inside the modal's action); natural endings still count it immediately (D19). Reproduced before: cycle 1 → 2 and 3 → 4 after crash; after: stays 1 and 3 |
| N8 | A save always **overwrote** the session's totals, even with older, smaller values. A crash backup up to a minute old (N3) salvaged by the menu rolled stored work back (3600 s → 1 s) | ✅ | `478cf5d`: on conflict the upsert keeps the **larger** value for all five totals (`MAX(COALESCE(old, 0), COALESCE(new, 0))`); totals only grow per uuid, so the larger is always the newer. Remaining after N8: the resumed **timer** can still rewind up to ~1 minute and the redone minute is not added again (stats can be up to ~1 minute short, never higher, never rolled back) → fixed by N3 (D17) |
| A9 | Upsert overwrites `date_completed` with the latest save time, so a session crossing midnight was dated entirely on the later day | ✅ | Resolved by A10 (`ddf779a`): a session can no longer span two days, so "date of its latest save" is always the right day. No SQL change |
| A10 | The "new day?" check only ran while the timer ticked, so a session paused, closed, or crash-resumed across midnight was saved entirely on the new day (yesterday's work moved to today; daily totals, weekly chart, and streaks wrong). It also compared only `getDate()` (day of month) | ✅ | `ddf779a`: `rolloverIfNewDay()` runs before every save and every second while ticking; it saves the old day's part dated 23:59:59 of that day and continues under a new session ID. Days compared by year + month + day. `sessionDate` is stored in the crash backup and restored (D21) |
| A12 | DB open/migration failures are silent; no schema version (`user_version`) | 💤 |
| A13 | Dev-only: DB copied between root and AppData without its `-wal` file | 💤 |

### Open: platforms & packaging
| ID | Issue | Status |
| :--- | :--- | :--- |
| P1 | Linux Wayland ignores always-on-top, window positioning, and `flashFrame` (mini-widget won't float) | 💤 |
| P2 | AppImage needs `libfuse2` and hits the Chromium sandbox restriction on Ubuntu 24.04+ | 💤 |
| P3 | Linux autostart `.desktop` icon points inside the asar; ignores `$XDG_CONFIG_HOME` | 💤 |
| P4 | macOS builds unsigned / not notarized (downloaded builds won't open; auto-update needs signing) | 💤 business decision |
| P5 | macOS floating widget doesn't follow across Spaces / full-screen apps | 💤 |
| P6 | Microsoft Store (MSIX): launch on startup needs a `StartupTask` manifest entry | 💤 |
| P7 | Store build: toast activation with a custom AppUserModelId needs L4 verification | 💤 |
| P8 | Windows NSIS installer is unsigned (SmartScreen warning) | 💤 |
| P9 | Launch at login steals focus | 💤 |

### Open: quality & operations
| ID | Issue | Status |
| :--- | :--- | :--- |
| Q1 | Jest tests re-implement logic instead of importing real modules; no E2E tests; no CI | 💤 Plan: Playwright `_electron` + CI on 3 OSes |
| Q2 | No logging or crash handling in packaged builds (`console.log` silenced) | 💤 |
| Q3 | Window IPC handlers crashed the main process when the message came from a window that was already gone (a click while a window closes, or a notification clicked after its window closed): `BrowserWindow.fromWebContents()` itself throws "Object has been destroyed", so even the handlers that null-checked its result failed (6/6 in testing) | ✅ | `1d9d49a`: `windowFromEvent(event)` returns the window or `null` without throwing (checks the sender first); all 9 lookups use it; maximize, close, and restore (including its 500 ms timer) now handle `null` |
| Q4 | `autoStartPomodoros` / `autoStartBreaks` toggle is saved but does nothing | ❌ |
| Q5 | Timer window title was "Document" (template placeholder) in the taskbar, Alt+Tab, and Task Manager; menu and Settings fell back to the package name ("pawse" in dev) | ✅ | `0284590`: explicit `<title>`: menu and timer "Pawse", Settings "Pawse Settings" (tells the two windows apart) |
| Q6 | `ambient.mp3` is 36 MB (~75% of the asar) | 💤 |
| Q7 | No tray / menu-bar presence | 💤 feature |
| Q8 | README links a `LICENSE` file that doesn't exist (MIT not actually granted) | ❌ |

---

## Part 2 — Decisions (and why)

| ID | Decision | Why |
| :--- | :--- | :--- |
| D1 | `build.files` is an **allowlist** (`src/**/*`, `package.json`, no `*.db*`) | electron-builder ignores `.gitignore`; a blocklist leaks new files by default. `app.asar` is publicly extractable |
| D2 | Strict Mode blocks **pausing and skipping, never resuming** | The app itself pauses (sleep, crash restore, freezes); blocking resume locked users out |
| D3 | Strict Mode belongs to the **session** (stored in the snapshot) | Otherwise force-quit → toggle off → resume escapes strict mode |
| D4 | Strict sessions resume **immediately** after crash restore and on system wake; normal sessions restore paused | Prevents sleep/force-quit acting as a pause in strict mode. No resume countdown modal (no UI for it yet) |
| D5 | Leaving a strict session is always allowed; the exit modal states the cost | Trapping users only leads to force-quits; quitting is honest (focus time saved, no Pomodoro credit) |
| D6 | Countdown uses `performance.now()`; calendar logic uses `Date` | Monotonic clock is immune to clock changes and doesn't advance during suspend |
| D7 | Orphaned snapshots are salvaged **on menu load**, kept in place, dated to their last activity | Menu always loads before a timer page can overwrite/discard them; the uuid upsert of running totals makes repeat saves idempotent |
| D8 | Shutdown: wait for pending saves on `will-quit`, then `closeDatabase()`; limit **4 s, must stay above `busy_timeout` (3 s)** | `before-quit` fires before windows close (would block the timer's final save). A limit shorter than `busy_timeout` exits with a save still waiting → crash on exit |
| D9 | **Update method per build.** In-app (download, then Restart & Update): Windows `.exe`, Linux AppImage. Manual (**Download** button → latest GitHub release page): macOS (all chips) and Linux `.deb`. Store: unchanged. Decided by `supportsInAppUpdate` in `main.js`; `MAC_IN_APP_UPDATES = false` until macOS builds are signed with an Apple Developer ID | Mac in-app updates require a Developer ID signature. In-app `.deb` install (electron-updater `DebUpdater`, `dpkg` via a sudo prompt) varies by desktop and can't be tested before the deadline. Option (b) remains possible later; option (c) (no `.deb`) was rejected because the AppImage has its own Ubuntu 24.04 issue (P2) |
| D10 | Restart & Update during a session: first click warns (red "Restart Anyway", one-line message), second click within 6 s restarts | Destructive action needs confirmation; matches industry convention for destructive buttons. Message kept to one line like other Settings descriptions |
| D11 | Agent docs: `AGENTS.md` is the single source of rules; `CLAUDE.md` / `GEMINI.md` are 1-line pointers; status/history lives here | Every AI tool reads the same rules; rules file stays short because it loads every session |
| D12 | One fix per commit; agents don't commit unless asked | Reviewable, revertable history |
| D21 | **One session, one day.** Before any save, if the local day changed since the session started, save the old part dated 23:59:59 of its day and continue under a new uuid (`rolloverIfNewDay()`). The session's day travels with the crash backup | A row's date is its latest save time (A9); without the split, any save after midnight moved the whole session to the new day. Splitting at the source avoids changing the SQL and keeps every row on exactly one day |
| D20 | **Dashboard load failure ("Option 2", mock-up approved 2026-11-13):** the date line stays; the three card values show "—" with "Couldn't load" underneath; the chart's empty-state text says "Couldn't load your dashboard. Press refresh or reopen Settings."; the week label still shows the requested week. Refresh (↻) or reopening Settings retries; a successful load restores everything | Never show zeros that look like "no history". Reuses the existing empty-chart text spot and refresh button, so no new UI. The date line is redrawn every second, so a message there would vanish; the chart area is where the data would be |
| D19 | **Confirmation dialogs only ask; the confirm action does.** No session state changes when a confirmation modal opens; changes are applied in its confirm callback | A crash while a dialog is open must leave a consistent state (the backup is written every second). Also makes Cancel trivially correct (nothing to undo) |
| D18 | **Crash backup lives in a main-process file** (`durable-state.json` in user data), written every second (temp + rename), read synchronously once per page (`sendSync`, small file). **The file is the authority once it exists**; clearing writes `{"cleared":true,"timestamp"}` instead of deleting. localStorage keeps a copy for the Settings dashboard and is read only when no file exists (upgrade from an older version). Corrupt file → treated as no backup | localStorage reaches disk only about once a minute; a file write reaches the OS immediately and survives an app crash (not guaranteed on a sudden power cut without fsync). A deleted file would make the page fall back to a stale localStorage copy and resurrect ended sessions (N9) |
| D17 | **Session totals are monotonic per uuid; the save keeps the larger value** (N8). The crash backup's staleness is fixed at the source (N3), not by reconstructing timer state from the database | Totals only increase within a session (midnight starts a new uuid; cancelling a skip restores equal counts; only restoring an old backup lowers them). The database stores totals but not phase, cycle, or remaining time, so it can't tell the timer where to resume; a fresher backup can |
| D16 | **First official release is v1.0.0.** Before publishing: delete the GitHub release v1.1.0 and the tags v1.1.0 / v1.0.0 (earlier test builds). Publish **one** release containing every OS's files plus `latest.yml` / `latest-mac.yml` / `latest-linux.yml`, as a normal (non-draft, non-pre-release) release. Steps in `AGENTS.md` §5 | The updater offers the newest published release; a leftover 1.1.0 would be offered to 1.0.0 users as an "update" back to the old test build (with known bugs and bundled private files). Each OS reads only its own `latest*.yml`, so one release serves all three |
| D15 | A naturally completed set is **saved at completion** (`flushSessionData(true)`), the crash snapshot stops (`setFinished`), and the menu treats a "cycle ≥ 4, break, 00:00" snapshot as finished (credit + remove). Skipping the final break still earns no Pomodoro | A finished set must not be resumable, and the result must not depend on clicking "Return to Menu". Repeat saves are safe (`MAX(total_pomodoro)`) |
| D14 | Installer file names never contain spaces (`nsis.artifactName`). Release formats stay as-is: Windows `.exe` + Store `.appx`; macOS `.dmg` + `.zip` (arm64 and x64); Linux AppImage + `.deb`. No `.rpm`/Snap/Flatpak until users ask | The updater matches files by exact name, and GitHub's web upload rewrites spaces. The current format set matches common Electron apps; each extra format adds build/test/support cost. A universal macOS `.dmg` (one file for both chips, ~2× size) is an optional later improvement |
| D13 | **Notifications respect Do Not Disturb; the alarm sound does not.** Windows: re-show only if the toast was visible ≥ 2 s, max 6 times; otherwise leave it in the Action Center (click handler kept). macOS/Linux: a notification closing never stops the alarm; it stops on user action or the 30 s auto-silence | Industry standard: apps don't bypass DND, but timers/alarms the user set still ring (Clock apps). Electron can't query DND, so suppression is inferred from a fast close. Only Windows reports *why* a toast closed; on macOS/Linux an auto-expired notification silenced the alarm after ~5 s |

---

## Part 3 — Test Results

Levels: L0 parse · L1 Jest · L2 sandbox dev · L3 sandbox packaged · L4 manual on target OS (see `AGENTS.md` §7).

| Date | What | Level | Result | Not verified |
| :--- | :--- | :--- | :--- | :--- |
| 2026-11-07 | `build.files` allowlist: asar contents | L3 (Linux `--dir`) | Only `package.json`, `src/`, production `node_modules`; sqlite3 `.node` in `app.asar.unpacked` | Windows/macOS builds |
| 2026-11-07 | Strict lockout fix: freeze, crash restore, running (manual + DevTools) | L2 + manual | Play enabled after auto-pause; pause still blocked | L4 sleep on Windows/macOS |
| 2026-11-07 | Orphan salvage: idempotency of the real upsert SQL | L1-style (real SQL, in-memory DB) | 1 row after repeated saves; resume updates same row; different cat → separate row | — |
| 2026-11-07 | Strict escape via force-quit + toggle off (before fix) | L2 | Escape confirmed: same session resumed with skip/pause available | — |
| 2026-11-07 | Strict session integrity, auto-resume, freeze, clock tamper (after fix) | L2 | All pass: resumes running & strict; 20 s freeze not counted; wake auto-resumes; +50 s clock jumps counted as 5 s. Normal mode regression unchanged | L4 sleep events on Windows/macOS |
| 2026-11-07 | Final-modal crash boundary (N1) | L2 | Bug reproduced 5/5: cycle 4 → 5, wrong modal | — |
| 2026-11-08 | Save on quit (A4) | L2 | 0/40 lost (20 window close, 20 app quit) | L3, L4 |
| 2026-11-08 | Exit with DB briefly locked, before fix | L2 (no debugger) | Session saved, but **5/6 aborted on exit** (code 134) | Real antivirus/slow disk |
| 2026-11-08 | Restart confirmation (A4a) | L2 (update simulator) | Warn → revert after 6 s; second click restarts; no session → one click; red `#E5484D`; one-line message | Real `quitAndInstall` (L3/L4) |
| 2026-11-08 | Notifications (A5/A5b), before → after. Fake OS notification in the sandbox (no debugger), real session completion | L2 (simulated OS) | Windows DND-like (closed in 0.1 s): **285 → 1** shown, alarm full 30 s · Windows normal (5 s): 6 → 6 · Linux expiry (5 s): alarm stopped at ~5 s → **full 30 s** · user dismiss (Windows): alarm stops (unchanged) · `failed`: 1 show, no retry | **L4: real Focus Assist / DND on Windows, macOS Focus, Linux desktops (GNOME/KDE)**; Action Center click after suppression |
| 2026-11-08 | Final-modal crash (N1), before → after. Sandbox jumps to "3 cycles done, final break ending" and completes naturally; SIGKILL with the final modal open, then reopen | L2 (no debugger) | Before: `pomodoro 0`. After: **`pomodoro 1`** in normal and strict (3/3) · normal finish credits once, normal + strict · skip final break: work saved, `pomodoro 0` (unchanged) · old-style snapshot credited by the menu and removed · separate probe: snapshot removal at completion reached disk; after crash + reopen, no snapshot (fresh start) | The N1 harness reopened onto an early stale snapshot in every run; dedicated probes did not reproduce this, so it is treated as a harness artifact (cause not found). It exposed N8. Not verified: L3/L4 |
| 2026-11-08 | localStorage durability (N3), counter written every second, SIGKILL at 60 s | L2 | Menu page 58/60 survived; timer page 56/59 (snapshot) and 57/60 (probe), also across set completion | Other OSes; power loss | **Superseded 2026-11-12:** those counts were taken right after a disk save; see the save-timing row above.
| 2026-11-08 | Update flow per build (A6), dev update simulator in the sandbox, platform faked only for the update decision, "open URL" stubbed | L2 (simulated builds) | `.deb`: Check → "PAWSE v1.1.0 is available." [Download] → release page opened, message "Download page opened in your browser." · macOS: same · AppImage: Restart & Update (unchanged) · Windows: Restart & Update (unchanged) | Real GitHub release check on a packaged `.dmg` and `.deb` (L3/L4) |
| 2026-11-12 | **Regression audit** of all fixes since the audit (`33e7df0..8d6a188`): (1) every fix's key code still present at HEAD; (2) overlapping fixes read together (timer restore/strict/monotonic/finished set, menu salvage, shutdown + restart + updates + notifications); (3) backward compatibility; (4) `test-branch` vs `test-windows`; (5) 13 L2 scenarios re-run together | L2 (instrumented sandbox, no debugger) | **No conflicts or regressions between fixes.** All present; branches identical (`8d6a188`); upsert SQL and localStorage keys unchanged, snapshot only adds `strictMode` (old snapshots fall back safely). Scenarios: strict sleep/wake ✅, strict escape after crash ✅, normal crash restore ✅, salvage to a different cat ✅, clock tamper ✅ (+50 s jumps → 6 s), freeze strict ✅ / normal ✅, shutdown with busy DB ✅ (exit 0, saved), Windows DND-like notification ✅ (1 shown), Linux notification expiry ✅ (alarm still ringing at 11 s), `.deb` Download ✅, **Restart & Update after the clean-shutdown fix ✅** (first time tested: red confirm → exit 0 → relaunched → saved), final-screen crash ✅ (Pomodoro credited) | Found: **N3 is ~1 minute, not 2–3 s** (see next row) and **N8 confirmed** (3600 s → 1 s). Harness note: the first two scenario runs after setup produced no log once (re-ran clean). Windows worktree has a harmless uncommitted `package-lock.json` line (`"peer": true`, from npm 11 on Windows). Not verified: L3/L4 |
| 2026-11-13 | Sprite cleanup: each sprite checked for literal paths and code-built names (`${cat}_static/_work/_click`) on `test-branch`, `test-windows`, and `feature/auto-start-timer`, plus README/docs/config; after deleting, every image path the code references re-checked on disk; Tux states and Ginger/Void timer images re-run | L2 | 11 files referenced nowhere (sprites `*-btn-click` duplicates of the `icons/` copies, `*-btn-hover`, `black_cat_break_static`) deleted, 54 → 43. No referenced file missing; Tux states correct; Ginger and Void pixel-identical. Kept (still named in code, never shown): `*_cat_static.png`, `*_cat_click.png`, `orange_cat_break_static.png`; removing them needs a code change first | — |
| 2026-11-13 | Petting end: every animation frame recorded from the click until the idle pose returns, 10 pets per cat; return-to-idle check; 11-frame Tux strip simulated in the sandbox with only the three CSS numbers changed | L2 | Before: the animation **wrapped back to frame 1** for an instant before the idle pose in Tux 4/10, Ginger 4/10, Void 3/10 pets (the CSS looped forever and a separate ±10 ms timer ended it). After: **0/10** for every cat; all frames shown and the last one held (Tux 10, Ginger 9, Void 7); back to the idle loop afterwards. Simulated 11-frame strip: 0/10 wraps, 11 frames, 1.1 s, no JS change | Windows (L4) |
| 2026-11-13 | Menu and About pacing: each cat's animation starts sampled every 50 ms for 60 s, two runs, before and after | L2 | Before: menu random but 5–12 starts per minute within 0.5 s of another cat, all three moving 1–3% of the time; About **not random** (fixed 5.2 / 5.4 / 5.5 s rhythms, identical on every visit, all three moving 8%). After: both screens random and different on every visit; **0** starts within 0.5 s of another cat; all three moving **0%**; two moving at once menu 16–18%, About 31% (longer 2–3 loop animations overlap briefly) | Windows (L4) |
| 2026-11-13 | New Tux sprites wired in (`06f2fc5`): menu, About, focus still/anim, break still/anim, petting, mini widget screenshotted; every referenced image path checked on disk; Ginger and Void timer cat area pixel-compared with the previous commit | L2 | Before: Tux focus animation **broken** (new 5-frame 64 px strip drawn with the old 8-frame 512 px sheet rules); menu, About, break, and petting showed the old Tux. After: every Tux state uses the new set; all 12 new paths exist (5 missing references are pre-existing and harmless: commented code, hidden `<img>`, "-unused" CSS); Ginger and Void **pixel-identical** (4/4); timer loops are whole animation loops for all three cats | Windows (L4) |
| 2026-11-13 | Q3: deliver minimize/maximize/resize/close/restore/flash-frame from a destroyed sender; notification clicked after its window closed; live-window regression | L2 | Before: **6/6 main-process errors** ("Object has been destroyed"). After: 6/6 handled safely; live window: restore/maximize ok, close closes it. Notification path **not exercised**: notifications are unsupported in the WSL sandbox (no notification created before or after); covered by code reading. Jest 62/62 | **L4 on Windows:** close Pawse while a notification is in the Action Center, then click it |
| 2026-11-13 | Q5: window titles read with `BrowserWindow.getTitle()` for menu, timer, Settings | L2 | Before: "pawse" / **"Document"** / "pawse". After: "Pawse" / "Pawse" / "Pawse Settings" | Packaged build on Windows (L4) |
| 2026-11-13 | A10 + A9, before → after, with a fake clock on the sandbox timer page: (1) ticking across midnight; (2) paused at "Thu 23:50" with 50 min done, Home after midnight; (3) crash at "Thu 23:40" with 2402 s, resume at "Fri 00:20", Home (normal, and strict which resumes running); (4) same day | L2 (fake clock, DB rows read back) | (1) Thu 9 s + Fri 12 s both before and after. (2) Before: one row **Fri** 3000 s; after: **Thu** 3000 s. (3) Before: one row **Fri** 2402 s (the salvage's Thu date was overwritten by the resumed save); after: **Thu** 2402 s; strict: Thu 2402 s + new Fri row (split on the first tick). (4) One row, Fri, both. Jest 62/62. Note: a first attempt at (3) resumed after >12 h and hit the stale-backup rule instead, so the reopen was moved to "Fri 00:20" | Real midnight on Windows (L4); DST transition days |
| 2026-11-13 | N5, before → after: (a) the load fails (handler throws), then recovers and refresh is pressed; (b) the database is unreadable (closed); (c) normal load; (d) dashboard while a timer runs (live session); (e) N6 bursts | L2 + screenshots | Before: (a) blank defaults, week label "Date", no message; (b) zeros + "No sessions yet" + "No sessions recorded for this week". After: (a)/(b) date kept, cards "—" + "Couldn't load", chart message, correct week label; refresh after recovery shows real numbers. Dashes aligned across cards (streak number hidden so its 8 px row gap doesn't shift the dash). (c) unchanged; (d) identical to the last commit (live 25 min folded in); (e) still 0/20. Jest 62/62 | Visual check on Windows (L4) |
| 2026-11-13 | N6: 20 bursts of 10 concurrent week loads ending on week 10 (2,000 seeded sessions), plus a single click and a normal load | L2 | Before: wrong week drawn in **17/20** bursts (app state said week 10). After: **0/20**; single click to week 2 correct; normal load unchanged (date, cards, bars). Jest 62/62 | L3/L4 |
| 2026-11-13 | N4: open the exit dialog (Home) during a session, normal + strict | L2 | Before (normal): "…Your progress won't be saved." After: "Returning home ends this session. Your focus time so far is still saved." (3 lines, no overflow). Strict text unchanged (4 lines, no overflow) | Visual check on Windows (L4) |
| 2026-11-13 | N2, before → after: session with 2 cycles done, SIGKILL, reopen same cat (normal + strict) | L2 (no debugger) | Before: cycle 2, **fish 0** (both modes). After: cycle 2, **fish 2** (both modes); a new session still shows 0. Jest 62/62 | L3/L4 |
| 2026-11-12 | N7, before → after. Sandbox jumps to a break with N cycles done, presses Skip, then SIGKILL with the modal open, reopens the same cat | L2 | Before: mid-set cycle 1 → **2**, long break 3 → **4** after reopen. After: **1** and **3** (modal also shows the unchanged count). Regressions: Cancel restores (cycle 1, running); Confirm mid-set → cycle 2, work starts; Confirm "Finish Session?" → menu, Pomodoro 0; natural break end → cycle 2 immediately; skip during work unchanged; final-set crash (N1) still credited. Jest 62/62. Fish counter shows 0 after any restore (known N2, separate) | L3/L4 |
| 2026-11-12 | N3 + N9, before → after (instrumented sandbox, no debugger, SIGKILL) | L2 | **Resume precision** (normal): crash at 15 s rewound 12 s → **0 s**; at 45 s rewound 43 s → **0 s**; ~58 s → exact. Strict at 45 s: resumes running and strict. **N9** (Home, crash 2 s later, reopen same cat): before → ended session came back (same uuid, stale time); after → **fresh session**. Final-screen crash: fresh set on reopen; 3600 s + Pomodoro kept. Rescue to a different cat: 1 s → **9 s** of ~10 s. Cleanup: normal close, Home, busy-DB quit → file holds the "cleared" marker. Old-version backup (localStorage only, no file): rescued (300 s) and resumed (1200 s left). Corrupt file: fresh session, no crash. Regressions: strict escape blocked, N8 no rollback (902 ×2), clean quit with busy DB (exit 0). Jest 62/62 | L3/L4; power-cut durability (no fsync); Windows file locking (fallback path untested) |
| 2026-11-12 | N8, before → after. (a) Crash 5 s into a break right after a work phase was saved via "Start Break" (normal + strict), (b) crash on the final "Pawsome Job!" screen; reopen each time. (c) The real upsert SQL extracted from `main.js`, 9 edge cases on an in-memory DB | L2 (no debugger) + direct SQL | Before: **4/9 rolled back** (phase-save 2/6: 900 → 1; final screen 2/3: 3600 → 1). After: **0/9** (phase-save 902 in 6/6, final screen 3600 + Pomodoro in 3/3). SQL: 9/9 (stale backup ignored, normal growth updates, legacy NULLs, new rows, one row per uuid). Jest 62/62 | L3/L4. Rollback depends on Chromium save timing, so it shows as a rate |
| 2026-11-12 | localStorage save timing (N3 correction): counter written every second on the timer page, SIGKILL after 30/45/75/105 s | L2 | On disk after reopen: 30 s → 2, 45 s → 2, 75 s → 57, 105 s → 57. Disk saves happen at page start and about once a minute | Other OSes may differ in timing (same Chromium logic) |
| 2026-11-09 | Red "Restart Anyway" after restoring the deleted styles (regression from `06d15c2`). Sandbox with simulated AppImage so the dev updater shows Restart & Update; session running | L2 | Before click: blue `rgb(53, 166, 241)` · first click: **red `rgb(229, 72, 77)`**, "Restarting will end your current focus session." · after 6.5 s: back to blue | Windows dev/installer visual check (L4) |
| 2026-11-09 | Windows installer build from PowerShell (`npm run build:exe`, electron-builder 25.1.8) | L3 on Windows (build only) | `Pawse-Setup-1.0.0.exe`, `.blockmap`, and `latest.yml` (url matches the file name, R1 confirmed); `app.asar` contains only `package.json` and `src/` (A1 confirmed). Needed Windows Developer Mode for the winCodeSign symlink step | Installing and running it (checklist, R5) |
| 2026-11-08 | Installer file name (R1). Published v1.1.0: asset `Pawse.Setup.1.1.0.exe` vs `latest.yml` url `Pawse-Setup-1.1.0.exe` (mismatch). After fix: Windows NSIS build from Linux produced `Pawse-Setup-1.0.0.exe` | L3 (partial: the build stopped at a Wine step, so no `latest.yml` or finished installer) | File name now has no spaces | Full Windows build and an actual update from GitHub (L4, build on Windows) |
| 2026-11-08 | Clean shutdown (A4b), after fix | L2 (no debugger) | DB busy 1.5 s: 4/4 clean, saved · normal close 3/3 clean ~10 ms · quit with window open 3/3 clean · DB locked 5 s: 2/2 clean exit ~3 s (save impossible, expected) | **L4: Restart & Update on Windows/macOS with the packaged installer** |

---

## Part 4 — Lessons & Traps

**Testing**
- **Jest passing proves nothing about the app** (tests copy logic). Verify at L2+.
- **Test tools can create fake bugs.** A "10–30 s slow exit" turned out to be the test script's own polling delay. Re-measure without debuggers attached before concluding.
- **Races need repetition.** Report rates (e.g. 0/40), not single runs. A sandbox pass doesn't prove a race is gone on slower machines.
- **`pkill -f` can kill your own shell** when the pattern appears in your command text (including heredoc content). Write scripts to files; run them in a separate command; use patterns like `port=933[3]`.
- **Inspector calls right after launch can return nothing**; wait 2–3 s.
- Stress testing reveals different failures than the predicted one: the predicted "data loss on quit" didn't happen; a crash on exit did.

**Code**
- **Temporal dead zone in `timer.js`:** `startTimer()` runs during load before `let`/`const` bindings further down exist. Guarded by `var controlsReady`.
- **Fixes can open new holes:** resetting `timerRunning` on the menu enabled a strict-mode escape (fixed by D3). Re-check adjacent invariants after each fix.
- **localStorage is not durable immediately:** Chromium saves it to disk about once a minute, so state that must survive a crash belongs in a main-process file (N3). Deleting it is not durable immediately either: a "cleared" deletion can be undone by a crash (N9), so use an explicit marker rather than absence.
- **Record results when the event happens, not when the user acknowledges it** (N1). A modal waiting for a click is a crash window.
- **When a test result looks alarming, measure the mechanism directly, and at several points in time.** The N1 harness showed a stale backup; a single 60 s probe then suggested "~2–3 s" and the harness result was wrongly written off as an artifact. Measuring at 30/45/75/105 s showed the real pattern (saves about once a minute). A timing behavior measured at one moment can mislead.
- **`excluded.*` in a SQLite upsert holds the already-evaluated insert values**, so `COALESCE(excluded.x, old.x)` never falls back.
- **Time limits must respect inner timeouts** (shutdown limit vs `busy_timeout`, D8).

**Repo & packaging**
- **electron-builder ignores `.gitignore`.** Removing a file in a later commit doesn't remove it from git history or from already-published installers.
- **Mixed line endings:** `src/renderer/index.js` and `src/renderer/index.css` mix CRLF/LF (`core.autocrlf=true`). Editing tools may normalize the whole file; check `git diff --stat` for whole-file churn.
- **Version drift:** `package.json` lagged behind the published release.
- **Editing from an older copy of a file silently deletes newer changes.** `06d15c2` (sidebar styling) removed the red "Restart Anyway" styles added in `4c76f49`. Before committing, read the **full** `git diff` (not just the lines you meant to change) and look for unexpected deletions.
- **The terminal decides the platform, not the folder.** Building in WSL inside `/mnt/c/...` is a Linux build (needs Wine for Windows targets). Build Windows installers from PowerShell/Command Prompt. The Windows folder is a **git worktree** of the WSL repo (its `.git` points to a Linux path), so run git from WSL and builds from PowerShell (`powershell.exe -Command "..."` works from bash).
- **Windows builds with electron-builder 25 need symlink rights** to extract the winCodeSign toolkit ("A required privilege is not held by the client"). Turn on **Settings → System → For developers → Developer Mode** (once), or run the first build as Administrator.
- **Never build Windows (or any other OS) installers from Linux/WSL in the repo folder.** `electron-builder --win` rebuilt `node_modules/sqlite3` as a Windows DLL, and `npm start` on Linux then failed with "invalid ELF header". Restore with `npx electron-builder install-app-deps`. If a cross-build is ever needed for a quick check, expect this and restore afterwards.
- **Faking `process.platform` before Electron starts makes Electron itself hang** (its internals switch to that OS's code). In tests, fake the platform only in the specific lines being tested.

---

## Part 5 — History Timeline (2026-06-30 → present)

**Not reviewed yet.** A full review of the git history (≈480 commits, 23 branches) is planned. Patterns already noticed:
- **Timing** was reworked more than once: wall-clock synchronization (`529be14`) was later replaced by the monotonic clock (`b809bac`).
- **Secrets/session files** were committed and later removed on older branches; removal didn't clean history or published installers (see A1b, D1).
- **Strict Mode** was reconfigured several times before its invariants were written down (D2–D5).
- **Durable state** evolved through several commits (crash snapshot, 12 h expiry `eb575b5`, salvage `6c636dd`).
- **SQLite concurrency:** WAL + `busy_timeout` added in `c1382ca`; shutdown handling added in `4412524`.

---

## Part 6 — Fix Changelog

Newest first. One line per commit.

| Date | Commit | Change |
| :--- | :--- | :--- |
| 2026-11-13 | _(this commit)_ | Removed 11 sprite files referenced nowhere (button click/hover duplicates, `black_cat_break_static`) |
| 2026-11-13 | `6db9ccb` | Petting animation plays once and holds its last frame, ending on `animationend` (no flash of the first frame before the idle pose, all three cats); frame count now changes in CSS only |
| 2026-11-13 | `4ee0fd7` | Tux break (petting) sprite re-exported: starts and ends on the neutral pose (still 10 frames) |
| 2026-11-13 | `76cc88a` | Menu and About cats animate at random, each on its own timing; a cat waits when another just started or both others are moving (About was a fixed rhythm) |
| 2026-11-13 | `06f2fc5` | New Tux sprite set wired in like Ginger and Void (menu, About, focus, break, petting, mini widget); old 512 px Tux rules removed (committed with updated Tux work art) |
| 2026-11-13 | `1941571` | Release checklist: steps for the fixes since 2026-11-09 (crash backup within ~1 s, ended session stays ended, totals never drop, fish and skip after a crash, exit text, window titles, double-click close, week navigation, optional midnight); note that the old Auto-Start Timer toggle does nothing in v1.0.0 |
| 2026-11-13 | `1d9d49a` | Window handlers no longer crash when the sending window is already gone (Q3) |
| 2026-11-13 | `0284590` | Window titles: "Pawse" and "Pawse Settings" instead of "Document" (Q5) |
| 2026-11-13 | `ddf779a` | A session never crosses midnight: split before every save, day stored in the crash backup (A10, resolves A9) |
| 2026-11-13 | `75774eb` | Dashboard shows a "Couldn't load" state instead of zeros when stats can't be read (N5) |
| 2026-11-13 | `81cc5c4` | Dashboard draws only the newest week request (N6) |
| 2026-11-13 | `e1e80a2` | Exit dialog no longer says progress won't be saved (N4) |
| 2026-11-13 | `eaef332` | Draw the fish counter when the timer opens, so restored sessions show their cycles (N2) |
| 2026-11-13 | `63ce2e4` | README + `AGENTS.md` §6.2/§7.4: describe the file-based crash backup (≤ ~1 s lost, file is the authority, "cleared" marker) |
| 2026-11-12 | `47748f1` | Count a skipped break's cycle only when the user confirms (N7) |
| 2026-11-12 | `796810a` | Crash backup in a main-process file every second; "cleared" marker stops ended sessions from coming back (N3, N9) |
| 2026-11-12 | `b719b35` | Record N8 results; N3 scheduled next |
| 2026-11-12 | `478cf5d` | Keep the larger totals when saving so stats never roll back after a crash (N8) |
| 2026-11-12 | `b226341` | Regression audit recorded: all fixes intact and compatible; N3 corrected to ~1 minute; N8 confirmed |
| 2026-11-09 | `8d6a188` | Restore the red "Restart Anyway" styles deleted by `06d15c2` (A4a regression) |
| 2026-11-09 | `872a8f8` | Add `docs/RELEASE_CHECKLIST.md` (manual tests for Windows, macOS, Linux); testing deferred and tracked as R5 |
| 2026-11-09 | `83dbeeb` | Release plan: first official release is v1.0.0; GitHub cleanup and upload steps (D16) |
| 2026-11-08 | `7e39326` | README: match the app's actual behavior (recovery, dialogue, updates per platform, strict mode, builds per OS) |
| 2026-11-08 | `125d970` | Credit the Pomodoro when the set completes and retire the snapshot; menu credits old finished snapshots (N1) |
| 2026-11-08 | `01711d2` | Project log: next steps |
| 2026-11-08 | `61ccd47` | Download button for macOS and `.deb` updates; in-app updates only on Windows `.exe` and AppImage (A6) |
| 2026-11-08 | `8814974` | Installer file name without spaces so Windows updates find the file (R1) |
| 2026-11-08 | `3fb78d4` | Notifications respect DND; alarm not silenced by auto-closing notifications on macOS/Linux (A5, A5b) |
| 2026-11-08 | `5556541` | AGENTS.md: link to project log, shutdown rules, new testing rules |
| 2026-11-08 | `b3decdf` | Add `docs/PROJECT_LOG.md` |
| 2026-11-08 | `0545c59` | Move `documentation/` to `docs/` |
| 2026-11-08 | `4412524` | Wait for pending saves and close the database before quitting (A4b) |
| 2026-11-08 | `4c76f49` | Confirm before Restart & Update during an active session (A4a) |
| 2026-11-08 | `d2b7a84` | AGENTS.md: testing levels, sandbox recipe, report disclaimer |
| 2026-11-08 | `7778bac` | Replace GEMINI.md with tool-agnostic AGENTS.md (+ CLAUDE.md/GEMINI.md pointers) |
| 2026-11-07 | `117bcbd` | Keep strict mode enforced across crash, sleep, and freeze (S1, D3–D5) |
| 2026-11-07 | `b809bac` | Monotonic clock for the countdown (A8) |
| 2026-11-07 | `6c636dd` | Salvage orphaned sessions on menu load (A3) |
| 2026-11-07 | `225be0c` | Reset stale `timerRunning` on menu load (A11) |
| 2026-11-07 | `9ea9609` | Strict mode: block pausing, not resuming (A2) |
| 2026-11-07 | `a1b7d0d` | `build.files` allowlist (A1) |
