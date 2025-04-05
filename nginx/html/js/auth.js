document.addEventListener("DOMContentLoaded", () => {
    const authButtons = document.getElementById("auth-buttons");

    const localUser = localStorage.getItem("user_info");
    if (localUser) {
        // ✅ On a déjà un user stocké, on l'affiche
        const userObj = JSON.parse(localUser);
        showAuthenticated(authButtons, userObj);
    } else {

        fetch("/api/auth/user", {
            method: "GET",
            credentials: "include"  // 🔥 Important pour envoyer les cookies
        })
            .then(response => response.json())
            .then(data => {
                if (data.username) {
                    authButtons.innerHTML = `
                    <li><span class="dropdown-item">Hello, ${data.username}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="/settings">Settings</a></li>
                    <li><button class="dropdown-item text-danger" id="logout-btn">Logout</button></li>

                `;
                    document.getElementById("logout-btn").addEventListener("click", logout);
                } else {
                    authButtons.innerHTML = `
                    <li><a class="dropdown-item" href="/login">Login</a></li>
                    <li><a class="dropdown-item" href="/register">Register</a></li>
                `;
                }
            })
            .catch(error => console.error("❌ Erreur lors de la récupération de l'utilisateur :", error));
    }
});

// 🔥 Afficher le menu quand on est connecté
function showAuthenticated(authButtons, user) {
    console.log("user info = ", user)
    authButtons.innerHTML = `
        <li><span class="dropdown-item">Hello, ${user.first_name}</span></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="/profile">Profile</a></li>
        <li><button class="dropdown-item text-danger" id="logout-btn">Logout</button></li>
    `;
    // Ajouter le listener sur le bouton logout
    document.getElementById("logout-btn").addEventListener("click", logout);
}

function loginWith42() {
    window.location.href = "http://localhost:8000/api/auth/remote";
}

function login() {
    fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "testUser", password: "password123" })
    })
        .then(response => response.json())
        .then(data => {
            if (data.token) {
                localStorage.setItem("user", data.username);
                location.reload();
            }
        });
}

function register() {
    fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "newUser", password: "password123" })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                login();
            }
        });
}

// 🔥 Fonction de logout qui supprime la session côté serveur
function logout() {
    fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
    })
        .then(response => {
            if (response.ok) {

                // 🔥 Supprimer manuellement les cookies
                localStorage.removeItem("user_info");
                document.cookie = "sessionid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;";
                document.cookie = "csrftoken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;";

                // 🔄 Redirection vers la page d'accueil
                window.location.href = "/";
            } else {
                console.error("❌ Erreur lors de la déconnexion !");
            }
        })
        .catch(error => console.error("❌ Erreur de requête :", error));
}

// 1) Fonction pour récupérer un cookie par nom
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// 2) Appel fetch en incluant le token
function unregisterAccount() {
    if (!confirm("Voulez-vous vraiment supprimer votre compte ?")) {
        return;
    }

    // Récupérer le token dans le cookie nommé "csrftoken"
    const csrftoken = getCookie("csrftoken");

    fetch("/api/auth/unregister", {
        method: "POST", // ou "POST", selon ce que ta vue attend
        credentials: "include",
        headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Content-Type": "application/json"
        }
    })

        .then(response => {
            if (!response.ok) {
                throw new Error("Erreur lors de la suppression du compte");
            }
            alert("Compte supprimé avec succès !");
            window.location.href = "/";
        })
        .catch(error => alert(error));
}

function registerUser() {
    // Récupérer les valeurs des champs
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Envoyer les données via fetch en POST
    fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Redirection vers la page de login en cas de succès
                window.location.href = "/login";
            } else {
                alert("Erreur d'inscription : " + data.message);
            }
        })
        .catch(error => console.error("Erreur lors de l'inscription :", error));
}