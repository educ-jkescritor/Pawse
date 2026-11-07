const { app, BrowserWindow, ipcMain, shell, nativeTheme, screen, Notification, powerMonitor } = require("electron");

// Production Hygiene: Suppress debug console logs in packaged end-user builds
if (app.isPackaged) {
  console.log = () => {};
  console.debug = () => {};
}
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const iconPath = path.join(__dirname, "../assets/logos/logo.png");
const { db, generateAnalytics, closeDatabase } = require("./database.js");
const { autoUpdater } = require("electron-updater");
const { randomUUID } = require("crypto");

nativeTheme.themeSource = 'light';

// Suppress internal Chromium C++ diagnostics (e.g. unconfigured Crashpad pipes)
app.commandLine.appendSwitch('log-level', '3');

// Linux Audio & Visual Optimizations:
// 1. Increase audio buffer to eliminate ALSA/PulseAudio underruns and dropouts on Linux
// 2. Enable transparent visuals so real Linux compositors (GNOME Mutter, KDE KWin) render 32-bit ARGB transparency
if (process.platform === 'linux') {
  if (!process.env.PULSE_LATENCY_MSEC) {
    process.env.PULSE_LATENCY_MSEC = '120';
  }
  app.commandLine.appendSwitch('audio-buffer-size', '4096');
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
}

let win = null;
let set = null;
let globalAlwaysOnTop = false;
let currentMode = 'default'; // Tracks the active window mode: 'default', 'timer-only', or 'cat-only'

function clampBoundsToWorkArea(bounds, targetWidth, targetHeight) {
  const display = screen.getDisplayMatching(bounds);
  const workArea = display.workArea;

  let newX = bounds.x;
  let newY = bounds.y;

  // Clamp horizontally (Right boundary first, then Left boundary)
  if (newX + targetWidth > workArea.x + workArea.width) {
    newX = workArea.x + workArea.width - targetWidth;
  }
  if (newX < workArea.x) {
    newX = workArea.x;
  }

  // Clamp vertically (Bottom boundary first, then Top boundary)
  if (newY + targetHeight > workArea.y + workArea.height) {
    newY = workArea.y + workArea.height - targetHeight;
  }
  if (newY < workArea.y) {
    newY = workArea.y;
  }

  return {
    x: Math.round(newX),
    y: Math.round(newY),
    width: targetWidth,
    height: targetHeight
  };
}

