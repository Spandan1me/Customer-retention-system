import React, { useEffect, useState } from 'react';
import api from '../../api';
import { Shield, Users, CheckCircle2, TrendingUp, DollarSign, AlertTriangle, Layers, PhoneCall } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  const fetchAdminDashboard = async () => {
    try {
      const res = await api.get('/dashboard/admin/');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Command Center...</div>;

  const kpis = data?.kpis || {};
  const funnel = data?.funnel || [];

  return (
    <div className="space-y-6">
      {/* Super Admin Command Center Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-extrabold text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-purple-400" /> Organization Command Center
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1">Apex Fiber ISP Churn Recovery SaaS</h2>
          <p className="text-indigo-200 text-sm mt-0.5">Global organization health, 6-stage conversion funnel, and recovered revenue tracking.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 text-right">
          <p className="text-xs text-purple-200 font-bold uppercase tracking-wider">Total Revenue Recovered</p>
          <p className="text-3xl font-extrabold text-emerald-400">NPR {kpis.recovered_revenue?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Top Company KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Total Customers</div>
          <p className="text-2xl font-extrabold text-slate-900">{kpis.total_customers}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Active Staff Agents</div>
          <p className="text-2xl font-extrabold text-indigo-600">{kpis.active_agents}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-bold uppercase mb-1">Today Organization Calls</div>
          <p className="text-2xl font-extrabold text-slate-900">{kpis.today_calls}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="text-emerald-700 text-xs font-bold uppercase mb-1">Overall Retention Rate</div>
          <p className="text-2xl font-extrabold text-emerald-900">{kpis.overall_retention_rate}%</p>
        </div>
      </div>

      {/* 6-Stage Retention Conversion Funnel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" /> ISP Retention Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Measures progression from initial assigned customer database to verified successful recharges.</p>
          </div>
          <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Recharged Total: {kpis.recharged_total} Customers
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="vertical" margin={{ left: 40, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="stage" type="category" stroke="#475569" fontSize={12} width={130} />
              <Tooltip />
              <Bar dataKey="count" name="Customers" fill="#0284c7" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
