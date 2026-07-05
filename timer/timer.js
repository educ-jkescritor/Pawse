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

const urlParams = new URLSearchParams(window.location.search);
const catType = urlParams.get('cat');
const catConfig = catConfiguration[catType];

let remainingTime = catConfig.workTime;
let workingTime = true;
let cycleCount = 0;
let timerId = null;
let isRunning = true;
let soundEnabled = true;
let actualWork = 0; 
let actualBreak = 0;
let workCount = 0;
let breakCount = 0;

// Initialize Ambient Audio
const ambientAudio = new Audio('../assets/sounds/ambient.mp3');
ambientAudio.loop = true;

const savedAmbientVolume = localStorage.getItem('ambientVolume');
const ambientVol = savedAmbientVolume !== null ? parseInt(savedAmbientVolume) : 50;

if (ambientVol > 0) {
    ambientAudio.volume = ambientVol / 100;
    ambientAudio.play().catch(e => console.log("Autoplay blocked:", e));
}

// Initialize Tick Audio
const tickAudio = new Audio('../assets/sounds/tick.mp3');
let tickEnabled = localStorage.getItem('tickSound') === 'true';

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

function updateCatState() {
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

    timerId = setInterval(() => {
        remainingTime--;

        if (tickEnabled && soundEnabled) {
            // Skip the first 0.15 seconds of the MP3 to bypass "dead air" padding
            tickAudio.currentTime = 0.10;
            tickAudio.play().catch(e => console.log("Tick blocked:", e));
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
            } else {
                showModal (
                    "Long Break Time!",
                    "Time for a long break!",
                    "Start Break",
                    function () {
                        remainingTime = catConfig.longBreakTime;
                        document.getElementById("timer-display").textContent = formatTime(remainingTime);
                        startTimer();
                    }
                );
            }
        } else {
            if (autoStartBreaks) {
                remainingTime = catConfig.shortBreakTime;
                document.getElementById("timer-display").textContent = formatTime(remainingTime);
                startTimer();
            } else {
                showModal (
                    "Short Break Time!",
                    "Time for a short break!",
                    "Start Break",
                    function () {
                        remainingTime = catConfig.shortBreakTime;
                        document.getElementById("timer-display").textContent = formatTime(remainingTime);
                        startTimer();
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

            let sessionData = {
                cat_type: catConfig.dbId,
                total_work_seconds: actualWork,
                total_break_seconds: actualBreak,
                total_work: workCount,
                total_break: breakCount,
                total_pomodoro: 1
            }

            window.mainAPI.savesession(sessionData);

            showModal (
                "Session Complete!",
                `You have completed ${cycleCount} cycles! Back to the main menu.`,
                "Back to Main Menu",
                function () {
                    window.location.replace("../index.html");
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
                    "Back to Work!",
                    `Back to work! You have completed ${cycleCount} cycle(s)! Keep going!`,
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
}

function soundControl() {
    clearInterval(timerId);
}

startTimer();

let soundButton = document.getElementById("sound-btn");
let playButton = document.getElementById("play-btn");
let skipButton = document.getElementById("skip-btn");

soundButton.addEventListener("click", () => {
    const soundIcon = document.getElementById("sound-icon");
    if(soundEnabled) {
        soundEnabled = false;
        soundIcon.src = "../assets/icons/soundoff-btn.png";
        ambientAudio.muted = true;
    }else{
        soundEnabled = true;
        soundIcon.src = "../assets/icons/soundon-btn.png";
        ambientAudio.muted = false;
    }
});

playButton.addEventListener("click", () => {
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
}

skipButton.addEventListener("click", () => {
    if (strictMode) return;
    skipTimer(false);
});

function updateSessionCounter() {
    const fishIcons = document.querySelectorAll(".fish-icon");

    fishIcons.forEach((fish, index) => {
        if(index < cycleCount) {
            fish.classList.add("active");
        } else {
            fish.classList.remove("active");
        }
    });
};

function showModal(title, message, btnText, nextAction) {
    const isMiniMode = document.body.classList.contains("timer-only-mode") || document.body.classList.contains("cat-only-mode");

    if (isMiniMode) {
        // If the session completes, we must restore the window size before returning to the main menu
        if (title === "Session Complete!") {
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

    dialogBtn.onclick = function() {
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