function createWindow() {
  win = new BrowserWindow({
    icon: iconPath,
    show: false,
    width: 310, // buffered window width
    height: 430, // buffered window height
    alwaysOnTop: globalAlwaysOnTop,
    //resizable: false,
    minWidth: 310,
    maxWidth: 310,
    minHeight: 430,
    maxHeight: 430,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      devTools: !app.isPackaged,
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
      const b = win.getBounds();
      win.setBounds(clampBoundsToWorkArea(b, 310, 430));
      win.webContents.setVisualZoomLevelLimits(1, 1);
      win.webContents.setZoomLevel(0);
      win.show();
      win.setAlwaysOnTop(true, 'screen-saver');
      win.focus();
      setTimeout(() => {
        if (!win.isDestroyed()) {
          win.setAlwaysOnTop(globalAlwaysOnTop, 'screen-saver');
        }
      }, 300);
    }
  };

  win.once('ready-to-show', showWindow);
  win.webContents.once('did-finish-load', showWindow);

  win.loadFile(path.join(__dirname, "../renderer/index.html"));

  win.on('focus', () => {
    if (win && !win.isDestroyed()) {
      win.flashFrame(false);
    }
  });

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
    width: 736, // content area width
    height: 430, // buffered window height
    alwaysOnTop: false,
    //resizable: false,
    minWidth: 736,
    maxWidth: 736,
    minHeight: 430,
    maxHeight: 430,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    webPreferences: {
      devTools: !app.isPackaged,
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
      set.setSize(736, 430);
      const b = set.getBounds();
      set.setBounds(clampBoundsToWorkArea(b, 736, 430));
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

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    } else if (set && !set.isDestroyed()) {
      if (set.isMinimized()) set.restore();
      set.show();
      set.focus();
    }
  });

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

      // SECURITY: Block inspection shortcuts in packaged/production builds
      if (app.isPackaged) {
        contents.on('before-input-event', (event, input) => {
          const isDevToolsShortcut = (input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i';
          const isF12 = input.key === 'F12';
          if (isDevToolsShortcut || isF12) {
            event.preventDefault();
          }
        });
      }
    });
    
    // OS Power & Sleep Integration: Pause active timer cleanly when computer suspends
    powerMonitor.on('suspend', () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('system-suspend');
      }
    });

    powerMonitor.on('resume', () => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('system-resume');
      }
    });

    // Automatically re-evaluate frameless window bounds when display scale/orientation/resolution changes
    screen.on('display-metrics-changed', () => {
      if (win && !win.isDestroyed() && !win.isMinimized()) {
        // Determine the correct target dimensions based on the active mode
        let targetWidth = 310;
        let targetHeight = 430;
        if (currentMode === 'timer-only') {
          targetWidth = 240;
          targetHeight = 100;
        } else if (currentMode === 'cat-only') {
          targetWidth = 240;
          targetHeight = 240;
        }

        // Temporarily unlock resizing, re-apply bounds, then lock again
        win.setResizable(true);
        win.setMinimumSize(0, 0);
        win.setMaximumSize(targetWidth, targetHeight);
        win.setSize(targetWidth, targetHeight);
        const b = win.getBounds();
        win.setBounds(clampBoundsToWorkArea(b, targetWidth, targetHeight));
        win.setMinimumSize(targetWidth, targetHeight);
        win.setMaximumSize(targetWidth, targetHeight);
        win.setResizable(false);
        win.webContents.setVisualZoomLevelLimits(1, 1);
        win.webContents.setZoomLevel(0);
      }
      if (set && !set.isDestroyed() && !set.isMinimized()) {
        set.setResizable(true);
        set.setMinimumSize(0, 0);
        set.setMaximumSize(736, 430);
        set.setSize(736, 430);
        const b = set.getBounds();
        set.setBounds(clampBoundsToWorkArea(b, 736, 430));
        set.setMinimumSize(736, 430);
        set.setMaximumSize(736, 430);
        set.setResizable(false);
        set.webContents.setVisualZoomLevelLimits(1, 1);
        set.webContents.setZoomLevel(0);
      }
    });

    // Multi-Display Disconnect Safety: Rescue window back to primary display if its monitor was unplugged
    screen.on('display-removed', () => {
      const primaryDisplay = screen.getPrimaryDisplay();
      const allDisplays = screen.getAllDisplays();

      [win, set].forEach(targetWindow => {
        if (targetWindow && !targetWindow.isDestroyed()) {
          const bounds = targetWindow.getBounds();

          // Check if window coordinates are within any currently active display
          const isVisibleOnAnyDisplay = allDisplays.some(display => {
            const { x, y, width, height } = display.bounds;
            return (
              bounds.x + bounds.width > x &&
              bounds.x < x + width &&
              bounds.y + bounds.height > y &&
              bounds.y < y + height
            );
          });

          // If orphaned off-screen, rescue to the primary display's visible work area
          if (!isVisibleOnAnyDisplay) {
            const rescuedBounds = clampBoundsToWorkArea(primaryDisplay.workArea, bounds.width, bounds.height);
            targetWindow.setBounds(rescuedBounds);
          }
        }
      });
    });
  });
}

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

  // Track the active mode for display-metrics-changed re-evaluation
  currentMode = mode;

  // 1. Temporarily enable resizing so we can programmatically change dimensions
  senderWindow.setResizable(true);

  // 2. Release minimum constraint, but cap maximum at exactly the target to prevent overshoot
  senderWindow.setMinimumSize(0, 0);
  senderWindow.setMaximumSize(targetWidth, targetHeight);

  // 3. Set the window size using setSize (consistent with outer bounds WS_THICKFRAME geometry)
  senderWindow.setSize(targetWidth, targetHeight);

  // 4. Immediately clamp and re-evaluate bounds to ensure window stays fully inside screen workArea
  const currentBounds = senderWindow.getBounds();
  senderWindow.setBounds(clampBoundsToWorkArea(currentBounds, targetWidth, targetHeight));

  // 5. Lock min and max to the target dimensions to maintain fixed sizing
  senderWindow.setMinimumSize(targetWidth, targetHeight);
  senderWindow.setMaximumSize(targetWidth, targetHeight);

  // 6. Disable resizing so the user cannot drag the window edges
  senderWindow.setResizable(false);

  // 7. Ensure zoom level limits remain strictly locked
  senderWindow.webContents.setVisualZoomLevelLimits(1, 1);
  senderWindow.webContents.setZoomLevel(0);

  // 8. Apply always on top state
  senderWindow.setAlwaysOnTop(alwaysOnTop, 'screen-saver');
});

