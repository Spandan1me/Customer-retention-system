from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AgentStartCallLogView, CustomerRemarksView, CustomerViewSet, SmartWorkQueueView, CustomerAssignView, CustomerImportView

router = DefaultRouter()
router.register(r'', CustomerViewSet, basename='customers')

urlpatterns = [
    path('my-queue/', SmartWorkQueueView.as_view(), name='smart_work_queue'),
    path('start-call-log/', AgentStartCallLogView.as_view(), name='agent_start_call_log'),
    path('remarks/<int:pk>/', CustomerRemarksView.as_view(), name='customer_remarks'),
    path('assign/', CustomerAssignView.as_view(), name='customer_assign'),
    path('import/', CustomerImportView.as_view(), name='customer_import'),
    path('', include(router.urls)),
]
