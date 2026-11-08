# PAWSE — Project Log

The project's shared memory for **any AI agent or developer**: what was found, decided, tested, and fixed, and why. It survives across sessions and across AI tools.

- **Read Parts 1–4 before starting work.** Read Part 5 when touching an area with history.
- **After each fix:** update Parts 1, 3, and 6 **in the same commit** as the fix.
- Git is the source of truth for *what* changed; this log records *why*, *what was learned*, and *what's still open*. Link commits by short hash.
- **This repo is public.** Never write secrets, IDs, emails, personal data, or machine paths here. Describe security incidents in general terms. Refer to people by role.

Rules for how to work live in [`AGENTS.md`](../AGENTS.md). This file is status and history.

---

## Part 1 — Current Status

_Last updated: 2026-11-09 (release checklist)_

**Next up (agreed path to release):**
1. ~~**N1:** crash during the final "Pawsome Job!" modal loses the Pomodoro~~ ✅ done
2. ~~**README:** remove overclaims~~ ✅ done
3. ~~Version bump~~ not needed: **v1.0.0 is the first official release** (D16)
4. **Manual testing (L4):** checklist written in [`docs/RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) for Windows, macOS, and Linux. **Not run yet.** Windows can be tested now; macOS and real-Linux testing are **deferred** (no test machines). Run at least Windows before publishing v1.0.0 following D16 (delete the old v1.1.0 release and tags first)

After release: R2 icon (needs a designer asset), then the 💤 items below.

Legend: ✅ done · ⏳ in progress / partly done · ❌ open · 💤 deferred (post-deadline)

### Release blockers (deadline)

| ID | Issue (user impact) | Status | Commits / notes |
| :--- | :--- | :--- | :--- |
| A1 | Builds packed everything in the project folder (including a local dev DB) into `app.asar` | ✅ | `a1b7d0d`: `build.files` allowlist |
| A1b | An older public release contained bundled credential/session files | ⏳ | Credentials revoked and RLS verified. **Still to do:** delete the old v1.1.0 release and the v1.1.0 / v1.0.0 tags before publishing v1.0.0 (D16) |
| A2 | Strict Mode: after sleep/crash the timer was paused with Play disabled (user locked out) | ✅ | `9ea9609`, `117bcbd` |
| A3 | Crash + picking a different cat (or returning after 12 h) lost unsaved work | ✅ | `6c636dd`: menu salvages the snapshot to the DB |
| A4a | "Restart & Update" ended a running session without warning | ✅ | `4c76f49`: two-click confirm, red "Restart Anyway" |
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
| N2 | After any restore, the fish (cycle) counter shows 0 until the next phase change | ❌ |
| N3 | Chromium batches localStorage writes: a hard kill loses the last few seconds of progress. **Re-measured 2026-11-08: ~2–3 s** (58/60 and 56/59 writes survived a SIGKILL after 60 s, including on the timer page and across set completion). The earlier "~13–16 s" figure came from runs killed soon after launch | 💤 Low impact. `AGENTS.md` §6.2 still says ~15 s (update it) |
| N4 | Exit modal says "Your progress won't be saved", but focus time **is** saved on exit (normal mode copy) | ❌ |
| N5 | Dashboard `loadAnalytics` has no error handling: a failed query leaves it blank/stale | ❌ |
| N6 | Fast week navigation: responses can arrive out of order and draw the wrong week | ❌ |
| N7 | Crash while the **skip** confirmation modal of a break is open: `cycleCount` was already incremented, so the restored session is one cycle ahead (found by reading the code, not reproduced) | ❌ |
| N8 | A save always **overwrites** the session's totals, even with older, smaller values. Seen in testing: a stale snapshot salvaged by the menu turned 3600 s of saved work into 1 s. Fix idea: `MAX()` for the four totals in the upsert (totals only grow per uuid) | ❌ |
| A9 | Upsert overwrites `date_completed` with the latest save time | ❌ |
| A10 | Midnight rollover is only checked while the timer is ticking | ❌ |
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
| Q3 | Several IPC handlers don't null-check the sender window | 💤 |
| Q4 | `autoStartPomodoros` / `autoStartBreaks` toggle is saved but does nothing | ❌ |
| Q5 | Timer window title is "Document" | ❌ |
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
| 2026-11-08 | localStorage durability (N3), counter written every second, SIGKILL at 60 s | L2 | Menu page 58/60 survived; timer page 56/59 (snapshot) and 57/60 (probe), also across set completion | Other OSes; power loss |
| 2026-11-08 | Update flow per build (A6), dev update simulator in the sandbox, platform faked only for the update decision, "open URL" stubbed | L2 (simulated builds) | `.deb`: Check → "PAWSE v1.1.0 is available." [Download] → release page opened, message "Download page opened in your browser." · macOS: same · AppImage: Restart & Update (unchanged) · Windows: Restart & Update (unchanged) | Real GitHub release check on a packaged `.dmg` and `.deb` (L3/L4) |
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
- **localStorage is not durable immediately** (Chromium batches disk writes, ~2–3 s in testing).
- **Record results when the event happens, not when the user acknowledges it** (N1). A modal waiting for a click is a crash window.
- **When a test result looks alarming, measure the mechanism directly** with a minimal probe before concluding. The N1 harness suggested localStorage loses everything after the first write; a direct probe showed ~2–3 s.
- **`excluded.*` in a SQLite upsert holds the already-evaluated insert values**, so `COALESCE(excluded.x, old.x)` never falls back.
- **Time limits must respect inner timeouts** (shutdown limit vs `busy_timeout`, D8).

**Repo & packaging**
- **electron-builder ignores `.gitignore`.** Removing a file in a later commit doesn't remove it from git history or from already-published installers.
- **Mixed line endings:** `src/renderer/index.js` and `src/renderer/index.css` mix CRLF/LF (`core.autocrlf=true`). Editing tools may normalize the whole file; check `git diff --stat` for whole-file churn.
- **Version drift:** `package.json` lagged behind the published release.
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
| 2026-11-09 | _(this commit)_ | Add `docs/RELEASE_CHECKLIST.md` (manual tests for Windows, macOS, Linux); testing deferred and tracked as R5 |
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
