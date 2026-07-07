let settingsButton = document.getElementById("menu-btn");
if (settingsButton !== null) {
    settingsButton.onclick = function settingsWindow() {
        window.mainAPI.settings();
    };
}

let closeButton = document.getElementById("close-btn");
if (closeButton !== null) {
    closeButton.onclick = function closeWindow() {
        let exitModal = document.getElementById("exit-modal-overlay");
        if (exitModal !== null) {
            // We are on the timer screen, show the confirmation modal instead of closing immediately
            exitModal.classList.remove("hidden");
            return;
        }
        
        // Otherwise (Main Menu, Settings), close immediately
        localStorage.removeItem('pawseDurableState');
        window.mainAPI.close();
    };
}

let minimizeButton = document.getElementById("minimize-btn");
if (minimizeButton !== null) {
    minimizeButton.onclick = function minimizeWindow() {
        window.mainAPI.minimize();
    };
}

let maximizeButton = document.getElementById("maximize-btn");
if (maximizeButton !== null) {
    maximizeButton.onclick = function maximizeWindow() {
        window.mainAPI.maximize();
    };
}

let resizeButton = document.getElementById("resize-btn");
if (resizeButton !== null) {
    resizeButton.onclick = function resizeWindow() {
        let resizeModal = document.getElementById("resize-modal-overlay");
        
        if (document.body.classList.contains("timer-only-mode") || document.body.classList.contains("cat-only-mode")) {
            document.body.classList.remove("timer-only-mode", "cat-only-mode");
            window.mainAPI.resize('default');
        } else if (resizeModal !== null) {
            resizeModal.classList.remove("hidden");
        } else {
            window.mainAPI.resize('default');
        }
    };
}

