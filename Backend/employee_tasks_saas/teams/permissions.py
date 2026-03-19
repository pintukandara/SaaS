from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminOrManagerCreateTeams(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False


        if request.method == 'POST':
            return user.role in ['admin', 'manager']

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user


        if request.method in ['PUT', 'PATCH']:
            return (
                user.role in ["manager", "admin"]

            )

        return True
