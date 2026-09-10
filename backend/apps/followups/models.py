from django.db import models
from django.conf import settings
from django.utils import timezone


def current_local_time():
    return timezone.localtime().time().replace(microsecond=0)

class BusinessClassification(models.TextChoices):
    POSITIVE_INTENT = 'POSITIVE_INTENT', 'Positive Intent'
    BARRIER = 'BARRIER', 'Barrier / Financial'
    SERVICE_ISSUE = 'SERVICE_ISSUE', 'Service Issue'
    COMPETITOR_LOSS = 'COMPETITOR_LOSS', 'Competitor Loss'
    SUCCESS = 'SUCCESS', 'Success / Verify Recharge'
    INVALID = 'INVALID', 'Invalid'
    UNREACHABLE = 'UNREACHABLE', 'Unreachable'
    OTHER = 'OTHER', 'Other'

class PriorityLevel(models.TextChoices):
    CRITICAL = 'CRITICAL', 'Critical'
    HIGH = 'HIGH', 'High'
    MEDIUM = 'MEDIUM', 'Medium'
    LOW = 'LOW', 'Low'

class RetentionCategory(models.Model):
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class RetentionSubCategory(models.Model):
    category = models.ForeignKey(RetentionCategory, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.category.name} -> {self.name}"

class RetentionDisposition(models.Model):
    sub_category = models.ForeignKey(RetentionSubCategory, on_delete=models.CASCADE, related_name='dispositions')
    name = models.CharField(max_length=150)
    business_classification = models.CharField(max_length=30, choices=BusinessClassification.choices, default=BusinessClassification.OTHER)
    default_priority = models.CharField(max_length=20, choices=PriorityLevel.choices, default=PriorityLevel.MEDIUM)
    auto_callback_days = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} [{self.business_classification}]"

class NextActionChoice(models.TextChoices):
    CALL_AGAIN = 'CALL_AGAIN', 'Call Again'
    VERIFY_RECHARGE = 'VERIFY_RECHARGE', 'Verify Recharge'
    ESCALATE_SERVICE = 'ESCALATE_SERVICE', 'Escalate Service Issue'
    SEND_OFFER = 'SEND_OFFER', 'Send Offer / Scheme'
    CONTACT_DEALER = 'CONTACT_DEALER', 'Contact Dealer'
    CLOSE_LOST = 'CLOSE_LOST', 'Close as Lost'

class CustomerFollowUp(models.Model):
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='followups')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_followups')
    call_date = models.DateField(default=timezone.localdate)
    call_time = models.TimeField(default=current_local_time)
    disposition = models.ForeignKey(RetentionDisposition, on_delete=models.PROTECT)
    notes = models.TextField()
    next_action = models.CharField(max_length=30, choices=NextActionChoice.choices, default=NextActionChoice.CALL_AGAIN)
    next_followup_date = models.DateField(null=True, blank=True)
    next_followup_time = models.TimeField(null=True, blank=True)
    previous_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Customer #{self.customer_id} Follow-up by {self.agent} on {self.call_date}"
