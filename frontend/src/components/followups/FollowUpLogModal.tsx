import React, { useEffect, useState } from 'react';
import api from '../../api';
import { PhoneCall } from 'lucide-react';

interface FollowUpLogModalProps {
  customer: any;
  onSaved: () => void | Promise<void>;
  triggerLabel?: string;
  triggerClassName?: string;
}

export const FollowUpLogModal: React.FC<FollowUpLogModalProps> = ({
  customer,
  onSaved,
  triggerLabel = 'Record Call Log',
  triggerClassName = 'px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold rounded-lg transition',
}) => {
  const [modalOpen, setModalOpen] = useState(false);
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
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = categories.find((category) => String(category.id) === categoryId);
  const subcategories = selectedCategory?.subcategories || [];
  const selectedSubcategory = subcategories.find((subcategory: any) => String(subcategory.id) === subcategoryId);
  const dispositions = selectedSubcategory?.dispositions || [];
  const isPreDisconnection = selectedSubcategory?.name === 'Pre Disconnection Follow Up';

  useEffect(() => {
    if (!modalOpen) return;

    const fetchCategories = async () => {
      setLoadingOptions(true);
      try {
        const res = await api.get('/followups/categories/');
        const categoryData = res.data.results || res.data;
        setCategories(categoryData);
        if (categoryData.length > 0) {
          const firstCategory = categoryData[0];
          setCategoryId(String(firstCategory.id));
          const workflowNames: Record<string, string> = { CHURN_FOLLOW_UP: 'Churn Follow Up', PRE_DISCONNECTION_FOLLOW_UP: 'Pre Disconnection Follow Up', DEALER_FOLLOW_UP: 'Dealer Follow Up' };
          const selectedSubcategory = firstCategory.subcategories?.find((subcategory: any) => subcategory.name === workflowNames[customer.retention_workflow]) || firstCategory.subcategories?.[0];
          if (selectedSubcategory) setSubcategoryId(String(selectedSubcategory.id));
        }
      } catch {
        setError('Unable to load disposition options.');
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchCategories();
  }, [modalOpen]);

  const openModal = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCallDate(now.toISOString().split('T')[0]);
    setCallTime(now.toTimeString().slice(0, 5));
    setDaysChurned(String(customer.days_since_churn || 0));
    setExpiryDate(customer.expiry_date || '');
    setNextDate(tomorrow.toISOString().split('T')[0]);
    setCategoryId('');
    setSubcategoryId('');
    setDispositionId('');
    setNotes('');
    setNextAction('CALL_AGAIN');
    setNextTime('10:00');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
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
        next_followup_date: nextDate || null,
        next_followup_time: nextTime || null,
      });
      setModalOpen(false);
      await onSaved();
    } catch {
      setError('Failed to save follow-up record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button type="button" onClick={openModal} className={triggerClassName}>
        <PhoneCall className="w-4 h-4 inline-block mr-1" />
        {triggerLabel}
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Record Completed Call</h3>
                <p className="text-xs text-slate-500">Enter the outcome of the call completed outside this system. {customer.name} ({customer.customer_id})</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Call Date</label>
                  <input type="date" value={callDate} onChange={(event) => setCallDate(event.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Call Time</label>
                  <input type="time" value={callTime} onChange={(event) => setCallTime(event.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium" required />
                </div>
                {!isPreDisconnection && <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Days Churned</label>
                  <input required min="0" type="number" value={daysChurned} onChange={(event) => setDaysChurned(event.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium" />
                </div>}
                {isPreDisconnection && <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Expiry Date</label>
                  <input required type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium" />
                </div>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(''); setDispositionId(''); }} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 font-medium" required>
                  <option value="">-- Select Category --</option>
                  {categories.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subcategory</label>
                <select value={subcategoryId} onChange={(event) => { setSubcategoryId(event.target.value); setDispositionId(''); }} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 font-medium" required disabled={!categoryId}>
                  <option value="">-- Select Subcategory --</option>
                  {subcategories.map((subcategory: any) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Disposition / Call Outcome</label>
                <select value={dispositionId} onChange={(event) => setDispositionId(event.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 font-medium" required disabled={!subcategoryId || loadingOptions}>
                  <option value="">{loadingOptions ? 'Loading outcomes...' : '-- Select Call Outcome --'}</option>
                  {dispositions.map((disposition: any) => <option key={disposition.id} value={disposition.id}>{disposition.name} [{disposition.business_classification}]</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Agent Follow-up Notes</label>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500" placeholder="Record customer response and commitments..." required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Next Action</label>
                  <select value={nextAction} onChange={(event) => setNextAction(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold">
                    <option value="CALL_AGAIN">Call Again</option>
                    <option value="VERIFY_RECHARGE">Verify Recharge</option>
                    <option value="ESCALATE_SERVICE">Escalate Service</option>
                    <option value="SEND_OFFER">Send Scheme Offer</option>
                    <option value="CLOSE_LOST">Close as Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Next Follow-up Date</label>
                  <input type="date" value={nextDate} onChange={(event) => setNextDate(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Next Follow-up Time</label>
                  <input type="time" value={nextTime} onChange={(event) => setNextTime(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 shadow-md shadow-sky-600/30 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};