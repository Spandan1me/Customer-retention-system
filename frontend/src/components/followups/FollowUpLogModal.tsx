import React, { useEffect, useState } from 'react';
import api from '../../api';
import { PhoneCall, X } from 'lucide-react';

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

  const selectedCategory = categories.find(
    (category) => String(category.id) === categoryId
  );

  const subcategories =
    selectedCategory?.subcategories || [];

  const selectedSubcategory = subcategories.find(
    (subcategory: any) =>
      String(subcategory.id) === subcategoryId
  );

  const dispositions =
    selectedSubcategory?.dispositions || [];

  const isPreDisconnection =
    selectedSubcategory?.name ===
    'Pre Disconnection Follow Up';

  useEffect(() => {
    if (!modalOpen) return;

    const fetchCategories = async () => {
      setLoadingOptions(true);

      try {
        const res = await api.get('/followups/categories/');
        const categoryData =
          res.data.results || res.data;

        setCategories(categoryData);

        if (categoryData.length > 0) {
          const firstCategory = categoryData[0];

          setCategoryId(String(firstCategory.id));

          const workflowNames: Record<string, string> = {
            CHURN_FOLLOW_UP: 'Churn Follow Up',
            PRE_DISCONNECTION_FOLLOW_UP:
              'Pre Disconnection Follow Up',
            DEALER_FOLLOW_UP: 'Dealer Follow Up',
          };

          const selectedSubcategory =
            firstCategory.subcategories?.find(
              (subcategory: any) =>
                subcategory.name ===
                workflowNames[customer.retention_workflow]
            ) ||
            firstCategory.subcategories?.[0];

          if (selectedSubcategory) {
            setSubcategoryId(
              String(selectedSubcategory.id)
            );
          }
        }
      } catch {
        setError(
          'Unable to load disposition options.'
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchCategories();
  }, [modalOpen, customer.retention_workflow]);

  const openModal = () => {
    const now = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    setCallDate(
      now.toISOString().split('T')[0]
    );

    setCallTime(
      now.toTimeString().slice(0, 5)
    );

    setDaysChurned(
      String(customer.days_since_churn || 0)
    );

    setExpiryDate(
      customer.expiry_date || ''
    );

    setNextDate(
      tomorrow.toISOString().split('T')[0]
    );

    setCategoryId('');
    setSubcategoryId('');
    setDispositionId('');
    setNotes('');
    setNextAction('CALL_AGAIN');
    setNextTime('10:00');
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) {
      setModalOpen(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      await api.post('/followups/records/', {
        customer: customer.id,
        call_date: callDate,
        call_time: callTime,
        days_since_churn:
          parseInt(daysChurned, 10) || 0,
        expiry_date: expiryDate || null,
        disposition:
          parseInt(dispositionId, 10),
        notes,
        next_action: nextAction,
        next_followup_date:
          nextAction === 'CALL_AGAIN'
            ? nextDate || null
            : null,
        next_followup_time:
          nextAction === 'CALL_AGAIN'
            ? nextTime || null
            : null,
      });

      setModalOpen(false);

      await onSaved();
    } catch {
      setError(
        'Failed to save follow-up record. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`${triggerClassName} inline-flex items-center justify-center`}
      >
        <PhoneCall className="w-4 h-4 mr-1 shrink-0" />
        {triggerLabel}
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] flex flex-col border border-slate-100 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Record Completed Call
                </h3>

                <p className="text-xs text-slate-500 mt-1 leading-5 break-words">
                  Enter the outcome of the call completed
                  outside this system.{' '}
                  <span className="font-semibold text-slate-700">
                    {customer.name}
                  </span>{' '}
                  ({customer.customer_id})
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-2 -mr-2 -mt-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg shrink-0 disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto overscroll-contain">
              <form
                onSubmit={handleSubmit}
                className="p-4 sm:p-6 space-y-4"
              >
                {/* Call details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Call Date
                    </label>

                    <input
                      type="date"
                      value={callDate}
                      onChange={(event) =>
                        setCallDate(event.target.value)
                      }
                      className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Call Time
                    </label>

                    <input
                      type="time"
                      value={callTime}
                      onChange={(event) =>
                        setCallTime(event.target.value)
                      }
                      className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>

                  {!isPreDisconnection && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Days Churned
                      </label>

                      <input
                        required
                        min="0"
                        type="number"
                        inputMode="numeric"
                        value={daysChurned}
                        onChange={(event) =>
                          setDaysChurned(
                            event.target.value
                          )
                        }
                        className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}

                  {isPreDisconnection && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Expiry Date
                      </label>

                      <input
                        required
                        type="date"
                        value={expiryDate}
                        onChange={(event) =>
                          setExpiryDate(
                            event.target.value
                          )
                        }
                        className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>

                  <select
                    value={categoryId}
                    onChange={(event) => {
                      setCategoryId(event.target.value);
                      setSubcategoryId('');
                      setDispositionId('');
                    }}
                    className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 font-medium bg-white"
                    required
                  >
                    <option value="">
                      -- Select Category --
                    </option>

                    {categories.map((category: any) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subcategory
                  </label>

                  <select
                    value={subcategoryId}
                    onChange={(event) => {
                      setSubcategoryId(
                        event.target.value
                      );
                      setDispositionId('');
                    }}
                    className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 font-medium bg-white"
                    required
                    disabled={!categoryId}
                  >
                    <option value="">
                      -- Select Subcategory --
                    </option>

                    {subcategories.map(
                      (subcategory: any) => (
                        <option
                          key={subcategory.id}
                          value={subcategory.id}
                        >
                          {subcategory.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Disposition */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Disposition / Call Outcome
                  </label>

                  <select
                    value={dispositionId}
                    onChange={(event) =>
                      setDispositionId(
                        event.target.value
                      )
                    }
                    className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 font-medium bg-white"
                    required
                    disabled={
                      !subcategoryId ||
                      loadingOptions
                    }
                  >
                    <option value="">
                      {loadingOptions
                        ? 'Loading outcomes...'
                        : '-- Select Call Outcome --'}
                    </option>

                    {dispositions.map(
                      (disposition: any) => (
                        <option
                          key={disposition.id}
                          value={disposition.id}
                        >
                          {disposition.name} [
                          {
                            disposition.business_classification
                          }
                          ]
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Agent Follow-up Notes
                  </label>

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    rows={4}
                    className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-y"
                    placeholder="Record customer response and commitments..."
                    required
                  />
                </div>

                {/* Next Action */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    className={
                      nextAction === 'CALL_AGAIN'
                        ? 'sm:col-span-1'
                        : 'sm:col-span-3'
                    }
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Next Action
                    </label>

                    <select
                      value={nextAction}
                      onChange={(event) => {
                        const value =
                          event.target.value;

                        setNextAction(value);

                        if (
                          value ===
                          'NO_CALL_NEEDED'
                        ) {
                          setNextDate('');
                          setNextTime('');
                        }
                      }}
                      className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="CALL_AGAIN">
                        Call Again
                      </option>

                      <option value="NO_CALL_NEEDED">
                        No Need to Call Again
                      </option>
                    </select>
                  </div>

                  {nextAction === 'CALL_AGAIN' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Next Follow-up Date
                        </label>

                        <input
                          type="date"
                          required
                          value={nextDate}
                          onChange={(event) =>
                            setNextDate(
                              event.target.value
                            )
                          }
                          className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Next Follow-up Time
                        </label>

                        <input
                          type="time"
                          required
                          value={nextTime}
                          onChange={(event) =>
                            setNextTime(
                              event.target.value
                            )
                          }
                          className="w-full min-w-0 px-3 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
                    <p className="text-xs font-semibold text-rose-600">
                      {error}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 shadow-md shadow-sky-600/30 disabled:opacity-60"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save Follow-up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
