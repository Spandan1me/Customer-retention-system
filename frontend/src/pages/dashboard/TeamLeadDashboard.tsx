import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Users, PhoneCall, CheckCircle2, AlertCircle, TrendingUp, Award, DollarSign } from 'lucide-react';

export const TeamLeadDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTeamLeadDashboard();
  }, []);

  const fetchTeamLeadDashboard = async () => {
    try {
      const res = await api.get('/dashboard/team-lead/');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Team Lead Dashboard...</div>;

  const kpis = data?.team_kpis || {};
  const agents = data?.agent_performance || [];

  const filteredAgents = agents.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Team Lead Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">Team Performance Command</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">{kpis.team_lead_name}'s Retention Team</h2>
          <p className="text-slate-400 text-sm mt-0.5">Real-time activity tracking, agent coaching, and recharge conversion monitoring.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-semibold uppercase">Recovered Revenue Today</p>
          <p className="text-3xl font-extrabold text-emerald-400">NPR {kpis.recovered_revenue?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Active Agents</div>
          <p className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500"/> {kpis.active_agents}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Today Team Calls</div>
          <p className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-sky-500"/> {kpis.today_calls}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Recharged Today</div>
          <p className="text-2xl font-extrabold text-emerald-600 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500"/> {kpis.recharged_today}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/50 shadow-sm">
          <div className="text-rose-600 text-xs font-bold uppercase mb-1">Team Overdue</div>
          <p className="text-2xl font-extrabold text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500"/> {kpis.overdue_followups}
          </p>
        </div>
      </div>

      {/* Agent Performance Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Agent Activity & Recharge Conversion Table
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Identifies top performing agents vs agents requiring activity coaching.</p>
          </div>
          <input
            type="text"
            placeholder="Search Agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-full md:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Agent</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Calls Today</th>
                <th className="px-4 py-3">Positive Intent</th>
                <th className="px-4 py-3">Ready Today</th>
                <th className="px-4 py-3">Recharged</th>
                <th className="px-4 py-3">Revenue (NPR)</th>
                <th className="px-4 py-3">Overdue</th>
                <th className="px-4 py-3">Conv %</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAgents.map((ag: any) => (
                <tr key={ag.agent_id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{ag.name}</td>
                  <td className="px-4 py-3.5 font-medium">{ag.assigned}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{ag.calls_today}</td>
                  <td className="px-4 py-3.5 text-indigo-600 font-semibold">{ag.positive_intent}</td>
                  <td className="px-4 py-3.5 text-amber-600 font-semibold">{ag.ready_today}</td>
                  <td className="px-4 py-3.5 text-emerald-600 font-bold">{ag.recharged_today}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">NPR {ag.revenue_today.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-rose-600 font-semibold">{ag.overdue}</td>
                  <td className="px-4 py-3.5 font-extrabold text-slate-900">{ag.conversion_rate}%</td>
                  <td className="px-6 py-3.5">
                    {ag.status === 'Top Performer' && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">Top Performer</span>
                    )}
                    {ag.status === 'Needs Attention' && (
                      <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold">Needs Attention</span>
                    )}
                    {ag.status === 'On Track' && (
                      <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold">On Track</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
