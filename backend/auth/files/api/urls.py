from django.urls import path
from . import views

urlpatterns = [
    path('auth/', views.authClass.as_view()),
]
