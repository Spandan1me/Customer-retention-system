from rest_framework import serializers
from .models import Customer, AssignmentHistory, CustomerRemark, CustomerTimeline
from apps.followups.serializers import CustomerFollowUpSerializer
from apps.recharges.models import Recharge

class RechargeMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recharge
        fields = ['id', 'recharge_date', 'recharge_amount', 'package', 'recharge_method', 'verified', 'recovered_revenue']

class CustomerTimelineSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomerTimeline
        fields = '__all__'

    def get_agent_name(self, obj):
        return obj.agent.get_full_name() or obj.agent.username if obj.agent else 'System'

class CustomerListSerializer(serializers.ModelSerializer):
    assigned_agent_name = serializers.SerializerMethodField()
    latest_disposition_name = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            'id', 'customer_id', 'name', 'mobile_number', 'package', 'days_since_churn',
            'churn_bucket', 'customer_status', 'priority', 'assigned_agent_name',
            'latest_disposition_name', 'last_contact_date', 'next_followup_date',
            'next_followup_time', 'recharge_status', 'recharge_amount', 'recovered_revenue'
        ]

    def get_assigned_agent_name(self, obj):
        return obj.assigned_agent.get_full_name() or obj.assigned_agent.username if obj.assigned_agent else 'Unassigned'

    def get_latest_disposition_name(self, obj):
        return obj.latest_disposition.name if obj.latest_disposition else 'None'

class CustomerDetailSerializer(serializers.ModelSerializer):
    assigned_agent_name = serializers.SerializerMethodField()
    assigned_team_lead_name = serializers.SerializerMethodField()
    assigned_supervisor_name = serializers.SerializerMethodField()
    latest_disposition_name = serializers.SerializerMethodField()
    followups = CustomerFollowUpSerializer(many=True, read_only=True)
    recharges = RechargeMiniSerializer(many=True, read_only=True)
    timeline = CustomerTimelineSerializer(many=True, read_only=True)
    remarks = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = '__all__'

    def get_remarks(self, obj):
        return [{
            'id': remark.id,
            'text': remark.text,
            'author_name': remark.author.get_full_name() or remark.author.username if remark.author else 'System',
            'created_at': remark.created_at,
        } for remark in obj.remarks.select_related('author').all()]

    def get_assigned_agent_name(self, obj):
        return obj.assigned_agent.get_full_name() or obj.assigned_agent.username if obj.assigned_agent else 'Unassigned'

    def get_assigned_team_lead_name(self, obj):
        return obj.assigned_team_lead.get_full_name() or obj.assigned_team_lead.username if obj.assigned_team_lead else 'Unassigned'

    def get_assigned_supervisor_name(self, obj):
        return obj.assigned_supervisor.get_full_name() or obj.assigned_supervisor.username if obj.assigned_supervisor else 'Unassigned'

    def get_latest_disposition_name(self, obj):
        return obj.latest_disposition.name if obj.latest_disposition else 'None'


class AgentCustomerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'customer_id', 'name', 'mobile_number', 'alternate_number', 'email',
            'address', 'area_location', 'package', 'current_plan',
            'previous_recharge_amount', 'days_since_churn', 'churn_bucket',
            'expiry_date', 'retention_workflow',
        ]
        extra_kwargs = {
            'package': {'required': False, 'default': 'Standard Fiber'},
            'current_plan': {'required': False, 'default': 'Standard Fiber'},
            'previous_recharge_amount': {'required': False, 'default': 0},
            'days_since_churn': {'required': False, 'default': 0},
            'churn_bucket': {'required': False, 'default': '0-29'},
        }
