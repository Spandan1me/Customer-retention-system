from django.urls import path
from .views import ReportsEngineView

urlpatterns = [
    path('export/', ReportsEngineView.as_view(), name='reports_export'),
]
