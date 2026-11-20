from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def root_view(request):
    return JsonResponse({
        "status": "online",
        "service": "TaskFlow SaaS Backend API",
        "documentation": "/api/docs/",
        "admin": "/admin/"
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/', include('teams.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('projects.urls')),
    path('api/subscription/', include('subscription.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name= 'schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]