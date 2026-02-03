from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from tasks.urls import router

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),

    path("api/", include(router.urls)),
    path('api/', include('teams.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('projects.urls')),
]
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )