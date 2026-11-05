const { spawn } = require("child_process");
const electronPath = require("electron");

// Clean environment so Cursor / IDE never leaks ELECTRON_RUN_AS_NODE into Electron
const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

// Ensure PulseAudio has sufficient latency buffer headroom on Linux/WSL to avoid underruns
if (process.platform === 'linux' && !cleanEnv.PULSE_LATENCY_MSEC) {
  cleanEnv.PULSE_LATENCY_MSEC = '120';
}

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
