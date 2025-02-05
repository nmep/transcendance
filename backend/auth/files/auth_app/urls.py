from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("<int:user>/result", views.result, name="result"),
    #   indique que la view recoit un parametre de type int et de nom result
    #   attention le nom doit etre identique a celui de la view en question
]