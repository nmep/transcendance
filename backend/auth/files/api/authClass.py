from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from requests_oauthlib import OAuth2Session
# faire une classe qui a des fonctions pour lauthentification

# login

class authManager:
    @staticmethod
    def login_user(request, username, password):
        if username == None:
            return JsonResponse({"success": False, "message":"Username is not defined"})
        elif password == None:
            return JsonResponse({"success": False, "message":"Password is not defined"})

        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return JsonResponse({"success": True, "message":"success"})
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
        logout(request)
        return JsonResponse({"success": True, "message":"User loged out"})

    @staticmethod
    def remote_connection(request):
        UID = ""
        client_secret = ""

        client = OAuth2Session(UID, client_secret=client_secret)

        print(f"client = {client}")
        return JsonResponse({"success": True, "message":"qwer"})
        