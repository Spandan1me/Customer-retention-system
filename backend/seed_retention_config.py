import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.followups.models import (
    RetentionCategory,
    RetentionDisposition,
    RetentionSubCategory,
)
from apps.followups.retention_config import RETENTION_CONFIG


category, _ = RetentionCategory.objects.get_or_create(name='Customer Retention')
RetentionDisposition.objects.filter(sub_category__category=category).delete()
RetentionSubCategory.objects.filter(category=category).delete()
for subcategory_name, dispositions in RETENTION_CONFIG.items():
    subcategory, _ = RetentionSubCategory.objects.get_or_create(
        category=category,
        name=subcategory_name,
    )
    for name, classification, priority, callback_days in dispositions:
        RetentionDisposition.objects.create(
            sub_category=subcategory,
            name=name,
            business_classification=classification,
            default_priority=priority,
            auto_callback_days=callback_days,
        )

print(f'Configured {sum(len(items) for items in RETENTION_CONFIG.values())} retention dispositions in {len(RETENTION_CONFIG)} subcategories.')
