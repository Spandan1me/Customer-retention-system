import csv
import io
import openpyxl
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q, Count, Case, When, Value, IntegerField
from .models import Customer, CustomerRemark, CustomerStatus, CustomerPriority, RechargeStatus, AssignmentHistory, CustomerTimeline
from .serializers import AgentCustomerCreateSerializer, CustomerListSerializer, CustomerDetailSerializer
from apps.authentication.models import User, UserRole, TeamLeadAssignment, SupervisorTeam
from apps.authentication.permissions import IsSuperAdmin, IsTeamManager
from apps.audit.models import AuditLog
from apps.authentication.permissions import IsAgent

class CustomerViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CustomerDetailSerializer
        return CustomerListSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Customer.objects.select_related('assigned_agent', 'assigned_team_lead', 'assigned_supervisor', 'latest_disposition')

        # Scope filter by Role
        if user.is_super_admin:
            pass
        elif user.is_supervisor_user:
            queryset = queryset.filter(assigned_supervisor=user)
        elif user.is_team_lead_user:
            queryset = queryset.filter(assigned_team_lead=user)
        else:
            queryset = queryset.filter(assigned_agent=user)

        # Query Parameters Filter
        status_param = self.request.query_params.get('status')
        bucket_param = self.request.query_params.get('churn_bucket')
        priority_param = self.request.query_params.get('priority')
        agent_param = self.request.query_params.get('agent_id')
        search_param = self.request.query_params.get('search')

        if status_param:
            queryset = queryset.filter(customer_status=status_param)
        if bucket_param:
            queryset = queryset.filter(churn_bucket=bucket_param)
        if priority_param:
            queryset = queryset.filter(priority=priority_param)
        if agent_param:
            queryset = queryset.filter(assigned_agent_id=agent_param)
        if search_param:
            queryset = queryset.filter(
                Q(customer_id__icontains=search_param) |
                Q(name__icontains=search_param) |
                Q(mobile_number__icontains=search_param) |
                Q(area_location__icontains=search_param)
            )

        return queryset

class SmartWorkQueueView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        user = request.user
        
        # Base filter: Only active/unclosed customers assigned to this agent
        queryset = Customer.objects.filter(
            assigned_agent=user
        ).exclude(
            customer_status__in=[
                CustomerStatus.RECHARGED,
                CustomerStatus.LOST,
                CustomerStatus.INVALID,
                CustomerStatus.CLOSED
            ]
        ).filter(
            Q(customer_status__in=[
                CustomerStatus.NEW,
                CustomerStatus.READY_TO_RECHARGE
            ]) |
            Q(next_followup_date__isnull=True) |
            Q(next_followup_date__lte=today)
        ).select_related('latest_disposition')

        # Queue Sorting Priority:
        # 1. Ready to recharge today
        # 2. Overdue follow-ups
        # 3. High Priority / Positive intent
        # 4. Scheduled follow-up today
        # 5. New / Not Contacted
        # 6. Others
        annotated_qs = queryset.annotate(
            queue_weight=Case(
                When(customer_status=CustomerStatus.READY_TO_RECHARGE, then=Value(1)),
                When(next_followup_date__lt=today, then=Value(2)),
                When(priority=CustomerPriority.CRITICAL, then=Value(3)),
                When(priority=CustomerPriority.HIGH, then=Value(4)),
                When(next_followup_date=today, then=Value(5)),
                When(customer_status=CustomerStatus.NEW, then=Value(6)),
                default=Value(7),
                output_field=IntegerField()
            )
        ).order_by('queue_weight', '-days_since_churn')

        serializer = CustomerListSerializer(annotated_qs[:50], many=True)
        
        # Determine "Next Best Customer To Call" (Top match)
        next_best = annotated_qs.first()
        next_best_data = CustomerDetailSerializer(next_best).data if next_best else None

        return Response({
            'count': annotated_qs.count(),
            'next_best_customer': next_best_data,
            'queue': serializer.data
        })


