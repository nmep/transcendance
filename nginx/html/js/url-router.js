import { startGame, stopGame, resetGameState } from '/pong.js';
import { startGame4, stopGame4, resetGameState4 } from '/pong4.js';
import { PongTournament } from '/tournament.js'; // Adjust path as needed
/*******************************
 * URL Routes Mapping
 *******************************/
const urlRoutes = {
    404: {
        template: "/templates/404.html",
        title: "Page non trouvée",
        description: "La page que vous recherchez n'existe pas."
    },
    "/home": {
        template: "/templates/home.html",
        title: "Accueil",
        description: "Bienvenue sur la page d'accueil."
    },
    "/games": {
        template: "/templates/games.html",
        title: "Jeux",
        description: "Découvrez nos jeux."
    },
    "/login": {
        template: "/templates/login.html",
        title: "Connexion",
        description: "Connectez-vous à votre compte Transcendance."
    },
    "/register": {
        template: "/templates/register.html",
        title: "Inscription",
        description: "Créez un compte pour jouer à Transcendance."
    },
    "/profile": {
        template: "/templates/profile.html",
        title: "Profil",
        description: "Détails de votre profil."
    },
    "/settings": {
        template: "/templates/settings.html",
        title: "settings",
        description: "Paramètre de votre profil."
    },
    "/pong": {
        template: "/templates/pong.html",
        title: "pong",
        description: "Petite partie de pong en toute détente."
    },
    "/pong4": {
        template: "/templates/pong4.html",
        title: "pong4",
        description: "Petite partie de pong à 4 oklm."
    },
    "/tournament": {
        template: "/templates/tournament.html",
        title: "tournament",
        description: "Tournoi de pong."
    }
};

/*******************************
 * Navigation Click Handler
 *******************************/
document.addEventListener("click", handleDocumentClick);

function handleDocumentClick(e) {
    const clickedElement = e.target;
    console.log("🖱 Click détecté sur :", clickedElement); // Debugging

    // Only act on navigation links or the toggle button
    if (!clickedElement.matches("nav a") && !clickedElement.matches("toggleCanvasBtn")) {
        return;
    }

    // For navigation links (ignoring the toggle button)
    if (!clickedElement.matches("toggleCanvasBtn")) {
        e.preventDefault();
        console.log("📌 Lien intercepté :", clickedElement.href);
        window.history.pushState({}, clickedElement.href, clickedElement.href);
        urlLocationHandler();
    }
}


/*******************************
 * User Information Handlers
 *******************************/
function getUserInfo() {
    fetch("/api/auth/whoami", { credentials: "include" })
        .then(response => response.json())
        .then(data => {
            if (data && !data.error) {
                localStorage.setItem("user_info", JSON.stringify(data));
                displayUserInfo(data);
            }
        })
        .catch(error => console.error("❌ Erreur récupération utilisateur :", error));
}

function displayUserInfo(user) {
    document.getElementById("user-login").textContent = user.login;
    document.getElementById("full-name").textContent = user.usual_full_name;
    document.getElementById("location").textContent = user.location;
    document.getElementById("user-id").textContent = user.id;
    document.getElementById("user-email").textContent = user.email;

    if (user.campus && user.campus.length > 0) {
        document.getElementById("user-campus").textContent = user.campus[0].name;
    }

    // Pour l'avatar (si défini)
    if (user.image && user.image.link) {
        document.getElementById("user-avatar").src = user.image.link;
    }
}

/*******************************
 * URL Location Handler
 *******************************/
async function urlLocationHandler() {
    // Remove game
    document.getElementById('webgl').style.display = 'none';
    document.getElementById('webgl4').style.display = 'none';
    // Determine current location, defaulting "/" to "/home"
    let location = window.location.pathname;
    if (location === "/") {
        location = "/home";
    }
    // Fetch and inject the template HTML
    const route = urlRoutes[location] || urlRoutes[404];
    const response = await fetch(route.template);
    const html = await response.text();
    document.getElementById("content").innerHTML = html;

    stopGame();
    resetGameState();
    stopGame4();
    resetGameState4();
    // Additional behavior based on route
    switch (location) {
        case "/profile":
            handleProfileAuthentication();
            break;
        case "/pong":
            initializePongButton();
            break;
        case "/tournament":
            setupTournamentPage();
            break;
        case "/pong4":
            initializePongButton4();
            break;
    }
}


function initializePongButton() {
    // Add a "Launch Game" button if not already present
    const launchBtn = document.getElementById('launchGameBtn') || createLaunchButton();
    // Optionally bind the button event
    launchBtn.addEventListener('click', () => {
        startGame();
        launchBtn.style.display = 'none'; // Hide once game is running
    });
}

function initializePongButton4() {
    // Add a "Launch Game" button if not already present
    const launchBtn = document.getElementById('launchGameBtn4') || createLaunchButton4();
    // Optionally bind the button event
    launchBtn.addEventListener('click', () => {
        startGame4();
        launchBtn.style.display = 'none'; // Hide once game is running
    });
}

function setupTournamentPage() {
    const tournament = new PongTournament(
        '#playerForm',
        '#launchTournament',
        '#resetTournament',
        '#matchInfo',
        '#roundDetails',
        '#matchDetails',
        '#tournamentResult',
        '#lastWinnerDetails'
    );
}

function createLaunchButton() {
    const btn = document.createElement('a');
    btn.id = 'launchGameBtn';
    btn.textContent = 'Launch Game';
    btn.className = 'btn btn-primary'
    document.getElementById('content').appendChild(btn);
    return btn;
}

function createLaunchButton4() {
    const btn = document.createElement('a');
    btn.id = 'launchGameBtn4';
    btn.textContent = 'Launch Game';
    btn.className = 'btn btn-primary'
    document.getElementById('content').appendChild(btn);
    return btn;
}

/**
 * Handle profile page authentication: display user information and adjust UI.
 */
function handleProfileAuthentication() {
    const authButtons = document.getElementById("auth-buttons");
    const savedUser = localStorage.getItem("user_info");

    if (savedUser) {
        const userObj = JSON.parse(savedUser);
        displayUserInfo(userObj);
        // Ensure showAuthenticated is defined elsewhere
        showAuthenticated(authButtons, userObj);
    } else {
        getUserInfo();
    }
}

/*******************************
 * Window Event Listeners
 *******************************/
window.addEventListener("load", urlLocationHandler);
window.addEventListener("popstate", urlLocationHandler);
