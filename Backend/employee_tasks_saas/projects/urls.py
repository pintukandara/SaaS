print("loading projects urls")  # Add debug print

from django.urls import path, include
from rest_framework.routers import SimpleRouter  # ✅ Changed from DefaultRouter
from .views import ProjectViewSet

router = SimpleRouter()  # ✅ Changed here
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
]