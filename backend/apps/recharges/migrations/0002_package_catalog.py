from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('recharges', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PackageFamily',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='PackagePrice',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('speed_mbps', models.PositiveIntegerField()),
                ('term_months', models.PositiveSmallIntegerField()),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('is_active', models.BooleanField(default=True)),
                ('family', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='prices', to='recharges.packagefamily')),
            ],
            options={
                'ordering': ['family', 'speed_mbps', 'term_months'],
                'constraints': [models.UniqueConstraint(fields=('family', 'speed_mbps', 'term_months'), name='unique_package_price')],
            },
        ),
        migrations.AddField(
            model_name='recharge',
            name='package_price',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='recharges', to='recharges.packageprice'),
        ),
        migrations.AddField(
            model_name='recharge',
            name='term_months',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]