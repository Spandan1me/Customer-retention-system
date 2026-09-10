import React, { useEffect, useState } from 'react';
import api from '../../api';
import { AlertTriangle, Clock, PhoneCall, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OverdueFollowupsPage: React.FC = () => {
  const [overdue, setOverdue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverdue();
  }, []);

  const fetchOverdue = async () => {
    try {
      const res = await api.get('/followups/overdue/');
      setOverdue(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Overdue Follow-up Alerts...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500 text-white rounded-xl shadow-md">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-rose-950">Overdue Follow-up Alert Center</h2>
            <p className="text-xs text-rose-700 mt-0.5">{overdue.length} Missed callback deadlines requiring immediate intervention.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Days Overdue</th>
                <th className="px-4 py-3">Customer ID</th>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Assigned Agent</th>
                <th className="px-4 py-3">Last Disposition</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overdue.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5">
                    <span className="bg-rose-100 text-rose-800 font-extrabold text-xs px-2.5 py-1 rounded-full">
                      {item.days_overdue} Days Late
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold">{item.customer_id}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">{item.name}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-sky-700">{item.mobile_number}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">{item.assigned_agent}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">{item.latest_disposition}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => navigate(`/customers/${item.id}`)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg"
                    >
                      Intervene Now
                    </button>
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
