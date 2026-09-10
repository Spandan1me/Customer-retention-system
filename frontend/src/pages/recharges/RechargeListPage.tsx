import React, { useEffect, useState } from 'react';
import api from '../../api';
import { CheckCircle2, DollarSign, Award, ShieldCheck } from 'lucide-react';

export const RechargeListPage: React.FC = () => {
  const [recharges, setRecharges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecharges();
  }, []);

  const fetchRecharges = async () => {
    try {
      const res = await api.get('/recharges/');
      setRecharges(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = recharges.reduce((acc, r) => acc + parseFloat(r.recovered_revenue || 0), 0);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Recharges...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Verified Conversion Module
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">Recharge & Revenue Recovery Ledger</h2>
          <p className="text-emerald-100 text-sm mt-0.5">Primary success metrics: Only actual verified recharges count as retained revenue.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-emerald-300 font-bold uppercase">Total Recovered Revenue</p>
          <p className="text-3xl font-extrabold text-white">NPR {totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Customer ID</th>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-4 py-3">Recharge Date</th>
                <th className="px-4 py-3">Amount (NPR)</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Team Lead</th>
                <th className="px-4 py-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recharges.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">{r.customer_code}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">{r.customer_name}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{r.recharge_date}</td>
                  <td className="px-4 py-3.5 font-black text-emerald-700">NPR {r.recharge_amount}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-800 font-semibold">{r.package}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">{r.agent_name}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{r.team_lead_name}</td>
                  <td className="px-4 py-3.5">
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
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
