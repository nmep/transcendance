from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    parties_gagnees = models.PositiveIntegerField(default=0)