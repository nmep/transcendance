from django.db import models

# Create your models here.

class authConf(models.Model):
    name = models.CharField(max_length=200)
    password = models.CharField(max_length=200)