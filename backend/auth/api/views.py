from rest_framework.response import Response
from rest_framework.views import APIView
from auth_app.models import authConf
from .serializers import authSerializer

# class d'api basic en faire ce que vous voulez

class authClass(APIView):
    def get(self, request):
        person = {'name':'Denis', 'age':28}
        # auth = authConf.objects.all()
        # serializer = authSerializer(auth, many=True)
        return Response(person)