let minimizeButton = document.getElementById("minimize-btn");
minimizeButton.onclick = function minimizeWindow() {
    window.mainAPI.minimize();
}

let closeButton = document.getElementById("close-btn");
closeButton.onclick = function closeWindow() {
    window.mainAPI.close();
}

const sidebar = document.querySelector(".side-bar");
const dockButton = document.getElementById("dock-btn") || document.querySelector(".sidebar-dock-btn") || document.querySelector(".sidebar-menu-btn");
const brandLogo = document.querySelector(".brand-logo");

if (sidebar && dockButton) {
    dockButton.addEventListener("click", () => {
        sidebar.classList.add("collapsed");
        if (brandLogo) brandLogo.title = "Dock";
    });
}

if (sidebar && brandLogo) {
    brandLogo.addEventListener("mouseenter", () => {
        if (sidebar.classList.contains("collapsed")) {
            brandLogo.title = "Dock";
        } else {
            brandLogo.removeAttribute("title");
        }
    });

    brandLogo.addEventListener("click", () => {
        if (sidebar.classList.contains("collapsed")) {
            sidebar.classList.remove("collapsed");
            brandLogo.removeAttribute("title");
        }
    });
}

let currentWeeksAgo = 0;
let calendarBaseDate = new Date();

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
    
    // Always display the month for both start and end dates (e.g., "Oct 4 - Oct 10")
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

function getStartOfWeek(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const dayIndex = (start.getDay() + 7) % 7;
    start.setDate(start.getDate() - dayIndex);
    return start;
}

