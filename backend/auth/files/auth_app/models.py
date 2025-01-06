from django.db import models

# Create your models here.

class authConf(models.Model):
    name = models.CharField(max_length=202)
    password = models.CharField(max_length=202)