class AgentStartCallLogView(APIView):
    permission_classes = [IsAgent]

    def post(self, request):
        existing = Customer.objects.filter(customer_id=request.data.get('customer_id')).first()
        if existing:
            return Response({'id': existing.id, 'existing': True}, status=status.HTTP_200_OK)
        serializer = AgentCustomerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        agent = request.user
        workflow = serializer.validated_data.get('retention_workflow', 'CHURN_FOLLOW_UP')
        if workflow == 'PRE_DISCONNECTION_FOLLOW_UP' and not serializer.validated_data.get('expiry_date'):
            return Response({'error': 'Expiry date is required for pre-disconnection follow-up.'}, status=status.HTTP_400_BAD_REQUEST)
        days_since_churn = serializer.validated_data.get('days_since_churn', 0)
        churn_bucket = '0-29'
        if days_since_churn >= 366:
            churn_bucket = '366+'
        elif days_since_churn >= 181:
            churn_bucket = '181-365'
        elif days_since_churn >= 90:
            churn_bucket = '90-180'
        elif days_since_churn >= 60:
            churn_bucket = '60-89'
        elif days_since_churn >= 30:
            churn_bucket = '30-59'
        team_lead_assignment = TeamLeadAssignment.objects.filter(agent=agent).first()
        team_lead = team_lead_assignment.team_lead if team_lead_assignment else None
        supervisor_assignment = SupervisorTeam.objects.filter(team_lead=team_lead).first() if team_lead else None
        supervisor = supervisor_assignment.supervisor if supervisor_assignment else None
        customer = serializer.save(
            assigned_agent=agent,
            assigned_team_lead=team_lead,
            assigned_supervisor=supervisor,
            customer_status=CustomerStatus.ASSIGNED,
            assignment_date=timezone.now(),
            churn_bucket=churn_bucket,
        )
        CustomerTimeline.objects.create(
            customer=customer,
            agent=agent,
            action='Customer Added for Call Logging',
            previous_status=CustomerStatus.NEW,
            new_status=CustomerStatus.ASSIGNED,
            notes='Customer added directly by Agent before recording an external call.',
        )
        AuditLog.objects.create(
            actor=agent,
            action='Customer Added for Call Logging',
            target_model='Customer',
            target_id=str(customer.id),
            new_values={'customer_id': customer.customer_id, 'assigned_agent': agent.username},
        )
        return Response({'id': customer.id}, status=status.HTTP_201_CREATED)


class CustomerRemarksView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            customer = Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'customer': {'id': customer.id, 'customer_id': customer.customer_id, 'name': customer.name, 'mobile_number': customer.mobile_number},
            'remarks': CustomerDetailSerializer(customer).data.get('remarks', []),
        })

    def post(self, request, pk):
        text = str(request.data.get('text', '')).strip()
        if not text:
            return Response({'error': 'Remark is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            customer = Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found.'}, status=status.HTTP_404_NOT_FOUND)
        remark = CustomerRemark.objects.create(customer=customer, author=request.user, text=text)
        CustomerTimeline.objects.create(customer=customer, agent=request.user, action='Remark Added', notes=text)
        AuditLog.objects.create(actor=request.user, action='Customer Remark Added', target_model='Customer', target_id=str(customer.id), new_values={'remark': text})
        return Response({'id': remark.id, 'text': remark.text}, status=status.HTTP_201_CREATED)

class CustomerAssignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsTeamManager()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        # Workload balancing stats
        user = request.user
        agents = User.objects.filter(role=UserRole.AGENT)
        if user.is_team_lead_user:
            my_agents = TeamLeadAssignment.objects.filter(team_lead=user).values_list('agent_id', flat=True)
            agents = agents.filter(id__in=my_agents)
        elif user.is_supervisor_user:
            tls = SupervisorTeam.objects.filter(supervisor=user).values_list('team_lead_id', flat=True)
            my_agents = TeamLeadAssignment.objects.filter(team_lead_id__in=tls).values_list('agent_id', flat=True)
            agents = agents.filter(id__in=my_agents)

        agent_workload = agents.annotate(
            customer_count=Count('agent_customers', filter=~Q(agent_customers__customer_status__in=['RECHARGED', 'CLOSED', 'LOST', 'INVALID']))
        ).values('id', 'username', 'first_name', 'last_name', 'customer_count')

        return Response({'workload': list(agent_workload)})

    def post(self, request):
        customer_ids = request.data.get('customer_ids', [])
        target_agent_id = request.data.get('agent_id')

        if not customer_ids or not target_agent_id:
            return Response({'error': 'customer_ids and agent_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_agent = User.objects.get(id=target_agent_id, role=UserRole.AGENT)
        except User.DoesNotExist:
            return Response({'error': 'Target agent not found'}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.is_super_admin:
            allowed_agents = User.objects.filter(id=target_agent.id)
            if request.user.is_team_lead_user:
                allowed_agents = allowed_agents.filter(team_lead_assignment__team_lead=request.user)
            elif request.user.is_supervisor_user:
                team_leads = SupervisorTeam.objects.filter(supervisor=request.user).values_list('team_lead_id', flat=True)
                allowed_agents = allowed_agents.filter(team_lead_assignment__team_lead_id__in=team_leads)
            if not allowed_agents.exists():
                return Response({'error': 'You cannot assign customers to this agent.'}, status=status.HTTP_403_FORBIDDEN)

        # Retrieve Team Lead and Supervisor for target agent
        tl_assignment = TeamLeadAssignment.objects.filter(agent=target_agent).first()
        team_lead = tl_assignment.team_lead if tl_assignment else None
        
        sup_assignment = SupervisorTeam.objects.filter(team_lead=team_lead).first() if team_lead else None
        supervisor = sup_assignment.supervisor if sup_assignment else None

        customers = Customer.objects.filter(id__in=customer_ids)
        if request.user.is_team_lead_user:
            customers = customers.filter(assigned_team_lead=request.user)
        elif request.user.is_supervisor_user:
            customers = customers.filter(assigned_supervisor=request.user)
        updated_count = 0

        for cust in customers:
            prev_agent = cust.assigned_agent
            cust.assigned_agent = target_agent
            cust.assigned_team_lead = team_lead
            cust.assigned_supervisor = supervisor
            cust.assignment_date = timezone.now()
            if cust.customer_status == CustomerStatus.NEW:
                cust.customer_status = CustomerStatus.ASSIGNED
            cust.save()

            AssignmentHistory.objects.create(
                customer=cust,
                assigned_by=request.user,
                previous_agent=prev_agent,
                new_agent=target_agent
            )

            CustomerTimeline.objects.create(
                customer=cust,
                agent=request.user,
                action=f"Reassigned to Agent {target_agent.get_full_name() or target_agent.username}",
                previous_status=cust.customer_status,
                new_status=cust.customer_status,
                notes=f"Reassigned by {request.user.username}"
            )
            updated_count += 1

        AuditLog.objects.create(
            actor=request.user,
            action="Bulk Customer Assignment",
            target_model="Customer",
            target_id=f"Count: {updated_count}",
            new_values={'agent_id': target_agent.id, 'count': updated_count}
        )

        return Response({'message': f'Successfully assigned {updated_count} customers to {target_agent.username}'})

class CustomerImportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_super_admin:
            return Response({'error': 'Only Super Admin can import customer data'}, status=status.HTTP_403_FORBIDDEN)

        file_obj = request.FILES.get('file')
        duplicate_mode = request.data.get('duplicate_mode', 'skip') # 'skip' or 'update'

        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        records = []
        file_name = file_obj.name.lower()

        try:
            if file_name.endswith('.csv'):
                content = file_obj.read().decode('utf-8')
                reader = csv.DictReader(io.StringIO(content))
                records = [row for row in reader]
            elif file_name.endswith(('.xlsx', '.xls')):
                wb = openpyxl.load_workbook(file_obj)
                sheet = wb.active
                headers = [cell.value for cell in sheet[1]]
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    records.append(dict(zip(headers, row)))
            else:
                return Response({'error': 'Unsupported file format. Please upload CSV or Excel (.xlsx)'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Failed to parse file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        imported = 0
        skipped = 0
        updated = 0
        errors = []

        for idx, row in enumerate(records, start=2):
            cid = str(row.get('Customer ID') or row.get('customer_id') or '').strip()
            name = str(row.get('Customer Name') or row.get('name') or '').strip()
            mobile = str(row.get('Mobile Number') or row.get('mobile_number') or '').strip()

            if not cid or not name or not mobile:
                errors.append(f"Row {idx}: Missing Customer ID, Name, or Mobile Number.")
                continue

            existing = Customer.objects.filter(customer_id=cid).first()
            if existing:
                if duplicate_mode == 'skip':
                    skipped += 1
                    continue
                elif duplicate_mode == 'update':
                    existing.name = name
                    existing.mobile_number = mobile
                    existing.package = str(row.get('Package') or existing.package)
                    existing.address = str(row.get('Address') or existing.address)
                    existing.area_location = str(row.get('Area') or existing.area_location)
                    existing.save()
                    updated += 1
                    continue

            # Create new customer record
            pkg = str(row.get('Package') or row.get('package') or 'Standard Fiber')
            days_churn = int(row.get('Days Since Churn') or row.get('days_since_churn') or 30)
            
            bucket = '0-30'
            if days_churn > 90: bucket = '90+'
            elif days_churn > 60: bucket = '61-90'
            elif days_churn > 30: bucket = '31-60'

            Customer.objects.create(
                customer_id=cid,
                name=name,
                mobile_number=mobile,
                alternate_number=row.get('Alternate Number'),
                email=row.get('Email'),
                address=row.get('Address', ''),
                area_location=row.get('Area', ''),
                package=pkg,
                current_plan=row.get('Current Plan', pkg),
                previous_recharge_amount=float(row.get('Previous Recharge Amount') or row.get('amount') or 1000),
                days_since_churn=days_churn,
                churn_bucket=bucket,
                customer_status=CustomerStatus.NEW
            )
            imported += 1

        AuditLog.objects.create(
            actor=request.user,
            action="Customer File Import",
            target_model="Customer",
            target_id=f"File: {file_obj.name}",
            new_values={'imported': imported, 'updated': updated, 'skipped': skipped, 'errors_count': len(errors)}
        )

        return Response({
            'message': 'Import process completed',
            'summary': {
                'total_rows': len(records),
                'imported': imported,
                'updated': updated,
                'skipped': skipped,
                'errors': errors
            }
        })
