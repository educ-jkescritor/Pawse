<div align="center">

  <img src="src/assets/logos/pawse.png" alt="PAWSE Logo" width="220" />

  <p><strong>A Secure, Resilient, and Companion-Driven Pomodoro Desktop Application</strong></p>

  <p>
    <a href="https://github.com/educ-jkescritor/Pawse/releases"><img src="https://img.shields.io/badge/Version-1.0.0-blue.svg?style=for-the-badge&logo=github" alt="Version 1.0.0" /></a>
    <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-42.4.0-47848F.svg?style=for-the-badge&logo=electron&logoColor=white" alt="Electron 42" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-CommonJS-339933.svg?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
    <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/Database-SQLite3-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite3" /></a>
    <a href="#-devsecops--security-posture"><img src="https://img.shields.io/badge/Security-OS%20Sandboxed-2ea44f.svg?style=for-the-badge&logo=shield" alt="Hardened Security" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-orange.svg?style=for-the-badge" alt="MIT License" /></a>
  </p>

  <p>
    <a href="#-key-features">Key Features</a> •
    <a href="#-meet-your-companions">Meet Your Companions</a> •
    <a href="#-adaptive-window-modes">Window Modes</a> •
    <a href="#-local-durable-execution">Durable Execution</a> •
    <a href="#-technical-architecture">Architecture</a> •
    <a href="#-devsecops--security-posture">Security</a> •
    <a href="#-database-schema--migration-readiness">Database</a> •
    <a href="#-getting-started">Installation</a> •
    <a href="#-team--acknowledgments">Team</a>
  </p>

</div>

---

## 📖 Overview

**PAWSE** is a companion-driven desktop Pomodoro productivity application engineered to turn focused work into an engaging, habit-forming experience through animated pixel-art feline companions. 

Unlike traditional browser or mobile timers that lose progress upon accidental closure or background suspension, PAWSE is architected with **Local Durable Execution** (crash-resilient continuous state tracking) and **Electron security hardening** (OS-level sandboxing, context isolation, strict Content Security Policy, and parameterized SQL). Built with frameworkless Vanilla web standards and CommonJS, PAWSE runs fully offline.

---

## 🌟 Key Features

- **🐾 3 Unique Companion Cadences:** Choose between Tux, Ginger, and Void—each tuned with mathematically balanced work/break cycles, bespoke visual themes, and distinct meow sound effects.
- **🔄 Local Durable Execution:** The timer saves its state every second. If the app crashes or the computer shuts down unexpectedly, your unsaved focus time is recovered into your stats, and picking the same companion resumes the session where it stopped (time spent closed is never counted as focus). The timer also pauses safely when the computer sleeps.
- **🪟 4 Adaptive Window Modes:** Effortlessly switch between Standard, Settings & Analytics, Minimalist Floating Timer, and Companion Desk-Pet widgets via frameless IPC window transforms.
- **📊 Local Analytics & Lifetime Statistics:** Automatically tracks daily focus streaks, 7-day weekly activity distributions, personal best focus records, total work/break sessions, and companion popularity in a local, zero-leak SQLite database.
- **🐟 Fish-Treat Gamification:** Complete 4 work sessions to earn fish treats for your feline partner and unlock long rejuvenating breaks.
- **🐱 Interactive Break Petting & Companion Dialogue:** Click to pet your companion during breaks for a meow and a playful animation. Your companion also chats in speech bubbles that react to how your session went (finishing strong, skipping early, coming back after a long pause).
- **🎵 Automated Ambient Audio Engine:** Smooth transitions between focused background purring, gentle interval ticking, and alert bells with volume controls.
- **⚡ Built-In Updates:** Checks GitHub Releases from Settings. On Windows (installer) and Linux (AppImage), updates download and install with one click (**Restart & Update**). On macOS and Linux (`.deb`), a **Download** button opens the latest release page.
- **🔒 Enforced Focus (Strict Mode):** Optional lock that prevents pausing and skipping once a session starts. If the computer sleeps or the app closes unexpectedly, the strict session resumes automatically, and you can always leave a session from the exit dialog.
- **🛡️ DevSecOps-Grade Security:** 100% sandboxed Chromium renderer with zero Node.js process exposure, strict Content Security Policy (CSP), and parameterized SQL operations.

---

## 🐱 Meet Your Companions

Every companion in PAWSE brings their own personality, work cadence, and visual aesthetic:

