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

    todayWorkSecondsElement.textContent = data.today_work_seconds;
    historicalPomodoroElement.textContent = data.historical_pomodoro;
    favoriteCatElement.textContent = data.favorite_cat;
}

loadAnalytics();