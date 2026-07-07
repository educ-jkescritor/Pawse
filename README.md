# PAWSE 🐾
**A Secure, Resilient, and Adorable Pomodoro Timer built with Electron.**

PAWSE is not just a timer—it is a companion-driven productivity tool engineered with industry-standard architecture, impenetrable security, and flawless local fault tolerance.

## 🏆 Key Features

### 1. Local Durable Execution (Fault Tolerance)
Built to survive. The application leverages a continuous `localStorage` state-sync engine. If the app is accidentally closed, crashes, or the computer sleeps, PAWSE calculates the offline elapsed time mathematically and resumes the session exactly where it left off. No cloud orchestration required.

### 2. Impeccable Security Architecture
Hardened to the absolute maximum standard of the Electron framework:
- **Zero-Cloud Privacy:** All Pomodoro metrics and timestamps are recorded securely into a local SQLite Database (`pawse.db`). 
- **Chromium Sandboxing (`sandbox: true`):** The renderer processes are trapped in an OS-level sandbox.
- **Context Isolation & Node Integration:** The frontend operates completely independently from the Node.js backend.
- **Navigation Lock (`will-navigate`):** Aggressive URL blocking. Safe external links (GitHub/LinkedIn) are strictly validated and securely piped to the OS default browser (`shell.openExternal`).
- **Content Security Policy (CSP):** Every HTML window enforces a strict CSP to prevent XSS injection.

### 3. Industry-Standard MVC Structure
The codebase follows a rigorous separation of concerns:
- `src/main/` - Node.js Backend, SQLite Engine, and Preload IPC.
- `src/renderer/` - Chromium Frontend, UI Logic, and Global CSS tokens.
- `src/assets/` - Locally hosted media (zero external API dependencies).

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/educ-jkescritor/Pawse.git

# Install dependencies
npm install

# Start the application
npm start
```

## 🛠 Tech Stack
- **Framework:** Electron (Node.js + Chromium)
- **Database:** SQLite3 (Parameterized Queries)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3

## 👥 Developers
- Jude Keith Escritor 
- Jasmin Joyce Obligado