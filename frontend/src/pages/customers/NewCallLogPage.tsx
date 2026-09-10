import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, ClipboardPenLine } from 'lucide-react';

export const NewCallLogPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_id: '', name: '', mobile_number: '', package: '', days_since_churn: '0', retention_workflow: 'CHURN_FOLLOW_UP', expiry_date: '' });
  const [packageOptions, setPackageOptions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    api.get('/recharges/packages/').then((response) => {
      const options = (response.data || []).flatMap((family: any) => (family.prices || []).map((price: any) => ({
        value: `${family.name} - ${price.speed_mbps} Mbps`,
        label: `${family.name} - ${price.speed_mbps} Mbps`,
      })));
      setPackageOptions(options.filter((option: any, index: number, all: any[]) => all.findIndex((item) => item.value === option.value) === index));
    }).catch(() => setPackageOptions([]));
  }, []);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await api.post('/customers/start-call-log/', { ...form, days_since_churn: parseInt(form.days_since_churn, 10) || 0, expiry_date: form.expiry_date || null });
      navigate(response.data.existing ? `/customers/${response.data.id}/remarks` : `/customers/${response.data.id}/log`);
    } catch (err: any) {
      const details = err.response?.data;
      setError(details?.customer_id?.[0] || details?.error || 'Unable to add this customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate('/queue')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-sky-700"><ArrowLeft className="w-4 h-4" /> Back to My Log Queue</button>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-3"><ClipboardPenLine className="w-6 h-6 text-sky-600 mt-1" /><div><h2 className="text-2xl font-black text-slate-900">Start New Call Log</h2><p className="text-sm text-slate-500 mt-1">Add the customer you contacted in your external phone system.</p></div></div>
      </div>
      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer ID *<input required value={form.customer_id} onChange={(event) => update('customer_id', event.target.value)} placeholder="e.g. CUST-10001" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Customer Name *<input required value={form.name} onChange={(event) => update('name', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mobile Number *<input required value={form.mobile_number} onChange={(event) => update('mobile_number', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Package *<select required value={form.package} onChange={(event) => update('package', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Select package</option>{packageOptions.map((option: any) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Follow-up Type *<select required value={form.retention_workflow} onChange={(event) => update('retention_workflow', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="CHURN_FOLLOW_UP">Churn Follow Up</option><option value="PRE_DISCONNECTION_FOLLOW_UP">Pre Disconnection Follow Up</option><option value="DEALER_FOLLOW_UP">Dealer Follow Up</option></select></label>
          {form.retention_workflow !== 'PRE_DISCONNECTION_FOLLOW_UP' && <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Days Churned *<input required min="0" type="number" value={form.days_since_churn} onChange={(event) => update('days_since_churn', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>}
          {form.retention_workflow === 'PRE_DISCONNECTION_FOLLOW_UP' && <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expiry Date *<input required type="date" value={form.expiry_date} onChange={(event) => update('expiry_date', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>}
        </div>
        {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => navigate('/queue')} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">Cancel</button><button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold disabled:opacity-60">{saving ? 'Opening log...' : 'Continue to Call Log'}</button></div>
      </form>
    </div>
  );
};