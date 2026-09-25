const { app, BrowserWindow, ipcMain, shell, nativeTheme, screen} = require("electron");
const path = require("path");
const iconPath = path.join(__dirname, "../assets/logos/logo.png");
const { db, generateAnalytics } = require("./database.js");
const { autoUpdater } = require("electron-updater");
const { randomUUID } = require("crypto");

nativeTheme.themeSource = 'light';

// Suppress internal Chromium C++ diagnostics (e.g. unconfigured Crashpad pipes)
app.commandLine.appendSwitch('log-level', '3');

let win = null;
let set = null;
let globalAlwaysOnTop = false;

function createWindow() {
  win = new BrowserWindow({
    icon: iconPath,
    show: false,
    //useContentSize: true,
    width: 310, // content area width
    height: 430, // content area height
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
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  let isShown = false;
  const showWindow = () => {
    if (!isShown && win && !win.isDestroyed()) {
      isShown = true;
      win.setSize(310, 430);
      win.webContents.setVisualZoomLevelLimits(1, 1);
      win.webContents.setZoomLevel(0);
      win.show();
      win.setAlwaysOnTop(true);
      win.focus();
      setTimeout(() => {
        if (!win.isDestroyed()) {
          win.setAlwaysOnTop(globalAlwaysOnTop);
        }
      }, 300);
    }
  };

  win.once('ready-to-show', showWindow);
  win.webContents.once('did-finish-load', showWindow);

  win.loadFile(path.join(__dirname, "../renderer/index.html"));

  win.on('closed', () => {
    if(set) {
      set.close();
    }
    win = null;
  });
}

function settingsWindow() {
  set = new BrowserWindow({
    icon: iconPath,
    show: false,
    //useContentSize: true,
    width: 720, // content area width
    height: 430, // content area height
    alwaysOnTop: false,
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
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  let isSettingsShown = false;
  const showSettings = () => {
    if (!isSettingsShown && set && !set.isDestroyed()) {
      isSettingsShown = true;
      set.setSize(720, 430);
      set.webContents.setVisualZoomLevelLimits(1, 1);
      set.webContents.setZoomLevel(0);
      set.show();
      set.focus();
    }
  };

  set.once('ready-to-show', showSettings);
  set.webContents.once('did-finish-load', showSettings);

  set.loadFile(path.join(__dirname, "../renderer/settings.html"));

  set.on('closed', () => {
    set = null;
  });
}

app.setAppUserModelId("com.pawse.app");

app.whenReady().then(() => {
  createWindow();

  // SECURITY: Lock down navigation and new windows
  app.on('web-contents-created', (event, contents) => {
    // Intercept safe external links and pipe them to the OS default browser
    contents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://github.com/') || url.startsWith('https://www.linkedin.com/')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    // Disable navigation to external URLs
    contents.on('will-navigate', (event, navigationUrl) => {
      event.preventDefault();
    });
  });
  
  // Automatically re-evaluate frameless window bounds when display scale/orientation/resolution changes
  screen.on('display-metrics-changed', () => {
    if (win && !win.isDestroyed() && !win.isMinimized()) {
      const bounds = win.getBounds();
      win.setBounds(bounds);
    }
    if (set && !set.isDestroyed() && !set.isMinimized()) {
      const bounds = set.getBounds();
      set.setBounds(bounds);
    }
  });
});

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
  if (!senderWindow || senderWindow.isDestroyed()) return;
  
  let targetWidth = 310;
  let targetHeight = 430;
  let alwaysOnTop = globalAlwaysOnTop;

  if (mode === 'timer-only') {
    targetWidth = 240;
    targetHeight = 100;
    alwaysOnTop = true;
  } else if (mode === 'cat-only') {
    targetWidth = 240;
    targetHeight = 240;
    alwaysOnTop = true;
  }

  // 1. Temporarily release min/max boundaries so the window manager doesn't clamp the resize operation
  senderWindow.setMinimumSize(0, 0);
  senderWindow.setMaximumSize(10000, 10000);

  // 2. Set the window size using setSize (consistent with outer bounds WS_THICKFRAME geometry)
  senderWindow.setSize(targetWidth, targetHeight);

  // 3. Immediately re-evaluate bounds to force the OS and Chromium compositor to conform synchronously
  // (Identical to our display-metrics-changed fix that solved display scale conformity)
  const currentBounds = senderWindow.getBounds();
  senderWindow.setBounds({
    x: currentBounds.x,
    y: currentBounds.y,
    width: targetWidth,
    height: targetHeight
  });

  // 4. Lock min and max to the target dimensions to maintain fixed sizing
  senderWindow.setMinimumSize(targetWidth, targetHeight);
  senderWindow.setMaximumSize(targetWidth, targetHeight);

  // 5. Ensure zoom level limits remain strictly locked
  senderWindow.webContents.setVisualZoomLevelLimits(1, 1);
  senderWindow.webContents.setZoomLevel(0);

  // 6. Apply always on top state
  senderWindow.setAlwaysOnTop(alwaysOnTop);
});

ipcMain.on('close-window', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  senderWindow.close();
});

ipcMain.on('settings-window', (event) => {
  if (set) {
    if (set.isMinimized()) {
      set.restore();
      set.focus();
    } else {
      set.close();
    }
  } else {
    settingsWindow();
  }
});

ipcMain.on('save-session', (event, data) => {
  const uuid = data.uuid || randomUUID();
  const insertQuery = `INSERT INTO session (
    cat_type, 
    email,
    total_work_seconds, 
    total_break_seconds, 
    total_work, 
    total_break, 
    total_pomodoro,
    uuid,
    date_completed,
    is_synced
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), 0
  )`;

  db.run(insertQuery, [
    data.cat_type, 
    data.email || 'guest',
    data.total_work_seconds, 
    data.total_break_seconds, 
    data.total_work, 
    data.total_break, 
    data.total_pomodoro,
    uuid, 
    data.date_completed || null
  ], (err) => {
    if (err) {
      console.log("Error inserting session data:", err.message);
    } else {
      console.log("Session data inserted successfully.");

      // In development, keep AppData mirrored as backup so both copies stay in sync
      if (!app.isPackaged) {
        try {
          const fs = require("fs");
          const appDataDb = path.join(app.getPath("userData"), "pawse.db");
          const rootDb = path.join(__dirname, "../../pawse.db");
          fs.copyFileSync(rootDb, appDataDb);
        } catch (copyErr) {
          // Non-critical background mirror
        }
      }
    }
  });
});

ipcMain.on('set-always-on-top', (event, isAlwaysOnTop) => {
  globalAlwaysOnTop = isAlwaysOnTop;
  const activeWindow = BrowserWindow.fromWebContents(event.sender);
  
  // Set all background windows first
  if (win && !win.isDestroyed()) {
    win.setAlwaysOnTop(isAlwaysOnTop);
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

ipcMain.on('restore-window', (event) => {
  const targetWin = BrowserWindow.fromWebContents(event.sender);
  if (targetWin.isMinimized()) {
    targetWin.restore();
  }
  targetWin.setAlwaysOnTop(true);
  targetWin.show();
  targetWin.focus();

  setTimeout(() => {
    targetWin.setAlwaysOnTop(globalAlwaysOnTop);
  }, 500);
});

autoUpdater.autoDownload = false;

let currentUpdateStatus = {
  message: 'Check for new versions of Pawse.',
  buttonText: 'Check',
  disabled: false
};

function sendUpdateStatus(message, buttonText, disabled = false) {
  currentUpdateStatus = { message, buttonText, disabled };
  if (set) {
    set.webContents.send('update-message', message);
  }
}

ipcMain.handle('get-update-status', () => {
  return currentUpdateStatus;
});

ipcMain.on('check-for-updates', () => {
  if (!app.isPackaged) {
    sendUpdateStatus('Checking...', 'Check', true);
    setTimeout(() => {
      sendUpdateStatus('Update Available', 'Download', false);
    }, 500);
    return;
  }
  sendUpdateStatus('Checking...', 'Check', true);
  autoUpdater.checkForUpdates();
}); 

ipcMain.on('download-update', () => {
  if (!app.isPackaged) {
    sendUpdateStatus('Downloading...', 'Download', true);
    setTimeout(() => {
      sendUpdateStatus('Restart App to Install', 'Restart Now', false);
    }, 2500);
    return;
  }
  sendUpdateStatus('Downloading...', 'Download', true);
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-available', () => {
  sendUpdateStatus('Update Available', 'Download', false);
});

autoUpdater.on('update-not-available', () => {
  sendUpdateStatus('Up to date', 'Check', false);
});

autoUpdater.on('error', (err) => {
  console.log("Error:", err.message);
  sendUpdateStatus('Error', 'Check', false);
});

autoUpdater.on('update-downloaded', () => {
  sendUpdateStatus('Restart App to Install', 'Restart Now', false);
});

ipcMain.on('restart-app', () => {
  if (!app.isPackaged) {
    app.relaunch();
    app.quit();
    return;
  }
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

