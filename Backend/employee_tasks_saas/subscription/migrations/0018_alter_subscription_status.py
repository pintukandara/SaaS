from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscription', '0017_alter_subscription_end_date'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscription',
            name='status',
            field=models.CharField(
                choices=[
                    ('trial', 'Trial'),
                    ('pending', 'Pending'),
                    ('active', 'Active'),
                    ('past_due', 'Past Due'),
                    ('cancelled', 'Cancelled'),
                    ('expired', 'Expired'),
                ],
                default='trial',
                max_length=20,
            ),
        ),
    ]
