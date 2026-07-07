# PAWSE 🐾
*A Secure, Resilient, and Companion-Driven Pomodoro Timer built with Electron.*

![Pawse Application](https://img.shields.io/badge/Electron-42.4.0-blue?logo=electron) ![SQLite](https://img.shields.io/badge/Database-SQLite3-blue?logo=sqlite) ![Security](https://img.shields.io/badge/Security-Hardened-green?logo=shield)

## 📖 Project Explanation
PAWSE is a desktop Pomodoro application engineered to gamify focus and productivity through virtual cat companions. Users select a companion (Orange, Tuxedo, or Black Cat), each offering different Pomodoro time configurations based on the user's workload. As users complete work cycles, they collect "fish" (sessions), interact with their companion during breaks, and build localized analytics to track productivity.

Unlike standard timers, PAWSE was built with **fault tolerance (Local Durable Execution)** and **military-grade Electron security** in mind, proving that even lightweight productivity apps deserve enterprise-level engineering.

---

## 🏗 Architecture Overview
PAWSE adheres to a strict, industry-standard **Model-View-Controller (MVC)** directory structure, separating the Node.js backend from the Chromium frontend.

```text
pawse/
├── pawse.db                # Auto-generated SQLite Database (Root level for safety)
├── package.json            # Application metadata and dependencies
└── src/
    ├── main/               # Backend (Node.js)
    │   ├── main.js         # Window management, security locks, and lifecycle
    │   ├── database.js     # SQLite integration and parameterized queries
    │   └── preload.js      # Secure IPC Bridge (Context Isolation)
    ├── renderer/           # Frontend (Chromium)
    │   ├── index.*         # Main Menu UI & Logic
    │   ├── settings.*      # Configuration UI & Logic
    │   └── timer/          # Timer State Machine UI & Logic
    └── assets/             # Localized media, fonts, and CSS tokens
```

### Core Mechanisms
*   **State Machine:** The timer logic operates as a local state machine that controls UI elements, audio manipulation (ambient BGM, dynamic meows), and window resizing without page reloads.
*   **Local Durable Execution:** The timer continuously syncs its state to `localStorage`. If the app crashes or the system sleeps, PAWSE mathematically calculates the offline elapsed time on boot, deducts it from the remaining time, and seamlessly resumes the session. It fakes "Temporal-style" execution locally without needing a cloud server.

---

## 🛡️ Security Report (DevSecOps)
Electron applications are notoriously vulnerable if not configured correctly. PAWSE has been aggressively hardened to score a **0-vulnerability rating** on static security scans (e.g., Aikido Security).

The following layers of Defense-in-Depth have been implemented:

1.  **OS-Level Sandboxing (`sandbox: true`)**
    *   The renderer (frontend) is physically trapped inside an OS-level Chromium sandbox. Even if a zero-day RCE exploit compromised the UI, the attacker cannot escape to access the host operating system.
2.  **Strict Context Isolation & Disabled Node Integration**
    *   `nodeIntegration: false` and `contextIsolation: true` are explicitly enforced. The frontend has zero access to Node.js APIs or the file system. All communication happens strictly through heavily filtered IPC channels defined in `preload.js`.
3.  **Content Security Policy (CSP)**
    *   Every HTML window enforces a strict meta-tag CSP (`default-src 'self'`). No external scripts, remote stylesheets, or remote images can be executed or loaded.
4.  **Navigation Locks (`will-navigate` & `setWindowOpenHandler`)**
    *   The backend physically rejects any attempts by the renderer to open malicious popups or navigate to external URLs. Authorized developer links (GitHub/LinkedIn) are intercepted and securely piped to the OS's default web browser using `shell.openExternal`.
5.  **Database Injection Immunity**
    *   The `pawse.db` SQLite engine utilizes strict Parameterized Queries for all data insertions, making SQL Injection mathematically impossible.

---

## ⚙️ Setup Instructions
Follow these steps to successfully run PAWSE on your local machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
*   [Git](https://git-scm.com/)

### Installation & Execution
**1. Clone the repository**
```bash
git clone https://github.com/educ-jkescritor/Pawse.git
cd Pawse
```

**2. Install dependencies**
This will download Electron and SQLite3.
```bash
npm install
```

**3. Start the application**
```bash
npm start
```

### Resetting the Application Data
To completely reset your Pomodoro analytics, simply delete the `pawse.db` file from the root directory. The application will safely auto-generate a fresh database the next time it boots.

---

## 👥 Developers
*   **Jude Keith Escritor** ([GitHub](https://github.com/educ-jkescritor) | [LinkedIn](https://www.linkedin.com/in/jude-keith-escritor-370a69267/))
*   **Jasmin Joyce Obligado** ([GitHub](https://github.com/jjobligado) | [LinkedIn](https://www.linkedin.com/in/jasmin-joyce-obligado/))