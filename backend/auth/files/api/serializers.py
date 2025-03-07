from rest_framework import serializers
from auth_app.models import CustomUser

class authSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = '__all__'