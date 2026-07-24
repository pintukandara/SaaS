from rest_framework import serializers
from .models import SubscriptionPlan,Organisation,Subscription,OrganisationMember,UsageTracking,Invoice
from users.serializers import UserListSerializer


# Subscription plan serializer

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'


class OrganisationSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    member_count = serializers.IntegerField(read_only=True)
    current_plan_name = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()

    class Meta:
        model = Organisation
        fields = ['id', 'name', 'slug', 'description', 'email', 'phone',
            'website', 'address', 'city', 'country', 'logo',
            'owner', 'owner_name', 'member_count',
            'current_plan_name', 'subscription_status',
            'is_active', 'created_at']
        read_only_fields = ['id','created_at',
                            'owner']
    def get_owner_name(self,obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.username
    
    def get_current_plan_name(self, obj):
        plan = obj.current_plan
        return plan.display_name if plan else 'No active plan'
    def get_subscription_status(self,obj):
        sub = obj.active_subscription
        return sub.status if sub else 'inactive'
    
class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.display_name', read_only=True)
    organisation_name = serializers.CharField(source='organisation.name', read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)


    class Meta:
        model = Subscription
        fields = [
                       'id', 'organisation', 'organisation_name',
            'plan', 'plan_name', 'status',
            'start_date', 'end_date', 'next_billing_date',
            'is_trial', 'trial_end_date', 'auto_renew',
            'days_remaining', 'created_at'
        ]
        read_only_fields = ['id','created_at']

class OrganisationMemberSerializer(serializers.ModelSerializer):
    user = UserListSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=False)
    organisation_name = serializers.CharField(source='organisation.name', read_only=True)
    invited_by_name = serializers.SerializerMethodField()


    class Meta:
        model = OrganisationMember

        fields = [
            'id', 'organization', 'organization_name',
            'user', 'user_id', 'role',
            'invited_by', 'invited_by_name',
            'invited_at', 'joined_at', 'is_active'
        ]
        read_only_fields = ['id','invited_by',
                            'joined_at'
                            ]
        
    def get_invited_by_name(self,obj):
        if obj.invited_by:
            return f"{obj.invited_by.first_name} {obj.invited_by.last_name}".strip() or obj.invited_by.username
        return None
    
class UsageTrackingSerializer(serializers.ModelSerializer):
    organisation_name = serializers.CharField(source='organisation.name', read_only=True)

    class Meta:
        model = UsageTracking
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']