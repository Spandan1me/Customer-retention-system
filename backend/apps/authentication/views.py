from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, SupervisorTeam, TeamLeadAssignment, UserRole
from .permissions import IsSuperAdmin
from .serializers import CustomTokenObtainPairSerializer, UserCreateSerializer, UserSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        role_filter = self.request.query_params.get('role')
        queryset = User.objects.all().order_by('username')
        
        if user.is_super_admin:
            pass
        elif user.is_supervisor_user:
            tls = SupervisorTeam.objects.filter(supervisor=user).values_list('team_lead_id', flat=True)
            agents = TeamLeadAssignment.objects.filter(team_lead_id__in=tls).values_list('agent_id', flat=True)
            allowed_ids = list(tls) + list(agents) + [user.id]
            queryset = queryset.filter(id__in=allowed_ids)
        elif user.is_team_lead_user:
            agents = TeamLeadAssignment.objects.filter(team_lead=user).values_list('agent_id', flat=True)
            allowed_ids = list(agents) + [user.id]
            queryset = queryset.filter(id__in=allowed_ids)
        else:
            queryset = queryset.filter(id=user.id)

        if role_filter:
            queryset = queryset.filter(role=role_filter)

        return queryset

class HierarchyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        supervisors = User.objects.filter(role=UserRole.SUPERVISOR)
        result = []
        for sup in supervisors:
            teams = SupervisorTeam.objects.filter(supervisor=sup)
            team_leads_data = []
            for st in teams:
                tl = st.team_lead
                agents = TeamLeadAssignment.objects.filter(team_lead=tl).select_related('agent')
                agents_data = [{
                    'id': a.agent.id,
                    'name': a.agent.get_full_name() or a.agent.username,
                    'email': a.agent.email
                } for a in agents]
                
                team_leads_data.append({
                    'id': tl.id,
                    'name': tl.get_full_name() or tl.username,
                    'email': tl.email,
                    'agents': agents_data
                })

            result.append({
                'id': sup.id,
                'name': sup.get_full_name() or sup.username,
                'email': sup.email,
                'team_leads': team_leads_data
            })

        return Response(result)
