document.addEventListener("DOMContentLoaded", () => {
    const authButtons = document.getElementById("auth-buttons");

    console.log("📡 Vérification de l'utilisateur...");

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
});

// function loginWith42() {
//     console.log("📡 Vérification de l'authentification via 42...");

//     fetch("http://localhost:8000/api/auth/remote", {
//         method: "GET",
//         credentials: "include"  // 🔥 Nécessaire pour envoyer les cookies
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error("Erreur lors de la récupération des informations utilisateur");
//         }
//         return response.json();
//     })
//     .then(userInfo => {
//         console.log("✅ Informations utilisateur reçues :", userInfo);

//         if (userInfo) {  // Vérification que les données existent
//             // 🔥 Stocker **toutes** les infos utilisateur dans localStorage
//             localStorage.setItem("user_info", JSON.stringify(userInfo));

//             // 🔄 Redirection vers la page d'accueil ou le dashboard
//             window.location.href = "/dashboard";
//         } else {
//             console.error("❌ Échec de la connexion via 42");
//             alert("Échec de la connexion via 42. Veuillez réessayer.");
//         }
//     })
//     .catch(error => {
//         console.error("❌ Erreur lors de la connexion :", error);
//         alert("Une erreur est survenue lors de la connexion.");
//     });
// }

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
    fetch("http://localhost:8000/api/auth/logout", { 
        method: "POST",
        credentials: "include" // 🔥 Envoie les cookies pour permettre Django de supprimer la session
    })
    .then(response => {
        if (response.ok) {
            console.log("✅ Déconnexion réussie !");
            
            // 🔥 Supprimer manuellement les cookies
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