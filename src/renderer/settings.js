let minimizeButton = document.getElementById("minimize-btn");
minimizeButton.onclick = function minimizeWindow() {
    window.mainAPI.minimize();
}

let closeButton = document.getElementById("close-btn");
closeButton.onclick = function closeWindow() {
    window.mainAPI.close();
}

function hideAllContents() {
    dashboardContent.classList.add("hidden");
    aboutContent.classList.add("hidden");
    settingsContent.classList.add("hidden");
}  

// Tab button selection state handling
const sidebarButtons = [
    document.getElementById("dashboard-btn"),
    document.getElementById("about-btn"),
    document.getElementById("settings-btn")
];

function setActiveTab(activeButton) {
    sidebarButtons.forEach(btn => {
        if (btn) btn.classList.remove("active");
    });
    if (activeButton) activeButton.classList.add("active");
}

let dashboardButton = document.getElementById("dashboard-btn");
dashboardButton.onclick = function() {
    hideAllContents();
    dashboardContent.classList.remove("hidden");
    setActiveTab(dashboardButton);
}

let aboutButton = document.getElementById("about-btn");
aboutButton.onclick = function() {
    hideAllContents();
    aboutContent.classList.remove("hidden");
    setActiveTab(aboutButton);
}

let settingsButton = document.getElementById("settings-btn");
settingsButton.onclick = function() {
    hideAllContents();
    settingsContent.classList.remove("hidden");
    setActiveTab(settingsButton);
}

let dashboardContent = document.getElementById("dashboard-content");    
let aboutContent = document.getElementById("about-content");
let settingsContent = document.getElementById("settings-content");

