import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Eye } from 'lucide-react';

export const AgentMetricDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const metric = params.get('metric') || 'assigned';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard/agent/details/', { params: { metric } })
      .then((response) => setData(response.data))
      .finally(() => setLoading(false));
  }, [metric]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading metric details...</div>;

  const rows = data?.rows || [];
  const isCustomer = data?.kind === 'customers';

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-sky-700"><ArrowLeft className="w-4 h-4" /> Back to Dashboard</button>
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div><h2 className="text-xl font-extrabold text-slate-900">{data?.title}</h2><p className="text-xs text-slate-500 mt-1">All records behind this dashboard metric.</p></div>
        <span className="text-2xl font-black text-sky-700">{data?.count || 0}</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {rows.length === 0 ? <div className="p-10 text-center text-slate-500">No records found for this metric.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold"><tr>{isCustomer ? <><th className="px-5 py-3">Customer ID</th><th className="px-5 py-3">Name</th><th className="px-5 py-3">Mobile</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Next Follow-up</th><th className="px-5 py-3">Action</th></> : data?.kind === 'recharges' ? <><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount (NPR)</th><th className="px-5 py-3">Package</th></> : <><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Call Date</th><th className="px-5 py-3">Disposition</th><th className="px-5 py-3">Notes</th></>}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row: any) => <tr key={row.id} className="hover:bg-slate-50">{isCustomer ? <><td className="px-5 py-3 font-mono text-xs font-bold">{row.customer_id}</td><td className="px-5 py-3 font-bold text-slate-900">{row.name}</td><td className="px-5 py-3">{row.mobile_number}</td><td className="px-5 py-3">{row.customer_status}</td><td className="px-5 py-3">{row.next_followup_date || 'None'}</td><td className="px-5 py-3"><button type="button" onClick={() => navigate(`/customers/${row.id}`)} className="inline-flex items-center gap-1 text-xs font-bold text-sky-700"><Eye className="w-3.5 h-3.5" /> View</button></td></> : data?.kind === 'recharges' ? <><td className="px-5 py-3 font-bold">{row.customer_name}</td><td className="px-5 py-3">{row.recharge_date}</td><td className="px-5 py-3 font-black text-emerald-700">NPR {row.recharge_amount}</td><td className="px-5 py-3">{row.package}</td></> : <><td className="px-5 py-3 font-bold">{row.customer_name || row.customer}</td><td className="px-5 py-3">{row.call_date}</td><td className="px-5 py-3 text-indigo-700 font-semibold">{row.disposition_name}</td><td className="px-5 py-3">{row.notes}</td></>}</tr>)}</tbody></table></div>}
      </div>
    </div>
  );
};