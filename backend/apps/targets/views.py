from rest_framework import viewsets, permissions
from .models import Target
from .serializers import TargetSerializer
from apps.authentication.permissions import IsSuperAdmin

class TargetViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TargetSerializer
    queryset = Target.objects.all()

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]
