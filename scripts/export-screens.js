const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname, '../documentation/screens');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Mock analytics data so dashboard renders realistic charts and stats
let currentAnalytics = {
    today_work_seconds: 14400, // 4 hours
    historical_pomodoro: 48,
    favorite_cat: 'tuxedo_cat',
    favorite_cat_percentage: 65,
    weekly_data: [10800, 14400, 18000, 12600, 16200, 7200, 0], // Sun-Sat
    weekly_avg_seconds: 12857,
    current_streak: 5,
    best_streak: 12,
    avg_daily_seconds: 13500,
    personal_best_seconds: 21600,
    personal_best_date: 'Oct 20, 2026'
};

const defaultAnalytics = { ...currentAnalytics };

ipcMain.handle('load-analytics', async () => currentAnalytics);
ipcMain.handle('get-version', async () => '1.0.0');
ipcMain.handle('get-update-status', async () => 'idle');
ipcMain.handle('get-launch-on-startup', async () => false);

// Stub one-way IPC events so renderer scripts do not error
const noopEvents = [
    'settings-window', 'minimize-window', 'maximize-window', 'resize-window',
    'close-window', 'save-session', 'set-always-on-top', 'restore-window',
    'flash-frame', 'check-for-updates', 'download-update', 'restart-app',
    'set-launch-on-startup', 'show-notification', 'close-notification'
];
noopEvents.forEach(evt => ipcMain.on(evt, () => {}));

