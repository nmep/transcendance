from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
# faire une classe qui a des fonctions pour lauthentification

# login

class authClass:
    @staticmethod
    def login_user(request, username, password):
        user = authenticate(request, username, password)
        if user:
            return JsonResponse({"success": False, "message":"login or password is not recognize"})
        else:
            return JsonResponse({"success": True, "message":"success"})
    
    @staticmethod
    def register_user(request, username, password):
        if User.object.filter(username=username):
            return JsonResponse({"success": False, "message":"username already exist"})
        else:
            user= User.objects.create_user(username, None, password)
            user.save()
            return JsonResponse({"success": True, "message":"Register successed"})


# inscription

# logout


