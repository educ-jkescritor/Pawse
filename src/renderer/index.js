if (localStorage.getItem('alwaysOnTop') === 'true') {
    if (window.mainAPI && window.mainAPI.setAlwaysOnTop) {
        window.mainAPI.setAlwaysOnTop(true);
    }
}

const savedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');

if (savedUser) {
    // If they already logged in or clicked guest previously, skip the login screen!
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.main-content').style.display = 'block';
    
    window.mainAPI.appReady(savedUser);

    document.getElementById('back-btn').style.display = 'block';
    document.getElementById('close-btn').style.display = 'none'; 
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
        document.querySelector('.main-content').style.display = 'none';
        document.querySelector('.timer-content').style.display = 'block';

        document.getElementById("back-btn").style.display = 'none';
        document.getElementById("close-btn").style.display = 'none';
        document.getElementById("home-btn").style.display = 'block';
        document.getElementById("resize-btn").style.display = 'block';

        startPomodoroSession(selectedCat);
    }
}

let isSignUpMode = false;

document.getElementById('toggle-auth-link').addEventListener('click', (e) => {
    e.preventDefault();   
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        document.getElementById('auth-title').innerText = "SIGN UP";
        document.getElementById('auth-btn').innerText = "Create Account";
        document.getElementById('toggle-auth-link').innerText = "Already have an account? Login";
    } else {
        document.getElementById('auth-title').innerText = "LOGIN";
        document.getElementById('auth-btn').innerText = "Login";
        document.getElementById('toggle-auth-link').innerText = "Don't have an account? Sign up";
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const emailStr = document.getElementById('email').value;
    const passStr = document.getElementById('password').value;

    try {
        if (isSignUpMode) {
            await window.mainAPI.signup(emailStr, passStr);
            document.getElementById('toggle-auth-link').click();
            return;
        } else {
            await window.mainAPI.login(emailStr, passStr);
        }
        localStorage.setItem('currentUser', emailStr);

        document.querySelector('.login-container').style.display = 'none';
        document.querySelector('.main-content').style.display = 'block'; 

        window.mainAPI.appReady(emailStr);

        document.getElementById('back-btn').style.display = 'block';
        document.getElementById('close-btn').style.display = 'none'; 
    } catch (error) {
        if (error.message.includes("already taken")) {
            document.getElementById('error-message').innerText = "The email is already taken. Please try again.";
        } else {
            document.getElementById('error-message').innerText = "Invalid credentials. Please try again.";
        }
    }
});

document.getElementById('guest-btn').addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    sessionStorage.setItem('currentUser', 'guest');
        
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.main-content').style.display = 'block';

    window.mainAPI.appReady('guest');

    document.getElementById('back-btn').style.display = 'block'; // show
    document.getElementById('close-btn').style.display = 'none'; // do not show
});

const catConfiguration = {   
    orange: {
        workTime: 15 * 60,
        shortBreakTime: 3 * 60,
        longBreakTime: 12 * 60,
        dbId: "orange_cat"
    },
    tuxedo: {
        workTime: 25 * 60,
        shortBreakTime: 5 * 60,
        longBreakTime: 20 * 60,
        dbId: "tuxedo_cat"
    },   
    black: {
        workTime: 50 * 60,
        shortBreakTime: 10 * 60,
        longBreakTime: 40 * 60,
        dbId: "black_cat"
    }
}

let catType = null;
let catConfig = null;
let remainingTime = 0;
let workingTime = true;
let cycleCount = 0;
let timerId = null;
let isRunning = true;
let soundEnabled = true;
let actualWork = 0; 
let actualBreak = 0;
let workCount = 0;
let breakCount = 0;
let sessionDate = new Date();
let durableSaveInterval = null;

// Lock settings while timer is active
window.addEventListener('beforeunload', () => {
    localStorage.setItem('timerRunning', 'false');
    if (typeof flushSessionData === 'function') flushSessionData();
});

