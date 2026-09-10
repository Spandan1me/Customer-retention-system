import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Shield, Users, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

export const SupervisorDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [agentOptions, setAgentOptions] = useState<any[]>([]);

  useEffect(() => {
    fetchSupervisorDashboard();
  }, [selectedAgentId]);

  const fetchSupervisorDashboard = async () => {
    try {
      const res = await api.get('/dashboard/supervisor/', { params: selectedAgentId ? { agent_id: selectedAgentId } : {} });
      setData(res.data);
      if (!selectedAgentId) setAgentOptions(res.data.agent_performance || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportAgentReport = async () => {
    const response = await api.get('/reports/export/', {
      params: { type: 'agent_daily', format: 'csv', ...(selectedAgentId ? { agent_id: selectedAgentId } : {}) },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedAgentId ? 'selected_agent_performance.csv' : 'all_agents_performance.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Supervisor Dashboard...</div>;

  const kpis = data?.supervisor_kpis || {};
  const teams = data?.team_comparison || [];
  const agents = data?.agent_performance || [];
  const dailyTrend = data?.daily_trend || [];
  const pieColors = ['#0284c7', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];

  return (
    <div className="space-y-6">
      {/* Supervisor Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-xl flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1">
            <Shield className="w-4 h-4" /> Supervisor Executive Control
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">{kpis.supervisor_name}'s Teams</h2>
          <p className="text-slate-300 text-sm mt-0.5">Monitoring Team Lead performance, activity gaps, and total revenue recovery.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Recovered Revenue</p>
          <p className="text-3xl font-extrabold text-emerald-400">NPR {kpis.total_revenue?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Assigned Customers</div>
          <p className="text-2xl font-extrabold text-slate-900">{kpis.total_assigned}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Today Calls Across Teams</div>
          <p className="text-2xl font-extrabold text-slate-900">{kpis.today_calls}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Recharged Today</div>
          <p className="text-2xl font-extrabold text-emerald-600">{kpis.total_recharged}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Overall Retention Rate</div>
          <p className="text-2xl font-extrabold text-indigo-600">{kpis.overall_retention_rate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Agent Performance Filter</p>
          <p className="text-xs text-slate-500 mt-1">Filter the charts and KPIs by Agent.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={selectedAgentId} onChange={(event) => { setSelectedAgentId(event.target.value); }} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold min-w-64">
            <option value="">All Agents</option>
            {agentOptions.map((agent: any) => <option key={agent.agent_id} value={agent.agent_id}>{agent.agent_name}</option>)}
          </select>
          <button type="button" onClick={exportAgentReport} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">Export Agent Performance</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-base font-bold text-slate-900">Agent Performance by Name</h3>
          <p className="text-xs text-slate-500 mt-1">Calls and successful recharges for every Agent under your teams.</p>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agents} margin={{ top: 10, right: 10, left: -15, bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="agent_name" angle={-35} textAnchor="end" interval={0} height={70} fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls_today" name="Calls" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recharged_today" name="Recharged" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-base font-bold text-slate-900">Recharge Performance by Agent</h3>
          <p className="text-xs text-slate-500 mt-1">Name-wise share of successful recharges today.</p>
          <div className="h-80 mt-4">
            {agents.some((agent: any) => agent.recharged_today > 0) ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={agents.filter((agent: any) => agent.recharged_today > 0)} dataKey="recharged_today" nameKey="agent_name" cx="50%" cy="45%" outerRadius={100} label>{agents.filter((agent: any) => agent.recharged_today > 0).map((agent: any, index: number) => <Cell key={agent.agent_id} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer> : <div className="h-full flex items-center justify-center text-sm text-slate-500">No successful recharges recorded today.</div>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-900">Date-wise Team Activity</h3>
        <p className="text-xs text-slate-500 mt-1">Seven-day calls, positive intent, and successful recharges.</p>
        <div className="h-72 mt-4"><ResponsiveContainer width="100%" height="100%"><LineChart data={dailyTrend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Legend /><Line type="monotone" dataKey="calls" name="Calls" stroke="#0284c7" strokeWidth={3} /><Line type="monotone" dataKey="positive_intent" name="Positive Intent" stroke="#6366f1" strokeWidth={3} /><Line type="monotone" dataKey="recharges" name="Recharges" stroke="#10b981" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
      </div>

      {/* Team Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Team Lead Performance & Conversion Ranking</h3>
          <p className="text-xs text-slate-500 mt-0.5">Compares conversion rates and output across assigned retention teams.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Team Lead</th>
                <th className="px-4 py-3">Agents Count</th>
                <th className="px-4 py-3">Total Assigned</th>
                <th className="px-4 py-3">Calls Today</th>
                <th className="px-4 py-3">Positive Intent</th>
                <th className="px-4 py-3">Recharged Today</th>
                <th className="px-4 py-3">Recovered Revenue</th>
                <th className="px-6 py-3">Retention Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teams.map((t: any) => (
                <tr key={t.team_lead_id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{t.team_lead_name}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">{t.agents_count} Agents</td>
                  <td className="px-4 py-3.5 font-medium">{t.assigned}</td>
                  <td className="px-4 py-3.5 font-semibold">{t.calls_today}</td>
                  <td className="px-4 py-3.5 text-indigo-600 font-semibold">{t.positive_intent}</td>
                  <td className="px-4 py-3.5 text-emerald-600 font-bold">{t.recharged_today}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">NPR {t.recovered_revenue.toLocaleString()}</td>
                  <td className="px-6 py-3.5 font-extrabold text-indigo-700">{t.conversion_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
