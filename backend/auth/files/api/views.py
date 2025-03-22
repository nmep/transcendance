from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .authClass import authManager
from django.http import JsonResponse

person = {'name':'Denis', 'age':28}

class authAPI(APIView):
    def post(self, request, *args, **kwargs):

        extract_kwargs_action = kwargs.get("action")

        if extract_kwargs_action == "login":
            return authManager.login_user(request, request.POST.get('username'), request.POST.get('password'))
        elif extract_kwargs_action == "register":
            return authManager.register_user(request, request.POST.get('username'), request.POST.get('password'))
        elif extract_kwargs_action == "logout":
            return authManager.logout_user(request)

        elif extract_kwargs_action == "unregister":
            return authManager.unregister_user(request)
        return Response({"detail": "Page not found"}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, *args, **kwargs):

        action = kwargs.get('action')
        if action == "unregister":
            return authManager.unregister_user(request)
        if action == "user":
            print("je recois la requete sur user")
            return authManager.get_user(request)
        elif action == "remote":
            return authManager.remote_connection(request)
        elif action == "whoami":
            return authManager.whoami(request)
        elif action == "callback":
            return authManager.callback(request)
        elif action == "tfa_status":
            return authManager.tfa_status(request)
        return JsonResponse({"error": "Page Not Found"}, status=404)