| Companion | Profile | Cadence (Work / Short / Long) | Target Focus Style | Sound Profile |
| :--- | :---: | :---: | :--- | :--- |
| **Tux**<br>*(Tuxedo Cat)* | <img src="src/assets/photos/tuxedo-cat-face.png" alt="Tux" width="56" /> | **25 min** / **5 min** / **20 min** | **Balanced & Methodical**<br>Classic Pomodoro cadence perfect for general productivity, daily task sprints, and steady pacing. | Crisp bell & balanced meow |
| **Ginger**<br>*(Orange Cat)* | <img src="src/assets/photos/orange-cat-face.png" alt="Ginger" width="56" /> | **15 min** / **3 min** / **12 min** | **Rapid Sprints**<br>Ideal for quick bursts of deep work, drafting emails, reading, or fighting fatigue. | Energetic, playful meow |
| **Void**<br>*(Black Cat)* | <img src="src/assets/photos/black-cat-face.png" alt="Void" width="56" /> | **50 min** / **10 min** / **40 min** | **Deep Research & Flow State**<br>Tailored for software development, technical writing, and immersive problem solving. | Deep, resonant chime & meow |

---

## 🪟 Adaptive Window Modes

PAWSE dynamically changes shape to suit your working environment. Toggle views using the custom frameless title bar controls:

```
┌─────────────────────────┐  ┌────────────────────────────────────────────────────────┐
│      Standard Mode      │  │                   Settings & Dashboard                 │
│       (310 x 430)       │  │                       (736 x 430)                      │
│                         │  │                                                        │
│   🐱 Companion Sprite   │  │   📊 Overall Focus Time & Session Stats                │
│   ⏱️ Digital Timer Display│  │   🐱 Companion Preferences & Audio Volumes             │
│   ▶️ Play / Skip / Options │  │   ⚙️ Application Settings & Updates                    │
└─────────────────────────┘  └────────────────────────────────────────────────────────┘

        ┌─────────────────────────┐         ┌─────────────────────────┐
        │    Timer-Only Widget    │         │     Cat-Only Widget     │
        │       (240 x 100)       │         │       (240 x 240)       │
        │   ⏱️ 24:58 [▶][⏭][⚙]    │         │   🐱 Companion Desk Pet  │
        └─────────────────────────┘         └─────────────────────────┘
```

1. **Standard Mode (310 x 430):** The primary view displaying the full companion sprite animation, digital countdown display, fish reward tracker, and controls.
2. **Settings & Analytics Dashboard (736 x 430):** An independent management dashboard displaying overall work hours, break minutes, completed cycles, audio sliders, and companion picker.
3. **Timer-Only HUD (240 x 100):** A compact floating widget that tucks neatly into the corner of your workspace for uninterrupted multitasking.
4. **Cat-Only Desk Pet (240 x 240):** Turns your companion into an animated pixel desk pet to keep you company during study and relaxation.

---

## 🔄 Local Durable Execution

A core engineering highlight of PAWSE is its crash-resilient timer. Traditional web-based timers reset if the window is closed unexpectedly. PAWSE implements **Local Durable Execution**:

```mermaid
flowchart TD
    A["Active Timer Tick (1s Interval)"] --> B["Capture State Snapshot<br/>(remainingTime, cycleCount, focus totals, strict mode)"]
    B --> C["Write to localStorage<br/>('pawseDurableState')"]

    D["Crash / Force Quit / Power Loss"] --> E["App Restart: Companion Menu (index.js)"]
    E --> F{"Unsaved snapshot<br/>found?"}
    F -- No --> G["Normal start"]
    F -- Yes --> H["Save its focus time to the<br/>SQLite stats (no progress lost)"]
    H --> I{"Same companion picked<br/>within 12 hours?"}
    I -- No --> G
    I -- Yes --> J["Resume at the stored remaining time<br/>(time spent closed is not counted)"]
    J --> K{"Strict Mode<br/>session?"}
    K -- No --> L["Resume paused: press Play when ready"]
    K -- Yes --> M["Resume running, still strict"]
```

### The Recovery Rules
1. Every second, `src/renderer/timer/timer.js` saves the companion, cycle, remaining time, focus totals, and Strict Mode state to `localStorage`.
2. On restart, the companion menu (`index.js`) first saves any unsaved focus time from that snapshot to the local database, so your stats and streaks keep it even if you pick a different companion.
3. Picking the **same** companion within 12 hours resumes the session at the time it stopped. Time while the app was closed is **not** counted as focus, so the countdown continues exactly where you left it.
4. A completed set (all 4 cycles) is saved the moment it finishes, so it's never lost and never resumed.
5. The timer uses a monotonic clock, so changing the system clock can't speed it up or slow it down. When the computer sleeps, the timer pauses (Strict Mode resumes it automatically on wake).

