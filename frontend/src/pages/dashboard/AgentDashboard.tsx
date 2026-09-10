import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  AlertTriangle,
  PhoneCall,
  Flame,
  CheckCircle2,
  Target,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AgentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgentDashboard();
  }, []);

  const fetchAgentDashboard = async () => {
    try {
      const res = await api.get('/dashboard/agent/');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNextCallLog = async () => {
    try {
      const response = await api.get('/customers/my-queue/');
      const nextCustomer = response.data?.next_best_customer;
      navigate(nextCustomer ? `/customers/${nextCustomer.id}/log` : '/new-call-log');
    } catch {
      navigate('/new-call-log');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Agent Dashboard...</div>;

  const kpis = data?.kpis || {};
  const trend = data?.trend || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Retention Command Center</h2>
          <p className="text-sky-200 text-sm mt-1">Focus on high-intent churned customers and convert promises to verified recharges today.</p>
        </div>
        <button
          onClick={openNextCallLog}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/30 transition flex items-center gap-2 text-sm"
        >
          <PhoneCall className="w-5 h-5" /> Keep Next Call Log <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Target Progress Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-600" /> Today's Recharge Target Achievement
          </span>
          <span className="font-semibold text-slate-600">
            {kpis.successfully_recharged} / {kpis.today_target} Recharges ({kpis.achievement_percentage}%)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(kpis.achievement_percentage || 0, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => navigate('/dashboard/agent/details?metric=assigned')} className="text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            My Assigned <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{kpis.my_assigned_customers}</p>
        </button>

        <button onClick={() => navigate('/dashboard/agent/details?metric=followups')} className="text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            Today Follow-ups <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{kpis.today_followups}</p>
        </button>

        <button onClick={() => navigate('/dashboard/agent/details?metric=overdue')} className="text-left bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-sm hover:border-rose-400 transition">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
            Overdue Follow-ups <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700">{kpis.overdue_followups}</p>
        </button>

        <button onClick={() => navigate('/dashboard/agent/details?metric=calls')} className="text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            Today Calls <PhoneCall className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{kpis.today_calls}</p>
        </button>

        <button onClick={() => navigate('/dashboard/agent/details?metric=connected')} className="text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            Connected <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{kpis.connected}</p>
        </button>

        <button onClick={() => navigate('/dashboard/agent/details?metric=positive')} className="text-left bg-white p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 shadow-sm hover:border-indigo-400 transition">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            Positive Intent <Flame className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-900">{kpis.positive_intent}</p>
        </button>

        <button onClick={() => navigate('/dashboard/agent/details?metric=ready')} className="text-left bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm hover:border-amber-400 transition">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
            Ready To Recharge <Target className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-900">{kpis.ready_to_recharge}</p>
        </button>

        <button onClick={() => navigate('/dashboard/agent/details?metric=recharged')} className="text-left bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm hover:border-emerald-400 transition">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
            Recharged Today <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-900">{kpis.successfully_recharged}</p>
        </button>
      </div>

      {/* Performance Trend Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">Last 7 Days Call Activity & Recharge Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="calls" name="Calls Made" stroke="#0284c7" fill="#e0f2fe" strokeWidth={2} />
              <Area type="monotone" dataKey="recharges" name="Successful Recharges" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
