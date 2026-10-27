const { spawn } = require("child_process");
const electronPath = require("electron");
const path = require("path");

const cleanEnv = { ...process.env };
delete cleanEnv.ELECTRON_RUN_AS_NODE;

const scriptPath = path.join(__dirname, "export-screens.js");

console.log("Starting automated screen export process with Electron...");

const child = spawn(electronPath, [scriptPath], {
  stdio: "inherit",
  env: cleanEnv,
  windowsHide: false
});

child.on("close", (code) => {
  console.log(`Export process finished with exit code ${code}`);
  process.exit(code || 0);
});
