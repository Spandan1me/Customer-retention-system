import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, Bell, Shield, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [overdue, setOverdue] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const hasShownOverduePopup = useRef(false);

  const loadOverdue = async () => {
    try {
      const response = await api.get('/followups/overdue/');
      const records = response.data || [];
      setOverdue(records);
      if (records.length > 0 && !hasShownOverduePopup.current) {
        setNotificationOpen(true);
        hasShownOverduePopup.current = true;
      }
      if (records.length === 0) hasShownOverduePopup.current = false;
    } catch {
      setOverdue([]);
    }
  };

  useEffect(() => {
    loadOverdue();
    const timer = window.setInterval(loadOverdue, 60000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded font-semibold flex items-center gap-1"><Shield className="w-3 h-3"/> Super Admin</span>;
      case 'SUPERVISOR':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded font-semibold">Supervisor</span>;
      case 'TEAM_LEAD':
        return <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-0.5 rounded font-semibold">Team Lead</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-semibold flex items-center gap-1"><PhoneCall className="w-3 h-3"/> Retention Agent</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-2.5 py-1 rounded-lg text-sm font-extrabold">RETENTION</span>
          <span className="hidden sm:inline">ISP Churn Recovery System</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Alert Bell */}
        <button onClick={() => setNotificationOpen((open) => !open)} className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition" title="Overdue Follow-up Alerts">
          <Bell className="w-5 h-5" />
          {overdue.length > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white">{overdue.length}</span>}
        </button>

        {notificationOpen && overdue.length > 0 && <div className="fixed top-14 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white border border-rose-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 bg-rose-50 border-b border-rose-100"><p className="font-extrabold text-rose-800">Overdue Follow-up Alert</p><p className="text-xs text-rose-600">{overdue.length} callback{overdue.length === 1 ? '' : 's'} require attention.</p></div>
          <div className="max-h-80 overflow-y-auto">{overdue.slice(0, 8).map((item: any) => <button key={item.id} onClick={() => { setNotificationOpen(false); navigate(`/customers/${item.id}`); }} className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50"><p className="text-sm font-bold text-slate-900">{item.name} <span className="font-mono text-xs text-sky-700">{item.customer_id}</span></p><p className="text-xs text-rose-600 mt-1">{item.days_overdue} day{item.days_overdue === 1 ? '' : 's'} overdue · {item.latest_disposition}</p></button>)}</div>
          {overdue.length > 8 && <button onClick={() => { setNotificationOpen(false); navigate('/followups'); }} className="w-full px-4 py-3 text-xs font-bold text-sky-700 hover:bg-slate-50">View all overdue follow-ups</button>}
        </div>}

        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Info & Role */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
            {user?.first_name ? user.first_name[0].toUpperCase() : user?.username[0].toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}</span>
              {getRoleBadge(user?.role)}
            </div>
            <p className="text-xs text-slate-500">{user?.email || 'Apex Fiber ISP'}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
