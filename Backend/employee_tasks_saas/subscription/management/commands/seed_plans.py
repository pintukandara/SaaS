from django.core.management.base import BaseCommand
from subscription.models import SubscriptionPlan

class Command(BaseCommand):
    help = "Seed initial subscription plans"

    def handle(self, *args, **options):
        plans = [
            {
                'name': 'free',
                'display_name': 'Free',
                'description': 'Perfect for trying out TaskFlow',
                'price': 0.00,
                'max_users': 3,
                'max_projects': 3,
                'max_tasks_per_month': 50,

                'max_storage_mb': 500,
                'has_advanced_analytics': False,
                'has_priority_support': False,
                'has_api_access': False,
                'has_custom_branding': False,
                'has_sso': False,
                'razorpay_plan_id': None
            },
            {
                'name': 'starter',
                'display_name': 'Starter',
                'description': 'Ideal for small teams getting started with TaskFlow',
                'price': 9.99,
                'max_users': 10,
                'max_projects': 20,
                'max_tasks_per_month': 500,
                'max_storage_mb': 2000,
                'has_advanced_analytics': False,
                'has_priority_support': True,
                'has_api_access': True,
                'has_custom_branding': False,
                'has_sso': False,
                'razorpay_plan_id': 'plan_TKpW36P92xwj1p'
            },
            {
                'name': 'professional',
                'display_name': 'Professional',
                'description': 'Best for growing teams that need more features and support',
                'price': 29.99,
                'max_users': 50,
                'max_projects': 100,
                'max_tasks_per_month': 5000,
                'max_storage_mb': 10000,
                'has_advanced_analytics': True,
                'has_priority_support': True,
                'has_api_access': True,
                'has_custom_branding': True,
                'has_sso': False,
                'razorpay_plan_id': 'plan_TKpZAxbMnAVXWH'
            },
            {
                'name': 'enterprise',
                'display_name': 'Enterprise',
                'description': 'Custom solutions for large organizations with specific needs',
                'price': 99.99,  # Placeholder price, typically custom
                'max_users': 1000,  # Placeholder, typically custom
                'max_projects': 1000,  # Placeholder, typically custom
                'max_tasks_per_month': 100000,  # Placeholder, typically custom
                'max_storage_mb': 100000,  # Placeholder, typically custom
                'has_advanced_analytics': True,
                'has_priority_support': True,
                'has_api_access': True,
                'has_custom_branding': True,
                'has_sso': True,
                'razorpay_plan_id': 'plan_TKpajCGmfjmWGm'

            }
        ]

        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Plan Created: {plan.display_name}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Plan Updated: {plan.display_name}"))

        self.stdout.write(self.style.SUCCESS('\nAll plans created/updated!'))

