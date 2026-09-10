import React, { useEffect, useState } from 'react';
import api from '../../api';
import { PieChart, TrendingUp, DollarSign, Layers } from 'lucide-react';

export const ChurnReasonPage: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChurnReasons();
  }, []);

  const fetchChurnReasons = async () => {
    try {
      const res = await api.get('/dashboard/churn-reasons/');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Analyzing Churn Reasons...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1">
            <PieChart className="w-4 h-4" /> Root Cause Intelligence
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1">Churn Reason & Conversion Analysis</h2>
          <p className="text-slate-300 text-sm mt-0.5">Identifies which churn reasons have the highest recovery opportunity and conversion rate.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Churn Reason / Disposition</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Customer Count</th>
                <th className="px-4 py-3">Recharged Count</th>
                <th className="px-4 py-3">Conversion Rate</th>
                <th className="px-6 py-3">Recovered Revenue (NPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item: any) => (
                <tr key={item.disposition_id} className="hover:bg-slate-50">
                  <td className="px-6 py-3.5 font-bold text-slate-900">{item.reason_name}</td>
                  <td className="px-4 py-3.5 text-xs">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded">
                      {item.classification}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{item.customer_count}</td>
                  <td className="px-4 py-3.5 font-bold text-emerald-600">{item.recharged_count}</td>
                  <td className="px-4 py-3.5 font-extrabold text-indigo-700">{item.conversion_rate}%</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">NPR {item.recovered_revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
