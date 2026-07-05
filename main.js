const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { db, generateAnalytics } = require("./database.js");

let set = null;
let globalAlwaysOnTop = false;

function createWindow() {
  const win = new BrowserWindow({
    width: 310, // initially 292 from initial build
    height: 430, // initially 430 from initial build
    alwaysOnTop: globalAlwaysOnTop,
    resizable: true, // Keep resizable true to allow programmatic resizing on Windows
    minWidth: 310,
    maxWidth: 310,
    minHeight: 430,
    maxHeight: 430,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("index.html");

  win.on('closed', () => {
    if(set) {
      set.close();
    }
  });
}

function settingsWindow() {
  set = new BrowserWindow({
    width: 720, // initially 292 from initial build
    height: 430, // initially 430 from initial build
    alwaysOnTop: globalAlwaysOnTop,
    resizable: true, // Keep resizable true to match main window's OS frame styling
    minWidth: 720,
    maxWidth: 720,
    minHeight: 430,
    maxHeight: 430,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  set.loadFile("settings.html");

  set.on('closed', () => {
    set = null;
  });
}

app.whenReady().then(createWindow);

ipcMain.on('minimize-window', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if(senderWindow) {
    senderWindow.minimize();
  }
});

ipcMain.on('maximize-window', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow.isMaximized()) {
    senderWindow.unmaximize();
  } else {
    senderWindow.maximize();
  }
});

ipcMain.on('resize-window', (event, mode) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  
  if (mode === 'timer-only') {
    senderWindow.setMinimumSize(240, 100);
    senderWindow.setMaximumSize(240, 100);
    senderWindow.setSize(240, 100); 
  } else if (mode === 'cat-only') {
    senderWindow.setMinimumSize(240, 240);
    senderWindow.setMaximumSize(240, 240);
    senderWindow.setSize(240, 240); 
  } else {
    senderWindow.setMinimumSize(310, 430);
    senderWindow.setMaximumSize(310, 430);
    senderWindow.setSize(310, 430); 
  }
});

ipcMain.on('close-window', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  senderWindow.close();
});

ipcMain.on('settings-window', (event) => {
  if(set){
    set.focus();
  }else{
    settingsWindow();
  }
});

ipcMain.on('save-session', (event, data) => {
  
  const insertQuery = `INSERT INTO session (
    cat_type, 
    total_work_seconds, 
    total_break_seconds, 
    total_work, 
    total_break,
    total_pomodoro
  ) VALUES (
    ?, ?, ?, ?, ?, ?
  )`;

  db.run(insertQuery, [data.cat_type, data.total_work_seconds, data.total_break_seconds, data.total_work, data.total_break, data.total_pomodoro], (err) => {
    if (err) {
      console.log("Error inserting session data:", err.message);
    } else {
      console.log("Session data inserted successfully.");
    }
  });
});

ipcMain.on('set-always-on-top', (event, isAlwaysOnTop) => {
  globalAlwaysOnTop = isAlwaysOnTop;
  const activeWindow = BrowserWindow.fromWebContents(event.sender);
  
  // Set all background windows first
  BrowserWindow.getAllWindows().forEach((window) => {
    if (window !== activeWindow) {
      window.setAlwaysOnTop(isAlwaysOnTop);
    }
  });

  // Set the active window last so it stays on top of the others, and focus it to clear Windows DWM lag
  if (activeWindow) {
    activeWindow.setAlwaysOnTop(isAlwaysOnTop);
    activeWindow.focus();
  }
});

ipcMain.handle('load-analytics', async (event, weeksAgo) => {
  try {
    const analyticsData = await generateAnalytics(weeksAgo);
    return analyticsData;
  } catch (error) {
    console.error("Error generating analytics:", error);
    throw error;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

