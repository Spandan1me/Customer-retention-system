import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  PhoneCall,
  Users,
  Clock,
  CheckCircle2,
  PieChart,
  FileSpreadsheet,
  UploadCloud,
  UserCheck,
  History
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const role = user?.role;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'SUPERVISOR', 'TEAM_LEAD', 'AGENT'] },
    { label: 'My Log Queue', path: '/queue', icon: PhoneCall, roles: ['AGENT'] },
    { label: 'Customers 360', path: '/customers', icon: Users, roles: ['SUPER_ADMIN', 'SUPERVISOR', 'TEAM_LEAD', 'AGENT'] },
    { label: 'Overdue Follow-ups', path: '/followups', icon: Clock, roles: ['SUPER_ADMIN', 'SUPERVISOR', 'TEAM_LEAD', 'AGENT'] },
    { label: 'Recharges Recovery', path: '/recharges', icon: CheckCircle2, roles: ['SUPER_ADMIN', 'SUPERVISOR', 'TEAM_LEAD', 'AGENT'] },
    { label: 'Churn Intelligence', path: '/analytics/churn', icon: PieChart, roles: ['SUPER_ADMIN', 'SUPERVISOR', 'TEAM_LEAD'] },
    { label: 'Reports Engine', path: '/reports', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'SUPERVISOR', 'TEAM_LEAD', 'AGENT'] },
    { label: 'Customer Data Import', path: '/admin/import', icon: UploadCloud, roles: ['SUPER_ADMIN'] },
    { label: 'User & Team Hierarchy', path: '/admin/users', icon: UserCheck, roles: ['SUPER_ADMIN', 'SUPERVISOR'] },
    { label: 'Audit Trail', path: '/admin/audit', icon: History, roles: ['SUPER_ADMIN', 'SUPERVISOR'] },
  ];

  const filteredItems = navItems.filter(item => role && item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-800">
        <div className="bg-slate-800/80 rounded-xl p-3 text-xs space-y-1 text-slate-400">
          <p className="font-semibold text-slate-200">Apex Fiber ISP Org</p>
          <p>65 Active Staff Users</p>
          <p className="text-emerald-400 font-medium">System Online • v1.0 Production</p>
        </div>
      </div>
    </aside>
  );
};
