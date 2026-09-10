from django.db import migrations, models
from django.utils.timezone import localdate
from apps.followups.models import current_local_time


class Migration(migrations.Migration):

    dependencies = [
        ('followups', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customerfollowup',
            name='call_date',
            field=models.DateField(default=localdate),
        ),
        migrations.AlterField(
            model_name='customerfollowup',
            name='call_time',
            field=models.TimeField(default=current_local_time),
        ),
    ]