from rest_framework import serializers
from .models import RetentionCategory, RetentionSubCategory, RetentionDisposition, CustomerFollowUp

class RetentionDispositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetentionDisposition
        fields = '__all__'

class RetentionSubCategorySerializer(serializers.ModelSerializer):
    dispositions = RetentionDispositionSerializer(many=True, read_only=True)

    class Meta:
        model = RetentionSubCategory
        fields = '__all__'

class RetentionCategorySerializer(serializers.ModelSerializer):
    subcategories = RetentionSubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = RetentionCategory
        fields = '__all__'

class CustomerFollowUpSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    agent_name = serializers.SerializerMethodField()
    disposition_name = serializers.CharField(source='disposition.name', read_only=True)
    business_classification = serializers.CharField(source='disposition.business_classification', read_only=True)

    class Meta:
        model = CustomerFollowUp
        fields = '__all__'

    def get_agent_name(self, obj):
        return obj.agent.get_full_name() or obj.agent.username if obj.agent else 'System'