function startPomodoroSession(selectedCat) {
    catType = selectedCat;
    catConfig = catConfiguration[catType];
    
    // Reset state for new session
    workingTime = true;
    cycleCount = 0;
    isRunning = true;
    actualWork = 0;
    actualBreak = 0;
    workCount = 0;
    breakCount = 0;
    sessionDate = new Date();
    remainingTime = catConfig.workTime;
    soundEnabled = true;
    
    localStorage.setItem('timerRunning', 'true');
    
    // Reset visual fish icons
    const fishIcons = document.querySelectorAll(".fish-icon");
    fishIcons.forEach((fish) => {
        fish.classList.remove("active");
        fish.style.backgroundImage = `url('../assets/icons/uncompleted-fish.png')`;
    });

    // Boot up the timer
    document.getElementById("timer-display").textContent = formatTime(remainingTime);
    updateCatState();
    updateAudioSettings();
    startTimer();
}

// --- DURABLE EXECUTION ENGINE (Local Persistence) ---
const savedStateStr = localStorage.getItem('pawseDurableState');
if (savedStateStr) {
    try {
        const savedState = JSON.parse(savedStateStr);
        // Only restore if the saved state belongs to the exact same cat companion
        if (savedState.catType === catType) {
            const elapsedSeconds = Math.floor((Date.now() - savedState.timestamp) / 1000);
            
            remainingTime = savedState.remainingTime;
            // If it was actively running when closed, subtract the elapsed offline time
            if (savedState.isRunning) {
                remainingTime -= elapsedSeconds;
                if (remainingTime < 0) remainingTime = 0; // Trigger completion instantly if time passed
            }
            
            workingTime = savedState.workingTime;
            cycleCount = savedState.cycleCount;
            actualWork = savedState.actualWork || 0;
            actualBreak = savedState.actualBreak || 0;
            workCount = savedState.workCount || 0;
            breakCount = savedState.breakCount || 0;
            
            // If it was manually paused before crashing, start up paused
            isRunning = savedState.isRunning;
        }
    } catch(e) {
        // Ignore corruption
    }
}

// Continuously save state (Fault Tolerance)
setInterval(() => {
    localStorage.setItem('pawseDurableState', JSON.stringify({
        email: localStorage.getItem('userEmail'),
        catType: catType,
        remainingTime: remainingTime,
        workingTime: workingTime,
        cycleCount: cycleCount,
        isRunning: isRunning,
        actualWork: actualWork,
        actualBreak: actualBreak,
        workCount: workCount,
        breakCount: breakCount,
        timestamp: Date.now()
    }));
}, 1000);
// ---------------------------------------------------

function flushSessionData(isPomodoroComplete = false, forceYesterday = false) {
    if (actualWork === 0 && actualBreak === 0 && !isPomodoroComplete) return;

    let dateCompleted = null;
    if (forceYesterday) {
        let d = sessionDate; 
        d.setHours(23, 59, 59, 0);
        // Export exactly as UTC to match SQLite CURRENT_TIMESTAMP behavior
        dateCompleted = d.toISOString().replace('T', ' ').substring(0, 19);
    }

    let sessionData = {
        email: localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'guest',
        cat_type: catConfig.dbId,
        total_work_seconds: actualWork,
        total_break_seconds: actualBreak,
        total_work: workCount,
        total_break: breakCount,
        total_pomodoro: isPomodoroComplete ? 1 : 0,
        date_completed: dateCompleted
    };
    
    if (window.mainAPI && window.mainAPI.savesession) {
        window.mainAPI.savesession(sessionData);
    }

    // Reset local accumulators so we never double-count
    actualWork = 0;
    actualBreak = 0;
    workCount = 0;
    breakCount = 0;
}

// Initialize Audio Objects
const ambientAudio = new Audio('../assets/sounds/ambient.mp3');
ambientAudio.loop = true;
const purrAudio = new Audio('../assets/sounds/purr.mp3');
purrAudio.loop = true;
const tickAudio = new Audio('../assets/sounds/tick.mp3');
tickAudio.volume = 0.2; // Lowered default volume to prevent ear strain
let tickEnabled = false;
const alarmAudio = new Audio('../assets/sounds/alarm.mp3');
alarmAudio.loop = true;
alarmAudio.volume = 0.2; // Lowered default volume to prevent ear strain

