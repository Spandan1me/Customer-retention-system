import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { PhoneCall, Zap, RefreshCw } from 'lucide-react';
import { FollowUpLogModal } from '../../components/followups/FollowUpLogModal';

export const SmartQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers/my-queue/');
      setQueueData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Smart Work Queue...</div>;

  const nextBest = queueData?.next_best_customer;
  const queue = queueData?.queue || [];

  return (
    <div className="space-y-6">
      {/* Queue Banner */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Smart Agent Work Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated queue prioritization based on retention intent, overdue follow-ups, and churn bucket.</p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue ({queueData?.count || 0} Ready)
        </button>
      </div>

      {/* NEXT BEST CUSTOMER TO CALL HERO CARD */}
      {nextBest ? (
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white rounded-2xl p-6 shadow-2xl border border-sky-500/20 relative overflow-hidden">
          <div className="absolute top-3 right-4 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 uppercase">
            <Zap className="w-3.5 h-3.5" /> Next Best Customer to Call
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center mt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-white">{nextBest.name}</h3>
                <span className="bg-sky-500/30 text-sky-200 text-xs px-2.5 py-0.5 rounded font-mono font-bold">{nextBest.customer_id}</span>
              </div>
              <p className="text-sky-300 font-mono text-base font-bold flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" /> {nextBest.mobile_number}
              </p>
              <p className="text-xs text-slate-300">Package: <span className="font-semibold text-white">{nextBest.package}</span></p>
            </div>

            <div className="space-y-1.5 border-l border-slate-700/60 pl-6">
              <p className="text-xs text-slate-400">Days Since Churn: <span className="font-bold text-amber-400">{nextBest.days_since_churn} Days</span></p>
              <p className="text-xs text-slate-400">Latest Reason: <span className="font-bold text-sky-300">{nextBest.latest_disposition_name || 'Not Contacted'}</span></p>
              <p className="text-xs text-slate-400">Priority Level: <span className="font-bold text-emerald-400 uppercase">{nextBest.priority}</span></p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate(`/customers/${nextBest.id}/log`)}
                className="px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition flex items-center gap-2"
              >
                <PhoneCall className="w-5 h-5" /> Keep Next Call Log
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
          <p className="font-bold text-slate-800">No customers are assigned to your queue.</p>
          <p className="text-sm text-slate-500 mt-2">Add a customer directly to keep a completed external call log.</p>
          <button type="button" onClick={() => navigate('/new-call-log')} className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700">Add Customer & Keep Log</button>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-800">
          Prioritized Work Queue List
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Customer ID</th>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Days Churned</th>
                <th className="px-4 py-3">Latest Disposition</th>
                <th className="px-4 py-3">Next Follow-up</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((cust: any) => (
                <tr key={cust.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-0.5 rounded font-extrabold uppercase ${
                      cust.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                      cust.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {cust.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">{cust.customer_id}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900">{cust.name}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-sky-700">{cust.mobile_number}</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-700">{cust.days_since_churn} d</td>
                  <td className="px-4 py-3.5 text-xs text-slate-800 font-medium">{cust.latest_disposition_name}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 font-semibold">{cust.next_followup_date || 'Today'}</td>
                  <td className="px-4 py-3.5">
                    <FollowUpLogModal customer={cust} onSaved={fetchQueue} />
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