ipcMain.on('close-window', (event) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  senderWindow.close();
});

ipcMain.on('settings-window', (event) => {
  if (set && !set.isDestroyed()) {
    if (set.isFocused()) {
      set.close(); // Toggle off only if it is the actively focused window
    } else {
      if (set.isMinimized()) set.restore();
      set.show();
      set.focus();
    }
  } else {
    settingsWindow();
  }
});

// Saves still waiting for SQLite to confirm. Shutdown waits for these (see 'will-quit' below).
const pendingWrites = new Set();

ipcMain.on('save-session', (event, data) => {
  let finishWrite;
  const writeDone = new Promise((resolve) => { finishWrite = resolve; });
  pendingWrites.add(writeDone);
  writeDone.then(() => pendingWrites.delete(writeDone));

  const uuid = data.uuid || randomUUID();
  const upsertQuery = `INSERT INTO session (
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
  )
  ON CONFLICT(uuid) DO UPDATE SET
    total_work_seconds = excluded.total_work_seconds,
    total_break_seconds = excluded.total_break_seconds,
    total_work = excluded.total_work,
    total_break = excluded.total_break,
    total_pomodoro = MAX(session.total_pomodoro, excluded.total_pomodoro),
    date_completed = COALESCE(excluded.date_completed, session.date_completed, CURRENT_TIMESTAMP),
    is_synced = 0`;

  db.run(upsertQuery, [
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
      console.error("[PAWSE / Session] Failed to save session data:", err.message);
    } else {
      console.log("[PAWSE / Session] Session data saved successfully (progressive upsert).");

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
    finishWrite(); // Success or failure, this save is no longer in flight
  });
});

ipcMain.on('set-always-on-top', (event, isAlwaysOnTop) => {
  globalAlwaysOnTop = isAlwaysOnTop;
  const activeWindow = BrowserWindow.fromWebContents(event.sender);
  
  if (win && !win.isDestroyed()) {
    win.setAlwaysOnTop(isAlwaysOnTop, 'screen-saver');
    
    // Fix Windows Z-order caching bug: when demoting 'win' from the topmost group,
    // Windows leaves it at the top of the normal group (above the settings window).
    // Re-focusing the settings window forces Windows to recalculate the stack properly.
    if (!isAlwaysOnTop && activeWindow && !activeWindow.isDestroyed()) {
      setTimeout(() => {
        if (!activeWindow.isDestroyed()) activeWindow.focus();
      }, 50);
    }
  }
});

ipcMain.handle('load-analytics', async (event, weeksAgo) => {
  try {
    const analyticsData = await generateAnalytics(weeksAgo);
    return analyticsData;
  } catch (error) {
    console.error("[PAWSE / Analytics] Failed to compute analytics:", error?.message || error);
    throw error;
  }
});

ipcMain.on('restore-window', (event) => {
  const targetWin = BrowserWindow.fromWebContents(event.sender);
  if (targetWin.isMinimized()) {
    targetWin.restore();
  }
  targetWin.setAlwaysOnTop(true, 'screen-saver');
  targetWin.show();
  targetWin.focus();

  setTimeout(() => {
    targetWin.setAlwaysOnTop(globalAlwaysOnTop, 'screen-saver');
  }, 500);
});

ipcMain.on('flash-frame', (event, flag) => {
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow && !senderWindow.isDestroyed()) {
    if (flag) {
      if (!senderWindow.isFocused() || senderWindow.isMinimized()) {
        senderWindow.flashFrame(true);
      }
    } else {
      senderWindow.flashFrame(false);
    }
  }
});

let activeNotification = null;
let activeNotificationActivateHandler = null;

if (process.platform === 'win32' && Notification && typeof Notification.handleActivation === 'function') {
  Notification.handleActivation((details) => {
    if (!activeNotificationActivateHandler || !details) return;
    const isAction =
      details.type === 'action' ||
      (typeof details.arguments === 'string' && details.arguments.includes('type=action'));
    if (isAction) {
      activeNotificationActivateHandler(true);
    } else if (details.type === 'click') {
      activeNotificationActivateHandler(false);
    }
  });
}

