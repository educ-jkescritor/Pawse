let orangeButton = document.getElementById("orange_cat");
orangeButton.onclick = function orangeScreen() {
    window.location.assign("timer/timer.html?cat=orange");
}

let tuxedoButton = document.getElementById("tuxedo_cat");
tuxedoButton.onclick = function tuxedoScreen() {
    window.location.assign("timer/timer.html?cat=tuxedo");
}

let blackButton = document.getElementById("black_cat");
blackButton.onclick = function blackScreen() {
    window.location.assign("timer/timer.html?cat=black");
}