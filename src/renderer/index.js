// Ensure window conforms to default dimensions when index loads
if (window.mainAPI && window.mainAPI.resize) {
    window.mainAPI.resize('default');
}

// No timer can be running while the menu is showing. After a crash, timer.js never gets to
// reset this flag, which would leave the Strict Mode toggle in Settings locked indefinitely.
localStorage.setItem('timerRunning', 'false');

// --- ORPHANED SESSION SALVAGE (Durable Execution safety net) ---
// Between phase transitions, in-progress work lives only in the crash backup: a main-process file
// (written every second, ~1 s old after a crash) and localStorage ('pawseDurableState', which Chromium
// writes to disk only about once a minute, or left behind by older versions). Once the file exists it is
// the authority ({"cleared":true} = no backup); localStorage is used only when no file exists at all.
// timer.js only uses that snapshot to RESUME the same cat within 12h; picking a different cat
// overwrites it within 1s, and a stale (>12h) snapshot is deleted. Either way the work was lost.
// The menu always loads before any timer page, so we persist the snapshot to SQLite here first.
// This is safe to repeat: save-session upserts by uuid with running TOTALS (not increments),
// so saving the same snapshot again just rewrites the same row. The snapshot is intentionally
// left in place so same-cat resume keeps working and later flushes update the same row.
(function salvageOrphanedSession() {
    if (!window.mainAPI || !window.mainAPI.savesession) return;

    // Read the crash backup (same rule as timer.js's readDurableSnapshot): the file is the authority
    // once it exists; localStorage only when no file exists (backup left by an older version).
    let saved = null;
    let fileResult = null;
    try {
        fileResult = window.mainAPI.readDurableState ? window.mainAPI.readDurableState() : null;
    } catch (e) { fileResult = null; }
    if (fileResult && fileResult.exists) {
        try {
            const state = fileResult.json ? JSON.parse(fileResult.json) : null;
            saved = state && !state.cleared ? state : null;
        } catch (e) { saved = null; }
    } else {
        try {
            const json = localStorage.getItem('pawseDurableState');
            saved = json ? JSON.parse(json) : null;
        } catch (e) { saved = null; } // Corrupt snapshot: nothing recoverable
    }
    if (!saved || typeof saved !== 'object' || !saved.sessionUuid) return;
    if (!['orange', 'tuxedo', 'black'].includes(saved.catType)) return;

    const workSeconds = Math.max(0, Math.floor(Number(saved.actualWork) || 0));
    const breakSeconds = Math.max(0, Math.floor(Number(saved.actualBreak) || 0));
    if (workSeconds === 0 && breakSeconds === 0) return;

    // Credit the work to when it last happened (not "now"), so a crash on Monday night
    // reopened on Tuesday still counts toward Monday's total and streak.
    const lastActive = new Date(Number(saved.timestamp));
    const dateCompleted = isNaN(lastActive.getTime())
        ? null
        : lastActive.toISOString().replace('T', ' ').substring(0, 19);

    // A snapshot at "cycle 4, break over, 00:00" is a set that completed naturally while the final
    // "Pawsome Job!" modal was open (snapshots written by older versions). Credit the Pomodoro and
    // retire the snapshot instead of letting the timer resume it past cycle 4.
    // (A skipped final break keeps its remaining time, so it never matches.)
    const setFinished = Number(saved.cycleCount) >= 4 && saved.workingTime === false && Number(saved.remainingTime) <= 0;

    window.mainAPI.savesession({
        cat_type: `${saved.catType}_cat`,
        uuid: String(saved.sessionUuid),
        total_work_seconds: workSeconds,
        total_break_seconds: breakSeconds,
        total_work: Math.max(0, Math.floor(Number(saved.workCount) || 0)),
        total_break: Math.max(0, Math.floor(Number(saved.breakCount) || 0)),
        total_pomodoro: setFinished ? 1 : 0, // MAX() in the upsert keeps any pomodoro already recorded for this uuid
        date_completed: dateCompleted
    });

    if (setFinished) {
        localStorage.removeItem('pawseDurableState');
        if (window.mainAPI.clearDurableState) window.mainAPI.clearDurableState();
    }
})();

if (localStorage.getItem('alwaysOnTop') === 'true') {
    if (window.mainAPI && window.mainAPI.setAlwaysOnTop) {
        window.mainAPI.setAlwaysOnTop(true);
    }
}

let selectedCat = null;

