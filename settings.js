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

let dashboardButton = document.getElementById("dashboard-btn");
dashboardButton.onclick = function() {
    hideAllContents();
    dashboardContent.classList.remove("hidden");
}

let aboutButton = document.getElementById("about-btn");
aboutButton.onclick = function() {
    hideAllContents();
    aboutContent.classList.remove("hidden");
}

let settingsButton = document.getElementById("settings-btn");
settingsButton.onclick = function() {
    hideAllContents();
    settingsContent.classList.remove("hidden");
}

let dashboardContent = document.getElementById("dashboard-content");    
let aboutContent = document.getElementById("about-content");
let settingsContent = document.getElementById("settings-content");

async function loadAnalytics() {
    const data = await window.mainAPI.loadanalytics();

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

    // Map cat_type to display name
    const catDisplayNames = {
        'orange_cat': 'Ginger',
        'tuxedo_cat': 'Tux',
        'black_cat': 'Void'
    };
    
    favoriteCatElement.textContent = catDisplayNames[data.favorite_cat] || 'None';

    // Graph Generation
    const graphBarsContainer = document.querySelector(".graph-bars");
    if (graphBarsContainer && data.weekly_data) {
        graphBarsContainer.innerHTML = ''; // Clear existing
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Find max hours for scaling, default to at least 1 hour to prevent divide by zero
        const maxHours = Math.max(...data.weekly_data, 1); 
        
        data.weekly_data.forEach((hours, index) => {
            const heightPercent = (hours / maxHours) * 100;
            
            const barWrapper = document.createElement("div");
            barWrapper.className = "bar-wrapper";
            
            const bar = document.createElement("div");
            bar.className = "bar";
            // The height of the bar container is essentially 100%, we apply height to bar
            bar.style.height = `${heightPercent}%`;
            bar.title = `${hours} hours`;
            
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

    // Function to calculate and apply colors and text
    const updateSliderFill = (el) => {
        const val = el.value;

        // Update text percentage
        const textLabel = el.previousElementSibling;
        if (textLabel) {
            textLabel.textContent = `${val}%`;
        }

        // Update background gradient (blue follows value percentage)
        el.style.background = `linear-gradient(to right, var(--sys-blue-solid) 0%,
        var(--sys-blue-solid) ${val}%, var(--stroke-color) ${val}%, var(--stroke-color) 100%)`;
    };

        // Initialize layout with the loaded values
        updateSliderFill(slider);

        // Update dynamically and save to localStorage on slide
        slider.addEventListener('input', (event) => {
            updateSliderFill(event.target);

            // 3. Save to localStorage dynamically as the user drags
            if (storageKey) {
                localStorage.setItem(storageKey, event.target.value);
            }
        });
});