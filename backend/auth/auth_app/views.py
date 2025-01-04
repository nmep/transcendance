from django.shortcuts import render

# Create your views here.

from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    print("request = ", request.body)
    
    return render(request, "auth_app/index.html")

def result(request, user): #user est un parametre ajouter a cette view depuis l'url
    return HttpResponse("your looking at user %d." % (user * 5))