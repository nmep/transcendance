document.addEventListener("click", (e) => {
    const { target } = e;

    console.log("🖱 Click détecté sur :", target); // 🔥 Debugging

    // Vérifie que l'élément cliqué est un lien de la navigation
    if (!target.matches("nav a")) {
        return;
    }

    // Empêche le comportement par défaut du lien
    e.preventDefault();

    console.log("📌 Lien intercepté :", target.href); // 🔥 Debugging

    // Met à jour l'URL sans recharger la page
    window.history.pushState({}, target.href, target.href);
  
    // Appelle la fonction pour gérer la localisation
    urlLocationHandler();
});


  // L'objet des routes avec les templates associés
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
    "/azer": {
        template: "/templates/azer.html",
        title: "Azer",
        description: "En savoir plus sur Azer."
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
        description: "Parametre de votre profil."
    }
};


function getUserInfo() {
    fetch("http://localhost:8000/api/auth/whoami", { credentials: "include" })
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

    // Pour l'avatar : user.image.link
    if (user.image && user.image.link) {
        document.getElementById("user-avatar").src = user.image.link;
    }
}


async function urlLocationHandler() {
    let location = window.location.pathname;
    if (location === "/") {
        location = "/home";
    }

    const route = urlRoutes[location] || urlRoutes[404];
    const response = await fetch(route.template);
    const html = await response.text();
    document.getElementById("content").innerHTML = html;
    const authButtons = document.getElementById("auth-buttons");

    // 📌 Maintenant que le HTML est injecté, on gère l'utilisateur
    if (location === "/profile") {
        const savedUser = localStorage.getItem("user_info");
        if (savedUser) {
            displayUserInfo(JSON.parse(savedUser));
            const userObj = JSON.parse(savedUser);
            showAuthenticated(authButtons, userObj);
        } else {
            getUserInfo();  // fera displayUserInfo() quand il a la réponse
        }
    }
    else if (location === "/settings") {
		fetch("http://localhost:8000/api/auth/tfa_status", {
			credentials: "include"
		  })
		  .then(response => {
			  if (!response.ok) {
				  throw new Error(`HTTP error ${response.status}`);
			  }
			  return response.json();
		  })
		  .then(data => {
			  console.log("Statut 2FA :", data);
			  if (data.enabled) {
				  console.log("L'utilisateur a déjà la 2FA activée → bouton 'Désactiver'");
				  // Afficher un bouton "Désactiver la 2FA"
			  } else {
				  console.log("L'utilisateur n'a pas la 2FA → bouton 'Activer'");
				  // Afficher un bouton "Activer la 2FA"
			  }
		  })
		  .catch(error => console.error("Erreur statut TFA :", error));
    }
}
  // Appelle urlLocationHandler au chargement de la page pour charger le bon contenu
  window.addEventListener("load", urlLocationHandler);

  // Permet de gérer le retour en arrière ou l'avant dans l'historique du navigateur
  window.addEventListener("popstate", urlLocationHandler);
  