> **Note:** after a hard crash, the last few seconds before the crash may not be recovered.

---

## 🏗 Technical Architecture

PAWSE enforces a strict **Model-View-Controller (MVC)** and **Multi-Process Architecture**, ensuring that untrusted renderer code can never access operating system primitives directly.

### System Architecture Diagram

```mermaid
flowchart TD
    subgraph Backend ["Main Process (Node.js)"]
        A["main.js<br/>Window Lifecycles & IPC Dispatcher"]
        C[("pawse.db<br/>SQLite3 Engine (database.js)")]
        A <-->|"Parameterized Queries<br/>(Zero SQLi Risk)"| C
    end

    subgraph Bridge ["Secure Preload Gateway"]
        D["preload.js<br/>contextBridge.exposeInMainWorld('mainAPI', ...)"]
    end

    subgraph Frontend ["Renderer Process (Chromium Sandbox)"]
        UI["UI Views<br/>index.html | settings.html | timer.html"]
        TM["timer.js<br/>Timer State Machine"]
        SM["settings.js<br/>Dashboard & Config Manager"]
        DS[("localStorage<br/>pawseDurableState")]
        UI --- TM
        UI --- SM
        TM <-->|"Sub-Second State Snapshot"| DS
    end

    A -->|"Enforces CSP & OS Sandbox"| UI
    Frontend -->|"Sanitized API Calls"| D
    D -->|"Explicit Whitelisted IPC"| A
```

### File Structure & Module Responsibilities

```
pawse/
├── docs/                     # Project report and the project log (status, decisions, test results)
├── src/
│   ├── assets/               # Pixel-art sprites, avatars, icons, fonts, and sound effects
│   │   ├── fonts/            # Inter & Pixelify Sans TrueType fonts
│   │   ├── icons/            # Action and UI navigation icons
│   │   ├── logos/            # Application logos and brand assets
│   │   ├── photos/           # High-resolution companion avatar portraits
│   │   ├── sounds/           # Purrs, meows, ticking, and alarm audio assets
│   │   └── sprites/          # Multi-frame animated cat sprites (static, work, click)
│   ├── main/                 # Electron Main Process (Node.js runtime)
│   │   ├── database.js       # SQLite3 connection, automated schema migrations, parameterized queries
│   │   ├── main.js           # Window lifecycle, auto-updater, frameless controls, IPC routing
│   │   └── preload.js        # Isolated contextBridge exposing safe window.mainAPI
│   └── renderer/             # Chromium Presentation Layer (Vanilla HTML5 / CSS3 / JS)
│       ├── index.css         # Central design token system (CSS variables, themes, typography)
│       ├── index.html        # Companion selection welcome screen
│       ├── index.js          # Selection UI logic and companion switching
│       ├── settings.css      # Modal styling, responsive analytics dashboard, themes
│       ├── settings.html     # Settings modal & productivity analytics view
│       ├── settings.js       # Analytics aggregation, audio volume engine, theme updates
│       ├── titlebar.js       # Frameless custom titlebar window controls & IPC dispatch
│       └── timer/            # Core Pomodoro execution environment
│           ├── dialogueData.js   # Companion speech-bubble lines
│           ├── dialogueEngine.js # Picks what the companion says based on your session
│           ├── timer.css     # Timer-specific HUD and widget styles
│           ├── timer.html    # Timer view markup
│           └── timer.js      # Pomodoro state machine & local durable execution logic
├── tests/                    # Jest unit and integration tests
├── AGENTS.md                 # Guidelines for AI coding assistants (CLAUDE.md / GEMINI.md point here)
├── package.json              # Dependencies, build metadata, and npm scripts
├── README.md                 # Project documentation
└── start.js                  # Clean environment bootstrapper for Electron development

# pawse.db (your local SQLite database) is created automatically on first run:
# in the project folder during development, and in the OS user-data folder when installed.
# It is never committed or packaged.
```

---

## 🛡️ DevSecOps & Security Posture

PAWSE enforces a zero-trust, defence-in-depth architecture across all Electron components:

