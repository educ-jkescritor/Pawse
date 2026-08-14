const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const iconPath = path.join(__dirname, "../assets/logos/pawse.png");
const { db, generateAnalytics } = require("./database.js");
const supabase = require("./supabase.js");

let set = null;
let globalAlwaysOnTop = false;

function createWindow() {
  const win = new BrowserWindow({
    show: false,
    icon: iconPath,
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
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile(path.join(__dirname, "../renderer/index.html"));

  win.once('ready-to-show', () => {
    win.setSize(310, 430);
    win.show();
  });

  win.on('closed', () => {
    if(set) {
      set.close();
    }
  });
}

function settingsWindow() {
  set = new BrowserWindow({
    icon: iconPath,
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
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js")
    }
  });

  set.loadFile(path.join(__dirname, "../renderer/settings.html"));

  set.once('ready-to-show', () => {
    set.setSize(720, 430);
  });

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
  
  if (mode === 'timer-only') {
    senderWindow.setMinimumSize(240, 100);
    senderWindow.setMaximumSize(240, 100);
    senderWindow.setSize(240, 100); 
    senderWindow.setAlwaysOnTop(true);
  } else if (mode === 'cat-only') {
    senderWindow.setMinimumSize(240, 240);
    senderWindow.setMaximumSize(240, 240);
    senderWindow.setSize(240, 240); 
    senderWindow.setAlwaysOnTop(true);
  } else {
    senderWindow.setMinimumSize(310, 430);
    senderWindow.setMaximumSize(310, 430);
    senderWindow.setSize(310, 430); 
    senderWindow.setAlwaysOnTop(globalAlwaysOnTop);
  }
});

ipcMain.on('close-window', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  senderWindow.close();
});

ipcMain.on('settings-window', (event) => {
  if(set){
    if (set.isMinimized()) set.restore();
    set.focus();
  }else{
    settingsWindow();
  }
});

ipcMain.on('save-session', (event, data) => {
  if (!data.email || data.email === '' || data.email === 'guest') {
    return;  
  }

  const crypto = require('crypto');
  const uuid = crypto.randomUUID();

  const insertQuery = `INSERT INTO session (
    email,
    cat_type, 
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
    data.email,
    data.cat_type, 
    data.total_work_seconds, 
    data.total_break_seconds, 
    data.total_work, 
    data.total_break, 
    data.total_pomodoro, 
    uuid,
    data.date_completed || null
  ], (err) => {
    if (err) {
      console.log("Local session data save failed:", err.message);
    } else {

      console.log("Local session data saved successfully.");

      try {
        const { pushDatabase } = require("./database.js");
        pushDatabase();
        console.log("Syncing data for user:", data.email);
      } catch (error) {
        console.log("No internet connection. Cloud sync failed.");
        //console.log("Error:", error.message);
      }
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

ipcMain.handle('login', async (event, credentials) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  
  console.log("Login successful for user:", credentials.email);
  
  if (error) {
      throw error; 
  }

  return data;
});

ipcMain.handle('signup', async (event, credentials) => {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
  });

  if(data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error("The email is already taken. Please try again.");
  }
  
  console.log("Signup successful for user:", credentials.email);

  if (error) {
      throw error; 
  }

  return data;
})

ipcMain.on('login-success', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow) {
    senderWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
});

ipcMain.on('app-ready', async (event, email) => {
  if(!email || email === '' || email === 'guest') {
    console.log("Guest account detected. No data will be saved.");
    return;
  }

  console.log("Connected to local SQLite database.");
  
  try {
    const { db, pushDatabase, pullDatabase } = require("./database.js");
    db.run("UPDATE session SET email = ? WHERE email = 'guest'", [email], async (err) => {
    if(!err){
      await pushDatabase();
      await pullDatabase(email);
    }
  });
  } catch (error) {
    console.log("No internet connection. Local sync only.");
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on('manual-sync', async (event, email) => {
  if (!email || email === '' || email === 'guest') {
    console.log("Guest user detected. Manual sync disabled.");
    return;
  }

  try{
    const { pushDatabase, pullDatabase } = require("./database.js");
    await pushDatabase();
    await pullDatabase(email);
    console.log("Sync successful for email:", email);
  } catch (error) {
    console.log("No internet connection. Please try again later.");
  }
});

ipcMain.on('restore-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if(win.isMinimized()) {
    win.restore();
  }
  win.setAlwaysOnTop(true);
  win.show();
  win.focus();

  setTimeout(() => {
    win.setAlwaysOnTop(globalAlwaysOnTop);
  }, 500);
});
