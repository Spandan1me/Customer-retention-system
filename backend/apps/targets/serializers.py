from rest_framework import serializers
from .models import Target

class TargetSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Target
        fields = '__all__'

    def get_user_name(self, obj):
        return obj.assigned_to_user.get_full_name() or obj.assigned_to_user.username if obj.assigned_to_user else 'Org Global'
