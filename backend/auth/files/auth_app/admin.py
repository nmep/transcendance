from django.contrib import admin

# Register your models here.

from .models import authConf

admin.site.register(authConf) # sert a dire a django que l'app auth peut etre modifie sur le site admin