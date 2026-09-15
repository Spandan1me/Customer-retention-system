from django.db import IntegrityError
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import (
    User,
    SupervisorTeam,
    TeamLeadAssignment,
    UserRole,
)
from .permissions import IsSuperAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserCreateSerializer,
    UserSerializer,
)


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
            tls = SupervisorTeam.objects.filter(
                supervisor=user
            ).values_list('team_lead_id', flat=True)

            agents = TeamLeadAssignment.objects.filter(
                team_lead_id__in=tls
            ).values_list('agent_id', flat=True)

            allowed_ids = list(tls) + list(agents) + [user.id]

            queryset = queryset.filter(id__in=allowed_ids)

        elif user.is_team_lead_user:
            agents = TeamLeadAssignment.objects.filter(
                team_lead=user
            ).values_list('agent_id', flat=True)

            allowed_ids = list(agents) + [user.id]

            queryset = queryset.filter(id__in=allowed_ids)

        else:
            queryset = queryset.filter(id=user.id)

        if role_filter:
            queryset = queryset.filter(role=role_filter)

        return queryset


class UserManagementMixin:
    """
    Common security checks for user-management operations.

    Super Admin:
        - Can manage users in the same organization.

    Supervisor:
        - Can manage their assigned Team Leads and Agents.

    Everyone else:
        - Cannot manage users.

    Users cannot manage their own account through these endpoints.
    """

    def get_target_user(self, request, user_id):
        try:
            target = User.objects.get(
                id=user_id,
                organization=request.user.organization,
            )
        except User.DoesNotExist:
            return None, Response(
                {
                    'detail': 'User not found.'
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Prevent self-management.
        if target.id == request.user.id:
            return None, Response(
                {
                    'detail': (
                        'You cannot manage your own account '
                        'from User Management.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Super Admin can manage users within the same organization.
        if request.user.is_super_admin:
            return target, None

        # Supervisor can manage assigned Team Leads and their Agents.
        if request.user.is_supervisor_user:

            team_lead_ids = SupervisorTeam.objects.filter(
                supervisor=request.user
            ).values_list(
                'team_lead_id',
                flat=True,
            )

            agent_ids = TeamLeadAssignment.objects.filter(
                team_lead_id__in=team_lead_ids
            ).values_list(
                'agent_id',
                flat=True,
            )

            allowed_ids = list(team_lead_ids) + list(agent_ids)

            if target.id not in allowed_ids:
                return None, Response(
                    {
                        'detail': (
                            'You are not allowed to manage '
                            'this user.'
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            return target, None

        return None, Response(
            {
                'detail': 'You are not allowed to manage users.'
            },
            status=status.HTTP_403_FORBIDDEN,
        )


class ResetUserPasswordView(APIView):
    """
    Reset another user's password.

    POST:
        /auth/users/<user_id>/reset-password/

    Body:
        {
            "password": "new-password"
        }
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):

        # Only Super Admin and Supervisor can reset passwords.
        if not (
            request.user.is_super_admin
            or request.user.is_supervisor_user
        ):
            return Response(
                {
                    'detail': (
                        'You are not allowed to reset '
                        'user passwords.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        target, error = UserManagementMixin().get_target_user(
            request,
            user_id,
        )

        if error:
            return error

        password = request.data.get('password')

        if not password:
            return Response(
                {
                    'detail': 'Password is required.'
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        password = str(password).strip()

        if len(password) < 8:
            return Response(
                {
                    'detail': (
                        'Password must be at least '
                        '8 characters long.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Never store plaintext passwords.
        target.set_password(password)
        target.save(update_fields=['password'])

        return Response(
            {
                'detail': (
                    f'Password reset successfully '
                    f'for {target.username}.'
                ),
                'username': target.username,
            },
            status=status.HTTP_200_OK,
        )


class ToggleUserStatusView(APIView):
    """
    Activate/deactivate another user.

    POST:
        /auth/users/<user_id>/toggle-status/

    No request body required.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):

        # Only Super Admin and Supervisor can change status.
        if not (
            request.user.is_super_admin
            or request.user.is_supervisor_user
        ):
            return Response(
                {
                    'detail': (
                        'You are not allowed to change '
                        'user status.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        target, error = UserManagementMixin().get_target_user(
            request,
            user_id,
        )

        if error:
            return error

        target.is_active = not target.is_active

        target.save(
            update_fields=['is_active']
        )

        action = (
            'activated'
            if target.is_active
            else 'deactivated'
        )

        return Response(
            {
                'id': target.id,
                'username': target.username,
                'is_active': target.is_active,
                'detail': (
                    f'{target.username} has been {action}.'
                ),
            },
            status=status.HTTP_200_OK,
        )


class DeleteUserView(APIView):
    """
    Permanently delete a user.

    Only Super Admin can permanently delete users.

    Deactivation should normally be preferred because
    historical customer-retention records may depend
    on the user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, user_id):

        # Permanent deletion is Super Admin only.
        if not request.user.is_super_admin:
            return Response(
                {
                    'detail': (
                        'Only Super Admin can permanently '
                        'delete users.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        target, error = UserManagementMixin().get_target_user(
            request,
            user_id,
        )

        if error:
            return error

        username = target.username

        try:
            target.delete()

        except IntegrityError:
            return Response(
                {
                    'detail': (
                        'This user cannot be permanently deleted '
                        'because historical records are linked '
                        'to this account. Deactivate the user '
                        'instead.'
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {
                'detail': (
                    f'{username} was permanently deleted.'
                )
            },
            status=status.HTTP_200_OK,
        )


class HierarchyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        supervisors = User.objects.filter(
            role=UserRole.SUPERVISOR
        )

        result = []

        for sup in supervisors:
            teams = SupervisorTeam.objects.filter(
                supervisor=sup
            )

            team_leads_data = []

            for st in teams:
                tl = st.team_lead

                agents = TeamLeadAssignment.objects.filter(
                    team_lead=tl
                ).select_related('agent')

                agents_data = [
                    {
                        'id': a.agent.id,
                        'name': (
                            a.agent.get_full_name()
                            or a.agent.username
                        ),
                        'email': a.agent.email,
                    }
                    for a in agents
                ]

                team_leads_data.append(
                    {
                        'id': tl.id,
                        'name': (
                            tl.get_full_name()
                            or tl.username
                        ),
                        'email': tl.email,
                        'agents': agents_data,
                    }
                )

            result.append(
                {
                    'id': sup.id,
                    'name': (
                        sup.get_full_name()
                        or sup.username
                    ),
                    'email': sup.email,
                    'team_leads': team_leads_data,
                }
            )

        return Response(result)
