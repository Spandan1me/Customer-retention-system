import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';

export const CustomerRemarksPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [remarks, setRemarks] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await api.get(`/customers/remarks/${id}/`);
      setCustomer(response.data.customer);
      setRemarks(response.data.remarks || []);
    } catch {
      setError('Unable to load this customer.');
    }
  };

  useEffect(() => { load(); }, [id]);

  const addRemark = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    try {
      await api.post(`/customers/remarks/${id}/`, { text });
      setText('');
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to save remark.');
    }
  };

  if (!customer) return <div className="p-8 text-center text-slate-500">{error || 'Loading customer...'}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate(`/customers/${id}`)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-sky-700"><ArrowLeft className="w-4 h-4" /> Back to Customer 360</button>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"><div className="flex items-start gap-3"><MessageSquare className="w-6 h-6 text-sky-600" /><div><h2 className="text-2xl font-black text-slate-900">Add Customer Remark</h2><p className="text-sm text-slate-500 mt-1">{customer.name} ({customer.customer_id}) already exists. Add a separate remark without creating another customer or changing previous call logs.</p></div></div></div>
      <form onSubmit={addRemark} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"><label className="block text-xs font-bold text-slate-700 uppercase">What did the customer say?<textarea required rows={5} value={text} onChange={(event) => setText(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" placeholder="Add the new remark..." /></label>{error && <p className="text-sm font-semibold text-rose-600">{error}</p>}<div className="flex justify-end"><button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold"><Send className="w-4 h-4" /> Save Remark</button></div></form>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"><h3 className="font-bold text-slate-900">Previous Remarks</h3>{remarks.length === 0 ? <p className="text-sm text-slate-500">No remarks yet.</p> : remarks.map((remark: any) => <div key={remark.id} className="border-l-2 border-sky-500 pl-4"><p className="text-sm text-slate-700">{remark.text}</p><p className="text-xs text-slate-400 mt-1">{remark.author_name} · {new Date(remark.created_at).toLocaleString()}</p></div>)}</div>
    </div>
  );
};