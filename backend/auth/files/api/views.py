from rest_framework.response import Response
from rest_framework.views import APIView
from auth_app.models import authConf
from .serializers import authSerializer
from .authClass import authManager


person = {'name':'Denis', 'age':28}

class authAPI(APIView):
    # def get(self, request, ):

    #     # auth = authConf.objects.all()
    #     # serializer = authSerializer(auth, many=True)
    #     return Response(person)
    def post(self, request, *args, **kwargs):

        extract_kwargs_action = kwargs.get("action")

        print(f"action = {extract_kwargs_action}")
        if extract_kwargs_action == "login":
            print("login !!")
            return authManager.login_user(request, request.POST.get('username'), request.POST.get('password'))
        elif extract_kwargs_action == "register":
            print("register !!")
            return authManager.register_user(request, request.POST.get('username'), request.POST.get('password'))
        elif extract_kwargs_action == "logout":
            print("logout")
            return authManager.logout_user(request)
        elif extract_kwargs_action == "remote":
            print("remote !!")
            return authManager.remote_connection(request)
        return Response(person)
    
    def get(self, request, *args, **kwargs):
        action = kwargs.get('action')
        print(f"get action = {action}")
        return authManager.callback(request)
