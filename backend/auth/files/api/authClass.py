from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.http import JsonResponse
from requests_oauthlib import OAuth2Session
import requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
import json

from django_otp import devices_for_user
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

# faire une classe qui a des fonctions pour lauthentification

# login

client_id = "u-s4t2ud-4db2df15929bada32b77ef1c2ec8086e2d7ff1de72baf9d32a9edcb00ab5f8a0"
client_secret = "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"

class authManager:
    @staticmethod
    def login_user(request, username, password):
        if username == None:
            return JsonResponse({"success": False, "message":"Username is not defined"})
        elif password == None:
            return JsonResponse({"success": False, "message":"Password is not defined"})

        user = authenticate(request, username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            login(request, user)
            return JsonResponse({
                "success": True,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return JsonResponse({"success": False, "message":"login or password is not recognize"})

    @staticmethod
    def register_user(request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "message": "Invalid JSON"}, status=400)

        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not username:
            return JsonResponse({"success": False, "message": "Username is not defined"})
        if not password:
            return JsonResponse({"success": False, "message": "Password is not defined"})
        if User.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "message": "Username already exists"})

        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()
        return JsonResponse({"success": True, "message": "Register succeeded"})

# logout
    @staticmethod
    def logout_user(request):
        # refresh = request.data["refresh"]
        # token = RefreshToken(refresh)
        # token.blacklist()
        logout(request=request)
        response = JsonResponse({"message": "Déconnexion réussie"})
        response.delete_cookie("sessionid")
        response.delete_cookie("csrftoken")
        return response

    @staticmethod
    def unregister_user(request):
        # Vérifie que l'utilisateur est authentifié
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated ${user.username}", }, status=401)

        user = request.user

        # Si l'utilisateur a un email, envoie un mail
        if user.email:
            text_content = render_to_string("emails/unregister.txt", {"1": 42})
            html_content = render_to_string("emails/unregister.html", {"2": 42})
            msg = EmailMultiAlternatives(
                "Transcendance unregister confirmation",
                text_content,
                "the.42.transcendance@gmail.com",
                [user.email],
                headers={"List-Unsubscribe": "<mailto:unsub@example.com>"},
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

        # Supprime l'utilisateur (ça peut être direct car user est déjà l'objet authentifié)
        user.delete()
        return JsonResponse({"success": True, "message": "Unregistered succeeded"})

    @staticmethod
    def remote_connection(request):
        redirect_uri = "http://localhost:8000/api/auth/callback"
        authorization_base_url = "https://api.intra.42.fr/oauth/authorize"
        token_url = "https://api.intra.42.fr/oauth/token"
        user_info_url = "https://api.intra.42.fr/v2/me"

        client = OAuth2Session(client_id, redirect_uri=redirect_uri)

        authorization_url, state = client.authorization_url(authorization_base_url)

        print(f"authorization url = {authorization_url}")
        return redirect(authorization_url)

    @staticmethod
    def callback(request):
        print(f"ICI CLIENT ID = {client_id}")
        redirect_uri = "http://localhost:8000/api/auth/callback"
        authorization_base_url = "https://api.intra.42.fr/oauth/authorize"
        token_url = "https://api.intra.42.fr/oauth/token"
        user_info_url = "https://api.intra.42.fr/v2/me"
    
        client = OAuth2Session(client_id, redirect_uri=redirect_uri)
    
        code = request.GET.get("code")
        if not code:
            return JsonResponse({"error": "Authorization code missing"}, status=400)
        
        token = client.fetch_token(token_url, client_secret=client_secret, code=code)
        client = OAuth2Session(client_id, token=token)

        # Récupérer les informations utilisateur
        user_info = client.get(user_info_url).json()
    
        # ⬇️ Stockage en session Django
        request.session["user_info"] = user_info
    
        # ⬇️ Redirection vers /profile (adapté à ton domaine + HTTPS si nécessaire)
        return redirect("https://localhost:8443/profile")

    def get_user(request):
    
        session_key = request.session.session_key
    
        if session_key:
            session = Session.objects.filter(session_key=session_key).first()
            if session:
                data = session.get_decoded()
    
                if '_auth_user_id' in data:
                    user_id = data['_auth_user_id']
                    user = User.objects.filter(id=user_id).first()
    
                    if user:
                        return JsonResponse({
                            "username": user.username,
                            "email": user.email,
                            "id": user.id
                        })
        return JsonResponse({"error": "Utilisateur non authentifié"}, status=401)
    # @staticmethod
    # def get_user(request):
    #     if request.user.is_authenticated:
    #         return JsonResponse({
    #             "username": request.user.username,
    #             "email": request.user.email,
    #             "id": request.user.id
    #         })
    #     return JsonResponse({"error": "Utilisateur non authentifié"}, status=401)


    @staticmethod
    def whoami(request):
        # Récupère user_info dans la session
        user_info = request.session.get("user_info")
        if not user_info:
            return JsonResponse({"error": "Not authenticated"}, status=401)
     
        # On renvoie les infos
        return JsonResponse(user_info)
