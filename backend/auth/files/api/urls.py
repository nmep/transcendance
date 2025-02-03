from django.urls import path
from . import views

urlpatterns = [
    path('auth/<str:action>', views.authAPI.as_view()),
]