// Meow sounds (often acts as button click feedback)
const meowAudios = {
    'orange_cat': new Audio('../assets/sounds/ginger-meow.mp3'),
    'tuxedo_cat': new Audio('../assets/sounds/tux-meow.mp3'),
    'black_cat': new Audio('../assets/sounds/void-meow.mp3')
};
Object.values(meowAudios).forEach(audio => audio.volume = 0.3); // Lowered click/meow volume

function updateAudioSettings() {
    let ambVol = parseInt(localStorage.getItem('ambientVolume'));
    if (isNaN(ambVol)) ambVol = 50;
    
    let purVol = parseInt(localStorage.getItem('purrVolume'));
    if (isNaN(purVol)) purVol = 50;
    
    let tickStr = localStorage.getItem('tickSound');
    tickEnabled = tickStr === null ? true : (tickStr === 'true');

    ambientAudio.volume = ambVol / 100;
    purrAudio.volume = purVol / 100;

    const soundIcon = document.getElementById("sound-icon");

    // Smart Mute if ambient and purr are zeroed out in settings
    if (ambVol === 0 && purVol === 0) {
        if (soundEnabled) {
            // User manually dragged both to 0%. Clear the history so unmuting defaults to 50%
            localStorage.setItem('prevAmbientVolume', '0');
            localStorage.setItem('prevPurrVolume', '0');
        }
        soundEnabled = false;
        ambientAudio.muted = true;
        purrAudio.muted = true;
        alarmAudio.muted = true;
        for (let key in meowAudios) {
            meowAudios[key].muted = true;
        }
        if (soundIcon) soundIcon.src = "../assets/icons/soundoff-btn.png";
    } else {
        soundEnabled = true;
        ambientAudio.muted = false;
        purrAudio.muted = false;
        alarmAudio.muted = false;
        for (let key in meowAudios) {
            meowAudios[key].muted = false;
        }
        if (soundIcon) soundIcon.src = "../assets/icons/soundon-btn.png";
    }

    // Play or Pause based on strict state conditions
    if (ambVol > 0 && soundEnabled && catType !== null) {
        ambientAudio.play().catch(e => {});
    } else {
        ambientAudio.pause();
    }
    
    // Purr only plays during working time and when timer is running
    if (purVol > 0 && soundEnabled && workingTime && isRunning) {
        purrAudio.play().catch(e => {});
    } else {
        purrAudio.pause();
    }
}

// Listen for settings changes from the Settings window
window.addEventListener('storage', (e) => {
    if (['ambientVolume', 'purrVolume', 'tickSound'].includes(e.key)) {
        updateAudioSettings();
    }
});

let modalOverlay = document.getElementById("modal-overlay");
let dialogTitle = document.getElementById("dialog-title");
let dialogMessage = document.getElementById("dialog-message");
let dialogBtn = document.getElementById("dialog-btn");

