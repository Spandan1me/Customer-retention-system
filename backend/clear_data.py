import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.admin.models import LogEntry
from django.contrib.sessions.models import Session
from apps.authentication.models import User, Organization, SupervisorTeam, TeamLeadAssignment
from apps.customers.models import Customer, AssignmentHistory, CustomerTimeline
from apps.followups.models import (
    CustomerFollowUp,
    RetentionCategory,
    RetentionSubCategory,
    RetentionDisposition,
)
from apps.recharges.models import Recharge
from apps.targets.models import Target
from apps.audit.models import AuditLog

def clear_all_users_and_data():
    print("=== Cleaning All Users and Application Data ===")

    # Delete transactional and relational data
    CustomerFollowUp.objects.all().delete()
    Recharge.objects.all().delete()
    CustomerTimeline.objects.all().delete()
    AssignmentHistory.objects.all().delete()
    Customer.objects.all().delete()

    # Delete hierarchy assignments and targets
    SupervisorTeam.objects.all().delete()
    TeamLeadAssignment.objects.all().delete()
    Target.objects.all().delete()
    AuditLog.objects.all().delete()
    LogEntry.objects.all().delete()
    Session.objects.all().delete()

    # Delete all users and organizations so manual setup starts from empty data.
    User.objects.all().delete()
    Organization.objects.all().delete()

    # Retention configuration is seeded application data too.
    RetentionDisposition.objects.all().delete()
    RetentionSubCategory.objects.all().delete()
    RetentionCategory.objects.all().delete()

    print("--> Successfully removed all users, organizations, customers, and application data.")
    print("--> No user account was recreated; create one manually.")
    print("=== Database Reset Complete ===")

if __name__ == '__main__':
    clear_all_users_and_data()
