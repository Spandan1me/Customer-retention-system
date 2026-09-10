from rest_framework import permissions
from .models import UserRole

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin

class IsSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_supervisor_user or request.user.is_super_admin)

class IsTeamLead(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_team_lead_user or request.user.is_supervisor_user or request.user.is_super_admin)

class IsAgent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_agent_user

class IsTeamManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_team_lead_user
            or request.user.is_supervisor_user
            or request.user.is_super_admin
        )

class IsSupervisorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_supervisor_user or request.user.is_super_admin
        )
