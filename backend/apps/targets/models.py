from django.db import models
from django.conf import settings

class TargetType(models.TextChoices):
    ORGANIZATION = 'ORG', 'Organization'
    SUPERVISOR = 'SUPERVISOR', 'Supervisor'
    TEAM_LEAD = 'TEAM_LEAD', 'Team Lead'
    AGENT = 'AGENT', 'Agent'

class PeriodType(models.TextChoices):
    DAILY = 'DAILY', 'Daily'
    WEEKLY = 'WEEKLY', 'Weekly'
    MONTHLY = 'MONTHLY', 'Monthly'

class Target(models.Model):
    target_type = models.CharField(max_length=20, choices=TargetType.choices, default=TargetType.AGENT)
    assigned_to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='targets', null=True, blank=True)
    period_type = models.CharField(max_length=10, choices=PeriodType.choices, default=PeriodType.DAILY)
    start_date = models.DateField()
    end_date = models.DateField()
    target_recharges = models.IntegerField(default=10)
    target_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.target_type} Target ({self.period_type}): {self.target_recharges} recharges"
