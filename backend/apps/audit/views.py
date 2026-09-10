from rest_framework import viewsets, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.authentication.permissions import IsSuperAdmin

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsSuperAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related('actor').all()
