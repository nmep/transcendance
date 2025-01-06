from rest_framework import serializers
from auth_app.models import authConf

class authSerializer(serializers.ModelSerializer):
    class Meta:
        model = authConf
        fields = '__all__'