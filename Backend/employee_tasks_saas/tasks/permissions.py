from rest_framework import permissions


class TaskPermission(permissions.BasePermission):
    """
    Custom permission for tasks:
    - Admin: Full access to all tasks
    - Manager: Can create/edit/delete tasks in their projects/teams
    - Employee: Can view assigned tasks and update status only
    """

    def has_permission(self, request, view):
        # Everyone must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        # GET requests (listing/viewing) - all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True

        # POST (create) - Only Admin and Manager
        if request.method == 'POST':
            return request.user.role in ['admin', 'manager']

        # For other methods (PUT, PATCH, DELETE), check object permissions
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin has full access
        if user.role == 'admin':
            return True

        # GET (view) - everyone can view their tasks
        if request.method in permissions.SAFE_METHODS:
            # Employees see tasks assigned to them
            if user.role == 'employee':
                return obj.assigned_to == user
            # Managers see tasks in their teams/projects
            elif user.role == 'manager':
                # Manager created it or manages the project/team
                return (
                        obj.created_by == user or
                        (obj.project and obj.project.owner == user) or
                        (obj.assigned_to and obj.assigned_to.team_memberships.filter(team__manager=user).exists())
                )

        # PUT/PATCH (update)
        if request.method in ['PUT', 'PATCH']:
            # Admin can update anything
            if user.role == 'admin':
                return True

            # Manager can update tasks they created or in their projects
            if user.role == 'manager':
                return (
                        obj.created_by == user or
                        (obj.project and obj.project.owner == user)
                )

            # Employee can only update status of their assigned tasks
            if user.role == 'employee':
                # Check if updating only allowed fields
                return obj.assigned_to == user

        # DELETE - Only Admin and task creator (if manager)
        if request.method == 'DELETE':
            return user.role == 'admin' or (user.role == 'manager' and obj.created_by == user)

        return False


class CanUpdateTaskStatus(permissions.BasePermission):
    """
    Employees can update task status, but not other fields
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin and Manager can update anything
        if user.role in ['admin', 'manager']:
            return True

        # Employee can only update status
        if user.role == 'employee' and obj.assigned_to == user:
            # Check if only updating allowed fields
            allowed_fields = {'status', 'completed_at'}
            update_fields = set(request.data.keys())
            return update_fields.issubset(allowed_fields)

        return False