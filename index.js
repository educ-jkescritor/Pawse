if (localStorage.getItem('alwaysOnTop') === 'true') {
    if (window.mainAPI && window.mainAPI.setAlwaysOnTop) {
        window.mainAPI.setAlwaysOnTop(true);
    }
}

let selectedCat = null;

let orangeButton = document.getElementById("orange_cat");
orangeButton.onclick = function () {
    selectedCat = "orange";
}

let tuxedoButton = document.getElementById("tuxedo_cat");
tuxedoButton.onclick = function () {
    selectedCat = "tuxedo";
}

let blackButton = document.getElementById("black_cat");
blackButton.onclick = function () {
    selectedCat = "black";
}

let confirmButton = document.querySelector(".confirmation_button");
confirmButton.onclick = function () {
    if (selectedCat) {
        window.location.assign(`timer/timer.html?cat=${selectedCat}`);
    }
}