function formatTime(remainingTime) {
    let minutes = Math.floor(remainingTime / 60);
    let secs = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

document.getElementById("timer-display").textContent = formatTime(remainingTime);     

let spriteTimeoutId = null;
const catSprite = document.getElementById("cat-sprite");

const clickDurations = {
    'orange_cat': 800,  // 8 frames
    'black_cat': 1200,  // 12 frames
    'tuxedo_cat': 1000  // 10 frames
};

// Chat bubble facts list
const catFacts = [
    "Cats spend 70% of their lives sleeping.",
    "A cat's purr can help heal bones and muscles.",
    "Cats have 32 muscles in each ear to control them.",
    "A cat's nose print is unique, like a fingerprint!",
    "Cats can make over 100 vocal sounds.",
    "A cat can jump up to six times its height!",
    "Cats have a third eyelid called the 'haw'!",
    "Cats are crepuscular, meaning they are most active at dawn and dusk."
];
let bubbleTimeoutId = null;
let isPetting = false;
let isShowingFact = false; // Tracks if a click-fact or welcome-fact is active so hover doesn't overwrite it


catSprite.addEventListener('click', () => {
    // Only allow interaction during break times and if not already petting
    if (workingTime || isPetting) return;

    isPetting = true;
    isShowingFact = true; // Lock fact display
    const catClass = catConfig.dbId;

    // Play corresponding companion meow sound if master audio is enabled AND click sound toggle is on
    const meowAudio = meowAudios[catClass];
    if (meowAudio && soundEnabled && localStorage.getItem('clickSound') !== 'false') {
        meowAudio.currentTime = 0; // Rewind to start for spam clicks
        meowAudio.play().catch(e => {});
    }

    // Display a random cat fact in the chat bubble
    const chatBubble = document.getElementById("chat-bubble");
    const chatText = document.getElementById("chat-text");
    if (chatBubble && chatText) {
        if (bubbleTimeoutId) clearTimeout(bubbleTimeoutId);
        
        const randomFact = catFacts[Math.floor(Math.random() * catFacts.length)];
        chatText.textContent = randomFact;
        
        // Dynamically assign theme classes (which auto-reveals the bubble by removing the hidden class)
        chatBubble.className = `chat-bubble ${catClass}`;
        
        // Hide after 3.5 seconds
        bubbleTimeoutId = setTimeout(() => {
            chatBubble.classList.add("hidden");
            isShowingFact = false; // Release fact display lock
        }, 3500);
    }

    // Shift to the click sprite
    catSprite.className = `cat-sprite ${catClass} clicking`;
    catSprite.style.backgroundImage = `url('../assets/sprites/${catClass}_click.png')`;

    // Wait exactly the length of this specific cat's animation
    const duration = clickDurations[catClass] || 1000;
    setTimeout(() => {
        // If session forcefully shifted back to work time, let updateCatState handle it
        if (workingTime) return;

        // Revert back to static and unlock
        catSprite.className = `cat-sprite ${catClass} breaking`;
        catSprite.style.backgroundImage = `url('../assets/sprites/${catClass}_static.png')`;
        isPetting = false;
    }, duration);
});

function triggerWelcomeBubble() {
    const chatBubble = document.getElementById("chat-bubble");
    const chatText = document.getElementById("chat-text");
    if (chatBubble && chatText) {
        if (bubbleTimeoutId) clearTimeout(bubbleTimeoutId);
        
        isShowingFact = true; // Lock fact display so hover doesn't overwrite it
        chatText.textContent = "Pet me for a fun fact! 🐾";
        chatBubble.className = `chat-bubble ${catConfig.dbId}`; // Solid theme style
        
        // Hide after 4 seconds
        bubbleTimeoutId = setTimeout(() => {
            chatBubble.classList.add("hidden");
            isShowingFact = false; // Release lock
        }, 4000);
    }
}

function updateCatState() {
    isPetting = false; // Release lock in case of forced state shifts
    isShowingFact = false; // Reset fact display lock
    
    // Hide chat bubble during state transitions (e.g. going back to work)
    const chatBubble = document.getElementById("chat-bubble");
    if (chatBubble) {
        chatBubble.classList.add("hidden");
    }
    if (bubbleTimeoutId) {
        clearTimeout(bubbleTimeoutId);
        bubbleTimeoutId = null;
    }
    
    const catClass = catConfig.dbId; // e.g. 'orange_cat', 'tuxedo_cat', 'black_cat'
    
    // Clear any existing animation sequence to prevent overlaps
    if (spriteTimeoutId) {
        clearTimeout(spriteTimeoutId);
        spriteTimeoutId = null;
    }
    
    if (workingTime) {
        if (!isRunning) {
            // Paused during work: just show static
            catSprite.className = `cat-sprite ${catClass} breaking`;
            catSprite.style.backgroundImage = `url('../assets/sprites/${catConfig.dbId}_static.png')`;
        } else {
            // Actively working: Sequence of work -> static -> work
            let isWorkingAnim = true;
            
            // Initial state: Working
            catSprite.className = `cat-sprite ${catClass} working`;
            catSprite.style.backgroundImage = `url('../assets/sprites/${catConfig.dbId}_work.png')`;
            
            function playSequence() {
                if (!isRunning || !workingTime) return;
                
                isWorkingAnim = !isWorkingAnim;
                if (isWorkingAnim) {
                    catSprite.className = `cat-sprite ${catClass} working`;
                    catSprite.style.backgroundImage = `url('../assets/sprites/${catConfig.dbId}_work.png')`;
                    spriteTimeoutId = setTimeout(playSequence, 2800); // Type for 2.8 seconds
                } else {
                    catSprite.className = `cat-sprite ${catClass} breaking`;
                    catSprite.style.backgroundImage = `url('../assets/sprites/${catConfig.dbId}_static.png')`;
                    spriteTimeoutId = setTimeout(playSequence, 2000); // Stop and look for 2 seconds
                }
            }
            
            // Kick off the sequence
            spriteTimeoutId = setTimeout(playSequence, 2800);
        }
    } else {
        // Break time: always static
        catSprite.className = `cat-sprite ${catClass} breaking`;
        catSprite.style.backgroundImage = `url('../assets/sprites/${catConfig.dbId}_static.png')`;
    }
}

function startTimer() {
    document.getElementById("play-icon").src = "../assets/icons/pause-btn.png";
    isRunning = true;
    updateCatState();
    updateAudioSettings();

    timerId = setInterval(() => {
        let today = new Date().getDate();
        if (today !== sessionDate.getDate()) {
            flushSessionData(false, true); // forceYesterday = true
            sessionDate = new Date();
        }

        remainingTime--;

        if (tickEnabled && soundEnabled) {
            // Skip the first 0.15 seconds of the MP3 to bypass "dead air" padding
            tickAudio.currentTime = 0.10;
            tickAudio.play().catch(e => {});
        }

        if(workingTime == true) {
            actualWork++;
        } else {
            actualBreak++;
        }

        document.getElementById("timer-display").textContent = formatTime(remainingTime);     

        if(remainingTime === 0) {
            setTimeout(() => {    
                skipTimer(true);
            }, 10)
        }
    }, 1000)
}

function skipTimer(completedCycle) {
    pauseTimer();

    if (completedCycle == true) {
        if (workingTime == true) {
            workCount++;
        } else {
            breakCount++;
        }
    }

    if (workingTime == true) {
        workingTime = false;
        updateCatState();
        const autoStartBreaks = localStorage.getItem('autoStartBreaks') === 'true';
        if (cycleCount === 3) {
            if (autoStartBreaks) {
                remainingTime = catConfig.longBreakTime;
                document.getElementById("timer-display").textContent = formatTime(remainingTime);
                startTimer();
                triggerWelcomeBubble();
            } else {
                showModal (
                    "Time for a Catnap!",
                    "Amazing work! You've earned a long, cozy rest. Step away from the screen and recharge.",
                    "Start Long Break",
                    function () {
                        remainingTime = catConfig.longBreakTime;
                        document.getElementById("timer-display").textContent = formatTime(remainingTime);
                        startTimer();
                        triggerWelcomeBubble();
                    }
                );
            }
        } else {
            if (autoStartBreaks) {
                remainingTime = catConfig.shortBreakTime;
                document.getElementById("timer-display").textContent = formatTime(remainingTime);
                startTimer();
                triggerWelcomeBubble();
            } else {
                showModal (
                    "Stretch Your Paws!",
                    "Great focus! Your companion is ready for a quick stretch and a treat.",
                    "Start Break",
                    function () {
                        remainingTime = catConfig.shortBreakTime;
                        document.getElementById("timer-display").textContent = formatTime(remainingTime);
                        startTimer();
                        triggerWelcomeBubble();
                    }
                );
            }
        }
    } else {     
        workingTime = true;
        updateCatState();
        remainingTime = catConfig.workTime;
        cycleCount++;
        
        updateSessionCounter();

        if (cycleCount === 4) {

            flushSessionData(true);

            showModal (
                "Paws-itively Brilliant!",
                `You successfully completed a full set of ${cycleCount} cycles! Your progress is logged safely. Take a bow!`,
                "Return to Menu",
                function () {
                    localStorage.removeItem('pawseDurableState');
                    returnToCatSelection();
                }
            )
            return;
        } else {
            const autoStartPomodoros = localStorage.getItem('autoStartPomodoros') === 'true';
            if (autoStartPomodoros) {
                remainingTime = catConfig.workTime;
                document.getElementById("timer-display").textContent = formatTime(remainingTime);
                startTimer();
            } else {
                showModal (
                    "Ready to Focus?",
                    `You’ve completed ${cycleCount} cycle(s) so far! Let's keep the momentum going.`,
                    "Start Work",
                    function () {
                        remainingTime = catConfig.workTime;
                        document.getElementById("timer-display").textContent = formatTime(remainingTime);
                        startTimer();
                    }
                ); 
            }
        }
    }
}

function pauseTimer() {
    clearInterval(timerId);
    document.getElementById("play-icon").src = "../assets/icons/play-btn.png";
    isRunning = false;
    updateCatState();
    updateAudioSettings();
}

function soundControl() {
    clearInterval(timerId);
}

let soundButton = document.getElementById("sound-btn");
let playButton = document.getElementById("play-btn");
let skipButton = document.getElementById("skip-btn");

soundButton.addEventListener("click", () => {
    const soundIcon = document.getElementById("sound-icon");
    if(soundEnabled) {
        // Remember volumes before muting
        let currentAmb = localStorage.getItem('ambientVolume') || '50';
        let currentPurr = localStorage.getItem('purrVolume') || '50';
        localStorage.setItem('prevAmbientVolume', currentAmb);
        localStorage.setItem('prevPurrVolume', currentPurr);

        soundEnabled = false;
        soundIcon.src = "../assets/icons/soundoff-btn.png";
        ambientAudio.muted = true;
        purrAudio.muted = true;

        // Force settings UI to visually drop to 0 / Off for ambient and purr only
        localStorage.setItem('ambientVolume', '0');
        localStorage.setItem('purrVolume', '0');
    }else{
        soundEnabled = true;
        soundIcon.src = "../assets/icons/soundon-btn.png";
        ambientAudio.muted = false;
        purrAudio.muted = false;

        // Restore previous volumes
        let prevAmbVol = parseInt(localStorage.getItem('prevAmbientVolume'));
        let prevPurrVol = parseInt(localStorage.getItem('prevPurrVolume'));
        
        if (isNaN(prevAmbVol)) prevAmbVol = 0;
        if (isNaN(prevPurrVol)) prevPurrVol = 0;

        // If they muted while both were 0, unmuting should set to 50% baseline
        if (prevAmbVol === 0 && prevPurrVol === 0) {
            prevAmbVol = 50;
            prevPurrVol = 50;
        }

        localStorage.setItem('ambientVolume', prevAmbVol.toString());
        localStorage.setItem('purrVolume', prevPurrVol.toString());

        updateAudioSettings(); // Re-apply everything
    }
});

playButton.addEventListener("click", () => {
    if (strictMode) return;
    if(isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }   
});

const strictMode = localStorage.getItem('strictMode') === 'true';
if (strictMode) {
    skipButton.disabled = true;
    skipButton.style.opacity = "0.5";
    skipButton.style.cursor = "not-allowed";

    playButton.disabled = true;
    playButton.style.opacity = "0.5";
    playButton.style.cursor = "not-allowed";
}

skipButton.addEventListener("click", () => {
    if (strictMode) return;
    skipTimer(false);
});

function updateSessionCounter() {
    const fishIcons = document.querySelectorAll(".fish-icon");
    const catPrefix = catConfig.dbId.replace('_cat', ''); // orange, tuxedo, black

    fishIcons.forEach((fish, index) => {
        if(index < cycleCount) {
            fish.classList.add("active");
            fish.style.backgroundImage = `url('../assets/icons/completed-${catPrefix}-fish.png')`;
        } else {
            fish.classList.remove("active");
            fish.style.backgroundImage = `url('../assets/icons/uncompleted-fish.png')`;
        }
    });
};

function showModal(title, message, btnText, nextAction) {
    const isMiniMode = document.body.classList.contains("timer-only-mode") || document.body.classList.contains("cat-only-mode");

    if (isMiniMode) {
        // If the session completes or a full Pomodoro cycle finishes, restore the window size
        if (title === "Session Complete!" || title === "Paws-itively Brilliant!") {
            document.body.classList.remove("timer-only-mode", "cat-only-mode");
            window.mainAPI.resize('default');
        }
        nextAction();
        return;
    }

    dialogTitle.innerText = title;
    dialogMessage.innerText = message;
    dialogBtn.innerText = btnText;   

    modalOverlay.classList.remove("hidden");
    
    // Start playing the alarm on a loop if the user has it enabled in Settings AND master sound is ON
    if (localStorage.getItem('alarmSound') !== 'false' && soundEnabled) {
        alarmAudio.play().catch(e => {});
    }

    dialogBtn.onclick = function() {
        // Stop the alarm when the user proceeds
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        
        modalOverlay.classList.add("hidden");
        nextAction();
    }
}

let resizeModal = document.getElementById("resize-modal-overlay");

if (resizeModal !== null) {
    resizeModal.addEventListener("click", function(event) {
        if (event.target === resizeModal) {
            resizeModal.classList.add("hidden");
        }
    });   
}

let timerOnlyButton = document.getElementById("timer-only");
let catOnlyButton = document.getElementById("cat-only");

if (timerOnlyButton !== null) {
    timerOnlyButton.onclick = function() {
        resizeModal.classList.add("hidden");
        document.body.classList.add("timer-only-mode");
        window.mainAPI.resize('timer-only');
    }

    catOnlyButton.onclick = function() {
        resizeModal.classList.add("hidden");
        document.body.classList.add("cat-only-mode");
        window.mainAPI.resize('cat-only');
    }
}


let restoreBtn = document.getElementById("restore-btn");
if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
        document.body.classList.remove("timer-only-mode", "cat-only-mode");
        window.mainAPI.resize('default');
    });
}

