from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import SimpleRouter
from .views import RegisterView, UserDetailView, LogoutView, UserViewSet

# Create router for UserViewSet
router = SimpleRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # ✅ Add router URLs
    path('', include(router.urls)),
]