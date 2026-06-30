let remainingTime = 25 * 60;
let workingTime = true;
let cycleCount = 0;
let timerId = null;
let isRunning = true;
let soundEnabled = true;
let actualWork = 0; 
let actualBreak = 0;
let workCount = 0;
let breakCount = 0;

function formatTime(remainingTime) {
    let minutes = Math.floor(remainingTime / 60);
    let secs = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    timerId = setInterval(() => {
        remainingTime--;

        if(workingTime == true) {
            actualWork++;
        } else {
            actualBreak++;
        }

        document.getElementById("tuxedo_timer").textContent = formatTime(remainingTime);        
        if(remainingTime === 0) {
            setTimeout(() => {    
                skipTimer(true);
            }, 10)
        }
    }, 1000)
}

function skipTimer(completedCycle) {
    clearInterval(timerId);

    if (completedCycle == true) {
        if (workingTime == true) {
            workCount++;
        } else {
            breakCount++;
        }
    }

    if (workingTime == true) {
        workingTime = false;
        if (cycleCount === 3) {
            window.alert("Time for a long break!");
            remainingTime = 20 * 60;
        } else {
            window.alert("Time for a short break!");
            remainingTime = 5 * 60;

        }
    } else {     
        workingTime = true;
        remainingTime = 25 * 60;
        cycleCount++;
        
        updateSessionCounter();

        if (cycleCount === 4) {

            let sessionData = {
                cat_type: 'tuxedo_cat',
                total_work_seconds: actualWork,
                total_break_seconds: actualBreak,
                total_work: workCount,
                total_break: breakCount,
                total_pomodoro: 1
            }

            window.mainAPI.savesession(sessionData);

            window.alert(`You have completed ${cycleCount} cycles! Back to the main menu.`);
            window.location.replace("../../index.html");

            return;
        } else {
            window.alert(`Back to work! You have completed ${cycleCount} cycle(s)! Keep going!`); 
        }
    }
    document.getElementById("tuxedo_timer").textContent = formatTime(remainingTime);
    startTimer();
    playButton.textContent = "PAUSE";
    isRunning = true;   
}

function pauseTimer() {
    clearInterval(timerId);
}

function soundControl() {
    clearInterval(timerId);
}

startTimer();

let soundButton = document.getElementById("sound-btn");
let playButton = document.getElementById("play-btn");
let skipButton = document.getElementById("skip-btn");

soundButton.addEventListener("click", () => {
    if(soundEnabled) {
        soundEnabled = false;
        soundButton.textContent = "SOUND: OFF";
    }else{
        soundEnabled = true;
        soundButton.textContent = "SOUND: ON";
    }
});

playButton.addEventListener("click", () => {
    if(isRunning) {
        pauseTimer();
        playButton.textContent = "PLAY";
        isRunning = false;
    }else{
        startTimer();
        playButton.textContent = "PAUSE";
        isRunning = true;
    }   
});

skipButton.addEventListener("click", () => {
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