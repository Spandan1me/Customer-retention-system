import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, ClipboardPenLine, Save } from 'lucide-react';

export const CallLogPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [dispositionId, setDispositionId] = useState('');
  const [callDate, setCallDate] = useState('');
  const [callTime, setCallTime] = useState('');
  const [daysChurned, setDaysChurned] = useState('0');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('CALL_AGAIN');
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('10:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = categories.find((category) => String(category.id) === categoryId);
  const subcategories = selectedCategory?.subcategories || [];
  const selectedSubcategory = subcategories.find((subcategory: any) => String(subcategory.id) === subcategoryId);
  const dispositions = selectedSubcategory?.dispositions || [];
  const isPreDisconnection = selectedSubcategory?.name === 'Pre Disconnection Follow Up';

  useEffect(() => {
    const loadPage = async () => {
      try {
        const [customerResponse, categoryResponse] = await Promise.all([
          api.get(`/customers/${id}/`),
          api.get('/followups/categories/'),
        ]);
        setCustomer(customerResponse.data);
        setDaysChurned(String(customerResponse.data.days_since_churn || 0));
        setExpiryDate(customerResponse.data.expiry_date || '');
        const categoryData = categoryResponse.data.results || categoryResponse.data;
        setCategories(categoryData);
        if (categoryData[0]) {
          setCategoryId(String(categoryData[0].id));
          const workflowNames: Record<string, string> = { CHURN_FOLLOW_UP: 'Churn Follow Up', PRE_DISCONNECTION_FOLLOW_UP: 'Pre Disconnection Follow Up', DEALER_FOLLOW_UP: 'Dealer Follow Up' };
          const selectedSubcategory = categoryData[0].subcategories?.find((subcategory: any) => subcategory.name === workflowNames[customerResponse.data.retention_workflow]) || categoryData[0].subcategories?.[0];
          if (selectedSubcategory) setSubcategoryId(String(selectedSubcategory.id));
        }
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setCallDate(now.toISOString().split('T')[0]);
        setCallTime(now.toTimeString().slice(0, 5));
        setNextDate(tomorrow.toISOString().split('T')[0]);
      } catch {
        setError('Unable to load this customer or the retention options.');
      } finally {
        setLoading(false);
      }
    };
    loadPage();
  }, [id]);

  const submitLog = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/followups/records/', {
        customer: customer.id,
        call_date: callDate,
        call_time: callTime,
        days_since_churn: parseInt(daysChurned, 10) || 0,
        expiry_date: expiryDate || null,
        disposition: parseInt(dispositionId, 10),
        notes,
        next_action: nextAction,
        next_followup_date: nextAction === 'CALL_AGAIN' ? (nextDate || null) : null,
        next_followup_time: nextAction === 'CALL_AGAIN' ? (nextTime || null) : null,
      });
      navigate(`/customers/${customer.id}`);
    } catch (err: any) {
      const details = err.response?.data;
      setError(details?.error || 'Unable to save this call log.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading call log...</div>;
  if (!customer) return <div className="p-8 text-center text-rose-600">{error || 'Customer not found.'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate(`/customers/${customer.id}`)} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-sky-700">
        <ArrowLeft className="w-4 h-4" /> Back to Customer 360
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <ClipboardPenLine className="w-6 h-6 text-sky-600 mt-1" />
          <div>
            <h2 className="text-2xl font-black text-slate-900">Keep Next Call Log</h2>
            <p className="text-sm text-slate-500 mt-1">Record a call completed in your external phone system.</p>
            <p className="text-sm font-bold text-slate-800 mt-3">{customer.name} <span className="font-mono text-sky-700">({customer.customer_id})</span></p>
            <p className="text-xs text-slate-500">{customer.mobile_number} · Current status: {customer.customer_status}</p>
          </div>
        </div>
      </div>

      <form onSubmit={submitLog} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Call Date
            <input required type="date" value={callDate} onChange={(event) => setCallDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Call Time
            <input required type="time" value={callTime} onChange={(event) => setCallTime(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </label>
          {!isPreDisconnection && <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Days Churned
            <input required min="0" type="number" value={daysChurned} onChange={(event) => setDaysChurned(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </label>}
          {isPreDisconnection && <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Expiry Date
            <input required type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </label>}
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category
            <select required value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(''); setDispositionId(''); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">Select category</option>
              {categories.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subcategory
            <select required disabled={!categoryId} value={subcategoryId} onChange={(event) => { setSubcategoryId(event.target.value); setDispositionId(''); }} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <option value="">Select subcategory</option>
              {subcategories.map((subcategory: any) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
            </select>
          </label>
        </div>

        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Second Subcategory / Disposition
          <select required disabled={!subcategoryId} value={dispositionId} onChange={(event) => setDispositionId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="">Select call outcome</option>
            {dispositions.map((disposition: any) => <option key={disposition.id} value={disposition.id}>{disposition.name} [{disposition.business_classification}]</option>)}
          </select>
        </label>

        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Call Notes
          <textarea required rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What did the customer say? Record the response, objection, promise, or action taken." className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Next Action
            <select
              value={nextAction}
              onChange={(event) => {
                const value = event.target.value;
                setNextAction(value);
                if (value === 'NO_CALL_NEEDED') {
                  setNextDate('');
                  setNextTime('');
                }
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="CALL_AGAIN">Call Again</option>
              <option value="NO_CALL_NEEDED">No Need to Call Again</option>
            </select>
          </label>

          {nextAction === 'CALL_AGAIN' && (
            <>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Next Follow-up Date
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(event) => setNextDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>

              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Next Follow-up Time
                <input
                  type="time"
                  required
                  value={nextTime}
                  onChange={(event) => setNextTime(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
            </>
          )}
        </div>

        {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={() => navigate(`/customers/${customer.id}`)} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Call Log'}
          </button>
        </div>
      </form>
    </div>
  );
};