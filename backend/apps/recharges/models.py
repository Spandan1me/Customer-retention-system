from django.db import models
from django.conf import settings


class PackageFamily(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class PackagePrice(models.Model):
    family = models.ForeignKey(PackageFamily, on_delete=models.CASCADE, related_name='prices')
    speed_mbps = models.PositiveIntegerField()
    term_months = models.PositiveSmallIntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['family', 'speed_mbps', 'term_months']
        constraints = [
            models.UniqueConstraint(fields=['family', 'speed_mbps', 'term_months'], name='unique_package_price'),
        ]

    def __str__(self):
        return f"{self.family.name} {self.speed_mbps}Mbps / {self.term_months} months"

class Recharge(models.Model):
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='recharges')
    agent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='recorded_recharges')
    team_lead = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='team_recharges')
    supervisor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='supervisor_recharges')
    recharge_date = models.DateField()
    recharge_amount = models.DecimalField(max_digits=10, decimal_places=2)
    package = models.CharField(max_length=100)
    package_price = models.ForeignKey(PackagePrice, on_delete=models.SET_NULL, null=True, blank=True, related_name='recharges')
    term_months = models.PositiveSmallIntegerField(null=True, blank=True)
    recharge_method = models.CharField(max_length=50, default='Online Portal')
    verified = models.BooleanField(default=True)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='verified_recharges')
    recovered_revenue = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Recharge ${self.recharge_amount} for {self.customer.name} on {self.recharge_date}"