ipcMain.on('show-notification', (event, { title, body, actionText }) => {
  if (Notification && Notification.isSupported()) {
    if (activeNotification) {
      activeNotification._isProgrammaticClose = true;
      try {
        activeNotification.close();
      } catch (e) {}
      activeNotification = null;
      activeNotificationActivateHandler = null;
    }

    const sessionAlertStart = Date.now();
    const ALERT_DURATION_MS = 30000;
    // Windows re-presents the toast when the OS hides it early, so it stays visible through the alarm.
    // Limits (respect Do Not Disturb, never flood the Action Center):
    // - MAX_PRESENTS: 6 covers the 30s alarm at Windows' default 5s banner time.
    // - MIN_VISIBLE_MS: if Windows closes the toast faster than this, it is being suppressed
    //   (Do Not Disturb / Focus Assist / notifications restricted). Stop re-presenting; the toast
    //   stays in the Action Center, and the in-app modal, alarm sound, and taskbar flash still work.
    //   (Electron has no API to ask Windows whether DND is on, so this is inferred.)
    const MAX_PRESENTS = 6;
    const MIN_VISIBLE_MS = 2000;
    let presentCount = 0;
    const buttonLabel = actionText || 'Continue';

    const escapeXml = (str) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const presentToast = () => {
      const notificationOptions = {
        title: title || 'Pawse',
        body: body || '',
        silent: true,
        timeoutType: 'never',
        urgency: 'critical',
        actions: [{ type: 'button', text: buttonLabel }]
      };

      const notification = new Notification(notificationOptions);

      // On Windows, Electron's `timeoutType: 'never'` automatically appends a second system "Close"
      // button (`<action activationType="system" arguments="dismiss" content=""/>`). Using `toastXml`
      // with `scenario="reminder"` and a single structured `type=action` button keeps the persistent
      // reminder behavior while displaying ONLY the single primary action button (e.g. "Start Break")
      // and allowing Electron to distinguish body clicks ('click') from button clicks ('action').
      if (process.platform === 'win32') {
        const notifId = escapeXml(notification.id || '');
        notification.toastXml = `<toast scenario="reminder">
  <visual>
    <binding template="ToastGeneric">
      <text>${escapeXml(title || 'Pawse')}</text>
      <text>${escapeXml(body || '')}</text>
    </binding>
  </visual>
  <actions>
    <action content="${escapeXml(buttonLabel)}" arguments="type=action&amp;actionIndex=0&amp;tag=${notifId}&amp;id=${notifId}" activationType="foreground" />
  </actions>
  <audio silent="true" />
</toast>`;
      }

      notification._isProgrammaticClose = false;
      activeNotification = notification;

      let hasActivated = false;
      const handleActivate = (isActionButton = false) => {
        if (hasActivated) return;
        hasActivated = true;
        notification._isProgrammaticClose = true;
        if (activeNotification === notification) {
          activeNotification = null;
          activeNotificationActivateHandler = null;
        }
        try {
          notification.close();
        } catch (e) {}
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        const targetWin = senderWindow || win;
        if (targetWin && !targetWin.isDestroyed()) {
          targetWin.flashFrame(false);
          if (targetWin.isMinimized()) {
            targetWin.restore();
          }
          targetWin.setAlwaysOnTop(true, 'screen-saver');
          targetWin.show();
          targetWin.focus();

          setTimeout(() => {
            if (!targetWin.isDestroyed()) {
              const shouldStayOnTop =
                currentMode === 'timer-only' || currentMode === 'cat-only'
                  ? true
                  : globalAlwaysOnTop;
              targetWin.setAlwaysOnTop(shouldStayOnTop, 'screen-saver');
            }
          }, 500);

          // Notify renderer whether the user clicked the action button or the toast body
          targetWin.webContents.send('notification-clicked', {
            isActionButton: Boolean(isActionButton)
          });
        }
      };

      activeNotificationActivateHandler = handleActivate;

      notification.on('click', () => handleActivate(false));
      notification.on('action', () => handleActivate(true));

      // Note: Electron emits 'close' as (event, reason) where `reason` is the 2nd argument on Windows
      // ('timedOut', 'userCanceled', or 'applicationHidden'), or `event.reason` in details objects.
      notification.on('close', (closeEvent, reasonArg) => {
        const wasProgrammatic = Boolean(notification._isProgrammaticClose);
        const closeReason =
          (typeof reasonArg === 'string' && reasonArg) ||
          (closeEvent && typeof closeEvent.reason === 'string' && closeEvent.reason) ||
          (typeof closeEvent === 'string' && closeEvent) ||
          '';

        if (wasProgrammatic || closeReason === 'applicationHidden') {
          if (activeNotification === notification) {
            activeNotification = null;
            activeNotificationActivateHandler = null;
          }
          return;
        }

        // On Windows 11, if OS Accessibility "Dismiss notifications after this amount of time" (default 5s)
        // overrides the banner and emits 'timedOut' (or an unlabelled timeout) before our 30s alarm window ends,
        // remove the stale entry from Action Center and re-present the banner so both toast & sound persist.
        const elapsedMs = Date.now() - sessionAlertStart;
        const visibleMs = Date.now() - notification._shownAt;
        if (
          process.platform === 'win32' &&
          closeReason !== 'userCanceled' &&
          elapsedMs < ALERT_DURATION_MS - 1500 &&
          presentCount < MAX_PRESENTS &&
          visibleMs >= MIN_VISIBLE_MS
        ) {
          if (activeNotification === notification) {
            notification._isProgrammaticClose = true;
            try {
              notification.close();
            } catch (e) {}
            presentToast();
          }
          return;
        }

        // Suppressed by Windows (closed almost immediately, not by the user): stop re-presenting,
        // but keep the click handler so the toast still works when clicked later from the Action Center.
        if (process.platform === 'win32' && closeReason !== 'userCanceled' && visibleMs < MIN_VISIBLE_MS) {
          console.log('[PAWSE / Notification] Toast suppressed by Windows (likely Do Not Disturb); not re-presenting.');
          return;
        }

        if (activeNotification === notification) {
          activeNotification = null;
          activeNotificationActivateHandler = null;
        }

        // Only a confirmed user dismissal silences the alarm. Windows reports it as 'userCanceled'.
        // macOS/Linux report no close reason, and their notifications often close on their own
        // (expiry, Do Not Disturb), so a close there must NOT stop the alarm; it still stops when the
        // user clicks the notification or acts in the app, or after the 30s auto-silence.
        if (process.platform === 'win32' && closeReason === 'userCanceled') {
          const senderWindow = BrowserWindow.fromWebContents(event.sender);
          const targetWin = senderWindow || win;
          if (targetWin && !targetWin.isDestroyed()) {
            targetWin.flashFrame(false);
            targetWin.webContents.send('notification-closed');
          }
        }
      });

      // The OS refused to show it (e.g. notifications disabled for Pawse). Don't retry; the in-app
      // modal and alarm still inform the user.
      notification.on('failed', (failEvent, error) => {
        console.error('[PAWSE / Notification] OS refused to show notification:', error || '');
        if (activeNotification === notification) {
          activeNotification = null;
          activeNotificationActivateHandler = null;
        }
      });

      presentCount++;
      notification._shownAt = Date.now();
      notification.show();
    };

    presentToast();
  }
});

