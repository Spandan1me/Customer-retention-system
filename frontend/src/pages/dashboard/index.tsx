import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { AgentDashboard } from './AgentDashboard';
import { TeamLeadDashboard } from './TeamLeadDashboard';
import { SupervisorDashboard } from './SupervisorDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardRouter: React.FC = () => {
  const { user } = useAuthStore();
  const role = user?.role;

  switch (role) {
    case 'SUPER_ADMIN':
      return <AdminDashboard />;
    case 'SUPERVISOR':
      return <SupervisorDashboard />;
    case 'TEAM_LEAD':
      return <TeamLeadDashboard />;
    case 'AGENT':
    default:
      return <AgentDashboard />;
  }
};
