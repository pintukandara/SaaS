print("loading teams urls")  # Keep your debug print

from django.urls import path, include
from rest_framework.routers import SimpleRouter  # ✅ Changed from DefaultRouter
from .views import DepartmentViewSet, TeamViewSet

router = SimpleRouter()  # ✅ Changed here
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'teams', TeamViewSet, basename='team')

urlpatterns = [
    path('', include(router.urls)),
]