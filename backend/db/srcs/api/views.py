from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import dbSerializer

class DB_API(APIView):
	def get(self, request):
		if request.user:
			user = User.objects.get(username=request.user)
			if (user == None):
				return Response({"message": "not ok"})
			serializer = dbSerializer(user)
			return Response(serializer.data)
		return Response({"message": "User non reconnue"})
