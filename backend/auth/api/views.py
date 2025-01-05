from rest_framework.response import Response
from rest_framework.decorators import api_view
from auth_app.models import authConf
from .serializers import authSerializer

@api_view(['GET'])
def getData(request):
    # person = {'name':'Denis', 'age':28}
    auth = authConf.objects.all()
    serializer = authSerializer(auth, many=True)
    return Response(serializer.data)