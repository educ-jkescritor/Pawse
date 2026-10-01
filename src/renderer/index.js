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

// Lock bottom gap to exactly 14px (125% golden reference) across all display scales
function balanceLayout() {
    const confirmBtn = document.querySelector('.confirmation_button');
    const wrapper = document.querySelector('.app-wrapper');
    if (!confirmBtn || !wrapper) return;

    // Reset inline margin first to measure natural rendered flow
    confirmBtn.style.marginTop = '';

    requestAnimationFrame(() => {
        const wrapperRect = wrapper.getBoundingClientRect();
        const btnRect = confirmBtn.getBoundingClientRect();
        
        // Exact pixel distance between the button bottom and the visible card bottom
        const currentGap = wrapperRect.bottom - btnRect.bottom;
        const targetGap = 14; // 125% scale golden reference
        
        const delta = currentGap - targetGap;
        if (Math.abs(delta) >= 0.5) {
            confirmBtn.style.marginTop = `${delta}px`;
        }
    });
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

// --- KEYBOARD NAVIGATION (Desktop Standards) ---
window.addEventListener('keydown', (e) => {
    // Ignore keystrokes if an input is focused (future-proofing)
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    const catKeys = ['tuxedo', 'orange', 'black'];
    if (e.key === '1') {
        selectCompanion('tuxedo');
    } else if (e.key === '2') {
        selectCompanion('orange');
    } else if (e.key === '3') {
        selectCompanion('black');
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = catKeys.indexOf(selectedCat);
        const nextIndex = currentIndex === -1 || currentIndex === catKeys.length - 1 ? 0 : currentIndex + 1;
        selectCompanion(catKeys[nextIndex]);
        buttons[catKeys[nextIndex]]?.focus();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = catKeys.indexOf(selectedCat);
        const prevIndex = currentIndex <= 0 ? catKeys.length - 1 : currentIndex - 1;
        selectCompanion(catKeys[prevIndex]);
        buttons[catKeys[prevIndex]]?.focus();
    } else if (e.key === 'Enter' && selectedCat && confirmButton && !confirmButton.disabled) {
        confirmButton.click();
    }
});