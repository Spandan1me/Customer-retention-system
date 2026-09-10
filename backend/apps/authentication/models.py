from django.db import models
from django.contrib.auth.models import AbstractUser

class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    SUPERVISOR = 'SUPERVISOR', 'Supervisor'
    TEAM_LEAD = 'TEAM_LEAD', 'Team Lead'
    AGENT = 'AGENT', 'Agent'

class User(AbstractUser):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.AGENT)
    mobile = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    @property
    def is_super_admin(self):
        return self.role == UserRole.SUPER_ADMIN or self.is_superuser

    @property
    def is_supervisor_user(self):
        return self.role == UserRole.SUPERVISOR

    @property
    def is_team_lead_user(self):
        return self.role == UserRole.TEAM_LEAD

    @property
    def is_agent_user(self):
        return self.role == UserRole.AGENT

class SupervisorTeam(models.Model):
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='managed_teams')
    team_lead = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supervisor_assignment')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('supervisor', 'team_lead')

    def __str__(self):
        return f"Supervisor {self.supervisor.username} -> Team Lead {self.team_lead.username}"

class TeamLeadAssignment(models.Model):
    team_lead = models.ForeignKey(User, on_delete=models.CASCADE, related_name='managed_agents')
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_lead_assignment')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team_lead', 'agent')

    def __str__(self):
        return f"Team Lead {self.team_lead.username} -> Agent {self.agent.username}"