ipcMain.on('close-notification', () => {
  if (activeNotification) {
    const notifToClose = activeNotification;
    notifToClose._isProgrammaticClose = true;
    activeNotification = null;
    activeNotificationActivateHandler = null;
    try {
      notifToClose.close();
    } catch (e) {}
  }
});

const isWindowsStore = Boolean(process.windowsStore);
const GITHUB_RELEASES_URL = 'https://github.com/educ-jkescritor/Pawse/releases/latest';

if (!isWindowsStore) {
  const isLinuxPlatform = process.platform === 'linux';
  autoUpdater.autoDownload = !isLinuxPlatform || Boolean(process.env.APPIMAGE);
}

const MICROSOFT_STORE_PRODUCT_ID = '9N0DQPN61VR6';

let currentUpdateStatus = {
  state: isWindowsStore ? 'windows-store' : 'idle',
  message: isWindowsStore
    ? 'Current version: v' + app.getVersion() + ' • Managed by Microsoft Store'
    : 'Current version: v' + app.getVersion(),
  buttonText: 'Check for Updates',
  buttonClass: '',
  disabled: false,
  version: app.getVersion(),
  newVersion: null,
  isStore: isWindowsStore
};

function sendUpdateStatus(state, message, buttonText, buttonClass = '', disabled = false, newVersion = null) {
  currentUpdateStatus = {
    state,
    message,
    buttonText,
    buttonClass,
    disabled,
    version: app.getVersion(),
    newVersion,
    isStore: isWindowsStore
  };
  if (set && !set.isDestroyed()) {
    set.webContents.send('update-status-changed', currentUpdateStatus);
    set.webContents.send('update-message', message);
  }
}

