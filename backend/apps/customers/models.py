from django.db import models
from django.conf import settings

class CustomerStatus(models.TextChoices):
    NEW = 'NEW', 'New'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    NOT_CONTACTED = 'NOT_CONTACTED', 'Not Contacted'
    FOLLOWUP_PENDING = 'FOLLOWUP_PENDING', 'Follow-up Pending'
    CONTACTED = 'CONTACTED', 'Contacted'
    POSITIVE_INTENT = 'POSITIVE_INTENT', 'Positive Intent'
    READY_TO_RECHARGE = 'READY_TO_RECHARGE', 'Ready to Recharge'
    RECHARGED = 'RECHARGED', 'Recharged'
    LOST = 'LOST', 'Lost'
    INVALID = 'INVALID', 'Invalid'
    CLOSED = 'CLOSED', 'Closed'

class ChurnBucket(models.TextChoices):
    BUCKET_0_29 = '0-29', '0 - 29 Days'
    BUCKET_30_59 = '30-59', '30 - 59 Days'
    BUCKET_60_89 = '60-89', '60 - 89 Days'
    BUCKET_90_180 = '90-180', '90 - 180 Days'
    BUCKET_181_365 = '181-365', '181 - 365 Days'
    BUCKET_366_PLUS = '366+', '366+ Days'


class RetentionWorkflow(models.TextChoices):
    CHURN_FOLLOW_UP = 'CHURN_FOLLOW_UP', 'Churn Follow Up'
    PRE_DISCONNECTION_FOLLOW_UP = 'PRE_DISCONNECTION_FOLLOW_UP', 'Pre Disconnection Follow Up'
    DEALER_FOLLOW_UP = 'DEALER_FOLLOW_UP', 'Dealer Follow Up'

class RechargeStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    READY_TODAY = 'READY_TODAY', 'Ready Today'
    RECHARGED = 'RECHARGED', 'Recharged'
    NOT_RECHARGED = 'NOT_RECHARGED', 'Not Recharged'

class CustomerPriority(models.TextChoices):
    CRITICAL = 'CRITICAL', 'Critical'
    HIGH = 'HIGH', 'High'
    MEDIUM = 'MEDIUM', 'Medium'
    LOW = 'LOW', 'Low'

class Customer(models.Model):
    customer_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    mobile_number = models.CharField(max_length=20, db_index=True)
    alternate_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    area_location = models.CharField(max_length=100, blank=True, null=True)
    
    package = models.CharField(max_length=100)
    current_plan = models.CharField(max_length=100, blank=True, null=True)
    previous_recharge_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_recharge_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    retention_workflow = models.CharField(max_length=40, choices=RetentionWorkflow.choices, default=RetentionWorkflow.CHURN_FOLLOW_UP)
    days_since_churn = models.IntegerField(default=0)
    churn_bucket = models.CharField(max_length=20, choices=ChurnBucket.choices, default=ChurnBucket.BUCKET_0_29)

    customer_status = models.CharField(max_length=30, choices=CustomerStatus.choices, default=CustomerStatus.NEW, db_index=True)
    priority = models.CharField(max_length=20, choices=CustomerPriority.choices, default=CustomerPriority.MEDIUM, db_index=True)

    assigned_supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervisor_customers')
    assigned_team_lead = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_lead_customers')
    assigned_agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='agent_customers', db_index=True)
    assignment_date = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    last_contact_date = models.DateTimeField(blank=True, null=True)
    next_followup_date = models.DateField(blank=True, null=True, db_index=True)
    next_followup_time = models.TimeField(blank=True, null=True)
    
    latest_disposition = models.ForeignKey('followups.RetentionDisposition', on_delete=models.SET_NULL, null=True, blank=True)
    latest_note = models.TextField(blank=True, null=True)

    recharge_status = models.CharField(max_length=20, choices=RechargeStatus.choices, default=RechargeStatus.PENDING, db_index=True)
    recharge_date = models.DateField(blank=True, null=True, db_index=True)
    recharge_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    recovered_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer_id} - {self.name}"

class AssignmentHistory(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='assignment_history')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assignments_made')
    previous_agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='previous_assignments')
    new_agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='new_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

class CustomerTimeline(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='timeline')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    previous_status = models.CharField(max_length=50, blank=True, null=True)
    new_status = models.CharField(max_length=50, blank=True, null=True)
    disposition_name = models.CharField(max_length=150, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']


class CustomerRemark(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='remarks')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='customer_remarks')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
