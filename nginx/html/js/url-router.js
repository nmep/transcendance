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
    }
};

// AJOUTER LA FONCTION GETUSER INFO DANS UN JS OU TESTER DIRECT SUR HTML

function getUserInfo() {
    fetch("http://localhost:8000/api/auth/whoami", { credentials: "include" })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Infos utilisateur :", data);
        if (data && !data.error) {
            document.getElementById("username").textContent = data.login;
        }
    });
}

  // Fonction pour gérer la localisation et charger le template approprié
  const urlLocationHandler = async () => {
    let location = window.location.pathname;

    // Assure que la page d'accueil soit bien chargée
    if (location === "/") {
        location = "/home";  // 🔥 On mappe le chemin root (/) vers la page d'accueil
    }

    console.log("🔍 URL demandée :", location); // 🔥 Debugging

    const route = urlRoutes[location] || urlRoutes[404];
    console.log("📂 Tentative de chargement :", route.template);

    try {
        const response = await fetch(route.template);
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        const html = await response.text();
        document.getElementById("content").innerHTML = html; // Injection du contenu

		  // 📌 Si tu veux exécuter du code quand "/profile" est chargé :
	    if (location === "/profile") {
			console.log("PAGE PROFIL DETECTE REQUETE SUR WHOAMI")
		    getUserInfo(); // Appel direct
		}
    } catch (error) {
        console.error("❌ Erreur lors du chargement du template :", error);
    }
};
  // Appelle urlLocationHandler au chargement de la page pour charger le bon contenu
  window.addEventListener("load", urlLocationHandler);

  // Permet de gérer le retour en arrière ou l'avant dans l'historique du navigateur
  window.addEventListener("popstate", urlLocationHandler);
  