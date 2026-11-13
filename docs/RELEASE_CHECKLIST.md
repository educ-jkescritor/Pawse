# PAWSE — Release Checklist (Manual Testing, L4)

Manual tests to run **on real machines with the real installers** before publishing a release. Automated and sandbox tests (L0–L3) only cover Linux/WSL in dev mode; this checklist is the only proof that a release works on each OS. See `AGENTS.md` §7.2 for test levels and §5 for the publishing steps.

**How to use**
- Run the section for each OS you can test. Tick each step; for any step that doesn't match **Expected**, write down what you saw (screenshots help).
- Record the outcome in the results table below and in `docs/PROJECT_LOG.md` Part 3.
- Don't skip an OS silently: if you can't test it, mark it **Not tested** in the results table.
- Time: about **60–75 minutes per OS** (sections A–J; K is optional).

## Results

| Release | OS / machine | Package | Date | Result | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| v1.0.0 | Windows | `.exe` | — | ⏳ Not run yet | |
| v1.0.0 | macOS (Apple Silicon) | `.dmg` arm64 | — | ⏳ Not tested (no test machine) | |
| v1.0.0 | macOS (Intel) | `.dmg` x64 | — | ⏳ Not tested (no test machine) | |
| v1.0.0 | Linux (real desktop) | `.deb` / AppImage | — | ⏳ Not tested (no test machine) | WSL is not a substitute for a real desktop |

## Expected warnings (not bugs)

| OS | What you'll see | Why |
| :--- | :--- | :--- |
| Windows | **"Windows protected your PC"** when running the installer → **More info → Run anyway** | The installer is not code-signed (P8) |
| macOS | **"Pawse can't be opened"** or **"Pawse is damaged"** when opening a downloaded copy → **System Settings → Privacy & Security → Open Anyway** | The app is not signed with an Apple Developer ID (P4) |
| macOS | Closing the window **doesn't quit** the app; it stays in the Dock | Standard Mac behavior; quit with **Cmd+Q** |
| macOS | "Check for Updates" never offers **Restart & Update**; it shows a **Download** button when a newer release exists | Mac in-app updates need signing (D9) |
| Linux | AppImage won't start on Ubuntu 22.04+ without **libfuse2**; on Ubuntu 24.04+ it may fail with a **sandbox error** | Known AppImage limits (P2). The `.deb` doesn't have these problems |
| Linux (Wayland) | **Always on top** and the floating widgets may not stay on top; the taskbar icon may not flash | Wayland ignores these window requests (P1) |
| All | The app icon may look slightly blurry | Icon source is 370×350 (R2) |
| All | Settings → **Auto-Start Timer** does nothing | Not part of v1.0.0; built on a separate branch (Q4) |

---

## Windows

