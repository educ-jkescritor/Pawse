# PAWSE — Agent Guidelines & Repository Rules

This document outlines mandatory guidelines, architectural principles, security standards, and behavioral requirements for any AI assistant working on the **PAWSE** codebase.

---

## 1. Project Overview & Architecture

PAWSE is an Electron desktop Pomodoro application featuring companion cats, local durable execution, and two-way Supabase synchronization.

* **Main Process (`src/main/`):** Node.js runtime governing window lifecycles, OS integrations, SQLite database operations, cloud sync, and auto-updates.
* **Preload Bridge (`src/main/preload.js`):** Sandboxed communication channel exposing a strictly typed `window.mainAPI` via Electron's `contextBridge`.
* **Renderer Process (`src/renderer/`):** Pure HTML5, CSS3, and Vanilla JavaScript handling the timer state machine, animations, audio, and settings/dashboard views.
* **Assets (`src/assets/`):** Curated sprites, audio effects (purrs, alarms, ticks), custom fonts (Inter, Pixelify Sans), and icons.

---

## 2. Core AI Rules of Engagement

1. **Verify Before Action:**
   * Always inspect relevant files before making modifications.
   * Do not initiate sweeping refactors or delete existing functional code without explaining the rationale and getting confirmation.
2. **Preserve Documentation & Comments:**
   * Maintain existing comments, author credits, and docstrings.
   * Document new IPC handlers, database schema changes, and complex algorithms (e.g. durable state time-math).
3. **Consistent Codebase Stack:**
   * Do not introduce new frameworks (React, Vue, Vite, Webpack, etc.) or external UI libraries unless explicitly instructed by the user. PAWSE is intentionally built with lightweight, frameworkless Vanilla HTML/CSS/JS and CommonJS.
4. **Clickable Links Requirement:**
   * Always provide clickable markdown links using the `file://` URI scheme when referencing files or code symbols in discussions and reviews.

---

## 3. Electron Security Standards (Non-Negotiable)

PAWSE enforces an aggressive DevSecOps security posture. Under no circumstances should security controls be weakened:

* **Sandboxing & Isolation:** 
  * `sandbox: true`, `contextIsolation: true`, and `nodeIntegration: false` must remain enabled for all `BrowserWindow` instances in [`src/main/main.js`](file:///mnt/c/Users/Jude%20Keith%20Escritor/pawse/src/main/main.js).
* **Zero Direct Node Access in Renderer:**
  * The frontend must NEVER have direct access to `require()`, `fs`, `sqlite3`, or process primitives.
  * All communication must pass through [`src/main/preload.js`](file:///mnt/c/Users/Jude%20Keith%20Escritor/pawse/src/main/preload.js) using explicitly declared, parameter-sanitized channels on `window.mainAPI`.
* **Content Security Policy (CSP):**
  * Every HTML file must retain strict CSP meta tags. Never permit `'unsafe-eval'` or unverified external sources.
* **Navigation & Popup Controls:**
  * External URLs must never navigate inside the Electron window. All safe external links (e.g., GitHub, LinkedIn) must be explicitly handled via `contents.setWindowOpenHandler` and piped to the user's OS default browser via `shell.openExternal()`. All other popups must be denied.

---

## 4. Data Layer & Persistence Rules

* **SQL Injection Immunity:**
  * All queries in [`src/main/database.js`](file:///mnt/c/Users/Jude%20Keith%20Escritor/pawse/src/main/database.js) must use parameterized statements (`VALUES (?, ?, ?)`). Never concatenate dynamic strings into SQL queries.
* **Durable Execution State:**
  * The local persistence schema (`localStorage.getItem('pawseDurableState')`) must be preserved. Any changes to timer state properties must update both active runtime memory and the local snapshot to guarantee crash resilience.
* **Cloud & Guest Mode Isolation:**
  * Guest accounts (`guest` or empty email) must NEVER trigger Supabase cloud synchronization.
  * Synchronizations must be incremental, using UUID deduplication and `is_synced` status flags.
* **Configuration & Secrets:**
  * Never hardcode sensitive tokens or personal credentials into repository files. Keep API configurations isolated in [`config.js`](file:///mnt/c/Users/Jude%20Keith%20Escritor/pawse/config.js) or environment variables.

---

## 5. UI & Styling Conventions

* **Design Tokens:**
  * Use the CSS custom properties defined in [`src/renderer/index.css`](file:///mnt/c/Users/Jude%20Keith%20Escritor/pawse/src/renderer/index.css) (e.g., `--text-black`, `--sys-blue-*`, `--theme-classic-*`, `--theme-sprint-*`, `--theme-focused-*`).
* **Typography:**
  * Digital timer displays and headers utilize `Pixelify Sans` (`font-pixel-*`).
  * Body copy, labels, and dialog text utilize `Inter` (`font-inter-*`).
* **Window Sizing Modes:**
  * Standard Window: `310 x 430`
  * Settings Window: `720 x 430`
  * Timer-Only Widget: `240 x 100`
  * Cat-Only Widget: `240 x 240`
  * Any UI changes to these views must account for their respective dimensions and ensure layouts do not overflow or cause unwanted scrollbars.

---

## 6. Verification Checklist Before Committing Changes

- [ ] Does the change maintain IPC security (no raw `ipcRenderer` exposure)?
- [ ] Are all database operations parameterized?
- [ ] Does the timer still resume correctly from `pawseDurableState` upon simulated reload?
- [ ] Does the feature work offline or in Guest mode?
- [ ] Are styles consistent with existing CSS variables and typography tokens?
