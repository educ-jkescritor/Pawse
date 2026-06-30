let remainingTime = 15 * 60;
let workingTime = true;
let cycleCount = 0;
let soundEnabled = true;

function formatTime(remainingTime) {
    let minutes = Math.floor(remainingTime / 60);
    let secs = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    let timerId = setInterval(() => {
        remainingTime--;
        document.getElementById("orange_timer").textContent = formatTime(remainingTime);
        
        if(remainingTime === 0) {
            clearInterval(timerId);
            setTimeout(() => {
                if(workingTime == true) { 
                    workingTime = false;
                    if(cycleCount === 3) {
                        remainingTime = 12 * 60;
                        window.alert(`Time for a break! Here is a long break.`);
                    }else{
                        remainingTime = 3 * 60;
                        window.alert(`Time for a break! Here is a short break.`);
                    }                    
                }else if(workingTime == false) {
                    workingTime = true;                 
                    cycleCount++;
                    if(cycleCount === 4) {
                        window.alert(`You have completed ${cycleCount} cycles! Back to the main menu.`);
                        window.location.replace("../../index.html");
                        return;
                    }else{
                        remainingTime = 15 * 60;    
                        window.alert(`Back to work! You have completed ${cycleCount} cycle(s)! Keep going!`); 
                    }
                }
                startTimer();
            }, 10)
        }
    }, 1000)
}

startTimer();