### 0. Preparation
| # | Do | Expected |
| :--- | :--- | :--- |
| 0.1 | In a **Windows** copy of the repo (not WSL): `git pull`, then `npm install` | No errors |
| 0.2 | `npm run build:exe` | `dist\` contains **`Pawse-Setup-<version>.exe`** (dashes, no spaces) and **`latest.yml`** |
| 0.3 | *(Optional)* Back up `%APPDATA%\Pawse\` | Testing adds sessions to your real stats |
| 0.4 | Uninstall any older Pawse (Settings → Apps) | Clean start |

### A. Install & launch
| # | Do | Expected |
| :--- | :--- | :--- |
| A1 | Run the installer | "Windows protected your PC" (expected) → **More info → Run anyway** |
| A2 | Open Pawse | Menu with the 3 animated cats |
| A3 | Open Settings | Version shows the release version (e.g. **v1.0.0**) |
| A4 | Hover Pawse in the taskbar, or press **Alt+Tab**, with the menu and Settings both open | **"Pawse"** and **"Pawse Settings"**, never "Document" (Q5) |

### B. Session basics (pick **Ginger**, 15 min)
| # | Do | Expected |
| :--- | :--- | :--- |
| B1 | Pick Ginger | Timer starts at **15:00** and counts down |
| B2 | ⏸ then ▶; then **Space** twice | Pauses and resumes both ways |
| B3 | Press **Skip** | "Quick Stretch?" modal |
| B4 | Press **Esc** | Skip cancelled; timer back where it was |
| B5 | Skip again → **Start Break** | Break timer **3:00** starts |
| B6 | Try both mini widgets (timer-only, cat-only); open another app on top | Widget stays **on top**; Restore brings back the full window |
| B7 | Restore the full window; press **Home** (✕) | *"Returning home ends this session. Your focus time so far is still saved."* → press **Cancel**; the break continues (N4) |

### C. Notifications (let the 3-minute break from B5 end)
| # | Do | Expected |
| :--- | :--- | :--- |
| C1 | **Do Not Disturb OFF**: let the break end | **One** notification with a **Start Work** button; alarm rings; taskbar icon flashes |
| C2 | Click **Start Work** on the notification | Pawse comes forward; work session starts |
| C3 | **Do Not Disturb ON** (Settings → System → Notifications). Skip to a break and let it end | **No flood**: at most one notification, in the notification center. **Alarm still rings** (up to 30 s); in-app modal shows |
| C4 | Click that notification in the notification center | Pawse comes to the front |
| C5 | Turn Do Not Disturb back **OFF** | — |

### D. Strict Mode (go Home first; the toggle only works with no timer open)
| # | Do | Expected |
| :--- | :--- | :--- |
| D1 | Settings → **Strict Mode ON**. Pick **Tux** | ⏸ and Skip **greyed out**; Space does nothing |
| D2 | Open Settings while the timer runs | Strict Mode toggle is **locked** |
| D3 | Start → Power → **Sleep**; wait 1 min; wake the PC | Timer **resumes by itself**; the minute asleep is **not** counted |
| D4 | Click **Home** (✕) | Exit modal: *"Strict session: leaving ends it for good…"* |

### E. Crash recovery
| # | Do | Expected |
| :--- | :--- | :--- |
| E1 | Strict **OFF**. Pick **Tux**; let it run **at least 1 minute** | — |
| E2 | Command Prompt: `taskkill /F /IM Pawse.exe` | Pawse disappears instantly (forced crash). The crash backup is written every second, so at most ~1 s is lost |
| E3 | Reopen Pawse → Settings → Dashboard | **Today** includes that ~1 minute |
| E4 | Close Settings; pick **Tux** | Same remaining time (within **~1–2 s**), **paused** |
| E5 | Repeat E1–E2 with **Strict ON**; reopen and pick Tux | Resumes **running**, still strict |
| E6 | Repeat E1–E2; after reopening pick **Ginger** instead | Dashboard still includes the Tux minute |
| E7 | Note **Today** on the Dashboard. Pick Tux, run 1 min, crash; reopen, pick Tux, press ▶, run 1 min, crash again; reopen → Dashboard | Today went **up** by about 2 min; it never goes **down** between checks (N8) |
| E8 | Go Home. Pick **Ginger**: **Skip → Start Break**, then **Skip → "End Break Early?" → Start Work** | **1 fish** lit |
| E9 | **Skip → Start Break**. Press **Skip** again so *"End Break Early?"* is showing, then crash (`taskkill`) | — |
| E10 | Reopen → pick **Ginger** | Back **in the break**, paused, with **1 fish** lit (not 2) (N2, N7) |
| E11 | Go Home. Pick **Tux**, run ~30 s, press **Home → confirm** (session ended). **Right away** crash (`taskkill`). Reopen → pick Tux | A **fresh 25:00** session: an ended session never comes back (N9) |

### F. Quitting
| # | Do | Expected |
| :--- | :--- | :--- |
| F1 | During a session, press **Alt+F4** | Pawse closes with **no error / "stopped working" message** |
| F2 | Task Manager → Details | **No `Pawse.exe` left running** |
| F3 | Open Pawse again right away | Opens normally |
| F4 | Dashboard | Includes the session from F1 |
| F5 | Open Settings; **double-click** its ✕ quickly | Settings closes; **no error dialog** (Q3) |

### G. Settings toggles
| # | Do | Expected |
| :--- | :--- | :--- |
| G1 | **Always on top** ON; open another app | Pawse stays on top. Turn it OFF afterwards |
| G2 | **Launch on startup** ON; sign out and back in | Pawse starts by itself. Turn it OFF afterwards |
| G3 | Move each volume slider during a session | Sound changes right away |

### H. Updates ⚠️ only after the old GitHub release v1.1.0 and tags are deleted (D16)
| # | Do | Expected |
| :--- | :--- | :--- |
| H1 | Settings → **Check for Updates** | **"Up to Date"** (no newer release exists) |

If checked **before** v1.1.0 is deleted, the app finds "1.1.0" and the download **fails** (old file-name mismatch, R1). Don't click Restart if offered.

### I. Optional: final-screen crash (N1) in dev mode
The installed app has DevTools disabled and a full set takes over an hour, so this uses `npm start` on Windows.
| # | Do | Expected |
| :--- | :--- | :--- |
| I1 | `npm start` → pick Ginger → **Ctrl+Shift+I** → Console:<br>`pauseTimer(); cycleCount = 3; workingTime = false; actualWork = 600; remainingTime = 3; updateSessionCounter(); startTimer();` | After ~3 s: **"Pawsome Job!"** with 4 fish lit |
| I2 | While that modal is open: `taskkill /F /IM electron.exe` | — |
| I3 | `npm start` again → Dashboard | The completed Pomodoro **is counted** |
| I4 | Pick Ginger | A **fresh** session (not "5 cycles") |

### J. Dashboard
| # | Do | Expected |
| :--- | :--- | :--- |
| J1 | Settings → Dashboard. Click **‹** (previous week) **quickly 5 times** | Ends on the week **5 weeks back**; the date range and the bars match that week, with no jump back to another week (N6) |
| J2 | Click **›** until this week | This week's sessions (from the tests above) show again |

The dashboard's **"Couldn't load"** state (N5) can't be triggered safely in the installed app; it was verified in the sandbox (`docs/PROJECT_LOG.md` Part 3).

### K. Optional: midnight (A10)
Changes the system clock; put it back afterwards.
| # | Do | Expected |
| :--- | :--- | :--- |
| K1 | Settings → Time & language → Date & time: **Set time automatically OFF** → Change → today, **23:58** | — |
| K2 | Pick **Tux**; let it run past midnight to about **00:02**; press **Home → confirm** | — |
| K3 | Dashboard | **Yesterday** has about 2 min, **today** about 2 min. The time is split at midnight, not all on one day |
| K4 | **Set time automatically ON** again | The clock is correct again |

---

## macOS

Test **each chip type you ship** (Apple Silicon and Intel `.dmg`) if possible. Note your macOS version.

### 0. Preparation
| # | Do | Expected |
| :--- | :--- | :--- |
| 0.1 | On the Mac: `git pull`, then `npm install` | No errors |
| 0.2 | `npm run build:mac` (builds **both** chips in one command) | `dist/` contains `.dmg` and `.zip` for **arm64** and **x64**, `.blockmap` files, and **one `latest-mac.yml` listing both** |
| 0.3 | *(Optional)* Back up `~/Library/Application Support/Pawse/` | Testing adds sessions to your real stats |
| 0.4 | Delete any older Pawse from Applications | Clean start |
| 0.5 | To test what users get, **download the `.dmg` from a GitHub release** (or AirDrop it from another Mac) rather than opening your local build | Local builds skip Gatekeeper; downloaded copies don't |

### A. Install & launch
| # | Do | Expected |
| :--- | :--- | :--- |
| A1 | Open the `.dmg`, drag **Pawse** into **Applications** | Copies without errors |
| A2 | Open Pawse from Applications | **"Pawse can't be opened"** or **"is damaged"** (expected, unsigned) → **System Settings → Privacy & Security → Open Anyway** → opens |
| A3 | Open Settings | Version shows the release version |
| A4 | Check you installed the right file for the chip (Apple menu → About This Mac) | Apple Silicon (M1/M2/M3…): the `.dmg` with **`arm64`** in its name; Intel: the one **without** `arm64` |

### B. Session basics
Same as Windows **B1–B7**. Also:
| # | Do | Expected |
| :--- | :--- | :--- |
| B7 | Switch to a **full-screen app** or another **Space** while a mini widget is open | The widget may **not** follow (known limit P5); note what happens |

### C. Notifications
| # | Do | Expected |
| :--- | :--- | :--- |
| C0 | First notification | macOS may ask to **allow notifications** for Pawse → Allow |
| C1 | **Focus / Do Not Disturb OFF**: let a break end | A notification appears; alarm rings; Dock icon may bounce. The **Start Work** button may be missing (unsigned apps often get banners only) |
| C2 | Click the notification | Pawse comes forward |
| C3 | Turn **Do Not Disturb** on (Control Center → Focus); let a break end | Notification is held quietly; **alarm still rings** (up to 30 s); in-app modal shows |
| C4 | With DND off, let the notification **disappear on its own** | The **alarm keeps ringing** until you act or 30 s pass (A5b) |

### D. Strict Mode
Same as Windows **D1–D4**, using **Apple menu → Sleep** for D3.

### E. Crash recovery
Same as Windows **E1–E11**, using **Terminal: `killall -9 Pawse`** (or Activity Monitor → Pawse → Force Quit) instead of `taskkill`.

### F. Quitting
| # | Do | Expected |
| :--- | :--- | :--- |
| F1 | Go **Home**, then click Pawse's own **✕** on the menu (Pawse has no Mac title bar) | The window closes; **Pawse stays in the Dock** (normal Mac behavior) |
| F2 | Click Pawse in the Dock | The menu window reopens |
| F3 | During a session, press **Cmd+Q** | Quits with **no "Pawse quit unexpectedly"** dialog |
| F4 | Reopen → Dashboard | Includes the sessions from F1 and F3 |
| F5 | Open Settings; **double-click** its ✕ quickly | Settings closes; no "Pawse quit unexpectedly" dialog |

### G. Settings toggles
Same as Windows **G1–G3**. For G2, check **System Settings → General → Login Items** lists Pawse after turning it on.

### H. Updates (after the old v1.1.0 release and tags are deleted)
| # | Do | Expected |
| :--- | :--- | :--- |
| H1 | Settings → **Check for Updates** | **"Up to Date"** |
| H2 | *(At the next release only)* Check for Updates when a newer release exists | **Download** button → opens the GitHub release page. Never a stuck "Downloading…" |

### I. Optional: final-screen crash (N1) in dev mode
Same as Windows **I1–I4**, using **Cmd+Option+I** for DevTools and `pkill -9 -f Electron` to crash.

### J. Dashboard
Same as Windows **J1–J2**.

### K. Optional: midnight (A10)
Same as Windows **K1–K4**, using **System Settings → General → Date & Time** (turn off "Set time and date automatically").

---

## Linux

Test the **`.deb`** first (recommended for Ubuntu/Debian users), then the **AppImage**. Note the distro and version, the desktop (GNOME/KDE/other), and the session type (`echo $XDG_SESSION_TYPE` → `x11` or `wayland`). **WSL is not a substitute** for a real desktop.

### 0. Preparation
| # | Do | Expected |
| :--- | :--- | :--- |
| 0.1 | On the Linux machine: `git pull`, then `npm install` | No errors |
| 0.2 | `npm run build:linux` | `dist/` contains the **`.deb`**, the **`.AppImage`**, and **`latest-linux.yml`** |
| 0.3 | *(Optional)* Back up `~/.config/Pawse/` | Testing adds sessions to your real stats |

### A. Install & launch
| # | Do | Expected |
| :--- | :--- | :--- |
| A1 | `.deb`: `sudo apt install ./dist/<file>.deb` | Installs; **Pawse** appears in the app menu |
| A2 | Open Pawse from the app menu | Menu with the 3 animated cats |
| A3 | Open Settings | Version shows the release version |
| A4 | AppImage: `chmod +x <file>.AppImage && ./<file>.AppImage` | Starts. If it fails: Ubuntu 22.04+ needs `libfuse2` (24.04: `libfuse2t64`); a **sandbox error** on 24.04+ is the known limit P2. Note what you saw |
| A5 | Look at the window titles in the taskbar / app switcher (Alt+Tab) with Settings open | **"Pawse"** and **"Pawse Settings"** (Q5) |

### B. Session basics
Same as Windows **B1–B7**. On **Wayland**, the widgets may not stay on top (known limit P1); note what happens.

### C. Notifications
| # | Do | Expected |
| :--- | :--- | :--- |
| C1 | Let a break end | A notification appears; alarm rings |
| C2 | Let the notification **disappear on its own** (many desktops hide it after a few seconds) | The **alarm keeps ringing** until you act or 30 s pass (A5b) |
| C3 | Turn on **Do Not Disturb** (GNOME: Settings → Notifications; KDE: notification tray); let a break end | No notification pops up; **alarm still rings**; in-app modal shows |

### D. Strict Mode
Same as Windows **D1–D4**, using `systemctl suspend` (or the desktop's Suspend) for D3. If the timer stays **paused** after waking, check that **Play still works**: some setups don't send the wake event, and Play is the fallback.

### E. Crash recovery
Same as Windows **E1–E11**, using `pkill -9 -f -i pawse` instead of `taskkill`.

### F. Quitting
Same as Windows **F1–F5**, closing with **Alt+F4** (Pawse has no title bar), and checking `pgrep -fl -i pawse` instead of Task Manager.

### G. Settings toggles
Same as Windows **G1–G3**. For G2, check that `~/.config/autostart/pawse.desktop` exists after turning it on, then log out and back in.

### H. Updates (after the old v1.1.0 release and tags are deleted)
| # | Do | Expected |
| :--- | :--- | :--- |
| H1 | `.deb` and AppImage: Settings → **Check for Updates** | **"Up to Date"** |
| H2 | *(At the next release only)* `.deb` with a newer release | **Download** button → opens the GitHub release page |
| H3 | *(At the next release only)* AppImage with a newer release | Downloads → **Restart & Update** → reopens on the new version |

### I. Optional: final-screen crash (N1) in dev mode
Same as Windows **I1–I4**, using `pkill -9 -f electron/dist/electron` to crash.

### J. Dashboard
Same as Windows **J1–J2**.

### K. Optional: midnight (A10)
Same as Windows **K1–K4**, using `sudo timedatectl set-ntp false` and `sudo timedatectl set-time "YYYY-MM-DD 23:58:00"`; afterwards `sudo timedatectl set-ntp true`.

---

## At the next release (after v1.0.0)

These need a published release **newer** than the installed one, so they can't be tested for v1.0.0:
| # | OS | Do | Expected |
| :--- | :--- | :--- | :--- |
| U1 | Windows, AppImage | Install the previous version, publish the new one, **Check for Updates** | Downloading… → **Restart & Update** → reopens on the new version; sessions still in the dashboard |
| U2 | Windows, AppImage | Same, but click **Restart & Update** during a session | First click: red **Restart Anyway** + one-line warning; reverts after 6 s; second click restarts |
| U3 | macOS, `.deb` | Check for Updates | **Download** button → opens the release page |