ipcMain.handle('get-update-status', () => {
  return currentUpdateStatus;
});

ipcMain.on('check-for-updates', () => {
  if (isWindowsStore) {
    shell.openExternal(`ms-windows-store://pdp/?productid=${MICROSOFT_STORE_PRODUCT_ID}`);
    sendUpdateStatus(
      'windows-store',
      'Opening Microsoft Store to check for updates...',
      'Check for Updates',
      '',
      false
    );
    setTimeout(() => {
      sendUpdateStatus(
        'windows-store',
        'Current version: v' + app.getVersion() + ' • Managed by Microsoft Store',
        'Check for Updates',
        '',
        false
      );
    }, 3000);
    return;
  }

  if (!app.isPackaged) {
    console.log('[PAWSE / AutoUpdater] [Simulator] Checking for updates...');
    sendUpdateStatus('checking', 'Looking for the latest version...', 'Checking...', 'btn-loading', true);
    
    setTimeout(() => {
      // Support testing edge cases via env var (e.g. PAWSE_MOCK_UPDATE="up-to-date" or "error")
      const mockMode = (process.env.PAWSE_MOCK_UPDATE || 'available').toLowerCase();
      if (mockMode === 'up-to-date') {
        console.log('[PAWSE / AutoUpdater] [Simulator] Simulated up to date.');
        sendUpdateStatus(
          'up-to-date',
          'Current version: v' + app.getVersion() + '. Checked just now.',
          'Up to Date',
          'btn-success',
          true
        );
      } else if (mockMode === 'error') {
        console.log('[PAWSE / AutoUpdater] [Simulator] Simulated update check error.');
        sendUpdateStatus(
          'error',
          "Couldn't connect. Check your internet and try again.",
          'Check for Updates',
          '',
          false
        );
      } else {
        const simVersion = '1.1.0';
        console.log('[PAWSE / AutoUpdater] [Simulator] Update found (v' + simVersion + '). Auto-starting download...');
        sendUpdateStatus(
          'downloading',
          `Downloading PAWSE v${simVersion}...`,
          'Downloading...',
          'btn-loading',
          true,
          simVersion
        );

        setTimeout(() => {
          console.log('[PAWSE / AutoUpdater] [Simulator] Download complete. Ready to restart.');
          sendUpdateStatus(
            'downloaded',
            `PAWSE v${simVersion} is ready. Restart to apply.`,
            'Restart & Update',
            'btn-action',
            false,
            simVersion
          );
        }, 2500);
      }
    }, 1200);
    return;
  }

  sendUpdateStatus('checking', 'Looking for the latest version...', 'Checking...', 'btn-loading', true);
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[PAWSE / AutoUpdater] Check failed:', err?.message || err);
    if (process.platform === 'darwin' && err?.message && err.message.includes('Could not get code signature')) {
      shell.openExternal(GITHUB_RELEASES_URL);
      sendUpdateStatus('idle', 'Current version: v' + app.getVersion() + ' • Opened GitHub Releases', 'Check for Updates', '', false);
      return;
    }
    sendUpdateStatus(
      'error',
      "Couldn't connect. Check your internet and try again.",
      'Check for Updates',
      '',
      false
    );
  });
}); 

autoUpdater.on('update-available', (info) => {
  const v = info && info.version ? `v${info.version}` : '';
  console.log('[PAWSE / AutoUpdater] Update available (' + v + '), auto-downloading...');
  sendUpdateStatus(
    'downloading',
    `Downloading PAWSE ${v}...`.trim(),
    'Downloading...',
    'btn-loading',
    true,
    info?.version
  );
});

autoUpdater.on('update-not-available', () => {
  sendUpdateStatus(
    'up-to-date',
    'Current version: v' + app.getVersion() + '. Checked just now.',
    'Up to Date',
    'btn-success',
    true
  );
});