function renderCalendar() {
    const popup = document.getElementById('calendar-popup');
    if (!popup) return;

    const today = new Date();
    const monthDate = new Date(calendarBaseDate.getFullYear(), calendarBaseDate.getMonth(), 1);
    const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const isCurrentMonth = monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth();

    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const calendarStart = getStartOfWeek(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
    const calendarEnd = getStartOfWeek(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
    const totalDays = Math.ceil((calendarEnd - calendarStart) / (1000 * 60 * 60 * 24)) + 7;

    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const weekdayMarkup = weekdays.map(day => `<span>${day}</span>`).join('');

    let calendarRows = '';
    const currentRealWeekStart = getStartOfWeek(today);

    for (let i = 0; i < totalDays; i += 7) {
        const rowStart = new Date(calendarStart);
        rowStart.setDate(calendarStart.getDate() + i);

        let rowHtml = '';
        let rowWeeksAgo = null;

        for (let j = 0; j < 7; j++) {
            const cellDate = new Date(rowStart);
            cellDate.setDate(rowStart.getDate() + j);

            const isCurrentMonthDay = cellDate.getMonth() === monthDate.getMonth();
            const isFutureDay = cellDate > today;
            const isTodayDay = cellDate.toDateString() === today.toDateString();

            const dayClasses = ['cal-day'];
            if (isTodayDay) dayClasses.push('today');
            if (!isCurrentMonthDay || isFutureDay) dayClasses.push('disabled-day');

            const cellMarkup = `<span class="${dayClasses.join(' ')}">${cellDate.getDate()}</span>`;
            rowHtml += cellMarkup;

            if (j === 0) {
                const rowWeekStart = getStartOfWeek(cellDate);
                const diffDays = Math.round((currentRealWeekStart - rowWeekStart) / (1000 * 60 * 60 * 24));
                rowWeeksAgo = Math.floor(diffDays / 7);
            }
        }

        const classes = ['calendar-week'];
        if (rowWeeksAgo === currentWeeksAgo) classes.push('selected-week');
        if (rowWeeksAgo < 0) classes.push('future-week');

        calendarRows += `<div class="${classes.join(' ')}" data-weeks-ago="${rowWeeksAgo}">${rowHtml}</div>`;
    }

    popup.innerHTML = `
        <div class="calendar-header">
            <button type="button" class="nav-arrow calendar-prev" aria-label="Previous month">&#8249;</button>
            <span class="font-inter-8-medium">${monthLabel}</span>
            <button type="button" class="nav-arrow calendar-next" aria-label="Next month" ${isCurrentMonth ? 'disabled' : ''}>&#8250;</button>
        </div>
        <div class="calendar-weekdays">${weekdayMarkup}</div>
        <div class="calendar-days">${calendarRows}</div>
    `;

    const prevMonthButton = popup.querySelector('.calendar-prev');
    const nextMonthButton = popup.querySelector('.calendar-next');

    if (prevMonthButton) {
        prevMonthButton.addEventListener('click', () => {
            const adjustedDate = new Date(calendarBaseDate);
            adjustedDate.setMonth(adjustedDate.getMonth() - 1);
            calendarBaseDate = adjustedDate;
            renderCalendar();
        });
    }

    if (nextMonthButton && !nextMonthButton.disabled) {
        nextMonthButton.addEventListener('click', () => {
            const adjustedDate = new Date(calendarBaseDate);
            adjustedDate.setMonth(adjustedDate.getMonth() + 1);
            calendarBaseDate = adjustedDate;
            renderCalendar();
        });
    }

    const weekRows = popup.querySelectorAll('.calendar-week');
    weekRows.forEach((row) => {
        const wAgo = Number(row.dataset.weeksAgo || 0);
        if (row.classList.contains('future-week')) return;

        row.addEventListener('click', () => {
            if (wAgo < 0) return;
            loadAnalytics(wAgo);
            calendarPopup.classList.add('hidden');
        });
    });
}

async function loadAnalytics(weeksAgo = 0) {
    currentWeeksAgo = weeksAgo;
    const data = await window.mainAPI.loadanalytics(weeksAgo);

//     data.today_work_seconds = 0; // 2 hours (exceeds 1h 1m avg)
// data.avg_daily_seconds = 3660;
// data.current_streak = 0;   // Greater than 0
// data.best_streak = 15;

    // Update dynamic week pill date range
    const dateRangeButton = document.getElementById("date-range-btn");
    if (dateRangeButton) {
        dateRangeButton.textContent = getWeekDateRangeString(weeksAgo);
    }

    // Sync the calendar popup to the selected week before rendering.
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - (weeksAgo * 7));
    calendarBaseDate = targetDate;

    renderCalendar();

    // Disable the right arrow if user is on current week
    const nextBtn = document.getElementById("next-week-btn");
    if (nextBtn) {
        nextBtn.disabled = (weeksAgo === 0);
    }

    // 1. Focus Streak Card
    const currentStreakEl = document.getElementById("current_streak");
    const streakUnitEl = document.getElementById("streak_unit");
    const bestStreakEl = document.getElementById("best_streak");
    const streakCard = document.getElementById("streak-card");
    const streakIconEl = document.querySelector("#streak-card .card-icon");

    const streak = data.current_streak || 0;
    const bestStreak = data.best_streak || 0; // Fallback to 0 for logic checks

    if (currentStreakEl) currentStreakEl.textContent = streak;
    if (streakUnitEl) streakUnitEl.textContent = streak <= 1 ? 'day' : 'days';

    if (streakCard && bestStreakEl) {
        // Reset classes
        streakCard.classList.remove('active-streak', 'best-streak');
        
        if (streak === 0) {
            // State 1: Inactive (0 days)
            bestStreakEl.textContent = "Ready to purr-ceed?";
            if (streakIconEl) streakIconEl.src = "../assets/icons/visual-streak-inactive.png";
        } else if (streak >= bestStreak) {
            // State 2: Matched or beaten best streak
            streakCard.classList.add('best-streak');
            bestStreakEl.textContent = "Purr-fect new best!";
            // TODO: Update src to your orange active streak asset
            if (streakIconEl) streakIconEl.src = "../assets/icons/visual-streak-best.png"; 
        } else {
            // State 3: Active streak, but hasn't beaten best yet
            streakCard.classList.add('active-streak');
            bestStreakEl.textContent = `Purr-suing ${bestStreak} days.`;
            // TODO: Update src to your yellow active streak asset
            if (streakIconEl) streakIconEl.src = "../assets/icons/visual-streak-active.png"; 
        }
    }

    // 2. Today's Focus Card & Trend vs Average
    const todayWorkSecondsElement = document.getElementById("today_work_seconds");
    const todayVsAvgEl = document.getElementById("today_vs_avg");
    const todayFocusCard = document.getElementById("today-focus-card");
    const focusIconEl = document.querySelector("#today-focus-card .card-icon");

    const totalSeconds = data.today_work_seconds || 0;
    const avgSeconds = data.avg_daily_seconds || 0;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const plainTimeString = `${hours}h ${minutes}m`;
    const htmlTimeString = `<span class="font-pixel-num-20-bold">${hours}</span>h <span class="font-pixel-num-20-bold">${minutes}</span>m`;

    if (todayWorkSecondsElement) todayWorkSecondsElement.innerHTML = htmlTimeString;

    if (todayFocusCard && todayVsAvgEl) {
        // Reset classes
        todayFocusCard.classList.remove('below-avg-focus', 'above-avg-focus', 'active-focus');

        // Always keep visual-hourglass.png across all 3 states
        if (focusIconEl) focusIconEl.src = "../assets/icons/visual-hourglass.png";

        const avgH = Math.floor(avgSeconds / 3600);
        const avgM = Math.round((avgSeconds % 3600) / 60);
        const formattedAvg = avgH > 0 ? (avgM > 0 ? `${avgH}h ${avgM}m` : `${avgH}h`) : `${avgM}m`;

        if (totalSeconds === 0) {
            // State 1: Inactive (0 seconds tracked)
            todayVsAvgEl.textContent = avgSeconds > 0 ? `Average pace is ${formattedAvg}` : "First day tracking";
            todayVsAvgEl.title = avgSeconds > 0 ? `Overall Daily Average: ${formattedAvg}` : "No previous days tracked yet";
        } else if (avgSeconds > 0 && totalSeconds > avgSeconds) {
            // State 3: Above Average (Teal)
            todayFocusCard.classList.add('above-avg-focus');
            todayVsAvgEl.textContent = "Above daily average!";
            todayVsAvgEl.title = `Today: ${plainTimeString} | Overall Daily Average: ${formattedAvg}`;
        } else {
            // State 2: Below Average / Pacing (Blue)
            todayFocusCard.classList.add('below-avg-focus');
            todayVsAvgEl.textContent = "Pacing your average";
            todayVsAvgEl.title = `Today: ${plainTimeString} | Overall Daily Average: ${formattedAvg}`;
        }
    }

    // 3. Top Companion Card
const topCompanionCard = document.getElementById("top-companion-card");
    const topCompanionNameEl = document.getElementById("top_companion_name");
    const topCompanionRateEl = document.getElementById("top_companion_rate");
    const topCompanionIconEl = document.querySelector("#top-companion-card .card-icon");

    const companionNames = {
        tuxedo_cat: "Tux",
        orange_cat: "Ginger",
        black_cat: "Void"
    };
    
    const companionIcons = {
        tuxedo_cat: "../assets/photos/tuxedo-cat-face.png",
        orange_cat: "../assets/photos/orange-cat-face.png",
        black_cat: "../assets/photos/black-cat-face.png"
    };

    if (topCompanionCard) {
        topCompanionCard.classList.remove('orange_cat', 'tuxedo_cat', 'black_cat');
    }

    if (data.favorite_cat && companionNames[data.favorite_cat]) {
        if (topCompanionCard) {
            topCompanionCard.classList.add(data.favorite_cat);
        }
        if (topCompanionNameEl) {
            topCompanionNameEl.textContent = companionNames[data.favorite_cat];
        }
        if (topCompanionIconEl) {
            topCompanionIconEl.src = companionIcons[data.favorite_cat];
        }
        if (topCompanionRateEl) {
            const percentage = data.favorite_cat_percentage || 0;
            topCompanionRateEl.textContent = `Chosen ${percentage}% of the time`;
        }
    } else { // Empty state fallback
        if (topCompanionNameEl) {
            topCompanionNameEl.textContent = "None";
        }
        if (topCompanionRateEl) {
            topCompanionRateEl.textContent = "No sessions yet";
        }
        // if (topCompanionIconEl) {
        //     topCompanionIconEl.src = "../assets/icons/visual-companion-tux.svg"; 
        // }
    }

    // Legacy fallbacks (in case DOM or tests look for historical elements)
    const historicalPomodoroElement = document.getElementById("historical_pomodoro");
    if (historicalPomodoroElement) {
        historicalPomodoroElement.textContent = data.historical_pomodoro || 0;
    }

    // Graph Generation
    const graphBarsContainer = document.querySelector(".graph-bars");
    const graphContainer = document.querySelector(".graph"); // Target parent for legend sync
    if (graphBarsContainer && data.weekly_data) {
        graphBarsContainer.innerHTML = ''; // Clear existing
        
        // Dynamic hover & legend support: style according to user's favorite companion
        graphBarsContainer.classList.remove('orange_cat', 'tuxedo_cat', 'black_cat', 'empty-state');
        if (graphContainer) {
            graphContainer.classList.remove('orange_cat', 'tuxedo_cat', 'black_cat');
        }
        if (data.favorite_cat) {
            graphBarsContainer.classList.add(data.favorite_cat);
            if (graphContainer) graphContainer.classList.add(data.favorite_cat);
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
        
        // Scale ceiling considers both the tallest bar of the week and weekly average so neither overflows
        const weekAvgSeconds = data.weekly_avg_seconds !== undefined ? data.weekly_avg_seconds : (() => {
            const activeDays = data.weekly_data.filter(s => s > 0);
            return activeDays.length > 0 ? Math.round(activeDays.reduce((a, b) => a + b, 0) / activeDays.length) : 0;
        })();
        const maxBarSeconds = Math.max(...data.weekly_data, 1); 
        const ceilingSeconds = Math.max(maxBarSeconds, weekAvgSeconds);
        
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

        // Draw Daily Average Benchmark Line if current week has data and weekly average > 0
        if (hasData && weekAvgSeconds > 0) {
            const avgLine = document.createElement("div");
            avgLine.className = "avg-benchmark-line";

            // Format average time for badge (e.g. "avg 12m" or "avg 1h 15m")
            const avgH = Math.floor(weekAvgSeconds / 3600);
            const avgM = Math.round((weekAvgSeconds % 3600) / 60);
            const formattedAvg = avgH > 0 ? (avgM > 0 ? `${avgH}h ${avgM}m` : `${avgH}h`) : `${avgM}m`;

            const avgBadge = document.createElement("span");
            avgBadge.className = "avg-benchmark-label font-inter-10-regular";
            // Reverses the order and wraps the time in a strong tag for bolding
            avgBadge.innerHTML = `<strong>${formattedAvg}</strong> avg`;
            avgLine.appendChild(avgBadge);

            // Compute bottom offset accurately: baseline of bars is 20px, max bar area is (containerHeight - 36px)
            const containerHeight = graphBarsContainer.clientHeight || 79;
            const baselineBottom = 20; // 12px label + 8px gap
            const maxBarHeight = Math.max(containerHeight - 20 - 16, 10); // 16px padding-top
            const avgRatio = Math.min(weekAvgSeconds / ceilingSeconds, 1);
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

// Custom Graph Week Picker Logic
const prevWeekButton = document.getElementById('prev-week-btn');
const nextWeekButton = document.getElementById('next-week-btn');
const dateRangeButton = document.getElementById('date-range-btn');
const calendarPopup = document.getElementById('calendar-popup');

if (prevWeekButton) {
    prevWeekButton.addEventListener('click', () => {
        currentWeeksAgo += 1;
        loadAnalytics(currentWeeksAgo);
    });
}

if (nextWeekButton) {
    nextWeekButton.addEventListener('click', () => {
        currentWeeksAgo = Math.max(0, currentWeeksAgo - 1);
        loadAnalytics(currentWeeksAgo);
    });
}

if (dateRangeButton && calendarPopup) {
    dateRangeButton.addEventListener('click', () => {
        renderCalendar();
        calendarPopup.classList.toggle('hidden');
    });
}

// Dismiss calendar popup when clicking outside
document.addEventListener('click', (event) => {
    if (calendarPopup && !calendarPopup.classList.contains('hidden')) {
        // Prevent dismissal when clicking month navigation arrows
        if (event.target.closest('.calendar-prev') || event.target.closest('.calendar-next')) {
            return;
        }

        const isOutside = !calendarPopup.contains(event.target) && 
                          (!dateRangeButton || !dateRangeButton.contains(event.target)) &&
                          (!prevWeekButton || !prevWeekButton.contains(event.target)) &&
                          (!nextWeekButton || !nextWeekButton.contains(event.target));
        
        if (isOutside) {
            calendarPopup.classList.add('hidden');
        }
    }
});

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
    
    // Format: "October 5, 2026"
    const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
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