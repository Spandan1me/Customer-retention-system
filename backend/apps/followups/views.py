from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from datetime import date, time
from .models import RetentionCategory, RetentionDisposition, CustomerFollowUp, BusinessClassification
from .serializers import RetentionCategorySerializer, RetentionDispositionSerializer, CustomerFollowUpSerializer
from apps.customers.models import Customer, CustomerStatus, CustomerPriority, RechargeStatus, CustomerTimeline
from apps.audit.models import AuditLog
from apps.authentication.permissions import IsSuperAdmin

class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RetentionCategorySerializer
    queryset = RetentionCategory.objects.all()

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

class DispositionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RetentionDispositionSerializer
    queryset = RetentionDisposition.objects.all()

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

class CustomerFollowUpViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CustomerFollowUpSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = CustomerFollowUp.objects.select_related('customer', 'agent', 'disposition')
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if user.is_super_admin:
            return queryset
        elif user.is_supervisor_user:
            return queryset.filter(customer__assigned_supervisor=user)
        elif user.is_team_lead_user:
            return queryset.filter(customer__assigned_team_lead=user)
        else:
            return queryset.filter(customer__assigned_agent=user)

    def create(self, request, *args, **kwargs):
        data = request.data
        customer_id = data.get('customer')
        disposition_id = data.get('disposition')
        notes = data.get('notes', '')
        next_action = data.get('next_action', 'CALL_AGAIN')
        call_date = data.get('call_date')
        call_time = data.get('call_time')
        days_since_churn = data.get('days_since_churn')
        expiry_date = data.get('expiry_date')
        next_followup_date = data.get('next_followup_date')
        next_followup_time = data.get('next_followup_time')

        try:
            call_date = date.fromisoformat(call_date) if call_date else timezone.localdate()
            call_time = time.fromisoformat(call_time) if call_time else timezone.localtime().time().replace(microsecond=0)
            days_since_churn = int(days_since_churn) if days_since_churn is not None else None
            if days_since_churn is not None and days_since_churn < 0:
                raise ValueError
            if expiry_date:
                expiry_date = date.fromisoformat(expiry_date)
        except ValueError:
            return Response({'error': 'Call date, time, or churn days is invalid.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = Customer.objects.get(id=customer_id)
            disposition = RetentionDisposition.objects.get(id=disposition_id)
        except (Customer.DoesNotExist, RetentionDisposition.DoesNotExist) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        subcategory_workflows = {
            'Churn Follow Up': 'CHURN_FOLLOW_UP',
            'Pre Disconnection Follow Up': 'PRE_DISCONNECTION_FOLLOW_UP',
            'Dealer Follow Up': 'DEALER_FOLLOW_UP',
        }
        selected_workflow = subcategory_workflows.get(disposition.sub_category.name)
        if not selected_workflow:
            return Response(
                {'error': 'Select a disposition from a valid retention workflow.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if selected_workflow == 'PRE_DISCONNECTION_FOLLOW_UP' and not data.get('expiry_date') and not customer.expiry_date:
            return Response({'error': 'Expiry date is required for pre-disconnection follow-up.'}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.is_super_admin:
            has_access = (
                (request.user.is_supervisor_user and customer.assigned_supervisor_id == request.user.id)
                or (request.user.is_team_lead_user and customer.assigned_team_lead_id == request.user.id)
                or (request.user.is_agent_user and customer.assigned_agent_id == request.user.id)
            )
            if not has_access:
                return Response(
                    {'error': 'You can only log follow-ups for customers assigned to your team.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        prev_status = customer.customer_status
        new_status = prev_status

        # Disposition Intelligence mapping logic
        classification = disposition.business_classification
        if classification == BusinessClassification.POSITIVE_INTENT:
            if 'today' in disposition.name.lower():
                new_status = CustomerStatus.READY_TO_RECHARGE
                customer.recharge_status = RechargeStatus.READY_TODAY
                customer.priority = CustomerPriority.CRITICAL
            else:
                new_status = CustomerStatus.POSITIVE_INTENT
                customer.priority = CustomerPriority.HIGH
        elif classification == BusinessClassification.SUCCESS:
            new_status = CustomerStatus.RECHARGED
            customer.recharge_status = RechargeStatus.RECHARGED
            customer.priority = CustomerPriority.LOW
        elif classification == BusinessClassification.BARRIER:
            new_status = CustomerStatus.FOLLOWUP_PENDING
            customer.priority = CustomerPriority.MEDIUM
        elif classification == BusinessClassification.SERVICE_ISSUE:
            new_status = CustomerStatus.FOLLOWUP_PENDING
            customer.priority = CustomerPriority.HIGH
        elif classification == BusinessClassification.COMPETITOR_LOSS:
            new_status = CustomerStatus.LOST
            customer.priority = CustomerPriority.LOW
        elif classification == BusinessClassification.INVALID:
            new_status = CustomerStatus.INVALID
            customer.priority = CustomerPriority.LOW
        elif classification == BusinessClassification.UNREACHABLE:
            new_status = CustomerStatus.NOT_CONTACTED
            customer.priority = CustomerPriority.MEDIUM
        else:
            new_status = CustomerStatus.CONTACTED

        # Create Follow-up record (Immutable business log)
        followup = CustomerFollowUp.objects.create(
            customer=customer,
            agent=request.user,
            call_date=call_date,
            call_time=call_time,
            disposition=disposition,
            notes=notes,
            next_action=next_action,
            next_followup_date=next_followup_date,
            next_followup_time=next_followup_time,
            previous_status=prev_status,
            new_status=new_status
        )

        # Update Customer Master Record
        customer.customer_status = new_status
        customer.retention_workflow = selected_workflow
        if customer.retention_workflow == 'PRE_DISCONNECTION_FOLLOW_UP' and expiry_date:
            customer.expiry_date = expiry_date
        if customer.retention_workflow != 'PRE_DISCONNECTION_FOLLOW_UP' and days_since_churn is not None:
            customer.days_since_churn = days_since_churn
            if days_since_churn >= 366:
                customer.churn_bucket = '366+'
            elif days_since_churn >= 181:
                customer.churn_bucket = '181-365'
            elif days_since_churn >= 90:
                customer.churn_bucket = '90-180'
            elif days_since_churn >= 60:
                customer.churn_bucket = '60-89'
            elif days_since_churn >= 30:
                customer.churn_bucket = '30-59'
            else:
                customer.churn_bucket = '0-29'
        customer.last_contact_date = timezone.now()
        if next_followup_date:
            customer.next_followup_date = next_followup_date
        if next_followup_time:
            customer.next_followup_time = next_followup_time
        customer.latest_disposition = disposition
        customer.latest_note = notes
        customer.save()

        # Log timeline event
        CustomerTimeline.objects.create(
            customer=customer,
            agent=request.user,
            action=f"Logged Follow-up ({disposition.name})",
            previous_status=prev_status,
            new_status=new_status,
            disposition_name=disposition.name,
            notes=notes
        )

        # Audit Log
        AuditLog.objects.create(
            actor=request.user,
            action="Follow-up Logged",
            target_model="Customer",
            target_id=str(customer.id),
            old_values={'status': prev_status},
            new_values={'status': new_status, 'disposition': disposition.name}
        )

        serializer = self.get_serializer(followup)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class OverdueFollowUpView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        user = request.user
        queryset = Customer.objects.filter(
            next_followup_date__lt=today,
            customer_status__in=[
                CustomerStatus.NEW, CustomerStatus.ASSIGNED, CustomerStatus.NOT_CONTACTED,
                CustomerStatus.FOLLOWUP_PENDING, CustomerStatus.CONTACTED,
                CustomerStatus.POSITIVE_INTENT, CustomerStatus.READY_TO_RECHARGE
            ]
        )

        if user.is_super_admin:
            pass
        elif user.is_supervisor_user:
            queryset = queryset.filter(assigned_supervisor=user)
        elif user.is_team_lead_user:
            queryset = queryset.filter(assigned_team_lead=user)
        else:
            queryset = queryset.filter(assigned_agent=user)

        data = []
        for c in queryset:
            data.append({
                'id': c.id,
                'customer_id': c.customer_id,
                'name': c.name,
                'mobile_number': c.mobile_number,
                'assigned_agent': c.assigned_agent.get_full_name() or c.assigned_agent.username if c.assigned_agent else 'Unassigned',
                'next_followup_date': c.next_followup_date,
                'latest_disposition': c.latest_disposition.name if c.latest_disposition else 'None',
                'days_overdue': (today - c.next_followup_date).days if c.next_followup_date else 0,
                'priority': c.priority
            })

        return Response(data)
