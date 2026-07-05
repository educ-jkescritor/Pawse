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

async function loadAnalytics(weeksAgo = 0) {
    const data = await window.mainAPI.loadanalytics(weeksAgo);

    const todayWorkSecondsElement = document.getElementById("today_work_seconds");
    const historicalPomodoroElement = document.getElementById("historical_pomodoro");
    const favoriteCatElement = document.getElementById("favorite_cat");

    // Format seconds into Xh Ym
    const totalSeconds = data.today_work_seconds || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let timeString = `${hours}h ${minutes}m`;

    todayWorkSecondsElement.textContent = timeString;
    historicalPomodoroElement.textContent = data.historical_pomodoro || 0;

    // Map cat_type to corresponding face image
    const catFaceImages = {
        'orange_cat': './assets/photos/orange-cat-face.png',
        'tuxedo_cat': './assets/photos/tuxedo-cat-face.png',
        'black_cat': './assets/photos/black-cat-face.png'
    };
    
    if (data.favorite_cat && catFaceImages[data.favorite_cat]) {
        favoriteCatElement.innerHTML = `<img src="${catFaceImages[data.favorite_cat]}" alt="${data.favorite_cat}" class="favorite-cat-img">`;
    } else {
        favoriteCatElement.textContent = 'None';
    }

    // Update favorite companion card theme class
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
        graphBarsContainer.classList.remove('orange_cat', 'tuxedo_cat', 'black_cat');
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
        }
        
        // Find max seconds for scaling, default to at least 1 second to prevent divide by zero
        const maxSeconds = Math.max(...data.weekly_data, 1); 
        
        data.weekly_data.forEach((seconds, index) => {
            const heightPercent = (seconds / maxSeconds) * 100;
            
            const barWrapper = document.createElement("div");
            barWrapper.className = "bar-wrapper";
            
            const bar = document.createElement("div");
            bar.className = "bar";
            
            // Normalize animation speed (velocity) regardless of height
            // 100% height = 1000ms, 50% height = 500ms
            const durationMs = Math.max((heightPercent / 100) * 1000, 300); // 300ms floor for tiny bounce
            bar.style.transition = `height ${durationMs}ms cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s ease`;
            
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
                const m = Math.round((seconds % 3600) / 60);
                tooltip.textContent = `${h}h ${m}m`;
                
                bar.appendChild(tooltip);
            }
            
            const label = document.createElement("span");
            label.className = "bar-label font-inter-10-regular";
            label.textContent = days[index];
            
            barWrapper.appendChild(bar);
            barWrapper.appendChild(label);
            graphBarsContainer.appendChild(barWrapper);
        });
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
        
        // Check if master mute triggered (both 0%)
        if (typeof updateAudioLocks === 'function') updateAudioLocks();
    });
});

// Workflow Settings Logic
const strictToggle = document.querySelector('.strict-toggle');
const breakToggle = document.querySelector('.break-toggle');
const pomodoroToggle = document.querySelector('.pomodoro-toggle');

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

if (breakToggle) {
    breakToggle.checked = localStorage.getItem('autoStartBreaks') === 'true';
    breakToggle.addEventListener('change', (e) => localStorage.setItem('autoStartBreaks', e.target.checked));
}

if (pomodoroToggle) {
    pomodoroToggle.checked = localStorage.getItem('autoStartPomodoros') === 'true';
    pomodoroToggle.addEventListener('change', (e) => localStorage.setItem('autoStartPomodoros', e.target.checked));
}

// Audio Settings Logic
// Audio Settings Logic
const alarmToggle = document.querySelector('.alarm-toggle');
if (alarmToggle) {
    alarmToggle.checked = localStorage.getItem('alarmSound') !== 'false';
    alarmToggle.addEventListener('change', (e) => localStorage.setItem('alarmSound', e.target.checked));
}

const tickToggle = document.querySelector('.tick-toggle');
if (tickToggle) {
    tickToggle.checked = localStorage.getItem('tickSound') === 'true';
    tickToggle.addEventListener('change', (e) => localStorage.setItem('tickSound', e.target.checked));
}

function updateAudioLocks() {
    const tickElement = document.querySelector('.tick-toggle');
    const alarmElement = document.querySelector('.alarm-toggle');
    
    let ambVol = parseInt(localStorage.getItem('ambientVolume'));
    if (isNaN(ambVol)) ambVol = 50;
    
    let purVol = parseInt(localStorage.getItem('purrVolume'));
    if (isNaN(purVol)) purVol = 50;
    
    const isMasterMuted = (ambVol === 0 && purVol === 0);
    
    if (tickElement) {
        const parentItem = tickElement.closest('.settings-item');
        if (parentItem) parentItem.style.opacity = isMasterMuted ? '0.5' : '1';
    }
    
    if (alarmElement) {
        const parentItem = alarmElement.closest('.settings-item');
        if (parentItem) parentItem.style.opacity = isMasterMuted ? '0.5' : '1';
    }
}
updateAudioLocks();

// Custom Graph Dropdown Logic
const dropdownTrigger = document.getElementById('dropdown-trigger');
const dropdownMenu = document.getElementById('dropdown-menu');
const dropdownContainer = document.getElementById('week-dropdown-container');
const selectedWeekLabel = document.getElementById('selected-week-label');
const dropdownItems = document.querySelectorAll('.dropdown-item');

if (dropdownTrigger && dropdownMenu) {
    // Toggle menu visibility
    dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
        dropdownContainer.classList.toggle('open');
    });

    // Handle item selection
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            const val = item.getAttribute('data-value');
            selectedWeekLabel.textContent = item.textContent;
            
            // Toggle active classes
            dropdownItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Close dropdown
            dropdownMenu.classList.add('hidden');
            dropdownContainer.classList.remove('open');
            
            // Load requested week's analytics
            loadAnalytics(parseInt(val));
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (dropdownContainer && !dropdownContainer.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
            dropdownContainer.classList.remove('open');
        }
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
        updateAudioLocks();
    }
    if (e.key === 'purrVolume') {
        const slider = document.querySelector('.purr-slider');
        if (slider) {
            slider.value = e.newValue;
            updateSliderFill(slider);
        }
        updateAudioLocks();
    }
    if (e.key === 'alarmSound') {
        const toggle = document.querySelector('.alarm-toggle');
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