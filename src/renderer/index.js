// Ensure window conforms to default dimensions when index loads
if (window.mainAPI && window.mainAPI.resize) {
    window.mainAPI.resize('default');
}

// Also recalculate as soon as custom web fonts finish rendering
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(balanceLayout);
}

if (localStorage.getItem('alwaysOnTop') === 'true') {
    if (window.mainAPI && window.mainAPI.setAlwaysOnTop) {
        window.mainAPI.setAlwaysOnTop(true);
    }
}

let selectedCat = null;

// Store buttons in a dictionary
const buttons = {
    tuxedo: document.getElementById("tuxedo_cat"),
    orange: document.getElementById("orange_cat"),
    black: document.getElementById("black_cat")
};

// Helper function to handle visual class swaps and value updating
function selectCompanion(catKey) {
    // If the clicked card is already selected, unlock/deselect it
    if (selectedCat === catKey) {
        selectedCat = null;
        if (buttons[catKey]) {
            buttons[catKey].classList.remove("selected");
        }
        if (confirmButton) {
            confirmButton.disabled = true;
        }
        return;
    }

    // Otherwise, select the new card
    selectedCat = catKey;

    // Remove 'selected' class from all buttons
    Object.values(buttons).forEach(btn => {
        if (btn) btn.classList.remove("selected");
    });

    // Add 'selected' class to the clicked button
    const selectedBtn = buttons[catKey];
    if (selectedBtn) {
        selectedBtn.classList.add("selected");
    }

    // Enable the confirm button
    if (confirmButton) {
        confirmButton.disabled = false;
    }
}

// Attach event listeners safely
if (buttons.orange) {
    buttons.orange.onclick = function () {
        selectCompanion("orange");
    };
}

if (buttons.tuxedo) {
    buttons.tuxedo.onclick = function () {
        selectCompanion("tuxedo");
    };
}

if (buttons.black) {
    buttons.black.onclick = function () {
        selectCompanion("black");
    };
}

// Confirmation handling
let confirmButton = document.querySelector(".confirmation_button");
confirmButton.onclick = function () {
    if (selectedCat) {
        window.location.assign(`timer/timer.html?cat=${selectedCat}`);
    }
}

// Align bottom gap to 14px (125% golden reference) across all scales
function balanceLayout() {
    const confirmBtn = document.querySelector('.confirmation_button');
    const catButtons = document.querySelector('.cat_buttons');
    if (!confirmBtn || !catButtons) return;

    // Reset gap to calculate natural rendered position
    catButtons.style.gap = '8px';

    const targetBottomGap = 14; // 125% reference bottom spacing
    const rect = confirmBtn.getBoundingClientRect();
    const currentGap = window.innerHeight - rect.bottom;
    const delta = currentGap - targetBottomGap;

    // Distribute delta across the 2 spaces between the 3 cat cards
    const adjustedGap = Math.max(3, Math.min(16, 8 + (delta / 2)));
    catButtons.style.gap = `${adjustedGap}px`;
}

// Run on load and whenever display scale/window changes
window.addEventListener('DOMContentLoaded', balanceLayout);
window.addEventListener('resize', balanceLayout);

  // 1. Listen for orientation changes (Portrait <-> Landscape)
if (window.screen && window.screen.orientation) {
    window.screen.orientation.addEventListener('change', balanceLayout);
}

// 2. Hardware-level DPI listener (fires immediately when 100% <-> 125% <-> 150% changes)
function watchDpiChanges() {
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener('change', () => {
        balanceLayout();
        watchDpiChanges(); // Re-arm for the next scale change
    }, { once: true });
}
watchDpiChanges();