document.addEventListener("DOMContentLoaded", () => {
    const authButtons = document.getElementById("auth-buttons");

    console.log("📡 Vérification de l'utilisateur...");

    const localUser = localStorage.getItem("user_info");
    if (localUser) {
        // ✅ On a déjà un user stocké, on l'affiche
        console.log("🎯 user_info trouvé dans localStorage");
        const userObj = JSON.parse(localUser);
        console.log("local storage a ete detecte, userObj = ", userObj)
        showAuthenticated(authButtons, userObj);
    } else {
        
        fetch("http://localhost:8000/api/auth/user", {
            method: "GET",
            credentials: "include"  // 🔥 Important pour envoyer les cookies
        })
        .then(response => response.json())
        .then(data => {
            console.log("✅ Réponse de l'API:", data);

            if (data.username) {
                authButtons.innerHTML = `
                    <li><span class="dropdown-item">Hello, ${data.username}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger" id="logout-btn">Logout</button></li>
                `;
                document.getElementById("logout-btn").addEventListener("click", logout);
            } else {
                console.log("🚨 Utilisateur non connecté, affichage de Login/Register");
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
    authButtons.innerHTML = `
        <li><span class="dropdown-item">Hello, ${user.username}</span></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="/profile">Profile</a></li>
        <li><button class="dropdown-item text-danger" id="logout-btn">Logout</button></li>
    `;
    // Ajouter le listener sur le bouton logout
    document.getElementById("logout-btn").addEventListener("click", logout);
}

function loginWith42() {
    console.log("🔄 Redirection vers l'authentification 42...");
    window.location.href = "http://localhost:8000/api/auth/remote";
}

function login() {
    fetch("http://localhost:8000/api/auth/login", {
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
    fetch("http://localhost:8000/api/auth/register", {
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
    console.log("fonction de deconnexion")
    fetch("http://localhost:8000/api/auth/logout", { 
        method: "POST",
        credentials: "include" // 🔥 Envoie les cookies pour permettre Django de supprimer la session
    })
    .then(response => {
        if (response.ok) {
            console.log("✅ Déconnexion réussie !");
            
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