// --- HOME MODAL HANDLERS ---
let homeCancelBtn = document.getElementById('home-cancel-btn');
if (homeCancelBtn) {
    homeCancelBtn.onclick = function() {
        document.getElementById('home-modal-overlay').classList.add('hidden');
    }
}

let homeConfirmBtn = document.getElementById('home-confirm-btn');
if (homeConfirmBtn) {
    homeConfirmBtn.onclick = function() {
        flushSessionData(false);
        localStorage.removeItem('pawseDurableState');
        returnToCatSelection();
    }
}

function returnToCatSelection() {
    localStorage.removeItem('pawseDurableState');
    localStorage.setItem('timerRunning', 'false');
    
    if (timerId) clearInterval(timerId);
    if (durableSaveInterval) clearInterval(durableSaveInterval);
    
    ambientAudio.pause();
    purrAudio.pause();
    alarmAudio.pause();
    for (let key in meowAudios) {
        meowAudios[key].pause();
    }
    
    document.getElementById('home-modal-overlay').classList.add('hidden');
    document.querySelector('.timer-content').style.display = 'none';
    document.querySelector('.main-content').style.display = 'block';
    
    document.getElementById('home-btn').style.display = 'none';
    document.getElementById('resize-btn').style.display = 'none';
    document.getElementById('back-btn').style.display = 'block';
    document.getElementById('close-btn').style.display = 'none';
    
    document.body.classList.remove("timer-only-mode", "cat-only-mode");
    if (window.mainAPI && window.mainAPI.resize) {
        window.mainAPI.resize('default');
    }
}