// Prevent Electron from auto-quitting between captures
app.on('window-all-closed', (e) => {
    // Keep app alive until loop completes
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureScreen(config) {
    console.log(`Capturing: ${config.name} (${config.width}x${config.height})...`);

    currentAnalytics = config.analytics ? { ...config.analytics } : { ...defaultAnalytics };

    const win = new BrowserWindow({
        width: config.width,
        height: config.height,
        useContentSize: true,
        show: true,
        frame: false,
        transparent: true,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: path.join(__dirname, '../src/main/preload.js')
        }
    });

    // Load URL or File
    if (config.url) {
        await win.loadURL(config.url);
    } else {
        await win.loadFile(config.file);
    }

    // Wait for fonts & DOM
    await win.webContents.executeJavaScript(`document.fonts.ready`);
    await delay(600);

    // Apply any custom state manipulations
    if (config.setup) {
        await win.webContents.executeJavaScript(`(() => { ${config.setup} })()`);
        await delay(500);
    }

    // Capture clean native image
    const image = await win.webContents.capturePage();
    const filePath = path.join(outputDir, config.name);
    fs.writeFileSync(filePath, image.toPNG());
    console.log(`Saved: ${filePath}`);

    win.destroy();
    await delay(300);
}

app.whenReady().then(async () => {
    try {
        const screens = [
            {
                name: '01_companion_selection.png',
                file: path.join(__dirname, '../src/renderer/index.html'),
                width: 310,
                height: 430
            },
            {
                name: '02_standard_timer_tux.png',
                url: `file://${path.join(__dirname, '../src/renderer/timer/timer.html')}?cat=tuxedo`,
                width: 310,
                height: 430
            },
            {
                name: '03_standard_timer_ginger.png',
                url: `file://${path.join(__dirname, '../src/renderer/timer/timer.html')}?cat=orange`,
                width: 310,
                height: 430
            },
            {
                name: '04_standard_timer_void.png',
                url: `file://${path.join(__dirname, '../src/renderer/timer/timer.html')}?cat=black`,
                width: 310,
                height: 430
            },
            {
                name: '05_compact_timer_only.png',
                url: `file://${path.join(__dirname, '../src/renderer/timer/timer.html')}?cat=tuxedo`,
                width: 240,
                height: 100,
                setup: `
                    document.body.classList.remove('cat-only-mode');
                    document.body.classList.add('timer-only-mode');
                `
            },
            {
                name: '05b_compact_timer_hover.png',
                url: `file://${path.join(__dirname, '../src/renderer/timer/timer.html')}?cat=tuxedo`,
                width: 240,
                height: 100,
                setup: `
                    document.body.classList.remove('cat-only-mode');
                    document.body.classList.add('timer-only-mode');
                    const style = document.createElement('style');
                    style.textContent = \`
                        body.timer-only-mode .timer-controls { opacity: 1 !important; }
                        body.timer-only-mode #timer-container { filter: blur(3px) !important; opacity: 0.45 !important; }
                        body.timer-only-mode .main-titlebar::after { opacity: 1 !important; background-color: var(--sys-blue-solid) !important; }
                        body.timer-only-mode .app-wrapper { border-color: #7B7C7B !important; }
                    \`;
                    document.head.appendChild(style);
                `
            },
            {
                name: '06_compact_cat_only.png',
                url: `file://${path.join(__dirname, '../src/renderer/timer/timer.html')}?cat=tuxedo`,
                width: 240,
                height: 240,
                setup: `
                    document.body.classList.remove('timer-only-mode');
                    document.body.classList.add('cat-only-mode');
                `
            },
            {
                name: '06b_compact_cat_hover.png',
                url: `file://${path.join(__dirname, '../src/renderer/timer/timer.html')}?cat=tuxedo`,
                width: 240,
                height: 240,
                setup: `
                    document.body.classList.remove('timer-only-mode');
                    document.body.classList.add('cat-only-mode');
                    const style = document.createElement('style');
                    style.textContent = \`
                        body.cat-only-mode .timer-controls { opacity: 1 !important; }
                        body.cat-only-mode .cat-sprite { filter: blur(4px) !important; }
                        body.cat-only-mode #timer-container { opacity: 1 !important; display: flex !important; }
                        body.cat-only-mode .main-titlebar::after { opacity: 1 !important; background-color: var(--sys-blue-solid) !important; }
                        body.cat-only-mode .app-wrapper { border-color: #7B7C7B !important; }
                    \`;
                    document.head.appendChild(style);
                `
            },
            {
                name: '07_break_petting_trivia.png',
                url: `file://${path.join(__dirname, '../src/renderer/timer/timer.html')}?cat=tuxedo`,
                width: 310,
                height: 430,
                setup: `
                    // Trigger break petting state and trivia bubble
                    const bubble = document.getElementById('chat-bubble');
                    const text = document.getElementById('chat-text');
                    const sprite = document.getElementById('cat-sprite');
                    if (bubble && text && sprite) {
                        bubble.className = 'chat-bubble tuxedo_cat';
                        text.textContent = 'A cat\\'s purr can help heal bones and muscles.';
                        sprite.className = 'cat-sprite tuxedo_cat clicking';
                        sprite.style.backgroundImage = 'url("../../assets/sprites/tuxedo_cat_click.png")';
                    }
                `
            },
            {
                name: '08_dashboard_analytics.png',
                file: path.join(__dirname, '../src/renderer/settings.html'),
                width: 720,
                height: 430,
                setup: `
                    const dashBtn = document.getElementById('dashboard-btn');
                    if (dashBtn) dashBtn.click();
                `
            },
            {
                name: '08b_dashboard_minimized_void.png',
                file: path.join(__dirname, '../src/renderer/settings.html'),
                width: 720,
                height: 430,
                analytics: {
                    today_work_seconds: 7200, // 2h 0m (Normal focus pace)
                    historical_pomodoro: 64,
                    favorite_cat: 'black_cat', // Top Companion: Void
                    favorite_cat_percentage: 75,
                    weekly_data: [12600, 14400, 16200, 18000, 10800, 7200, 0],
                    weekly_avg_seconds: 13200,
                    current_streak: 5,
                    best_streak: 12,
                    avg_daily_seconds: 14400,
                    personal_best_seconds: 21600,
                    personal_best_date: 'Oct 20, 2026'
                },
                setup: `
                    const dashBtn = document.getElementById('dashboard-btn');
                    if (dashBtn) dashBtn.click();
                    
                    // Minimize / collapse the sidebar
                    const sidebar = document.querySelector('.side-bar');
                    if (sidebar) sidebar.classList.add('collapsed');

                    // Set daily focus to normal pacing styling
                    const focusCard = document.getElementById('today-focus-card');
                    if (focusCard) {
                        focusCard.classList.remove('above-avg-focus');
                        focusCard.classList.add('below-avg-focus');
                    }
                `
            },
            {
                name: '09_settings_workflow.png',
                file: path.join(__dirname, '../src/renderer/settings.html'),
                width: 720,
                height: 430,
                setup: `
                    const setBtn = document.getElementById('settings-btn');
                    if (setBtn) setBtn.click();
                `
            },
            {
                name: '10_about_companions.png',
                file: path.join(__dirname, '../src/renderer/settings.html'),
                width: 720,
                height: 430,
                setup: `
                    const aboutBtn = document.getElementById('about-btn');
                    if (aboutBtn) aboutBtn.click();
                `
            }
        ];

        for (const config of screens) {
            await captureScreen(config);
        }

        console.log("All screens captured successfully into documentation/screens/!");
    } catch (err) {
        console.error("Error during screen capture:", err);
    } finally {
        app.quit();
    }
});
