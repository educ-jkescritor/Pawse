// Ensure window conforms to default dimensions when index loads
if (window.mainAPI && window.mainAPI.resize) {
    window.mainAPI.resize('default');
}

if (localStorage.getItem('alwaysOnTop') === 'true') {
    if (window.mainAPI && window.mainAPI.setAlwaysOnTop) {
        window.mainAPI.setAlwaysOnTop(true);
    }
}

let selectedCat = null;

// Preload Ginger & Void selection sprites into memory to prevent any transition flicker
(function preloadMainSprites() {
    [
        '../assets/sprites/orange_cat_main_static1.png',
        '../assets/sprites/orange_cat_main_static2.png',
        '../assets/sprites/orange_cat_main_static3.png',
        '../assets/sprites/orange_cat_main_static4.png',
        '../assets/sprites/black_cat_main.png',
        '../assets/sprites/black_cat_main_static1.png',
        '../assets/sprites/black_cat_main_static2.png',
        '../assets/sprites/black_cat_main_static3.png',
        '../assets/sprites/black_cat_main_static4.png',
        '../assets/sprites/orange_cat_main.png'
    ].forEach(url => {
        const img = new Image();
        img.src = url;
    });
})();

// Start continuous alternating sequence between orange_cat_main_static and orange_cat_main
let orangeMainTimeoutId = null;
let blackMainTimeoutId = null;
(function startCompanionMainSequences() {
    const orangeSprite = document.getElementById("orange-main-sprite");
    const blackSprite = document.getElementById("black-main-sprite");
    // Main pose function
    function pickNextPose(previousFrame, otherCatFrame) {
        const available = [1, 2, 3, 4].filter(f => f !== previousFrame);
        const preferred = available.filter(f => f !== otherCatFrame);
        const pool = preferred.length > 0 ? preferred : available;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // Smart random frame picker: avoids picking the same previous frame,
    // and prioritizes not mirroring the other cat's active pose.
    function _unusedPickNextPose() {
        const available = [1, 2, 3, 4].filter(f => f !== previousFrame);
        const preferred = available.filter(f => f !== otherCatFrame);
        const pool = preferred.length > 0 ? preferred : available;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // Dynamic randomized starting poses on every app launch
    let currentOrangeFrame = Math.floor(Math.random() * 4) + 1;
    let currentBlackFrame = pickNextPose(0, currentOrangeFrame);
    // Duplicate pickNextPose converted to unused

    // Smart random frame picker: avoids picking the same previous frame,
    // and prioritizes not mirroring the other cat's active pose.
    function _unusedPickNextPose() {
        const available = [1, 2, 3, 4].filter(f => f !== previousFrame);
        const preferred = available.filter(f => f !== otherCatFrame);
        const pool = preferred.length > 0 ? preferred : available;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    if (orangeSprite) {
        let isOrangeStatic = true;
        orangeSprite.className = `orange-main-sprite main-static-${currentOrangeFrame}`;

        function playOrangeLoop() {
            isOrangeStatic = !isOrangeStatic;
            if (isOrangeStatic) {
                // dynamic non-repeating pose selection
                currentOrangeFrame = pickNextPose(currentOrangeFrame, currentBlackFrame);
                orangeSprite.className = `orange-main-sprite main-static-${currentOrangeFrame}`;
                const restDuration = 2000 + Math.floor(Math.random() * 2200);
                orangeMainTimeoutId = setTimeout(playOrangeLoop, restDuration);
            } else {
                orangeSprite.className = "orange-main-sprite main-anim";
                const animCycles = Math.random() < 0.5 ? 1 : 2;
                orangeMainTimeoutId = setTimeout(playOrangeLoop, animCycles * 1000);
            }
        }
        const initialOrangeDelay = 1200 + Math.floor(Math.random() * 1600); // 1.2s - 2.8s
        orangeMainTimeoutId = setTimeout(playOrangeLoop, initialOrangeDelay);
    }

    if (blackSprite) {
        let isBlackStatic = true;
        blackSprite.className = `black-main-sprite main-static-${currentBlackFrame}`;

        function playBlackLoop() {
            isBlackStatic = !isBlackStatic;
            if (isBlackStatic) {
                // dynamic non-repeating pose selection
                currentBlackFrame = pickNextPose(currentBlackFrame, currentOrangeFrame);
                blackSprite.className = `black-main-sprite main-static-${currentBlackFrame}`;
                const restDuration = 2200 + Math.floor(Math.random() * 2400);
                blackMainTimeoutId = setTimeout(playBlackLoop, restDuration);
            } else {
                blackSprite.className = "black-main-sprite main-anim";
                const animCycles = Math.random() < 0.5 ? 1 : 2;
                blackMainTimeoutId = setTimeout(playBlackLoop, animCycles * 1000);
            }
        }
        // Slightly offset initial trigger so both companions do not animate in exact unison
        const initialBlackDelay = 2200 + Math.floor(Math.random() * 1800); // 2.2s - 4.0s
        blackMainTimeoutId = setTimeout(playBlackLoop, initialBlackDelay);
    }
    /* Legacy loop removed
    if (!sprite) return;

    let isStatic = true;
    sprite.className = "orange-main-sprite main-static";

    function playMainLoop() {
        isStatic = !isStatic;
        if (isStatic) {
            sprite.className = "orange-main-sprite main-static";
            // line 86
        } else {
            sprite.className = "orange-main-sprite main-anim";
            orangeMainTimeoutId = setTimeout(playMainLoop, 2700); // 3 cycles of 0.9s 3-frame main animation
        }
    }

    */
})();

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

// Double-click accelerator (300ms industry threshold) to quickly enter timer
let lastClickTime = 0;
let lastClickedCat = null;
const DOUBLE_CLICK_THRESHOLD_MS = 300;

function handleCardClick(catKey) {
    const now = Date.now();
    const isQuickDoubleClick = (catKey === lastClickedCat) && (now - lastClickTime <= DOUBLE_CLICK_THRESHOLD_MS);

    lastClickTime = now;
    lastClickedCat = catKey;

    if (isQuickDoubleClick) {
        selectedCat = catKey;
        Object.values(buttons).forEach(btn => btn?.classList.remove("selected"));
        buttons[catKey]?.classList.add("selected");
        if (confirmButton) confirmButton.disabled = false;
        window.location.assign(`timer/timer.html?cat=${catKey}`);
        return;
    }

    selectCompanion(catKey);
}

// Attach event listeners safely
if (buttons.orange) {
    buttons.orange.onclick = function () {
        handleCardClick("orange");
    };
}

if (buttons.tuxedo) {
    buttons.tuxedo.onclick = function () {
        handleCardClick("tuxedo");
    };
}

if (buttons.black) {
    buttons.black.onclick = function () {
        handleCardClick("black");
    };
}

// Confirmation handling
let confirmButton = document.querySelector(".confirmation_button");
confirmButton.onclick = function () {
    if (selectedCat) {
        window.location.assign(`timer/timer.html?cat=${selectedCat}`);
    }
}

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