// Preload Tux, Ginger & Void selection sprites into memory to prevent any transition flicker
(function preloadMainSprites() {
    [
        '../assets/sprites/tuxedo_cat_main.png',
        '../assets/sprites/tuxedo_cat_main_static1.png',
        '../assets/sprites/tuxedo_cat_main_static2.png',
        '../assets/sprites/tuxedo_cat_main_static3.png',
        '../assets/sprites/tuxedo_cat_main_static4.png',
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

// --- Companion pacing (shared by the three menu cats) ---
// Each cat runs its own loop: pause on a random still pose -> play its animation for whole loops -> pause again,
// with its own random timing. Anti-sync: a cat about to animate waits a little (random 0.4-0.9 s) when another cat
// started less than 0.5 s ago, or when both others are already moving. So two cats rarely start together, all three
// never move at once, and each companion looks like it lives in its own world.
const menuAnimating = { tuxedo: false, orange: false, black: false };
const menuLastStart = { tuxedo: -Infinity, orange: -Infinity, black: -Infinity };
function mayAnimate(cat) {
    const now = performance.now();
    const others = Object.keys(menuAnimating).filter(c => c !== cat);
    if (others.some(c => now - menuLastStart[c] < 500)) return false; // another cat just started
    if (others.every(c => menuAnimating[c])) return false;           // both others are moving
    return true;
}
function markAnimating(cat, isAnimating) {
    menuAnimating[cat] = isAnimating;
    if (isAnimating) menuLastStart[cat] = performance.now();
}

// Start continuous alternating sequence between orange_cat_main_static and orange_cat_main
let orangeMainTimeoutId = null;
let blackMainTimeoutId = null;
let tuxedoMainTimeoutId = null;
(function startCompanionMainSequences() {
    const orangeSprite = document.getElementById("orange-main-sprite");
    const blackSprite = document.getElementById("black-main-sprite");
    const tuxedoSprite = document.getElementById("tuxedo-main-sprite");
    // Main pose function. otherCatFrame may be one frame or a list (the other companions' current poses)
    function pickNextPose(previousFrame, otherCatFrame) {
        const others = [].concat(otherCatFrame);
        const available = [1, 2, 3, 4].filter(f => f !== previousFrame);
        const preferred = available.filter(f => !others.includes(f));
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
    let currentTuxedoFrame = pickNextPose(0, [currentOrangeFrame, currentBlackFrame]);
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
            // About to animate, but another cat just started or both others are moving: hold this pose a bit longer
            if (isOrangeStatic && !mayAnimate('orange')) {
                orangeMainTimeoutId = setTimeout(playOrangeLoop, 400 + Math.floor(Math.random() * 500));
                return;
            }
            isOrangeStatic = !isOrangeStatic;
            markAnimating('orange', !isOrangeStatic);
            if (isOrangeStatic) {
                // dynamic non-repeating pose selection
                currentOrangeFrame = pickNextPose(currentOrangeFrame, [currentBlackFrame, currentTuxedoFrame]);
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
            // About to animate, but another cat just started or both others are moving: hold this pose a bit longer
            if (isBlackStatic && !mayAnimate('black')) {
                blackMainTimeoutId = setTimeout(playBlackLoop, 400 + Math.floor(Math.random() * 500));
                return;
            }
            isBlackStatic = !isBlackStatic;
            markAnimating('black', !isBlackStatic);
            if (isBlackStatic) {
                // dynamic non-repeating pose selection
                currentBlackFrame = pickNextPose(currentBlackFrame, [currentOrangeFrame, currentTuxedoFrame]);
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

    if (tuxedoSprite) {
        let isTuxedoStatic = true;
        tuxedoSprite.className = `tuxedo-main-sprite main-static-${currentTuxedoFrame}`;

        function playTuxedoLoop() {
            // About to animate, but another cat just started or both others are moving: hold this pose a bit longer
            if (isTuxedoStatic && !mayAnimate('tuxedo')) {
                tuxedoMainTimeoutId = setTimeout(playTuxedoLoop, 400 + Math.floor(Math.random() * 500));
                return;
            }
            isTuxedoStatic = !isTuxedoStatic;
            markAnimating('tuxedo', !isTuxedoStatic);
            if (isTuxedoStatic) {
                // dynamic non-repeating pose selection
                currentTuxedoFrame = pickNextPose(currentTuxedoFrame, [currentOrangeFrame, currentBlackFrame]);
                tuxedoSprite.className = `tuxedo-main-sprite main-static-${currentTuxedoFrame}`;
                const restDuration = 2100 + Math.floor(Math.random() * 2300);
                tuxedoMainTimeoutId = setTimeout(playTuxedoLoop, restDuration);
            } else {
                tuxedoSprite.className = "tuxedo-main-sprite main-anim";
                const animCycles = Math.random() < 0.5 ? 1 : 2;
                tuxedoMainTimeoutId = setTimeout(playTuxedoLoop, animCycles * 1000);
            }
        }
        // Offset start so the three companions do not animate in unison
        const initialTuxedoDelay = 3000 + Math.floor(Math.random() * 1600); // 3.0s - 4.6s
        tuxedoMainTimeoutId = setTimeout(playTuxedoLoop, initialTuxedoDelay);
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

// Home-screen button sounds.
const homeClickAudios = {
    titlebar: new Audio('../assets/sounds/click-titlebar-button.mp3'),
    button: new Audio('../assets/sounds/click-button.mp3')
};

Object.values(homeClickAudios).forEach(audio => {
    audio.preload = 'auto';
    audio.volume = 0.3;

    audio.addEventListener('error', () => {
        console.error('Unable to load click sound:', audio.src, audio.error);
    });
});

document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    // Follow the Interface Sounds toggle in Settings.
    if (localStorage.getItem('clickSound') === 'false') return;

    const button = event.target.closest('button');

    if (
        !button ||
        button.matches(':disabled') ||
        button.getAttribute('aria-disabled') === 'true'
    ) {
        return;
    }

    const audio = button.closest('.main-window-controls')
        ? homeClickAudios.titlebar
        : homeClickAudios.button;

    audio.currentTime = 0;
    audio.play().catch(error => {
        console.warn('Click sound could not play:', error);
    });
}, { capture: true });