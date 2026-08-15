from rest_framework import permissions
from users.models import CustomUser
from django.utils import timezone
from typing import cast
from projects.models import Project
from .models import UsageTracking

class HasActiveSubscription(permissions.BasePermission):
    # pehle Checck krunga ki company ka koi subscription plan hai ya ni
    # agar nhi toh message dunga
    message = "your company doesn't have any active subscription"

    def has_permission(self, request, view):
        # sabse pehle agar user exist nhi karta ya authenticated nhi hai toh false return karunga
        if not request.user or not request.user.is_authenticated:
            return False
        
        # agar user company se belong nhi karta toh permission nhi dunga
        user: CustomUser = cast(CustomUser, request.user)
        if not user.current_organisation:
            self.message = "You are not part of any organisation"
            return False
        
        # agar company ka koi active plan nhi hai toh access nhi dena
        org = user.current_organisation
        if not org.active_subscription:
            self.message =  f'Organisation {org.name} does not have active subscription'
            return False
        return True
    

class IsOrganisationOwner(permissions.BasePermission):
    # check karte hai ki agar user organisation ka owner toh nhi

    def has_object_permission(self, request, view, obj):
        org = obj if hasattr(obj, 'owner') else obj.organization
        user: CustomUser = cast(CustomUser, request.user)
        return org.owner == user
    
class IsOrganisationAdmin(permissions.BasePermission):
    # check karte hai ki agar user organisation ka owner ya admin hai ki nhi
    def has_object_permission(self, request, view, obj):
        from .models import OrganisationMember
        org = obj if hasattr(obj,'owner') else obj.organisation
        user: CustomUser = cast(CustomUser, request.user)

        if org.owner == user:
            return True

        membership = OrganisationMember.objects.filter(organisation = org,
                                                       user = user,
                                                       role__in = ['owner','admin'],
                                                       is_active = True
                                                       ).first()
        return membership is not None
    
class CanAccessFeature(permissions.BasePermission):
    # Check krenge ki organisation ke subscription pe specific feature accessible hai ya nhi

    feature_name = None
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        user: CustomUser = cast(CustomUser, request.user)
        org = user.current_organisation
        if not org:
            return False
        sub = org.active_subscription

        if not sub:
            return False
        
        if self.feature_name:
            return sub.can_use_features(self.feature_name)
        return True
    
class HasAdvancedAnalytics(CanAccessFeature):
    """Check if plan has advanced analytics"""
    feature_name = 'advanced_analytics'
        
        
class HasAPIAccess(CanAccessFeature):
    """Check if plan has API access"""
    feature_name = 'api_access'

class WithInUsageLimits(permissions.BasePermission):

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        user: CustomUser = cast(CustomUser, request.user)

        org = user.current_organisation
        if not org:
            return False

        sub = org.active_subscription
        if not sub:
            return True

        plan = sub.plan

        # Check user limit
        if org.member_count >= plan.max_users:
            self.message = f"User limit reached ({plan.max_users} users max)"
            return False

        return True


class WithInProjectLimit(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if getattr(view, 'action', None) != 'create':
            return True

        user: CustomUser = cast(CustomUser, request.user)
        org = user.current_organisation
        if not org:
            return False
        sub = org.active_subscription
        if not sub:
            return False

        plan = sub.plan

        project_count = Project.objects.filter(owner__current_organisation=org).count()
        if project_count >= plan.max_projects:
            self.message = f"Project limit reached ({plan.max_projects} projects max)"
            return False
        return True


class WithInTaskLimit(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if getattr(view, 'action', None) != 'create':
            return True

        user: CustomUser = cast(CustomUser, request.user)
        org = user.current_organisation
        if not org:
            return False
        sub = org.active_subscription
        if not sub:
            return False

        plan = sub.plan

        now = timezone.now()
        usage = UsageTracking.objects.filter(
            organisation=org,
            year=now.year,
            month=now.month,
        ).first()
        task_count = usage.tasks_created if usage else 0
        if task_count >= plan.max_tasks_per_month:
            self.message = f"Task limit reached {plan.max_tasks_per_month} tasks per month max"
            return False
        return True
        