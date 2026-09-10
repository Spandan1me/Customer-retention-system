from django.urls import path
from .views import (
    AgentDashboardView,
    AgentMetricDetailsView,
    TeamLeadDashboardView,
    SupervisorDashboardView,
    AdminDashboardView,
    ChurnReasonAnalyticsView
)

urlpatterns = [
    path('agent/', AgentDashboardView.as_view(), name='dashboard_agent'),
    path('agent/details/', AgentMetricDetailsView.as_view(), name='dashboard_agent_details'),
    path('team-lead/', TeamLeadDashboardView.as_view(), name='dashboard_team_lead'),
    path('supervisor/', SupervisorDashboardView.as_view(), name='dashboard_supervisor'),
    path('admin/', AdminDashboardView.as_view(), name='dashboard_admin'),
    path('churn-reasons/', ChurnReasonAnalyticsView.as_view(), name='dashboard_churn_reasons'),
]