autoUpdater.on('error', (err) => {
  console.error('[PAWSE / AutoUpdater] Update error:', err?.message || err);
  sendUpdateStatus(
    'error',
    "Couldn't connect. Check your internet and try again.",
    'Check for Updates',
    '',
    false
  );
});

autoUpdater.on('update-downloaded', (info) => {
  const v = info && info.version ? `v${info.version}` : '';
  sendUpdateStatus(
    'downloaded',
    `PAWSE ${v} is ready. Restart to apply.`.trim(),
    'Restart & Update',
    'btn-action',
    false,
    info?.version
  );
});

ipcMain.on('restart-app', () => {
  if (isWindowsStore) return;
  if (!app.isPackaged) {
    console.log('[PAWSE / AutoUpdater] [Simulator] Restart & Update clicked. Relaunching app immediately...');
    app.relaunch();
    app.quit();
    return;
  }
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-launch-on-startup', () => {
  try {
    if (process.platform === 'linux') {
      const autostartFile = path.join(app.getPath('home'), '.config', 'autostart', 'pawse.desktop');
      return fs.existsSync(autostartFile);
    }
    const loginItemSettings = app.getLoginItemSettings();
    return loginItemSettings.openAtLogin;
  } catch (err) {
    console.error('[PAWSE / Startup] Failed to get login item settings:', err?.message || err);
    return false;
  }
});

ipcMain.on('set-launch-on-startup', (event, isEnabled) => {
  try {
    if (process.platform === 'linux') {
      const autostartDir = path.join(app.getPath('home'), '.config', 'autostart');
      const autostartFile = path.join(autostartDir, 'pawse.desktop');

      if (isEnabled) {
        if (!fs.existsSync(autostartDir)) {
          fs.mkdirSync(autostartDir, { recursive: true });
        }
        const execPath = process.env.APPIMAGE || (app.isPackaged ? app.getPath('exe') : process.execPath);
        const desktopContent = [
          '[Desktop Entry]',
          'Type=Application',
          'Version=1.0',
          'Name=Pawse',
          'Comment=A secure, resilient, and adorable Pomodoro timer',
          `Exec="${execPath}"`,
          `Icon=${iconPath}`,
          'Terminal=false',
          'StartupNotify=false',
          'Categories=Utility;'
        ].join('\n') + '\n';

        fs.writeFileSync(autostartFile, desktopContent, 'utf8');
      } else {
        if (fs.existsSync(autostartFile)) {
          fs.unlinkSync(autostartFile);
        }
      }
    }

    app.setLoginItemSettings({
      openAtLogin: Boolean(isEnabled),
      ...(process.platform === 'win32' ? { path: app.isPackaged ? app.getPath('exe') : process.execPath } : {})
    });
  } catch (err) {
    console.error('[PAWSE / Startup] Failed to set login item settings:', err?.message || err);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- CLEAN SHUTDOWN ---
// Before the process exits: wait for in-flight session saves, then close SQLite properly.
// Without this, quitting while a save is still running (busy disk, antivirus, sync tools touching
// pawse.db) aborted the process during teardown: a crash on quit (exit code 134 in testing).
// Uses 'will-quit' (not 'before-quit') because it fires AFTER all windows have closed, so the
// timer's final save from its beforeunload has already been sent. This covers closing the last
// window, Cmd+Q, and Restart & Update. A time limit makes sure quitting can never hang.
// The limit must stay ABOVE SQLite's busy_timeout (3000ms in database.js): by then a pending save
// has either finished or failed on its own, so the database can always be closed cleanly.
// A shorter limit exits with a save still waiting, which brings back the crash on quit.
const SHUTDOWN_TIMEOUT_MS = 4000;
let shutdownStarted = false;
let shutdownComplete = false;

app.on('will-quit', (event) => {
  if (shutdownComplete) return; // Second pass: cleanup done, let the app exit
  event.preventDefault();
  if (shutdownStarted) return;
  shutdownStarted = true;

  const cleanup = Promise.allSettled([...pendingWrites]).then(() => closeDatabase());
  const timeLimit = new Promise((resolve) => setTimeout(resolve, SHUTDOWN_TIMEOUT_MS));

  Promise.race([cleanup, timeLimit]).then(() => {
    shutdownComplete = true;
    app.quit();
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
});
