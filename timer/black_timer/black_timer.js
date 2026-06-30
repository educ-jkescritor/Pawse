let remainingTime = 50 * 60;
let workingTime = true;
let cycleCount = 0;

function formatTime(remainingTime) {
    let minutes = Math.floor(remainingTime / 60);
    let secs = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer() {
    let timerId = setInterval(() => {
        remainingTime--;
        document.getElementById("black_timer").textContent = formatTime(remainingTime);
        
        if(remainingTime === 0) {
            clearInterval(timerId);
            setTimeout(() => {
                if(workingTime == true) { 
                    workingTime = false;
                    if(cycleCount === 3) {
                        remainingTime = 40 * 60;
                        window.alert(`Time for a break! Here is a long break.`);
                    }else{
                        remainingTime = 10 * 60;
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
                        remainingTime = 50 * 60;    
                        window.alert(`Back to work! You have completed ${cycleCount} cycle(s)! Keep going!`); 
                    }
                }
                startTimer();
            }, 10)
        }
    }, 1000)
}

startTimer();