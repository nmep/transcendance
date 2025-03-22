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

# inscription
    @staticmethod
    def register_user(request, username, password):
        if username == None:
            return JsonResponse({"success": False, "message":"Username is not defined"})
        elif password == None:
            return JsonResponse({"success": False, "message":"Password is not defined"})
        if User.objects.filter(username=username):
            return JsonResponse({"success": False, "message":"username already exist"})
        else:
            user = User.objects.create_user(username, None, password)
            user.save()
            return JsonResponse({"success": True, "message":"Register successed"})

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

        if request.user:
            # si l'user a un email (ce qui est normalement obligatoire)
            # envoyer un email de suppression de compte

            # First, render the plain text content.
            text_content = render_to_string(
                "emails/unregister.txt",
                context={"1": 42},
            )

            # Secondly, render the HTML content.
            html_content = render_to_string(
                "emails/unregister.html",
                context={"2": 42},
            )

            # Then, create a multipart email instance.
            msg = EmailMultiAlternatives(
                "transcendance unreigster confirmation",
                text_content,
                "the.42.transcendance@gmail.com",
                [request.user.email],
                headers={"List-Unsubscribe": "<mailto:unsub@example.com>"},
            )

            # Lastly, attach the HTML content to the email instance and send.
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            user = User.objects.get(username = request.user)
            user.delete()
        return JsonResponse({"success": True, "message": "Unregistered mail sended"})

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

    # @staticmethod
    # def callback(request):
    #     print(f"ICI CLIENT ID = {client_id}")
    #     redirect_uri = "http://localhost:8000/api/auth/callback"
    #     authorization_base_url = "https://api.intra.42.fr/oauth/authorize"
    #     token_url = "https://api.intra.42.fr/oauth/token"
    #     user_info_url = "https://api.intra.42.fr/v2/me"

    #     client = OAuth2Session(client_id, redirect_uri=redirect_uri)

    #     code = request.GET.get("code")
    #     if not code:
    #         return JsonResponse({"error": "Authorization code missing"}, status=400)
        
    #     token = client.fetch_token(token_url, client_secret=client_secret, code=code)
    #     client = OAuth2Session(client_id, token=token)
    
    #     # Récupérer les informations utilisateur
    #     user_info = client.get(user_info_url).json()
    #     response = JsonResponse(user_info)  # Tu peux aussi retourner une JsonResponse ici
    #     response.set_cookie("user_info", json.dumps(user_info), httponly=True, samesite="None", secure=True)

    #     # Retourner la réponse avec le cookie
    #     return response

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


    # @staticmethod
    # def callback(request):
    #     redirect_uri = "http://localhost:8000/api/auth/callback"
    #     authorization_base_url = "https://api.intra.42.fr/oauth/authorize"
    #     token_url = "https://api.intra.42.fr/oauth/token"
    #     user_info_url = "https://api.intra.42.fr/v2/me"

    #     client = OAuth2Session(client_id, redirect_uri=redirect_uri)

    #     # Récupérer le code de l'URL
    #     code = request.GET.get("code")
    #     if not code:
    #         return JsonResponse({"error": "Authorization code missing"}, status=400)
        
    #     # Échanger le code contre un token
    #     token = client.fetch_token(token_url, client_secret=client_secret, code=code)
    #     client = OAuth2Session(client_id, token=token)

    #     # Récupérer les informations de l'utilisateur
    #     user_info = client.get(user_info_url).json()

    #     # Créer la réponse et définir les cookies
    #     response = JsonResponse(user_info)
        
    #     # Enregistrer les données utilisateur dans un cookie sécurisé
    #     response.set_cookie("user_info", json.dumps(user_info), httponly=True, samesite="None", secure=True)

    #     return response

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

    @staticmethod
    def whoami(request):
        # Récupère user_info dans la session
        user_info = request.session.get("user_info")
        if not user_info:
            return JsonResponse({"error": "Not authenticated"}, status=401)
     
        # On renvoie les infos
        return JsonResponse(user_info)

    @login_required
    def tfa_status(request):
        """
        Renvoie un JSON indiquant si l'utilisateur a un device 2FA.
        """
        # Parcourt tous les devices OTP pour l'utilisateur
        # (EmailDevice, TOTPDevice, etc.)
        user_devices = list(devices_for_user(request.user))
        # Vérifie s'il en existe au moins un
        twofa_enabled = any(d.confirmed for d in user_devices)
    
        return JsonResponse({"enabled": twofa_enabled})
