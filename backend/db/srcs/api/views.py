from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
# from rest_framework.request import Request

class DB_API(APIView):
	def get(self, request):
		print("1")
		if request.user:
			print(f"r user = {request.user}")
			user = User.objects.get(username=request.user)
			if (user == None):
				print(f"aucun user n'a été reconnue")
				return Response({"message": "not ok"})
			print(f"{user.__dict__}")
		else:
			print("user non reconnue")
		return Response({"message": "ok"})
