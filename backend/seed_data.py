from apps.followups.retention_config import RETENTION_CONFIG
from apps.recharges.package_catalog import PACKAGE_CATALOG, TERM_MONTHS
from apps.audit.models import AuditLog
from apps.targets.models import Target, TargetType, PeriodType
from apps.recharges.models import Recharge, PackageFamily, PackagePrice
from apps.customers.models import (
    Customer, CustomerStatus, ChurnBucket, RechargeStatus, CustomerPriority,
    CustomerTimeline, AssignmentHistory
)
from apps.followups.models import (
    RetentionCategory, RetentionSubCategory, RetentionDisposition,
    BusinessClassification, PriorityLevel, CustomerFollowUp
)
from apps.authentication.models import User, Organization, UserRole, SupervisorTeam, TeamLeadAssignment
import os
import random
from datetime import timedelta

import django
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()


def seed_database():
    print("=== Starting ISP Customer Retention System Data Seed ===")

    # 1. Organization
    org, _ = Organization.objects.get_or_create(
        slug='apex-fiber-isp',
        defaults={'name': 'Apex Fiber ISP'}
    )
    print(f"--> Organization: {org.name}")

    # 2. Keep only the super admin account in this local setup.
    User.objects.filter(organization=org).exclude(username='admin').delete()

    admin_user, _ = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@apexfiber.com',
            'first_name': 'Super',
            'last_name': 'Admin',
            'role': UserRole.SUPER_ADMIN,
            'organization': org
        }
    )
    admin_user.set_password('admin123')
    admin_user.save()
    print("--> Only Super Admin remains active: admin (Password: admin123)")

    # Keep the remaining role structures empty for this trimmed environment.
    supervisors = []
    team_leads = []
    agents = []

    # 3. Retention Categories & Dispositions Hierarchy
    cat, _ = RetentionCategory.objects.get_or_create(name="Customer Retention")

    dispositions_seed = [
        # CONTACT / UNREACHABLE
        ("CONTACT / UNREACHABLE", "Call not receive, connected",
         BusinessClassification.UNREACHABLE, PriorityLevel.LOW, 1),
        ("CONTACT / UNREACHABLE", "No Response",
         BusinessClassification.UNREACHABLE, PriorityLevel.LOW, 1),
        ("CONTACT / UNREACHABLE", "Invalid Number",
         BusinessClassification.INVALID, PriorityLevel.LOW, 0),
        ("CONTACT / UNREACHABLE", "Customer is out of home",
         BusinessClassification.UNREACHABLE, PriorityLevel.LOW, 2),
        ("CONTACT / UNREACHABLE", "Busy Need to call back later",
         BusinessClassification.UNREACHABLE, PriorityLevel.MEDIUM, 0),

        # TIMING / FOLLOW-UP
        ("TIMING / FOLLOW-UP", "Due to exam",
         BusinessClassification.BARRIER, PriorityLevel.MEDIUM, 7),
        ("TIMING / FOLLOW-UP", "Will recharge after 7 days",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.MEDIUM, 7),
        ("TIMING / FOLLOW-UP", "Interested callback required",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.HIGH, 0),
        ("TIMING / FOLLOW-UP", "Interested will recharge soon",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.HIGH, 2),
        ("TIMING / FOLLOW-UP", "Ready To recharge today",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.CRITICAL, 0),
        ("TIMING / FOLLOW-UP", "Ready To recharge within 3 days",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.HIGH, 3),
        ("TIMING / FOLLOW-UP", "Ready To recharge within 7 days",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.MEDIUM, 7),
        ("TIMING / FOLLOW-UP", "Will confirm later",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.MEDIUM, 3),

        # SERVICE / TECHNICAL
        ("SERVICE / TECHNICAL", "Denied due to bad service",
         BusinessClassification.SERVICE_ISSUE, PriorityLevel.HIGH, 1),
        ("SERVICE / TECHNICAL", "Denied due to late service",
         BusinessClassification.SERVICE_ISSUE, PriorityLevel.HIGH, 1),
        ("SERVICE / TECHNICAL", "Denied due to drop wire charge policy",
         BusinessClassification.SERVICE_ISSUE, PriorityLevel.HIGH, 2),
        ("SERVICE / TECHNICAL", "Untag Issue",
         BusinessClassification.SERVICE_ISSUE, PriorityLevel.MEDIUM, 2),
        ("SERVICE / TECHNICAL", "Upgrade / Downgrade request",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.HIGH, 1),
        ("SERVICE / TECHNICAL", "Process for router refund",
         BusinessClassification.SERVICE_ISSUE, PriorityLevel.LOW, 5),
        ("SERVICE / TECHNICAL", "Customer suggest to router refund",
         BusinessClassification.SERVICE_ISSUE, PriorityLevel.LOW, 5),

        # COMPETITION / OTHER ISP
        ("COMPETITION / OTHER ISP", "Other Isp using (12M plan)",
         BusinessClassification.COMPETITOR_LOSS, PriorityLevel.LOW, 0),
        ("COMPETITION / OTHER ISP", "Other Isp using (6M plan)",
         BusinessClassification.COMPETITOR_LOSS, PriorityLevel.LOW, 0),
        ("COMPETITION / OTHER ISP", "Customer denied due to higher pricing than other ISPs",
         BusinessClassification.COMPETITOR_LOSS, PriorityLevel.MEDIUM, 3),

        # CUSTOMER / ACCOUNT STATUS
        ("CUSTOMER / ACCOUNT STATUS", "Multiple Connection of Dishhome Internet",
         BusinessClassification.BARRIER, PriorityLevel.LOW, 0),
        ("CUSTOMER / ACCOUNT STATUS", "Non fibernet User (Invalid KYC)",
         BusinessClassification.INVALID, PriorityLevel.LOW, 0),
        ("CUSTOMER / ACCOUNT STATUS", "Router already collected - not at customer site",
         BusinessClassification.BARRIER, PriorityLevel.LOW, 0),
        ("CUSTOMER / ACCOUNT STATUS", "Router Collected By Dealer",
         BusinessClassification.BARRIER, PriorityLevel.LOW, 0),
        ("CUSTOMER / ACCOUNT STATUS", "Already Recharged",
         BusinessClassification.SUCCESS, PriorityLevel.CRITICAL, 0),
        ("CUSTOMER / ACCOUNT STATUS", "Financial Issue",
         BusinessClassification.BARRIER, PriorityLevel.MEDIUM, 7),
        ("CUSTOMER / ACCOUNT STATUS", "Insufficient fund will recharge soon",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.MEDIUM, 3),

        # OFFER / SALES
        ("OFFER / SALES", "Customer wants additional offer",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.HIGH, 1),
        ("OFFER / SALES", "Informed about Scheme and target",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.MEDIUM, 2),
        ("OFFER / SALES", "Informed about Recharge request",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.MEDIUM, 2),
        ("OFFER / SALES", "Will contact dealer",
         BusinessClassification.POSITIVE_INTENT, PriorityLevel.MEDIUM, 3),
        ("OFFER / SALES", "Inactive Sub-Dealer",
         BusinessClassification.OTHER, PriorityLevel.LOW, 0),
    ]

    disp_objects = []
    for subcategory_name, name, classification, priority, days in dispositions_seed:
        subcat, _ = RetentionSubCategory.objects.get_or_create(
            category=cat, name=subcategory_name)
        d, _ = RetentionDisposition.objects.get_or_create(
            sub_category=subcat,
            name=name,
            defaults={
                'business_classification': classification,
                'default_priority': priority,
                'auto_callback_days': days
            }
        )
        disp_objects.append(d)

    print(
        f"--> Configured {len(disp_objects)} Dispositions with Business Intelligence")

    # Replace the legacy flat seed with the source-of-truth three-level hierarchy.
    # Clear dependent follow-up history first so the disposition cleanup is idempotent.
    CustomerFollowUp.objects.all().delete()
    RetentionDisposition.objects.filter(sub_category__category=cat).delete()
    RetentionSubCategory.objects.filter(category=cat).delete()
    disp_objects = []
    for subcategory_name, disposition_items in RETENTION_CONFIG.items():
        subcat, _ = RetentionSubCategory.objects.get_or_create(
            category=cat, name=subcategory_name)
        for name, classification, priority, days in disposition_items:
            disp_objects.append(RetentionDisposition.objects.create(
                sub_category=subcat,
                name=name,
                business_classification=classification,
                default_priority=priority,
                auto_callback_days=days,
            ))
    print(
        f"--> Configured {len(disp_objects)} Dispositions across {len(RETENTION_CONFIG)} Subcategories")

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
    print(
        f"--> Configured {PackageFamily.objects.count()} package families and {PackagePrice.objects.count()} renewal prices")

    # 4. Generate Targets
    for ag in agents:
        Target.objects.get_or_create(
            assigned_to_user=ag,
            period_type=PeriodType.DAILY,
            defaults={
                'target_type': TargetType.AGENT,
                'start_date': timezone.now().date(),
                'end_date': timezone.now().date(),
                'target_recharges': random.randint(8, 15),
                'target_revenue': 12000.00
            }
        )
    print("--> Set Daily Targets for 60 Agents")

    # 5. Generate 500+ Realistic Churned Customers & Follow-ups
    packages = ["Fiber 50Mbps", "Fiber 100Mbps",
                "Gaming Fiber 200Mbps", "Enterprise 500Mbps"]
    locations = ["North Zone", "South Zone", "East Zone",
                 "West Zone", "Central Business District"]
    names_pool = ["Aarav Sharma", "Bikram Thapa", "Chandra Gurung", "Deepak Rai", "Elina Shrestha",
                  "Farhan Khan", "Gita Adhikari", "Hari Tamang", "Ishwar Karki", "Jyoti Joshi",
                  "Kiran Maharjan", "Laxmi Bhandari", "Manish Khadka", "Nabin Gautam", "Oshin Lama",
                  "Pradeep Basnet", "Roshani Giri", "Suman Khatiwada", "Trishna Regmi", "Umesh Neupane"]

    today = timezone.now().date()
    created_customers = 0

    for i in range(1, 501):
        cid = f"CUST-2026-{i:04d}"
        cust_name = f"{random.choice(names_pool)} #{i}"
        agent = random.choice(agents)
        tl_assignment = TeamLeadAssignment.objects.filter(agent=agent).first()
        tl = tl_assignment.team_lead
        sup = SupervisorTeam.objects.filter(team_lead=tl).first().supervisor

        days_churned = random.choice([5, 12, 25, 45, 75, 110])
        bucket = '0-29'
        if days_churned >= 366:
            bucket = '366+'
        elif days_churned >= 181:
            bucket = '181-365'
        elif days_churned >= 90:
            bucket = '90-180'
        elif days_churned >= 60:
            bucket = '60-89'
        elif days_churned >= 30:
            bucket = '30-59'

        # Pick disposition & status distribution
        disp = random.choice(disp_objects)
        status_val = CustomerStatus.CONTACTED
        recharge_st = RechargeStatus.PENDING
        priority_val = disp.default_priority
        rec_date = None
        rec_amt = 0.0

        if disp.business_classification == BusinessClassification.POSITIVE_INTENT:
            if disp.name == "Ready To recharge today":
                status_val = CustomerStatus.READY_TO_RECHARGE
                recharge_st = RechargeStatus.READY_TODAY
                priority_val = CustomerPriority.CRITICAL
            else:
                status_val = CustomerStatus.POSITIVE_INTENT
                priority_val = CustomerPriority.HIGH
        elif disp.business_classification == BusinessClassification.SUCCESS:
            status_val = CustomerStatus.RECHARGED
            recharge_st = RechargeStatus.RECHARGED
            rec_date = today - timedelta(days=random.randint(0, 3))
            rec_amt = random.choice([1200.0, 1800.0, 2500.0, 3500.0])
        elif disp.business_classification in [BusinessClassification.COMPETITOR_LOSS, BusinessClassification.INVALID]:
            status_val = CustomerStatus.LOST if disp.business_classification == BusinessClassification.COMPETITOR_LOSS else CustomerStatus.INVALID
            priority_val = CustomerPriority.LOW

        followup_date = today + timedelta(days=random.randint(-5, 5))

        cust = Customer.objects.create(
            customer_id=cid,
            name=cust_name,
            mobile_number=f"+9779841{i:05d}",
            alternate_number=f"+9779801{i:05d}",
            email=f"customer{i}@gmail.com",
            address=f"House #{i}, Ward {random.randint(1, 30)}",
            area_location=random.choice(locations),
            package=random.choice(packages),
            previous_recharge_amount=random.choice([1200.0, 1800.0, 2500.0]),
            last_recharge_date=today - timedelta(days=days_churned + 30),
            days_since_churn=days_churned,
            churn_bucket=bucket,
            customer_status=status_val,
            priority=priority_val,
            assigned_supervisor=sup,
            assigned_team_lead=tl,
            assigned_agent=agent,
            assignment_date=timezone.now() - timedelta(days=5),
            last_contact_date=timezone.now() - timedelta(days=1),
            next_followup_date=followup_date,
            next_followup_time=timezone.now().time(),
            latest_disposition=disp,
            latest_note=f"Customer noted: {disp.name}",
            recharge_status=recharge_st,
            recharge_date=rec_date,
            recharge_amount=rec_amt,
            recovered_revenue=rec_amt
        )

        # Historical follow-up
        CustomerFollowUp.objects.create(
            customer=cust,
            agent=agent,
            disposition=disp,
            notes=f"Customer expressed: {disp.name}. Scheduled next touchpoint.",
            next_action='CALL_AGAIN',
            next_followup_date=followup_date,
            next_followup_time=timezone.now().time(),
            previous_status=CustomerStatus.ASSIGNED,
            new_status=status_val
        )

        CustomerTimeline.objects.create(
            customer=cust,
            agent=agent,
            action=f"Initial Contact & Disposition ({disp.name})",
            previous_status=CustomerStatus.ASSIGNED,
            new_status=status_val,
            disposition_name=disp.name,
            notes=f"Follow-up logged by {agent.username}"
        )

        if status_val == CustomerStatus.RECHARGED:
            Recharge.objects.create(
                customer=cust,
                agent=agent,
                team_lead=tl,
                supervisor=sup,
                recharge_date=rec_date,
                recharge_amount=rec_amt,
                package=cust.package,
                recharge_method='Online Portal',
                verified=True,
                verified_by=tl,
                recovered_revenue=rec_amt,
                notes='Verified via ISP Core Billing API'
            )

        created_customers += 1

    print(
        f"--> Successfully Created {created_customers} Customer 360 Profiles with History, Follow-ups, and Verified Recharges")
    print("=== Database Seeding Complete! ===")


if __name__ == '__main__':
    seed_database()
