from rest_framework import serializers
# from auth_app.models import CustomUser
from django.contrib.auth.models import User

class authSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # model = CustomUser
        fields = '__all__'