from django.urls import path
from . import views

urlpatterns = [
    path('', views.authClass.as_view()),
]
