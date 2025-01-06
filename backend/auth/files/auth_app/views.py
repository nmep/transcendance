from django.shortcuts import render

# Create your views here.

from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth import authenticate

def index(request):
    if request.method == "POST":
        print(request.body)
        username=request.POST.get("username")
        password=request.POST.get("password")
        print("name = ", username, "| password = ", username, password)
        user = authenticate(request, username=username, password=password)
        if user is None:
            print("je ne reconnais pas cette user")
        else:
            print("je reconnais cette user")
            
    return render(request, "auth_app/index.html")

def result(request, user): #user est un parametre ajouter a cette view depuis l'url
    return HttpResponse("your looking at user %d." % (user * 5))