let settingsButton = document.getElementById("menu-btn");
settingsButton.onclick = function settingsWindow() {
    window.mainAPI.settings();
}

let closeButton = document.getElementById("close-btn");
closeButton.onclick = function closeWindow() {
    window.mainAPI.close();
}

let minimizeButton = document.getElementById("minimize-btn");
minimizeButton.onclick = function minimizeWindow() {
    window.mainAPI.minimize();
}

let maximizeButton = document.getElementById("maximize-btn");
maximizeButton.onclick = function maximizeWindow() {
    window.mainAPI.maximize();
}