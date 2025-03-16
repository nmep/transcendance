from django.urls import path, include
from . import views

urlpatterns = [
    path('auth/<str:action>', views.authAPI.as_view()),
]
