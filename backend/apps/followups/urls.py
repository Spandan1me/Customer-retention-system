from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, DispositionViewSet, CustomerFollowUpViewSet, OverdueFollowUpView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'dispositions', DispositionViewSet)
router.register(r'records', CustomerFollowUpViewSet, basename='followup_records')

urlpatterns = [
    path('overdue/', OverdueFollowUpView.as_view(), name='overdue_followups'),
    path('', include(router.urls)),
]
