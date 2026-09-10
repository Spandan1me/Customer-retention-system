from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0003_update_churn_buckets'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='retention_workflow',
            field=models.CharField(
                choices=[
                    ('CHURN_FOLLOW_UP', 'Churn Follow Up'),
                    ('PRE_DISCONNECTION_FOLLOW_UP', 'Pre Disconnection Follow Up'),
                    ('DEALER_FOLLOW_UP', 'Dealer Follow Up'),
                ],
                default='CHURN_FOLLOW_UP',
                max_length=40,
            ),
        ),
    ]