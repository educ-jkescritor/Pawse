const { spawn } = require("child_process");
const electronPath = require("electron");

// Clean environment so Cursor / IDE never leaks ELECTRON_RUN_AS_NODE into Electron
const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ["."], {
  stdio: "inherit",
  env: cleanEnv,
  windowsHide: false
});

child.on("close", (code) => {
  process.exit(code || 0);
});

const handleSignal = (signal) => {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal);
    }
  });
};

handleSignal("SIGINT");
handleSignal("SIGTERM");
