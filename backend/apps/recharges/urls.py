from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PackageCatalogView, RechargeViewSet, VerifyRechargeView

router = DefaultRouter()
router.register(r'', RechargeViewSet, basename='recharges')

urlpatterns = [
    path('packages/', PackageCatalogView.as_view(), name='package_catalog'),
    path('<int:pk>/verify/', VerifyRechargeView.as_view(), name='verify_recharge'),
    path('', include(router.urls)),
]
