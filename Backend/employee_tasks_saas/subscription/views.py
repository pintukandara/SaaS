from datetime import timedelta

from .models import SubscriptionPlan,Organisation,OrganisationMember,Subscription,UsageTracking
from rest_framework.permissions import IsAuthenticated
from .serializers import SubscriptionPlanSerializer,OrganisationMemberSerializer,OrganisationSerializer,SubscriptionSerializer,UsageTrackingSerializer

from django.shortcuts import render
from rest_framework import viewsets
from django.db.models import Q
from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.decorators import action
from .permissions import IsOrganisationOwner,HasActiveSubscription

# Create your views here.
class SubscriptionPlanViewSet(viewsets.ReadOnlyModelViewSet):
    # Viewset for listing subscription plans
    queryset = SubscriptionPlan.objects.filter(is_active= True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [] #Allow anyone to view Subscription Plans





class OrganisationViewSet(viewsets.ModelViewSet):
    serializer_class = OrganisationSerializer
    permission_classes = [IsAuthenticated]

    # getting organizations where the user is a member or owner
    def get_queryset(self):
        user = self.request.user
        return Organisation.objects.filter(
            Q(owner=user) | 
            Q(member__user=user) | 
            Q(member__is_active=True)
            ).distinct()
    
    def perform_create(self,serializer):
        org = serializer.save(owner = self.request.user)
        # Automatically add the creator as an active member of the organization

        # Add member to the organisation
        OrganisationMember.objects.create(
            organisation = org,
            user = self.request.user,
            role = 'owner',
            is_active = True,
            joined_at = timezone.now())
        
        self.request.user.current_organisation = org
        self.request.user.save()


        # Create a free Trial Subscription for new organisation

        free_trial = SubscriptionPlan.objects.filter(name = 'free').first()
        if free_trial:
            Subscription.objects.create(
                organisation = org,
                plan = free_trial,
                status = 'trial',
                start_date  = timezone.now(),
                end_date = timezone.now() + timezone.timedelta(days=14),
                is_trial = True,
                trial_end_date = timezone.now() + timezone.timedelta(days=14)

            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def invite_member(self,request,pk=None):
    #    invite a member to the organisation
        org = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', 'member')

        if not email:
            return Response(
                {'error': 'email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from users.models import CustomUser
        try:
            user = CustomUser.objects.get(email = email)
            if user.get_organisation:
                return Response(
                    {'error': 'User is already a member of another organization'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except CustomUser.DoesNotExist:
            return Response(
                {
                    'error': 'User with this email does not exist'},
                    status=status.HTTP_404_NOT_FOUND
                
            )
        # Add user to the organisation
        user.organization = org
        user.save()

        OrganisationMember.objects.create(
            organization=org,
            user=user,
            role=role,
            invited_by=request.user,
        )
        return Response(
            {'message': f'User {user.email} added to organization'},
            status=status.HTTP_201_CREATED
        )
    @action(detail=True, methods=['post'], url_path='leave-organisation') 
    def leave_organisation(self,request,pk=None):
        org = self.get_object()
        if org.owner == request.user:
            return Response({"message":"Owner cannot leave the organisation please transfer ownwership to anyone "},status = status.HTTP_400_BAD_REQUEST)
        request.user.current_organisation = None
        request.user.save()
        # Delete membership from organisation

        OrganisationMember.objects.filter(organisation = org,user = request.user).delete()

        return Response({"message":"You have left the organisation"},status = status.HTTP_200_OK)
    

    @action(detail=True,methods= ['post'])
    def transform_ownership(self, request, pk=None):
        org = self.get_object()

        if org.owner != request.user:
            return Response({"message":"Only owner can transfer ownership"},status=status.HTTP_400_BAD_REQUEST)
        # Get new owner id from request data
        new_owner_id = request.data.get('new_owner_id')


        try:
            membership = OrganisationMember.objects.get(organisation = org,user_id = new_owner_id)
#  setting new owner
            new_member = membership.user
            org.owner = new_member
            org.save()

            # Update membership role
            membership.role = 'owner'
            membership.save()

            return Response({"message":f"Ownership transferred to {new_member.email}"},status=status.HTTP_200_OK)

        except OrganisationMember.DoesNotExist:
            return Response(
                {'error': 'New owner must be a member of the organization'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
    

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk= None):
        org = self.get_object()
        user_id = request.data.get('user_id')
        if org.owner != request.user | request.user.role != 'admin':
            return Response({"message":"Only owner or admin can remove members"},status=status.HTTP_400_BAD_REQUEST)
        
        try:
            membership = OrganisationMember.objects.get(organisation = org,user_id =user_id)
            if membership.user == org.owner:
                return Response(
                    {"message":"Owner cannot be removed from the organisation"},
                    status=status.HTTP_400_BAD_REQUEST
                    )
            # remove organisation from user's current organisation
            user = membership.user
            user.current_organisation = None
            user.save()

            # delete membership

            membership.delete()

            return Response({"message":f"User {membership.user.email} removed from organization"},status=status.HTTP_200_OK)
        except OrganisationMember.DoesNotExist:
            return Response(
                {'error': 'User is not a member of the organization'},
                status=status.HTTP_400_BAD_REQUEST
            )
    @action(detail=False, methods=['get'], url_path='my-organisation')
    def my_organisation(self, request):
        
        if not request.user.current_organisation:
            return Response(
                {
                    'error': 'You are not part of any organisation',
                    'message': 'Create an organisation to get started',
                    'has_organisation': False
                },
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = OrganisationSerializer(request.user.current_organisation)
        return Response(serializer.data)
    

    @action(detail=True, methods=['delete'], url_path='delete-organisation')  # ✅ CHANGED
    def delete_organisation(self, request, pk=None):  # ✅ CHANGED
        """Delete organisation (owner only)"""
        org = self.get_object()
        
        from users.models import CustomUser
        CustomUser.objects.filter(organization=org).update(organization=None)
        
        org_name = org.name
        org.delete()
        
        return Response({
            'message': f'Organisation "{org_name}" deleted successfully'
        })
    


    

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.current_organisation:
            return Subscription.objects.filter(organisation = user.current_organisation)
        return Subscription.objects.none()
    

    @action(detail=False, methods=['post'])
    def current(self,request):
        user = request.user
        if not user.current_organisation:
            return Response({'error':'User is not part of any organization'},status = status.HTTP_400_BAD_REQUEST)
        sub = user.current_organisation.active_subscription
        if not sub:
            return Response({'error':'No active subscription found'},status = status.HTTP_404_NOT_FOUND)
        
        return Response(SubscriptionSerializer(sub).data)
    
    @action(detail=False, methods=['post'],permission_classes= [IsAuthenticated,IsOrganisationOwner])
    def upgrade(self,request):
        org = request.user.current_organisation

        if not org:
            return Response(
                {'error': 'No organization selected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        plan_id = request.data.get('plan_id')
        try:
            new_plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )
         # Cancel current subscription
        current_sub = org.active_subscription
        if current_sub:
            current_sub.status = 'cancelled'
            current_sub.save()
        
        # Create new subscription
        new_sub = Subscription.objects.create(
            organization=org,
            plan=new_plan,
            status='active',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=30),  # Monthly
            is_trial=False
        )
        
        return Response({
            'message': f'Upgraded to {new_plan.display_name}',
            'subscription': SubscriptionSerializer(new_sub).data
        })
    
        
        
class UsageTrackingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UsageTrackingSerializer
    permission_classes = [IsAuthenticated, HasActiveSubscription]

    def get_queryset(self):
        if self.request.user.current_organization:
            return UsageTracking.objects.filter(
                organization=self.request.user.current_organization
            )
        return UsageTracking.objects.none()
    
    @action(detail=False, methods=['get'])
    def current_month(self, request):
        """Get current month usage"""
        org = request.user.current_organization
        if not org:
            return Response({'error': 'No organization'}, status=status.HTTP_400_BAD_REQUEST)
        
        now = timezone.now()
        usage, _ = UsageTracking.objects.get_or_create(
            organization=org,
            year=now.year,
            month=now.month
        )
        # Get limits from plan
        sub = org.active_subscription
        limits = {
            'tasks_limit': sub.plan.max_tasks_per_month,
            'projects_limit': sub.plan.max_projects,
            'storage_limit_mb': sub.plan.max_storage_mb,
            'users_limit': sub.plan.max_users,
        } if sub else {}
        
        data = UsageTrackingSerializer(usage).data
        data['limits'] = limits
        data['current_users'] = org.member_count
        
        return Response(data)
    