from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/customers/', include('apps.customers.urls')),
    path('api/v1/followups/', include('apps.followups.urls')),
    path('api/v1/recharges/', include('apps.recharges.urls')),
    path('api/v1/targets/', include('apps.targets.urls')),
    path('api/v1/dashboard/', include('apps.dashboards.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/audit/', include('apps.audit.urls')),
]
