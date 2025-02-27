from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.http import JsonResponse
from requests_oauthlib import OAuth2Session
import requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
# faire une classe qui a des fonctions pour lauthentification

# login

client_id = "COUIN"
client_secret = "couin"

class authManager:
    @staticmethod
    def login_user(request, username, password):
        if username == None:
            return JsonResponse({"success": False, "message":"Username is not defined"})
        elif password == None:
            return JsonResponse({"success": False, "message":"Password is not defined"})

        print(f"username = {username} | password = {password}")
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
        print(f"user name = {username} | password = {password}")
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
        logout(request=request)
        # redirect sur le home page ?
        return JsonResponse({"success": True, "message":"User loged out"})

    @staticmethod
    def unregister_user(request):
        print(f"the user = {request.user.email}")

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
                "Unregister from transcance",
                text_content,
                "the.42.transcendance@gmail.com",
                [request.user.email],
                headers={"List-Unsubscribe": "<mailto:unsub@example.com>"},
            )

            # Lastly, attach the HTML content to the email instance and send.
            msg.attach_alternative(html_content, "text/html")
            msg.send()
        return JsonResponse({"success": True, "message":"User unregistered"})
        

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

        user_info = client.get(user_info_url).json()
        print(f"token = {token}")
        # print(f"👤 Infos utilisateur: {user_info}")

        return JsonResponse({"success": True, "user_login": user_info["login"]})