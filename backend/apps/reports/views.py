import csv
import io
import openpyxl
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q

from apps.customers.models import Customer, CustomerStatus, RechargeStatus
from apps.followups.models import CustomerFollowUp
from apps.recharges.models import Recharge
from apps.authentication.models import User, UserRole, SupervisorTeam, TeamLeadAssignment

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

class ReportsEngineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type', 'agent_daily')
        export_format = request.query_params.get('export_format', 'json') # json, csv, excel, pdf

        # Fetch Data based on report type
        headers, data = self.generate_report_data(report_type, request)

        if export_format == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
            writer = csv.writer(response)
            writer.writerow(headers)
            for row in data:
                writer.writerow(row)
            return response

        elif export_format == 'excel':
            wb = openpyxl.Workbook()
            ws = wb.active
            ws.title = "Report"
            ws.append(headers)
            for row in data:
                ws.append(row)
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{report_type}_report.xlsx"'
            return response

        elif export_format == 'pdf':
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            elements = []
            
            elements.append(Paragraph(f"<b>ISP Customer Retention System</b>", styles['Title']))
            elements.append(Paragraph(f"Report: {report_type.replace('_', ' ').title()}", styles['Heading2']))
            elements.append(Spacer(1, 12))

            table_data = [headers] + data[:50] # cap rows for PDF preview
            t = Table(table_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#F8FAFC')),
                ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ]))
            elements.append(t)
            doc.build(elements)
            buffer.seek(0)

            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{report_type}_report.pdf"'
            return response

        # Default JSON response
        formatted_json = [dict(zip(headers, row)) for row in data]
        return Response({
            'report_type': report_type,
            'total_records': len(data),
            'headers': headers,
            'data': formatted_json
        })

    def generate_report_data(self, report_type, request):
        today = timezone.now().date()
        user = request.user
        if user.is_super_admin:
            scoped_agent_ids = list(User.objects.filter(role=UserRole.AGENT).values_list('id', flat=True))
        elif user.is_supervisor_user:
            team_lead_ids = SupervisorTeam.objects.filter(supervisor=user).values_list('team_lead_id', flat=True)
            scoped_agent_ids = list(TeamLeadAssignment.objects.filter(team_lead_id__in=team_lead_ids).values_list('agent_id', flat=True))
            if not scoped_agent_ids:
                scoped_agent_ids = list(User.objects.filter(role=UserRole.AGENT, is_active=True).values_list('id', flat=True))
        elif user.is_team_lead_user:
            scoped_agent_ids = list(TeamLeadAssignment.objects.filter(team_lead=user).values_list('agent_id', flat=True))
        else:
            scoped_agent_ids = [user.id]

        requested_agent_id = request.query_params.get('agent_id')
        if requested_agent_id and requested_agent_id.isdigit() and int(requested_agent_id) in scoped_agent_ids:
            scoped_agent_ids = [int(requested_agent_id)]
        
        if report_type == 'agent_daily':
            headers = ['Agent', 'Role', 'Assigned Customers', 'Calls Today', 'Positive Intent', 'Recharged Today', 'Conversion %']
            agents = User.objects.filter(id__in=scoped_agent_ids, role=UserRole.AGENT)
            rows = []
            for ag in agents:
                assigned = Customer.objects.filter(assigned_agent=ag).count()
                calls = CustomerFollowUp.objects.filter(agent=ag, call_date=today).count()
                intent = Customer.objects.filter(assigned_agent=ag, customer_status=CustomerStatus.POSITIVE_INTENT).count()
                recharged = Recharge.objects.filter(agent=ag, recharge_date=today).count()
                conv = round((recharged / assigned * 100), 1) if assigned > 0 else 0
                rows.append([ag.get_full_name() or ag.username, ag.role, assigned, calls, intent, recharged, f"{conv}%"])
            return headers, rows

        elif report_type == 'overdue_followup':
            headers = ['Customer ID', 'Name', 'Mobile', 'Assigned Agent', 'Overdue Days', 'Last Disposition', 'Priority']
            customers = Customer.objects.filter(
                assigned_agent_id__in=scoped_agent_ids,
                next_followup_date__lt=today,
                customer_status__in=[CustomerStatus.NEW, CustomerStatus.ASSIGNED, CustomerStatus.NOT_CONTACTED, CustomerStatus.FOLLOWUP_PENDING, CustomerStatus.CONTACTED, CustomerStatus.POSITIVE_INTENT, CustomerStatus.READY_TO_RECHARGE]
            )
            rows = []
            for c in customers:
                days = (today - c.next_followup_date).days if c.next_followup_date else 0
                ag_name = c.assigned_agent.get_full_name() or c.assigned_agent.username if c.assigned_agent else 'Unassigned'
                disp_name = c.latest_disposition.name if c.latest_disposition else 'None'
                rows.append([c.customer_id, c.name, c.mobile_number, ag_name, days, disp_name, c.priority])
            return headers, rows

        elif report_type == 'recharge_conversion':
            headers = ['Customer ID', 'Name', 'Mobile', 'Recharge Date', 'Amount (NPR)', 'Package', 'Agent', 'Verified']
            recharges = Recharge.objects.select_related('customer', 'agent').filter(agent_id__in=scoped_agent_ids).order_by('-recharge_date')
            rows = []
            for r in recharges:
                ag_name = r.agent.get_full_name() or r.agent.username if r.agent else 'N/A'
                rows.append([r.customer.customer_id, r.customer.name, r.customer.mobile_number, str(r.recharge_date), float(r.recharge_amount), r.package, ag_name, 'Yes' if r.verified else 'No'])
            return headers, rows

        else: # Default Customer Master Report
            headers = ['Customer ID', 'Name', 'Mobile', 'Package', 'Days Churned', 'Status', 'Agent', 'Recharge Status']
            custs = Customer.objects.select_related('assigned_agent').filter(assigned_agent_id__in=scoped_agent_ids)[:100]
            rows = []
            for c in custs:
                ag_name = c.assigned_agent.get_full_name() or c.assigned_agent.username if c.assigned_agent else 'Unassigned'
                rows.append([c.customer_id, c.name, c.mobile_number, c.package, c.days_since_churn, c.customer_status, ag_name, c.recharge_status])
            return headers, rows
