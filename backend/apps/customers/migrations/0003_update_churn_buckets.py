from django.db import migrations, models


def remap_churn_buckets(apps, schema_editor):
    Customer = apps.get_model('customers', 'Customer')
    for customer in Customer.objects.all().iterator():
        days = customer.days_since_churn
        if days >= 366:
            bucket = '366+'
        elif days >= 181:
            bucket = '181-365'
        elif days >= 90:
            bucket = '90-180'
        elif days >= 60:
            bucket = '60-89'
        elif days >= 30:
            bucket = '30-59'
        else:
            bucket = '0-29'
        Customer.objects.filter(pk=customer.pk).update(churn_bucket=bucket)


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customer',
            name='churn_bucket',
            field=models.CharField(
                choices=[
                    ('0-29', '0 - 29 Days'),
                    ('30-59', '30 - 59 Days'),
                    ('60-89', '60 - 89 Days'),
                    ('90-180', '90 - 180 Days'),
                    ('181-365', '181 - 365 Days'),
                    ('366+', '366+ Days'),
                ],
                default='0-29',
                max_length=20,
            ),
        ),
        migrations.RunPython(remap_churn_buckets, migrations.RunPython.noop),
    ]