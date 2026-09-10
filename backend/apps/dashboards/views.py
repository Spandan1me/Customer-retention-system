from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from django.db.models import Count, Sum, Q, F, FloatField, ExpressionWrapper
from datetime import timedelta

from apps.customers.models import Customer, CustomerStatus, RechargeStatus, CustomerPriority
from apps.followups.models import CustomerFollowUp, RetentionDisposition, BusinessClassification
from apps.recharges.models import Recharge
from apps.authentication.models import User, UserRole, TeamLeadAssignment, SupervisorTeam
from apps.targets.models import Target
from apps.customers.serializers import CustomerListSerializer
from apps.followups.serializers import CustomerFollowUpSerializer
from apps.recharges.serializers import RechargeSerializer

class AgentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        agent_customers = Customer.objects.filter(assigned_agent=user)
        assigned_count = agent_customers.count()

        today_followups = agent_customers.filter(next_followup_date=today).count()
        overdue_followups = agent_customers.filter(
            next_followup_date__lt=today,
            customer_status__in=[CustomerStatus.NEW, CustomerStatus.ASSIGNED, CustomerStatus.NOT_CONTACTED, CustomerStatus.FOLLOWUP_PENDING, CustomerStatus.CONTACTED, CustomerStatus.POSITIVE_INTENT, CustomerStatus.READY_TO_RECHARGE]
        ).count()

        today_calls = CustomerFollowUp.objects.filter(agent=user, call_date=today).count()
        
        connected_calls = CustomerFollowUp.objects.filter(
            agent=user, call_date=today
        ).exclude(disposition__business_classification=BusinessClassification.UNREACHABLE).count()

        positive_intent = agent_customers.filter(customer_status=CustomerStatus.POSITIVE_INTENT).count()
        ready_today = agent_customers.filter(recharge_status=RechargeStatus.READY_TODAY).count()
        recharged_today = Recharge.objects.filter(agent=user, recharge_date=today).count()

        # Target calculation
        daily_target_obj = Target.objects.filter(assigned_to_user=user, period_type='DAILY').first()
        target_val = daily_target_obj.target_recharges if daily_target_obj else 10
        achieved_pct = round((recharged_today / target_val * 100), 1) if target_val > 0 else 0

        # 7-day trend chart
        trend = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            calls_d = CustomerFollowUp.objects.filter(agent=user, call_date=d).count()
            recharges_d = Recharge.objects.filter(agent=user, recharge_date=d).count()
            trend.append({'date': d.strftime('%b %d'), 'calls': calls_d, 'recharges': recharges_d})

        return Response({
            'kpis': {
                'my_assigned_customers': assigned_count,
                'today_followups': today_followups,
                'overdue_followups': overdue_followups,
                'today_calls': today_calls,
                'connected': connected_calls,
                'positive_intent': positive_intent,
                'ready_to_recharge': ready_today,
                'successfully_recharged': recharged_today,
                'today_target': target_val,
                'achievement_percentage': achieved_pct,
                'conversion_percentage': round((recharged_today / assigned_count * 100), 1) if assigned_count > 0 else 0
            },
            'trend': trend
        })


class AgentMetricDetailsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        metric = request.query_params.get('metric', 'assigned')
        user = request.user
        today = timezone.now().date()
        customers = Customer.objects.filter(assigned_agent=user).select_related('latest_disposition')

        if metric == 'assigned':
            rows = CustomerListSerializer(customers, many=True).data
            title = 'My Assigned Customers'
            kind = 'customers'
        elif metric == 'followups':
            rows = CustomerListSerializer(customers.filter(next_followup_date=today), many=True).data
            title = "Today's Follow-ups"
            kind = 'customers'
        elif metric == 'overdue':
            rows = CustomerListSerializer(customers.filter(next_followup_date__lt=today), many=True).data
            title = 'Overdue Follow-ups'
            kind = 'customers'
        elif metric in ('calls', 'connected'):
            followups = CustomerFollowUp.objects.filter(agent=user, call_date=today).select_related('customer', 'disposition')
            if metric == 'connected':
                followups = followups.exclude(disposition__business_classification=BusinessClassification.UNREACHABLE)
            rows = CustomerFollowUpSerializer(followups, many=True).data
            title = "Today's Calls" if metric == 'calls' else "Today's Connected Calls"
            kind = 'followups'
        elif metric == 'positive':
            rows = CustomerListSerializer(customers.filter(customer_status=CustomerStatus.POSITIVE_INTENT), many=True).data
            title = 'Positive Intent Customers'
            kind = 'customers'
        elif metric == 'ready':
            rows = CustomerListSerializer(customers.filter(recharge_status=RechargeStatus.READY_TODAY), many=True).data
            title = 'Ready to Recharge Today'
            kind = 'customers'
        elif metric == 'recharged':
            rows = RechargeSerializer(Recharge.objects.filter(agent=user, recharge_date=today).select_related('customer'), many=True).data
            title = "Recharged Today"
            kind = 'recharges'
        else:
            return Response({'error': 'Unknown metric.'}, status=400)

        return Response({'title': title, 'kind': kind, 'count': len(rows), 'rows': rows})

class TeamLeadDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        if user.is_super_admin or user.is_supervisor_user:
            team_lead_id = request.query_params.get('team_lead_id')
            if team_lead_id:
                tl = User.objects.get(id=team_lead_id)
            else:
                tl = User.objects.filter(role=UserRole.TEAM_LEAD).first()
        else:
            tl = user

        if not tl:
            return Response({'error': 'No Team Lead specified'}, status=400)

        # Managed Agents
        agents = TeamLeadAssignment.objects.filter(team_lead=tl).select_related('agent')
        agent_list = [a.agent for a in agents]

        agent_table = []
        total_assigned = 0
        total_calls = 0
        total_positive = 0
        total_ready = 0
        total_recharged = 0
        total_revenue = 0
        total_overdue = 0

        for ag in agent_list:
            custs = Customer.objects.filter(assigned_agent=ag)
            cnt_assigned = custs.count()
            cnt_calls = CustomerFollowUp.objects.filter(agent=ag, call_date=today).count()
            cnt_positive = custs.filter(customer_status=CustomerStatus.POSITIVE_INTENT).count()
            cnt_ready = custs.filter(recharge_status=RechargeStatus.READY_TODAY).count()
            recharges_qs = Recharge.objects.filter(agent=ag)
            cnt_recharged = recharges_qs.filter(recharge_date=today).count()
            rev = recharges_qs.filter(recharge_date=today).aggregate(s=Sum('recovered_revenue'))['s'] or 0
            
            cnt_overdue = custs.filter(
                next_followup_date__lt=today,
                customer_status__in=[CustomerStatus.NEW, CustomerStatus.ASSIGNED, CustomerStatus.NOT_CONTACTED, CustomerStatus.FOLLOWUP_PENDING, CustomerStatus.CONTACTED, CustomerStatus.POSITIVE_INTENT, CustomerStatus.READY_TO_RECHARGE]
            ).count()

            conv_rate = round((cnt_recharged / cnt_assigned * 100), 1) if cnt_assigned > 0 else 0
            
            # Status highlight
            agent_status = 'On Track'
            if cnt_overdue > 10 or conv_rate < 5:
                agent_status = 'Needs Attention'
            elif conv_rate > 15 or cnt_recharged >= 8:
                agent_status = 'Top Performer'

            agent_table.append({
                'agent_id': ag.id,
                'name': ag.get_full_name() or ag.username,
                'assigned': cnt_assigned,
                'calls_today': cnt_calls,
                'positive_intent': cnt_positive,
                'ready_today': cnt_ready,
                'recharged_today': cnt_recharged,
                'revenue_today': float(rev),
                'overdue': cnt_overdue,
                'conversion_rate': conv_rate,
                'status': agent_status
            })

            total_assigned += cnt_assigned
            total_calls += cnt_calls
            total_positive += cnt_positive
            total_ready += cnt_ready
            total_recharged += cnt_recharged
            total_revenue += float(rev)
            total_overdue += cnt_overdue

        return Response({
            'team_kpis': {
                'team_lead_name': tl.get_full_name() or tl.username,
                'active_agents': len(agent_list),
                'total_assigned': total_assigned,
                'today_calls': total_calls,
                'positive_intent': total_positive,
                'ready_today': total_ready,
                'recharged_today': total_recharged,
                'recovered_revenue': total_revenue,
                'overdue_followups': total_overdue,
                'team_conversion_rate': round((total_recharged / total_assigned * 100), 1) if total_assigned > 0 else 0
            },
            'agent_performance': agent_table
        })

class SupervisorDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()

        if user.is_super_admin:
            supervisors = User.objects.filter(role=UserRole.SUPERVISOR)
            sup = supervisors.first()
        else:
            sup = user

        teams = SupervisorTeam.objects.filter(supervisor=sup).select_related('team_lead')
        
        team_comparison = []
        agent_performance = []
        sup_total_assigned = 0
        sup_total_calls = 0
        sup_total_intent = 0
        sup_total_recharged = 0
        sup_total_revenue = 0

        for st in teams:
            tl = st.team_lead
            agents = TeamLeadAssignment.objects.filter(team_lead=tl).values_list('agent_id', flat=True)
            custs = Customer.objects.filter(assigned_agent_id__in=agents)

            for agent in User.objects.filter(id__in=agents, is_active=True):
                agent_customers = Customer.objects.filter(assigned_agent=agent)
                assigned = agent_customers.count()
                calls = CustomerFollowUp.objects.filter(agent=agent, call_date=today).count()
                recharged = Recharge.objects.filter(agent=agent, recharge_date=today).count()
                revenue = Recharge.objects.filter(agent=agent, recharge_date=today).aggregate(s=Sum('recovered_revenue'))['s'] or 0
                positive = agent_customers.filter(customer_status=CustomerStatus.POSITIVE_INTENT).count()
                agent_performance.append({
                    'agent_id': agent.id,
                    'agent_name': agent.get_full_name() or agent.username,
                    'team_lead_name': tl.get_full_name() or tl.username,
                    'assigned': assigned,
                    'calls_today': calls,
                    'positive_intent': positive,
                    'recharged_today': recharged,
                    'recovered_revenue': float(revenue),
                    'conversion_rate': round((recharged / assigned * 100), 1) if assigned else 0,
                })
            
            c_assigned = custs.count()
            c_calls = CustomerFollowUp.objects.filter(agent_id__in=agents, call_date=today).count()
            c_intent = custs.filter(customer_status=CustomerStatus.POSITIVE_INTENT).count()
            c_recharged = Recharge.objects.filter(team_lead=tl, recharge_date=today).count()
            c_rev = Recharge.objects.filter(team_lead=tl).aggregate(s=Sum('recovered_revenue'))['s'] or 0
            conv = round((c_recharged / c_assigned * 100), 1) if c_assigned > 0 else 0

            team_comparison.append({
                'team_lead_id': tl.id,
                'team_lead_name': tl.get_full_name() or tl.username,
                'agents_count': len(agents),
                'assigned': c_assigned,
                'calls_today': c_calls,
                'positive_intent': c_intent,
                'recharged_today': c_recharged,
                'recovered_revenue': float(c_rev),
                'conversion_rate': conv
            })

            sup_total_assigned += c_assigned
            sup_total_calls += c_calls
            sup_total_intent += c_intent
            sup_total_recharged += c_recharged
            sup_total_revenue += float(c_rev)

        # During initial setup, a Supervisor may exist before hierarchy mappings
        # are configured. Keep the dashboard useful by showing active Agents.
        if not teams.exists():
            fallback_agents = User.objects.filter(role=UserRole.AGENT, is_active=True)
            for agent in fallback_agents:
                agent_customers = Customer.objects.filter(assigned_agent=agent)
                assigned = agent_customers.count()
                calls = CustomerFollowUp.objects.filter(agent=agent, call_date=today).count()
                recharged = Recharge.objects.filter(agent=agent, recharge_date=today).count()
                revenue = Recharge.objects.filter(agent=agent, recharge_date=today).aggregate(s=Sum('recovered_revenue'))['s'] or 0
                positive = agent_customers.filter(customer_status=CustomerStatus.POSITIVE_INTENT).count()
                agent_performance.append({
                    'agent_id': agent.id,
                    'agent_name': agent.get_full_name() or agent.username,
                    'team_lead_name': 'Unassigned Team',
                    'assigned': assigned,
                    'calls_today': calls,
                    'positive_intent': positive,
                    'recharged_today': recharged,
                    'recovered_revenue': float(revenue),
                    'conversion_rate': round((recharged / assigned * 100), 1) if assigned else 0,
                })
                sup_total_assigned += assigned
                sup_total_calls += calls
                sup_total_intent += positive
                sup_total_recharged += recharged
                sup_total_revenue += float(revenue)

        daily_trend = []
        agent_filter = request.query_params.get('agent_id')
        if agent_filter:
            agent_performance = [row for row in agent_performance if str(row['agent_id']) == agent_filter]
            sup_total_assigned = sum(row['assigned'] for row in agent_performance)
            sup_total_calls = sum(row['calls_today'] for row in agent_performance)
            sup_total_intent = sum(row['positive_intent'] for row in agent_performance)
            sup_total_recharged = sum(row['recharged_today'] for row in agent_performance)
            sup_total_revenue = sum(row['recovered_revenue'] for row in agent_performance)
        agent_ids = [row['agent_id'] for row in agent_performance]
        for offset in range(6, -1, -1):
            trend_date = today - timedelta(days=offset)
            daily_trend.append({
                'date': trend_date.strftime('%b %d'),
                'calls': CustomerFollowUp.objects.filter(agent_id__in=agent_ids, call_date=trend_date).count(),
                'recharges': Recharge.objects.filter(agent_id__in=agent_ids, recharge_date=trend_date).count(),
                'positive_intent': Customer.objects.filter(assigned_agent_id__in=agent_ids, customer_status=CustomerStatus.POSITIVE_INTENT, last_contact_date__date=trend_date).count(),
            })

        return Response({
            'supervisor_kpis': {
                'supervisor_name': sup.get_full_name() or sup.username if sup else 'N/A',
                'total_assigned': sup_total_assigned,
                'today_calls': sup_total_calls,
                'positive_intent': sup_total_intent,
                'total_recharged': sup_total_recharged,
                'total_revenue': sup_total_revenue,
                'overall_retention_rate': round((sup_total_recharged / sup_total_assigned * 100), 1) if sup_total_assigned > 0 else 0
            },
            'team_comparison': team_comparison,
            'agent_performance': agent_performance,
            'daily_trend': daily_trend,
        })

