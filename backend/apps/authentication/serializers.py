from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Organization, SupervisorTeam, TeamLeadAssignment

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'organization': self.user.organization.name if self.user.organization else None,
            'organization_id': self.user.organization.id if self.user.organization else None,
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    team_lead_name = serializers.SerializerMethodField()
    supervisor_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'mobile', 'is_active', 'team_lead_name', 'supervisor_name']

    def get_team_lead_name(self, obj):
        if obj.role == 'AGENT':
            assignment = TeamLeadAssignment.objects.filter(agent=obj).first()
            if assignment:
                return assignment.team_lead.get_full_name() or assignment.team_lead.username
        return None

    def get_supervisor_name(self, obj):
        if obj.role == 'AGENT':
            tl_assignment = TeamLeadAssignment.objects.filter(agent=obj).first()
            if tl_assignment:
                sup_assignment = SupervisorTeam.objects.filter(team_lead=tl_assignment.team_lead).first()
                if sup_assignment:
                    return sup_assignment.supervisor.get_full_name() or sup_assignment.supervisor.username
        elif obj.role == 'TEAM_LEAD':
            sup_assignment = SupervisorTeam.objects.filter(team_lead=obj).first()
            if sup_assignment:
                return sup_assignment.supervisor.get_full_name() or sup_assignment.supervisor.username
        return None

class UserCreateSerializer(UserSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['password']

    def validate_role(self, value):
        if value == 'SUPER_ADMIN':
            raise serializers.ValidationError('Super admin accounts cannot be created here.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        request_user = self.context['request'].user
        user = User(**validated_data, organization=request_user.organization)
        user.set_password(password)
        user.save()
        return user

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'
