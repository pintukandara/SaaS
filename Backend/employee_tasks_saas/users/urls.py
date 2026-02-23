print("loading users urls")  # Keep your debug print

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserDetailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user-detail'),

]



# ## **Your URL Structure Should Be:**
# ```
# http://127.0.0.1:8000/api/auth/login/
# http://127.0.0.1:8000/api/auth/register/
# http://127.0.0.1:8000/api/auth/me/
#
# http://127.0.0.1:8000/api/departments/
# http://127.0.0.1:8000/api/teams/
# http://127.0.0.1:8000/api/teams/1/
#
# http://127.0.0.1:8000/api/tasks/
# http://127.0.0.1:8000/api/tasks/1/
# http://127.0.0.1:8000/api/tasks/my_tasks/
#
# http://127.0.0.1:8000/api/projects/
# http://127.0.0.1:8000/api/projects/1/