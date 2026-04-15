from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import CustomUser
from subscription.models import SubscriptionPlan,Organisation,OrganisationMember,Subscription,UsageTracking

class Command(BaseCommand):
    help = 'Create sample organisation with members'

    def handle(self, *args, **kwargs):
        # get or create plans first
        free_plan, _ = SubscriptionPlan.objects.get_or_create(
            name='free',
            defaults={
                'display_name': 'Free',
                'description': 'Free plan',
                'price': 0,
                'max_users': 3,
                'max_projects': 3,
                'max_tasks_per_month': 50,
            }
        )

        # Create owner
        owner , created = CustomUser.objects.get_or_create(
            username = 'pintu',
            defaults={
                'email': 'pintukandara124@gmail.com',
                'first_name': 'pintu',
                'last_name': 'kandara',
                'role': 'admin'
            }


        )
        if created:
            owner.set_password('owner123')
            owner.save()
            self.stdout.write(self.style.SUCCESS('✅ Created owner user'))

         # Create organisation
        org, created = Organisation.objects.get_or_create(
            slug='acme-corp',
            defaults={
                'name': 'Acme Corporation',
                'owner': owner,
                'email': 'contact@acme.com',
                'description': 'Sample organisation'
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Created organisation: {org.name}'))
            
            # Set owner's organisation
            owner.organisation = org
            owner.save()
            
            # Create owner membership
            OrganisationMember.objects.create(
                organisation=org,
                user=owner,
                role='owner'
            )
            
            # Create subscription
            Subscription.objects.create(
                organisation=org,
                plan=free_plan,
                status='trial',
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=14),
                is_trial=True,
                trial_end_date=timezone.now() + timedelta(days=14)
            )
            self.stdout.write(self.style.SUCCESS('✅ Created trial subscription'))

        # Create team members
        members_data = [
            {'username': 'pintu', 'first_name': 'pintu', 'role': 'manager'},
            {'username': 'pintu', 'first_name': 'pintu', 'role': 'employee'},
        ]

        for data in members_data:

            user ,created = CustomUser.objects.get_or_create(
                username=data['username'],
                defaults={
                    'email': f"{data['username']}@acme.com",
                    'first_name': data['first_name'],
                    'last_name': 'Smith',
                    'role': data['role'],
                    'organisation': org
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                
                OrganisationMember.objects.create(
                    organisation=org,
                    user=user,
                    role='member',
                    invited_by=owner
                )
                self.stdout.write(self.style.SUCCESS(f'✅ Created team member: {user.email}'))

        self.stdout.write(self.style.SUCCESS('\n🎉 Sample organisation created!'))
        self.stdout.write(self.style.SUCCESS(f'Organisation: {org.name}'))
        self.stdout.write(self.style.SUCCESS(f'Members: {org.member_count}'))
        self.stdout.write(self.style.SUCCESS('\nLogin credentials:'))
        self.stdout.write(self.style.SUCCESS('  owner / owner123'))
        self.stdout.write(self.style.SUCCESS('  alice / password123'))
        self.stdout.write(self.style.SUCCESS('  bob / password123'))


