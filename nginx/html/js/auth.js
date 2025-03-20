document.addEventListener("DOMContentLoaded", () => {
    const authButtons = document.getElementById("auth-buttons");

    const localUser = localStorage.getItem("user_info");
    if (localUser) {
        // ✅ On a déjà un user stocké, on l'affiche
        const userObj = JSON.parse(localUser);
        showAuthenticated(authButtons, userObj);
    } else {
        
        fetch("http://localhost:8000/api/auth/user", {
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

function unregister() {
    if (confirm("Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.")) {
        // Appel d'API pour supprimer le compte
        fetch("http://localhost:8000/api/auth/unsubscribe", {
          method: "DELETE",
          credentials: "include"
        })
        .then(resp => {
          if (resp.ok) {
            alert("Votre compte a été supprimé avec succès.");
            // Redirection ou logout
            window.location.href = "/";
          } else {
            alert("Erreur lors de la suppression du compte.");
          }
        });
      }
}

// 🔥 Fonction de logout qui supprime la session côté serveur
function logout() {
    fetch("http://localhost:8000/api/auth/logout", { 
        method: "POST",
        credentials: "include" // 🔥 Envoie les cookies pour permettre Django de supprimer la session
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

function disable_2fa() {
    window.location.href = "http://localhost:8000/account/two_factor/disable/"
}