function getWeekDateRangeString(weeksAgo) {
    const today = new Date();
    const currentDay = today.getDay();
    
    // Start of target week (Sunday)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay - (weeksAgo * 7));
    
    // End of target week (Saturday)
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    
    const startMonth = sunday.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = saturday.toLocaleDateString('en-US', { month: 'short' });
    const startDay = sunday.getDate();
    const endDay = saturday.getDate();
    
    // If spanning across different years (e.g. Dec 27, 2026 – Jan 2, 2027)
    if (sunday.getFullYear() !== saturday.getFullYear()) {
        return `${startMonth} ${startDay}, ${sunday.getFullYear()} – ${endMonth} ${endDay}, ${saturday.getFullYear()}`;
    }
    
    // If within the same month (e.g. Oct 4 – 10)
    if (startMonth === endMonth) {
        return `${startMonth} ${startDay} – ${endDay}`;
    }
    
    // If crossing month boundary within same year (e.g. Sep 27 – Oct 3)
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

async function loadAnalytics(weeksAgo = 0) {
    const data = await window.mainAPI.loadanalytics(weeksAgo);

    // Update dynamic subtitle date range
    const chartSubtitle = document.getElementById("chart-header-subtitle");
    if (chartSubtitle) {
        chartSubtitle.textContent = getWeekDateRangeString(weeksAgo);
    }

    // 1. Focus Streak Card
    const currentStreakEl = document.getElementById("current_streak");
    const streakUnitEl = document.getElementById("streak_unit");
    const bestStreakEl = document.getElementById("best_streak");
    const streakCard = document.getElementById("streak-card");

    const streak = data.current_streak || 0;
    const bestStreak = data.best_streak || streak;

    if (currentStreakEl) currentStreakEl.textContent = streak;
    if (streakUnitEl) streakUnitEl.textContent = streak === 1 ? 'day' : 'days';
    if (bestStreakEl) bestStreakEl.textContent = `Best: ${bestStreak} ${bestStreak === 1 ? 'day' : 'days'}`;
    if (streakCard) {
        if (streak >= 3) {
            streakCard.classList.add('active-streak');
        } else {
            streakCard.classList.remove('active-streak');
        }
    }

    // 2. Today's Focus Card & Trend vs Average
    const todayWorkSecondsElement = document.getElementById("today_work_seconds");
    const todayVsAvgEl = document.getElementById("today_vs_avg");

    const totalSeconds = data.today_work_seconds || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const timeString = `${hours}h ${minutes}m`;
    if (todayWorkSecondsElement) todayWorkSecondsElement.textContent = timeString;

    if (todayVsAvgEl) {
        const avgSeconds = data.avg_daily_seconds || 0;
        if (avgSeconds === 0) {
            todayVsAvgEl.textContent = "First day tracking";
            todayVsAvgEl.className = "card-subtext font-inter-10-regular text-gray";
        } else {
            const diffSeconds = totalSeconds - avgSeconds;
            const absDiff = Math.abs(diffSeconds);
            const diffHours = Math.floor(absDiff / 3600);
            const diffMins = Math.round((absDiff % 3600) / 60);
            const formattedDiff = diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins}m`;

            if (diffSeconds > 60) {
                todayVsAvgEl.textContent = `▲ +${formattedDiff} vs avg`;
                todayVsAvgEl.className = "card-subtext font-inter-10-regular trend-up";
            } else if (diffSeconds < -60) {
                todayVsAvgEl.textContent = `▼ -${formattedDiff} vs avg`;
                todayVsAvgEl.className = "card-subtext font-inter-10-regular trend-down";
            } else {
                todayVsAvgEl.textContent = "On par with daily avg";
                todayVsAvgEl.className = "card-subtext font-inter-10-regular text-gray";
            }
        }
    }

    // 3. Personal Best Card
    const personalBestEl = document.getElementById("personal_best_time");
    const personalBestDateEl = document.getElementById("personal_best_date");
    const personalBestCard = document.getElementById("personal-best-card");

    const pbSeconds = data.personal_best_seconds || 0;
    const pbHours = Math.floor(pbSeconds / 3600);
    const pbMinutes = Math.floor((pbSeconds % 3600) / 60);
    const pbTimeString = `${pbHours}h ${pbMinutes}m`;
    if (personalBestEl) personalBestEl.textContent = pbTimeString;

    if (personalBestDateEl) {
        if (pbSeconds === 0 || !data.personal_best_date) {
            personalBestDateEl.textContent = "No record yet";
            if (personalBestCard) personalBestCard.classList.remove('highlight-record');
        } else {
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            if (data.personal_best_date === todayKey && pbSeconds > 0) {
                personalBestDateEl.textContent = "Achieved today! 🏆";
                if (personalBestCard) personalBestCard.classList.add('highlight-record');
            } else {
                const [y, m, d] = data.personal_best_date.split('-').map(Number);
                const pbDate = new Date(y, m - 1, d);
                const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
                personalBestDateEl.textContent = pbDate.toLocaleDateString('en-US', dateOptions);
                if (personalBestCard) personalBestCard.classList.remove('highlight-record');
            }
        }
    }

    // Legacy fallbacks (in case DOM or tests look for historical elements)
    const historicalPomodoroElement = document.getElementById("historical_pomodoro");
    if (historicalPomodoroElement) {
        historicalPomodoroElement.textContent = data.historical_pomodoro || 0;
    }

    const favoriteCatElement = document.getElementById("favorite_cat");
    if (favoriteCatElement) {
        const catFaceImages = {
            'orange_cat': './../assets/photos/orange-cat-face.png',
            'tuxedo_cat': './../assets/photos/tuxedo-cat-face.png',
            'black_cat': './../assets/photos/black-cat-face.png'
        };
        
        if (data.favorite_cat && catFaceImages[data.favorite_cat]) {
            favoriteCatElement.innerHTML = `<img src="${catFaceImages[data.favorite_cat]}" alt="${data.favorite_cat}" class="favorite-cat-img">`;
        } else {
            favoriteCatElement.textContent = 'None';
        }
    }

    const favoriteCatCard = document.getElementById("favorite-cat-card");
    if (favoriteCatCard) {
        favoriteCatCard.classList.remove('orange_cat', 'tuxedo_cat', 'black_cat');
        if (data.favorite_cat) {
            favoriteCatCard.classList.add(data.favorite_cat);
        }
    }

    // Graph Generation
    const graphBarsContainer = document.querySelector(".graph-bars");
    if (graphBarsContainer && data.weekly_data) {
        graphBarsContainer.innerHTML = ''; // Clear existing
        
        // Dynamic hover support: style bars according to user's favorite companion
        graphBarsContainer.classList.remove('orange_cat', 'tuxedo_cat', 'black_cat', 'empty-state');
        if (data.favorite_cat) {
            graphBarsContainer.classList.add(data.favorite_cat);
        }
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Check if there is any data recorded for this week
        const hasData = data.weekly_data.some(seconds => seconds > 0);
        if (!hasData) {
            const noDataMsg = document.createElement("div");
            noDataMsg.className = "no-data-message font-inter-10-medium";
            noDataMsg.textContent = "No sessions recorded for this week";
            graphBarsContainer.appendChild(noDataMsg);
            graphBarsContainer.classList.add("empty-state"); // Disable hover highlights
        }
        
        // Scale ceiling considers both the tallest bar of the week and daily average so neither overflows
        const avgSeconds = data.avg_daily_seconds || 0;
        const maxBarSeconds = Math.max(...data.weekly_data, 1); 
        const ceilingSeconds = Math.max(maxBarSeconds, avgSeconds);
        
        data.weekly_data.forEach((seconds, index) => {
            const heightPercent = (seconds / ceilingSeconds) * 100;
            
            const barWrapper = document.createElement("div");
            barWrapper.className = "bar-wrapper";
            
            const bar = document.createElement("div");
            bar.className = "bar";
            
            // Normalize animation speed (velocity) regardless of height
            // 100% height = 1000ms, 50% height = 500ms
            const durationMs = Math.max((heightPercent / 100) * 1000, 300); // 300ms floor for tiny bounce
            bar.style.transition = `height ${durationMs}ms cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.25s ease, transform 0.25s ease`;
            
            // Start at 0% for animation
            bar.style.height = `0%`;
            
            // Stagger the animation so they rise in a wave from left to right
            setTimeout(() => {
                bar.style.height = `${heightPercent}%`;
            }, 100 + (index * 100));
            
            // Only add tooltip if there is actual time spent
            if (seconds > 0) {
                // Custom Tooltip element for styled hours display
                const tooltip = document.createElement("span");
                tooltip.className = "bar-tooltip font-inter-10-medium";
                
                // Format raw seconds to human readable "Xh Ym"
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                
                if (h === 0 && m === 0) {
                    tooltip.textContent = "A few seconds";
                } else {
                    tooltip.textContent = `${h}h ${m}m`;
                }
                
                bar.appendChild(tooltip);
            }
            
            const label = document.createElement("span");
            
            // Highlight today's date if viewing the current week
            if (weeksAgo === 0 && index === new Date().getDay()) {
                barWrapper.classList.add("today");
                label.className = "bar-label font-inter-10-medium";
            } else {
                label.className = "bar-label font-inter-10-regular";
            }
            
            label.textContent = days[index];
            
            barWrapper.appendChild(bar);
            barWrapper.appendChild(label);
            graphBarsContainer.appendChild(barWrapper);
        });

        // Draw Daily Average Benchmark Line if user has focus history and current week has data
        if (hasData && avgSeconds > 0) {
            const avgLine = document.createElement("div");
            avgLine.className = "avg-benchmark-line";

            // Format average time for badge (e.g. "avg 12m" or "avg 1h 15m")
            const avgH = Math.floor(avgSeconds / 3600);
            const avgM = Math.round((avgSeconds % 3600) / 60);
            const formattedAvg = avgH > 0 ? (avgM > 0 ? `${avgH}h ${avgM}m` : `${avgH}h`) : `${avgM}m`;

            const avgBadge = document.createElement("span");
            avgBadge.className = "avg-benchmark-label font-inter-10-medium";
            avgBadge.textContent = `avg ${formattedAvg}`;
            avgLine.appendChild(avgBadge);

            // Compute bottom offset accurately: baseline of bars is 20px, max bar area is (containerHeight - 36px)
            const containerHeight = graphBarsContainer.clientHeight || 79;
            const baselineBottom = 20; // 12px label + 8px gap
            const maxBarHeight = Math.max(containerHeight - 20 - 16, 10); // 16px padding-top
            const avgRatio = Math.min(avgSeconds / ceilingSeconds, 1);
            const lineBottom = baselineBottom + (avgRatio * maxBarHeight);
            
            avgLine.style.bottom = `${lineBottom}px`;
            graphBarsContainer.appendChild(avgLine);
        }
    }
}

loadAnalytics();

// Persistent volume sliders (retains configuration on load)
const volumeSliders = document.querySelectorAll('.volume-slider');

// Function to calculate and apply colors and text
const updateSliderFill = (el) => {
    const val = el.value;
    const textLabel = el.previousElementSibling;
    if (textLabel) textLabel.textContent = `${val}%`;
    el.style.background = `linear-gradient(to right, var(--sys-blue-solid) 0%, var(--sys-blue-solid) ${val}%, var(--stroke-color) ${val}%, var(--stroke-color) 100%)`;

    // UI/UX: Grayish design when sound is at 0%
    const parentItem = el.closest('.settings-item');
    if (parentItem) {
        if (val === '0') {
            parentItem.style.opacity = '0.5';
        } else {
            parentItem.style.opacity = '1';
        }
    }
};

volumeSliders.forEach(slider => {
    // 1. Determine a unique key for each slider using its HTML class
    let storageKey = '';
    if (slider.classList.contains('ambient-slider')) {
        storageKey = 'ambientVolume';
    } else if (slider.classList.contains('purr-slider')) {
        storageKey = 'purrVolume';
    } else if (slider.classList.contains('alarm-slider')){
        storageKey = 'alarmVolume';
    }

    // 2. Load the saved value on window startup (default to 50 if empty)
    if (storageKey) {
        const savedValue = localStorage.getItem(storageKey);
        if (savedValue !== null) {
            slider.value = savedValue;
        }
    }

    // Initialize layout with the loaded values
    updateSliderFill(slider);

    // Update dynamically and save to localStorage on slide
    slider.addEventListener('input', (event) => {
        updateSliderFill(event.target);
        if (storageKey) {
            localStorage.setItem(storageKey, event.target.value);
        }
    });
});

// Workflow Settings Logic
const strictToggle = document.querySelector('.strict-toggle');
// const breakToggle = document.querySelector('.break-toggle'); unused since auto-start focus and breaks are now combined
const pomodoroToggle = document.querySelector('.timer-toggle');

if (strictToggle) {
    strictToggle.checked = localStorage.getItem('strictMode') === 'true';
    strictToggle.addEventListener('change', (e) => localStorage.setItem('strictMode', e.target.checked));
}

function updateStrictLock() {
    if (!strictToggle) return;
    const isRunning = localStorage.getItem('timerRunning') === 'true';
    
    strictToggle.disabled = isRunning;
    
    const parentItem = strictToggle.closest('.settings-item');
    if (parentItem) {
        if (isRunning) {
            parentItem.style.opacity = '0.5';
            parentItem.style.pointerEvents = 'none';
        } else {
            parentItem.style.opacity = '1';
            parentItem.style.pointerEvents = 'auto';
        }
    }
}
updateStrictLock();

// Auto-start focus and breaks combined into one; code block can be deleted. Please check po @jude
/* if (breakToggle) {
    breakToggle.checked = localStorage.getItem('autoStartBreaks') === 'true';
    breakToggle.addEventListener('change', (e) => localStorage.setItem('autoStartBreaks', e.target.checked));
}
*/

// Updated logic for combined auto-start focus and breaks toggle. Please check po @jude
if (pomodoroToggle) {
    pomodoroToggle.checked = localStorage.getItem('autoStartPomodoros') === 'true';
    
    pomodoroToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        localStorage.setItem('autoStartPomodoros', isChecked);
        localStorage.setItem('autoStartBreaks', isChecked);
    });
}

// Audio Settings Logic
// Audio Settings Logic
const clickToggle = document.querySelector('.click-toggle');
if (clickToggle) {
    clickToggle.checked = localStorage.getItem('clickSound') !== 'false';
    clickToggle.addEventListener('change', (e) => localStorage.setItem('clickSound', e.target.checked));
}

const tickToggle = document.querySelector('.tick-toggle');
if (tickToggle) {
    tickToggle.checked = localStorage.getItem('tickSound') === 'true';
    tickToggle.addEventListener('change', (e) => localStorage.setItem('tickSound', e.target.checked));
}

// Custom Graph Week Segmented Control Logic
const segmentButtons = document.querySelectorAll('.segment-btn');

if (segmentButtons.length > 0) {
    const selectSegment = (btn) => {
        if (btn.classList.contains('active')) return;
        
        segmentButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        
        const val = btn.getAttribute('data-value');
        loadAnalytics(parseInt(val, 10));
    };

    segmentButtons.forEach((btn, idx) => {
        btn.addEventListener('click', () => selectSegment(btn));
        
        // Arrow key navigation across segments
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIdx = (idx + 1) % segmentButtons.length;
                segmentButtons[nextIdx].focus();
                selectSegment(segmentButtons[nextIdx]);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIdx = (idx - 1 + segmentButtons.length) % segmentButtons.length;
                segmentButtons[prevIdx].focus();
                selectSegment(segmentButtons[prevIdx]);
            }
        });
    });
}

// System Settings Logic
const topToggle = document.querySelector('.top-toggle');
if (topToggle) {
    topToggle.checked = localStorage.getItem('alwaysOnTop') === 'true';
    topToggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        localStorage.setItem('alwaysOnTop', isChecked);
        if (window.mainAPI && window.mainAPI.setAlwaysOnTop) {
            window.mainAPI.setAlwaysOnTop(isChecked);
        }
    });
}

// Dynamically update UI if localStorage changes from another window (like the Timer screen)
window.addEventListener('storage', (e) => {
    if (e.key === 'ambientVolume') {
        const slider = document.querySelector('.ambient-slider');
        if (slider) {
            slider.value = e.newValue;
            updateSliderFill(slider);
        }
    }
    if (e.key === 'purrVolume') {
        const slider = document.querySelector('.purr-slider');
        if (slider) {
            slider.value = e.newValue;
            updateSliderFill(slider);
        }
    }
    if (e.key === 'alarmVolume') {
        const slider = document.querySelector('.alarm-slider');
        if (slider) {
            slider.value = e.newValue;
            updateSliderFill(slider);
        }
    }
    if (e.key === 'clickSound') {
        const toggle = document.querySelector('.click-toggle');
        if (toggle) toggle.checked = (e.newValue !== 'false');
    }
    if (e.key === 'tickSound') {
        const toggle = document.querySelector('.tick-toggle');
        if (toggle) toggle.checked = (e.newValue === 'true');
    }
    if (e.key === 'timerRunning') {
        updateStrictLock();
    }
});

// Dashboard Real-Time Clock
function updateDashboardDateTime() {
    const dtElement = document.getElementById("dashboard-datetime");
    if (!dtElement) return;

    const now = new Date();
    
    // Format: "Oct 1, 2026"
    const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
    
    const dateStr = now.toLocaleDateString('en-US', optionsDate);

    dtElement.textContent = dateStr;
}

const updateBtn = document.getElementById("update-btn");
const updateMessage = document.getElementById("update-message");
let currentAppVersion = "";
let updateResetTimer = null;

function formatLastChecked(timestamp) {
    if (!timestamp) return null;
    const date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const isToday = (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
    );

    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    if (isToday) {
        return `Today at ${timeStr}`;
    }

    const monthStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${monthStr} at ${timeStr}`;
}

function getIdleVersionMessage(version) {
    const vStr = version ? `v${version}` : "v1.0.0";
    const lastCheckedTs = localStorage.getItem("pawseLastUpdateCheck");
    const formattedDate = formatLastChecked(lastCheckedTs);

    if (formattedDate) {
        return `Current version: ${vStr}. Last checked: ${formattedDate}`;
    }
    return `Current version: ${vStr}`;
}

function applyUpdateStatus(status) {
    if (!status) return;

    if (updateResetTimer) {
        clearTimeout(updateResetTimer);
        updateResetTimer = null;
    }

    if (updateMessage && status.message) {
        updateMessage.textContent = status.message;
    }

    if (updateBtn) {
        updateBtn.textContent = status.buttonText || "Check for Updates";
        updateBtn.disabled = Boolean(status.disabled);

        // Reset and apply proper state styling
        updateBtn.classList.remove("btn-loading", "btn-action", "btn-success");
        if (status.buttonClass) {
            updateBtn.classList.add(status.buttonClass);
        }
    }

    // Edge case: Up to Date saves timestamp and auto-resets to idle after 4 seconds
    if (status.state === "up-to-date") {
        localStorage.setItem("pawseLastUpdateCheck", Date.now().toString());

        updateResetTimer = setTimeout(() => {
            applyUpdateStatus({
                state: "idle",
                message: getIdleVersionMessage(currentAppVersion),
                buttonText: "Check for Updates",
                buttonClass: "",
                disabled: false
            });
        }, 4000);
    }
}

// 1. Fetch current app version and populate version labels
if (window.mainAPI && window.mainAPI.getVersion) {
    window.mainAPI.getVersion().then((version) => {
        if (!version) return;
        currentAppVersion = version;
        const badge = document.querySelector(".version-badge");
        if (badge) badge.textContent = `v${version}`;

        // Ensure update message displays formatted version with Last checked date
        if (updateMessage && (!updateBtn || !updateBtn.classList.contains("btn-loading"))) {
            updateMessage.textContent = getIdleVersionMessage(version);
        }
    });
}

// 2. Restore active status from main process whenever Settings window is opened
if (window.mainAPI && window.mainAPI.getUpdateStatus) {
    window.mainAPI.getUpdateStatus().then((status) => {
        if (status) {
            // If idle on open, show Last checked timestamp if available
            if (status.state === "idle") {
                status.message = getIdleVersionMessage(currentAppVersion || status.version);
            }
            applyUpdateStatus(status);
        }
    });
}

// 3. User interaction handler for the update button
if (updateBtn) {
    updateBtn.onclick = function() {
        if (updateBtn.disabled || updateBtn.classList.contains("btn-loading")) {
            return;
        }

        const currentText = updateBtn.textContent.trim();
        if (currentText === "Restart & Update" || currentText === "Restart Now") {
            // Immediate action: trigger app restart/reload directly on click
            window.mainAPI.restartApp();
        } else {
            // "Check for Updates" or "Retry"
            applyUpdateStatus({
                state: "checking",
                message: "Looking for the latest version...",
                buttonText: "Checking...",
                buttonClass: "btn-loading",
                disabled: true
            });
            window.mainAPI.checkForUpdates();
        }
    };
}

// 4. Listen for real-time status updates from main process
if (window.mainAPI && window.mainAPI.onUpdateStatus) {
    window.mainAPI.onUpdateStatus((status) => {
        applyUpdateStatus(status);
    });
} else if (window.mainAPI && window.mainAPI.onUpdateMessage) {
    window.mainAPI.onUpdateMessage((message) => {
        const vStr = currentAppVersion ? `v${currentAppVersion}` : "v1.0.0";
        let buttonText = "Check for Updates";
        let buttonClass = "";
        let disabled = false;
        let state = "idle";

        if (message === "Update Available" || message.includes("Downloading") || message === "Downloading...") {
            buttonText = "Downloading...";
            buttonClass = "btn-loading";
            state = "downloading";
            disabled = true;
        } else if (message === "Restart App to Install" || message === "Restart & Update" || message.includes("ready. Restart to apply")) {
            buttonText = "Restart & Update";
            buttonClass = "btn-action";
            state = "downloaded";
        } else if (message.includes("Checked just now") || message === "Up to date") {
            buttonText = "Up to Date";
            buttonClass = "btn-success";
            state = "up-to-date";
            message = `Current version: ${vStr}. Checked just now.`;
            disabled = true;
        } else if (message.includes("Looking for the latest version") || message === "Checking...") {
            buttonText = "Checking...";
            buttonClass = "btn-loading";
            state = "checking";
            message = "Looking for the latest version...";
            disabled = true;
        } else if (message.includes("Couldn't connect") || message === "Error") {
            buttonText = "Check for Updates";
            message = "Couldn't connect. Check your internet and try again.";
            state = "error";
        }

        applyUpdateStatus({ state, message, buttonText, buttonClass, disabled });
    });
}

updateDashboardDateTime();
setInterval(updateDashboardDateTime, 1000);

// --- KEYBOARD NAVIGATION (Desktop Standards) ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close settings window (unless editing text)
        if (!['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
            e.preventDefault();
            if (window.mainAPI && window.mainAPI.close) {
                window.mainAPI.close();
            }
        }
    }
});