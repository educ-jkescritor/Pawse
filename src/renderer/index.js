if (localStorage.getItem('alwaysOnTop') === 'true') {
    if (window.mainAPI && window.mainAPI.setAlwaysOnTop) {
        window.mainAPI.setAlwaysOnTop(true);
    }
}

const savedUser = localStorage.getItem('currentUser');

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
        window.location.assign(`timer/timer.html?cat=${selectedCat}`);
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