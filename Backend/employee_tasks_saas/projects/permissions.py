from rest_framework import permissions

class ProjectPermission(permissions.BasePermission):
    """
    - Admin: Full CRUD on projects
    - Manager: Can view projects assigned to them, update status
    - Employee: Can view projects they're part of (read-only)
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # GET - all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # POST (create) - Only Admin
        if request.method == 'POST':
            return request.user.role == 'admin'
        
        return True
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admin has full access
        if user.role == 'admin':
            return True
        
        # GET - Manager can view their projects
        if request.method in permissions.SAFE_METHODS:
            if user.role == 'manager':
                return obj.owner == user or (obj.team and obj.team.manager == user)
            # Employee can view projects they're part of via team
            return obj.team and obj.team.members.filter(user=user).exists()
        
        # PUT/PATCH - Manager can update their projects (but not delete)
        if request.method in ['PUT', 'PATCH']:
            return user.role == 'manager' and obj.owner == user
        
        # DELETE - Only Admin
        if request.method == 'DELETE':
            return user.role == 'admin'
        
        return False