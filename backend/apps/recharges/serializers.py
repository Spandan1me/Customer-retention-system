from rest_framework import serializers
from .models import PackageFamily, PackagePrice, Recharge


class PackagePriceSerializer(serializers.ModelSerializer):
    family_name = serializers.CharField(source='family.name', read_only=True)

    class Meta:
        model = PackagePrice
        fields = ['id', 'family', 'family_name', 'speed_mbps', 'term_months', 'amount']


class PackageFamilySerializer(serializers.ModelSerializer):
    prices = PackagePriceSerializer(many=True, read_only=True)

    class Meta:
        model = PackageFamily
        fields = ['id', 'name', 'prices']

class RechargeSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_code = serializers.CharField(source='customer.customer_id', read_only=True)
    agent_name = serializers.SerializerMethodField()
    team_lead_name = serializers.SerializerMethodField()
    supervisor_name = serializers.SerializerMethodField()

    class Meta:
        model = Recharge
        fields = '__all__'

    def get_agent_name(self, obj):
        return obj.agent.get_full_name() or obj.agent.username if obj.agent else 'N/A'

    def get_team_lead_name(self, obj):
        return obj.team_lead.get_full_name() or obj.team_lead.username if obj.team_lead else 'N/A'

    def get_supervisor_name(self, obj):
        return obj.supervisor.get_full_name() or obj.supervisor.username if obj.supervisor else 'N/A'
