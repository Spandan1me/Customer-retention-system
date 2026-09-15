from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    MeView,
    UserListView,
    HierarchyView,
    ResetUserPasswordView,
    ToggleUserStatusView,
    DeleteUserView,
)


urlpatterns = [
    path(
        'login/',
        CustomTokenObtainPairView.as_view(),
        name='token_obtain_pair',
    ),

    path(
        'refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh',
    ),

    path(
        'me/',
        MeView.as_view(),
        name='user_me',
    ),

    path(
        'users/',
        UserListView.as_view(),
        name='user_list',
    ),

    path(
        'users/<int:user_id>/reset-password/',
        ResetUserPasswordView.as_view(),
        name='user_reset_password',
    ),

    path(
        'users/<int:user_id>/toggle-status/',
        ToggleUserStatusView.as_view(),
        name='user_toggle_status',
    ),

    path(
        'users/<int:user_id>/',
        DeleteUserView.as_view(),
        name='user_delete',
    ),

    path(
        'hierarchy/',
        HierarchyView.as_view(),
        name='hierarchy',
    ),
]
