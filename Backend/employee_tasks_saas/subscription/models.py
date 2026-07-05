from django.utils import timezone

from django.db import models
from django.conf import settings

# Create your models here.

class SubscriptionPlan(models.Model):
    # different subscription plans
    PLAN_TYPES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
    ]

    name = models.CharField(max_length=50, choices = PLAN_TYPES, unique= True)
    display_name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_period = models.CharField(max_length=20,default='monthly')  # e.g., 'monthly', 'yearly'

    # Features Limits 
    max_users = models.IntegerField(default=5)
    max_projects = models.IntegerField(default=10)
    max_storage_mb = models.IntegerField(default=1024)  # Storage limit in MB


    # Feature flags
    has_advanced_analytics = models.BooleanField(default=False)
    has_priority_support = models.BooleanField(default=False)
    has_api_access = models.BooleanField(default=False)
    has_custom_branding = models.BooleanField(default=False)
    has_sso = models.BooleanField(default=False)  # Single Sign-On
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    max_tasks_per_month = models.IntegerField(default=1000)  # Example of a specific feature limit
    
    class Meta:
        ordering = ['price']
    
    def __str__(self):
        return f"{self.display_name} - ${self.price}/{self.billing_period}"



class Organisation(models.Model):
    # companies and organisation that subscribe to the service
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique= True)
    description = models.TextField(blank=True, null=True)

    # Owner (admin who created the organisation)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_organisation'
    )

    # Contact info
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)

    # Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)

     # Branding
    logo = models.ImageField(upload_to='organisation/logos/', blank=True, null=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Organisation' 
        verbose_name_plural = 'Organisations' 
    
    def __str__(self):
        return self.name
    
    @property
    def active_subscription(self):
        return self.subscription.filter(status = 'active',
                                        end_date__gte = timezone.now()).first()
    
    @property
    def current_plan(self):
        sub = self.active_subscription
        if sub:
            return sub.plan
        return None
    
    @property
    def member_count(self):
        return self.member.count()
    
class Subscription(models.Model):
        STATUS_CHOICES = [
        ('trial', 'Trial'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
        organisation = models.ForeignKey(Organisation,on_delete=models.CASCADE, related_name = 'subscription')
        plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
        status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='trial')

        # Billing

        start_date = models.DateTimeField()
        end_date = models.DateTimeField()
        next_billing_date = models.DateTimeField(default=None, null=True, blank=True)


        # Trial
        is_trial = models.BooleanField(default=False)
        trial_end_date = models.DateTimeField(null=True, blank=True)

        # payment details
        razorpay_subscription_id = models.CharField(max_length=255,blank=True)
        razorpay_customer_id = models.CharField(max_length=255,blank=True)


        # Auto - renewal
        auto_renew = models.BooleanField(default=True)

        created_at = models.DateTimeField(auto_now_add=True)
        updated_at = models.DateTimeField(auto_now=True)

        class Meta:
            ordering = ['-created_at']
        
        def __str__(self):
            return f"{self.organisation.name} - {self.plan.display_name} ({self.status})"
        
        def is_active(self):
            return self.status == 'active' and self.end_date >= timezone.now()
        
        def days_remaining(self):
            if self.end_date >= timezone.now():
                return (self.end_date - timezone.now()).days
            
            return 0
        
        def can_use_features(self):
            return self.is_active() or self.is_trial
        
class OrganisationMember(models.Model):
            ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]
            organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='member')
            user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organisation_memberships')
            role = models.CharField(max_length=20, choices=ROLE_CHOICES,default= 'member')

            # Invitation

            invited_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name='invited_members')
            invited_at = models.DateTimeField(auto_now_add=True)
            joined_at = models.DateTimeField(null=True, blank=True)
    
            is_active = models.BooleanField(default=True)
            class Meta:
                unique_together = ['organisation', 'user']
                ordering = ['-joined_at']
                verbose_name = 'Organisation Member' 
                verbose_name_plural = 'Organisation Members' 
            def __str__(self):
                return f"{self.user.username} - {self.organisation.name} ({self.role})"
            
    
class UsageTracking(models.Model):
    """Track usage for billing and limits"""
    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name='usage_records'
    )
    
    # Period
    year = models.IntegerField()
    month = models.IntegerField()
    
    # Usage metrics
    tasks_created = models.IntegerField(default=0)
    projects_created = models.IntegerField(default=0)
    storage_used_mb = models.FloatField(default=0.0)
    api_calls = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['organisation', 'year', 'month']
        ordering = ['-year', '-month']
    
    def __str__(self):
        return f"{self.organisation.name} - {self.year}/{self.month}"


class Invoice(models.Model):
    """Billing invoices"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.SET_NULL,
        null=True,
        related_name='invoices'
    )
    
    invoice_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Dates
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Payment
    razorpay_invoice_id = models.CharField(max_length=255, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.invoice_number} - {self.organisation.name}"

    


        