class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        total_customers = Customer.objects.count()
        active_agents = User.objects.filter(role=UserRole.AGENT, is_active=True).count()
        today_calls = CustomerFollowUp.objects.filter(call_date=today).count()
        
        contacted = Customer.objects.filter(customer_status__in=[
            CustomerStatus.CONTACTED, CustomerStatus.POSITIVE_INTENT,
            CustomerStatus.READY_TO_RECHARGE, CustomerStatus.RECHARGED, CustomerStatus.FOLLOWUP_PENDING
        ]).count()

        connected = CustomerFollowUp.objects.exclude(
            disposition__business_classification=BusinessClassification.UNREACHABLE
        ).values('customer').distinct().count()

        positive_intent = Customer.objects.filter(customer_status=CustomerStatus.POSITIVE_INTENT).count()
        ready_today = Customer.objects.filter(recharge_status=RechargeStatus.READY_TODAY).count()
        recharged_total = Recharge.objects.count()
        recharged_today = Recharge.objects.filter(recharge_date=today).count()

        recovered_revenue = Recharge.objects.aggregate(s=Sum('recovered_revenue'))['s'] or 0

        overdue_followups = Customer.objects.filter(
            next_followup_date__lt=today,
            customer_status__in=[CustomerStatus.NEW, CustomerStatus.ASSIGNED, CustomerStatus.NOT_CONTACTED, CustomerStatus.FOLLOWUP_PENDING, CustomerStatus.CONTACTED, CustomerStatus.POSITIVE_INTENT, CustomerStatus.READY_TO_RECHARGE]
        ).count()

        # Funnel Metrics
        funnel = [
            {'stage': 'Assigned Customers', 'count': total_customers},
            {'stage': 'Contacted Customers', 'count': contacted},
            {'stage': 'Connected Calls', 'count': connected},
            {'stage': 'Positive Intent', 'count': positive_intent},
            {'stage': 'Ready To Recharge', 'count': ready_today},
            {'stage': 'Actually Recharged', 'count': recharged_total}
        ]

        return Response({
            'kpis': {
                'total_customers': total_customers,
                'active_agents': active_agents,
                'today_calls': today_calls,
                'contact_rate': round((contacted / total_customers * 100), 1) if total_customers > 0 else 0,
                'positive_intent': positive_intent,
                'ready_today': ready_today,
                'recharged_today': recharged_today,
                'recharged_total': recharged_total,
                'overall_retention_rate': round((recharged_total / total_customers * 100), 1) if total_customers > 0 else 0,
                'recovered_revenue': float(recovered_revenue),
                'overdue_followups': overdue_followups
            },
            'funnel': funnel
        })

class ChurnReasonAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Calculate conversion breakdown by disposition/churn reason
        dispositions = RetentionDisposition.objects.all()
        report = []

        for disp in dispositions:
            custs = Customer.objects.filter(latest_disposition=disp)
            cnt = custs.count()
            if cnt == 0:
                continue
            recharged_cnt = custs.filter(customer_status=CustomerStatus.RECHARGED).count()
            rev = custs.aggregate(s=Sum('recovered_revenue'))['s'] or 0
            conv_rate = round((recharged_cnt / cnt * 100), 1)

            report.append({
                'disposition_id': disp.id,
                'reason_name': disp.name,
                'classification': disp.business_classification,
                'customer_count': cnt,
                'recharged_count': recharged_cnt,
                'conversion_rate': conv_rate,
                'recovered_revenue': float(rev)
            })

        report.sort(key=lambda x: x['customer_count'], reverse=True)
        return Response(report)
