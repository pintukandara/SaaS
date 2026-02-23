print("loading task urls")  # Keep your debug print

from django.urls import path, include
from rest_framework.routers import SimpleRouter  # ✅ Changed from DefaultRouter
from .views import TaskViewSet

router = SimpleRouter()  # ✅ Changed here
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]