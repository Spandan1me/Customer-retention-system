import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.recharges.models import PackageFamily, PackagePrice
from apps.recharges.package_catalog import PACKAGE_CATALOG, TERM_MONTHS


for family_name, speeds in PACKAGE_CATALOG.items():
    family, _ = PackageFamily.objects.get_or_create(name=family_name)
    for speed_mbps, prices in speeds.items():
        for term_months, amount in zip(TERM_MONTHS, prices):
            PackagePrice.objects.update_or_create(
                family=family,
                speed_mbps=speed_mbps,
                term_months=term_months,
                defaults={'amount': amount, 'is_active': True},
            )

print(f'Configured {PackageFamily.objects.count()} package families and {PackagePrice.objects.count()} package prices.')