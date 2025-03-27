from django.urls import path
from . import views

urlpatterns = [
	path('db/', views.DB_API.as_view()),
]
