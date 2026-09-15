import csv
import os
from django.core.management.base import BaseCommand
from django.db.models import Prefetch

from apps.followups.models import (
    CustomerFollowUp,
    RetentionDisposition,
)
from apps.recharges.models import Recharge


class Command(BaseCommand):
    help = "Export complete retention workflow data for backup"

    def add_arguments(self, parser):
        parser.add_argument(
            "--output",
            required=True,
            help="Output CSV path",
        )

    def handle(self, *args, **options):
        output = options["output"]

        os.makedirs(os.path.dirname(output), exist_ok=True)

        followups = (
            CustomerFollowUp.objects
            .select_related(
                "customer",
                "agent",
                "disposition",
                "disposition__sub_category",
                "disposition__sub_category__category",
                "deleted_by",
            )
            .order_by("created_at")
        )

        with open(output, "w", newline="", encoding="utf-8-sig") as file:
            writer = csv.writer(file)

            writer.writerow([
                "Follow Up ID",
                "Agent Username",
                "Agent Name",
                "Customer ID",
                "Customer Name",
                "Mobile Number",
                "Customer Status",
                "Customer Priority",

                "Call Date",
                "Call Time",

                "Category",
                "Sub Category",
                "Second Sub Category",
                "Business Classification",
                "Priority",

                "Notes",
                "Previous Status",
                "New Status",

                "Next Action",
                "Next Follow-up Date",
                "Next Follow-up Time",

                "Follow-up Created At",
                "Log Deleted",
                "Deleted At",
                "Deleted By",

                "Recharge Status",
                "Verified Recharge",
                "Recharge Amount",
                "Recharge Date",
                "Recharge Package",
                "Recharge Term Months",
                "Recharge Method",
                "Recovered Revenue",
                "Recharge Notes",
            ])

            count = 0

            for followup in followups:
                customer = followup.customer
                disposition = followup.disposition
                sub_category = disposition.sub_category
                category = sub_category.category

                # Get the latest recharge associated with this customer
                recharge = (
                    Recharge.objects
                    .filter(customer=customer)
                    .order_by("-recharge_date", "-created_at")
                    .first()
                )

                agent = followup.agent
                deleted_by = followup.deleted_by

                writer.writerow([
                    followup.id,

                    agent.username if agent else "",
                    agent.get_full_name() if agent else "",

                    customer.customer_id,
                    customer.name,
                    customer.mobile_number,
                    customer.customer_status,
                    customer.priority,

                    followup.call_date,
                    followup.call_time,

                    category.name if category else "",
                    sub_category.name if sub_category else "",
                    disposition.name if disposition else "",
                    disposition.business_classification if disposition else "",
                    disposition.default_priority if disposition else "",

                    followup.notes,
                    followup.previous_status,
                    followup.new_status,

                    followup.next_action,
                    followup.next_followup_date or "",
                    followup.next_followup_time or "",

                    followup.created_at,

                    "YES" if followup.deleted_at else "NO",
                    followup.deleted_at or "",
                    deleted_by.username if deleted_by else "",

                    customer.recharge_status,

                    "YES" if recharge and recharge.verified else "NO",

                    recharge.recharge_amount if recharge else "",
                    recharge.recharge_date if recharge else "",
                    recharge.package if recharge else "",
                    recharge.term_months if recharge else "",
                    recharge.recharge_method if recharge else "",
                    recharge.recovered_revenue if recharge else "",
                    recharge.notes if recharge else "",
                ])

                count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Retention backup exported successfully: {count} records -> {output}"
            )
        )