| Security Vector | Implementation Mechanism | Purpose & Verification |
| :--- | :--- | :--- |
| **OS-Level Sandboxing** | `sandbox: true` in `BrowserWindow.webPreferences` | Traps Chromium renderer threads in the OS kernel sandbox. |
| **Process Isolation** | `contextIsolation: true`, `nodeIntegration: false` | Prevents malicious DOM injections from accessing Node `require()`, `process`, or `fs`. |
| **Strict CSP** | `<meta http-equiv="Content-Security-Policy">` on all pages | Prohibits `'unsafe-eval'`, external scripts, unauthorized styles, and remote data leaks. |
| **Safe Navigation** | `contents.setWindowOpenHandler` & `will-navigate` in `main.js` | External links (GitHub, LinkedIn) open in OS default browser; all internal popups denied. |
| **SQL Injection Immunity** | Parameterized statements (`VALUES (?, ?, ?)`) in `database.js` | Completely neutralizes SQL injection attacks across all database operations. |
| **IPC Sanitization** | Explicit, strictly typed methods on `window.mainAPI` | Whitelists only safe IPC actions; no raw `ipcRenderer` access is ever leaked to the DOM. |

---

## 💾 Database Schema & Migration Readiness

PAWSE uses a local SQLite3 database (`pawse.db`) created automatically in the user data directory. To stay compatible with future releases (such as optional cloud synchronization), the database **migrates itself automatically** on startup:

```sql
CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT DEFAULT 'guest',
  cat_type TEXT,
  total_work_seconds INTEGER,
  total_break_seconds INTEGER,
  total_work INTEGER,
  total_break INTEGER,
  total_pomodoro INTEGER,
  date_completed DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_synced INTEGER DEFAULT 0,
  uuid TEXT UNIQUE
);
```

- **Cloud Isolation:** In guest mode, `email` defaults to `'guest'` and sync flags remain strictly local.
- **Deduplication:** Every session is stamped with a cryptographically secure UUID (`crypto.randomUUID()`), so saving the same session again updates one row instead of creating duplicates.
- **Self-Healing Schema:** On boot, `database.js` queries table `PRAGMA table_info(session)` and automatically executes `ALTER TABLE` to backfill any missing columns and populate UUIDs for legacy rows.

---

## 🛠 Technology Stack

- **Runtime & Desktop Framework:** [Electron](https://www.electronjs.org/) (v42)
- **Engine / Backend:** [Node.js](https://nodejs.org/) (CommonJS module architecture)
- **Local Persistence:** [SQLite3](https://www.sqlite.org/) (`sqlite3` v6)
- **Frontend Architecture:** Pure Vanilla HTML5, CSS3, JavaScript (no frameworks or bundlers)
- **Typography:** Pixelify Sans (digital displays, headers) & Inter (UI typography, dashboards)
- **Packaging & Distribution:** [electron-builder](https://www.electron.build/): Windows installer (`.exe`) and Microsoft Store package, macOS `.dmg` (Apple Silicon and Intel), Linux AppImage and `.deb`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Version 20 LTS or newer)
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/educ-jkescritor/Pawse.git
   cd Pawse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch the application in development mode:**
   ```bash
   npm start
   ```

### Building the Distributables

Build each platform **on that operating system** (PAWSE uses a native SQLite module, so cross-building from another OS produces broken packages):

| Platform | Command | Output |
| :--- | :--- | :--- |
| Windows | `npm run build:exe` | Installer (`.exe`) |
| Windows (Microsoft Store) | `npm run build:store` | `.appx` package |
| macOS | `npm run build:mac` | `.dmg` and `.zip` for Apple Silicon and Intel |
| Linux | `npm run build:linux` | AppImage and `.deb` |

The compiled packages are placed in the `dist/` directory.

---

## 👥 Team & Acknowledgments

**PAWSE** was created and engineered with ❤️ by:

- **Jasmin Joyce Obligado** — Co-Founder / UI/UX Designer / Technical Writer / Frontend Developer  
  [GitHub](https://github.com/jjobligado) • [LinkedIn](https://www.linkedin.com/in/jasmin-joyce-obligado/)
- **Jude Keith Escritor** — Co-Founder / Full-Stack Developer / Pixel Artist / QA Engineer  
  [GitHub](https://github.com/educ-jkescritor) • [LinkedIn](https://www.linkedin.com/in/jude-keith-escritor-370a69267/)
- **Ysabel Marie Delos Santos** — Frontend Development Lead

### Special Thanks
- Pixel art sprites and audio curated for focus and companion gaming.
- The open-source Electron, Node.js, and SQLite communities.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and distribute as described in the license.