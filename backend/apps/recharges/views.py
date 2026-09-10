from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import PackageFamily, PackagePrice, Recharge
from .serializers import PackageFamilySerializer, RechargeSerializer
from apps.customers.models import Customer, CustomerStatus, RechargeStatus, CustomerTimeline
from apps.authentication.models import TeamLeadAssignment, SupervisorTeam
from apps.audit.models import AuditLog
from apps.authentication.permissions import IsSupervisorOrAdmin

class RechargeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RechargeSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Recharge.objects.select_related('customer', 'agent', 'team_lead', 'supervisor')

        if user.is_super_admin:
            return queryset
        elif user.is_supervisor_user:
            return queryset.filter(supervisor=user)
        elif user.is_team_lead_user:
            return queryset.filter(team_lead=user)
        else:
            return queryset.filter(agent=user)

    def create(self, request, *args, **kwargs):
        customer_id = request.data.get('customer')
        package_price_id = request.data.get('package_price')
        recharge_date = request.data.get('recharge_date') or timezone.now().date()
        package = request.data.get('package', 'Fiber Plan')
        method = request.data.get('recharge_method', 'Online')
        notes = request.data.get('notes', '')

        try:
            package_price = PackagePrice.objects.select_related('family').get(id=package_price_id, is_active=True)
        except (PackagePrice.DoesNotExist, TypeError, ValueError):
            return Response({'error': 'Select a valid active package price.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=status.HTTP_400_BAD_REQUEST)

        if not request.user.is_super_admin and customer.assigned_agent_id != request.user.id:
            return Response({'error': 'You can only record recharges for your assigned customers.'}, status=status.HTTP_403_FORBIDDEN)

        agent = customer.assigned_agent or request.user
        team_lead = customer.assigned_team_lead
        supervisor = customer.assigned_supervisor

        recharge = Recharge.objects.create(
            customer=customer,
            agent=agent,
            team_lead=team_lead,
            supervisor=supervisor,
            recharge_date=recharge_date,
            recharge_amount=package_price.amount,
            package=f'{package_price.family.name} - {package_price.speed_mbps} Mbps',
            package_price=package_price,
            term_months=package_price.term_months,
            recharge_method=method,
            verified=True,
            verified_by=request.user,
            recovered_revenue=package_price.amount,
            notes=notes
        )

        prev_status = customer.customer_status
        customer.customer_status = CustomerStatus.RECHARGED
        customer.recharge_status = RechargeStatus.RECHARGED
        customer.recharge_date = recharge_date
        customer.recharge_amount = package_price.amount
        customer.recovered_revenue += package_price.amount
        customer.save()

        CustomerTimeline.objects.create(
            customer=customer,
            agent=request.user,
            action=f"Recorded Successful Recharge (${package_price.amount})",
            previous_status=prev_status,
            new_status=CustomerStatus.RECHARGED,
            notes=f"Recharge Method: {method}. Package: {package_price.family.name} {package_price.speed_mbps}Mbps / {package_price.term_months} months"
        )

        AuditLog.objects.create(
            actor=request.user,
            action="Recharge Recorded",
            target_model="Recharge",
            target_id=str(recharge.id),
            new_values={'customer': customer.customer_id, 'amount': str(package_price.amount), 'package_price_id': package_price.id}
        )

        serializer = self.get_serializer(recharge)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PackageCatalogView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        families = PackageFamily.objects.filter(is_active=True).prefetch_related('prices')
        return Response(PackageFamilySerializer(families, many=True).data)

class VerifyRechargeView(APIView):
    permission_classes = [IsSupervisorOrAdmin]

    def post(self, request, pk=None):
        try:
            recharge = Recharge.objects.get(pk=pk)
        except Recharge.DoesNotExist:
            return Response({'error': 'Recharge record not found'}, status=status.HTTP_404_NOT_FOUND)

        recharge.verified = True
        recharge.verified_by = request.user
        recharge.save()

        AuditLog.objects.create(
            actor=request.user,
            action="Recharge Verified",
            target_model="Recharge",
            target_id=str(recharge.id),
            new_values={'verified': True, 'verified_by': request.user.username}
        )

        return Response({'message': 'Recharge verified successfully'})
