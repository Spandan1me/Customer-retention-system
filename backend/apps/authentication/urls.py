from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, MeView, UserListView, HierarchyView

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='user_me'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('hierarchy/', HierarchyView.as_view(), name='hierarchy'),
]
