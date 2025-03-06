from django.urls import path, include
from . import views

urlpatterns = [
    path('auth/', views.authClass.as_view()),
]
