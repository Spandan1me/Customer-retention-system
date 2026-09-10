import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { FollowUpLogModal } from '../../components/followups/FollowUpLogModal';
import {
  PhoneCall,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  History,
  ArrowLeft,
  DollarSign,
  Package,
  MapPin
} from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'followups' | 'recharges'>('timeline');

  // Recharge modal form state
  const [rechargeModal, setRechargeModal] = useState(false);
  const [packageFamilies, setPackageFamilies] = useState<any[]>([]);
  const [packageFamilyId, setPackageFamilyId] = useState('');
  const [packagePriceId, setPackagePriceId] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState('Online Portal');

  useEffect(() => {
    fetchCustomer360();
    api.get('/recharges/packages/').then((res) => {
      const families = res.data || [];
      setPackageFamilies(families);
      if (families[0]) {
        setPackageFamilyId(String(families[0].id));
        if (families[0].prices?.[0]) setPackagePriceId(String(families[0].prices[0].id));
      }
    }).catch(() => setPackageFamilies([]));
  }, [id]);

  const selectedFamily = packageFamilies.find((family) => String(family.id) === packageFamilyId);
  const selectedPrice = selectedFamily?.prices?.find((price: any) => String(price.id) === packagePriceId);

  const fetchCustomer360 = async () => {
    try {
      const res = await api.get(`/customers/${id}/`);
      setCustomer(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/recharges/', {
        customer: customer.id,
        package_price: parseInt(packagePriceId, 10),
        recharge_method: rechargeMethod,
        notes: 'Recorded from Customer 360 portal'
      });
      setRechargeModal(false);
      fetchCustomer360();
      alert('Successful Recharge Recorded & Customer Status Updated to RECHARGED!');
    } catch (err) {
      console.error(err);
      alert('Failed to record recharge.');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Customer 360 Profile...</div>;
  if (!customer) return <div className="p-8 text-center text-slate-500">Customer not found.</div>;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-900">{customer.name}</h2>
            <span className="bg-slate-900 text-white font-mono text-xs px-2.5 py-1 rounded-lg font-bold">{customer.customer_id}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              customer.customer_status === 'RECHARGED' ? 'bg-emerald-100 text-emerald-800' :
              customer.customer_status === 'POSITIVE_INTENT' ? 'bg-indigo-100 text-indigo-800' :
              'bg-slate-100 text-slate-700'
            }`}>
              {customer.customer_status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-4">
            <span>Mobile: <strong className="text-slate-800 font-mono">{customer.mobile_number}</strong></span>
            <span>Area: <strong className="text-slate-800">{customer.area_location || 'Central'}</strong></span>
            <span>Assigned Agent: <strong className="text-sky-700">{customer.assigned_agent_name}</strong></span>
          </p>
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Days Churned</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{customer.days_since_churn} Days</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Package Plan</p>
          <p className="text-sm font-bold text-slate-900 mt-1 truncate">{customer.package}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Prev Recharge</p>
          <p className="text-xl font-extrabold text-slate-900 mt-1">NPR {customer.previous_recharge_amount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase">Next Follow-up</p>
          <p className="text-sm font-extrabold text-sky-700 mt-1">{customer.next_followup_date || 'None'}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
          <p className="text-xs text-emerald-800 font-bold uppercase">Recovered Revenue</p>
          <p className="text-xl font-extrabold text-emerald-900 mt-1">NPR {customer.recovered_revenue || 0}</p>
        </div>
      </div>

      {/* Main Content Area & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Tabs & Timeline/History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-1 flex gap-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'timeline' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Customer 360 Timeline
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'followups' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Follow-up Logs ({customer.followups?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('recharges')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
                activeTab === 'recharges' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Recharge History ({customer.recharges?.length || 0})
            </button>
          </div>

          {/* TAB 1: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" /> Chronological Activity Audit Trail
              </h3>

              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                {(customer.timeline || []).map((t: any) => (
                  <div key={t.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white ring-4 ring-slate-100"></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-900">{t.action}</span>
                        <span className="text-slate-400 font-mono">{new Date(t.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-600">By Agent: <strong className="text-slate-800">{t.agent_name}</strong></p>
                      {t.notes && <p className="text-xs text-slate-500 bg-white p-2 rounded-lg border border-slate-100 italic">{t.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FOLLOW-UPS TABLE */}
          {activeTab === 'followups' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Disposition</th>
                    <th className="px-6 py-3">Notes</th>
                    <th className="px-4 py-3">Next Action</th>
                    <th className="px-4 py-3">Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(customer.followups || []).map((f: any) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{f.call_date}</td>
                      <td className="px-4 py-3.5 font-bold text-indigo-700">{f.disposition_name}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">{f.notes}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-sky-700">{f.next_action}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-900">{f.agent_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: RECHARGES TABLE */}
          {activeTab === 'recharges' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Recharge Date</th>
                    <th className="px-4 py-3">Amount (NPR)</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(customer.recharges || []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-900">{r.recharge_date}</td>
                      <td className="px-4 py-3.5 font-black text-emerald-700">NPR {r.recharge_amount}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold">{r.package}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">{r.recharge_method}</td>
                      <td className="px-4 py-3.5">
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded font-extrabold">Verified</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Column: Quick Action Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Quick Action Panel</h3>

            <button
              onClick={() => setRechargeModal(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Record Verified Recharge
            </button>

            <FollowUpLogModal
              customer={customer}
              onSaved={fetchCustomer360}
              triggerLabel="Record Call Log"
              triggerClassName="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition"
            />

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
              <p className="font-bold text-slate-800 uppercase">Customer Information</p>
              <p>Address: <strong className="text-slate-900">{customer.address || 'N/A'}</strong></p>
              <p>Supervisor: <strong className="text-slate-900">{customer.assigned_supervisor_name}</strong></p>
              <p>Team Lead: <strong className="text-slate-900">{customer.assigned_team_lead_name}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Record Recharge Modal */}
      {rechargeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Record Customer Recharge Conversion</h3>
            <p className="text-xs text-slate-500">Only actual verified recharge converts customer status to RECHARGED.</p>

            <form onSubmit={handleRecordRecharge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Package Family</label>
                <select value={packageFamilyId} onChange={(event) => { const family = packageFamilies.find((item) => String(item.id) === event.target.value); setPackageFamilyId(event.target.value); setPackagePriceId(family?.prices?.[0] ? String(family.prices[0].id) : ''); }} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold" required>
                  <option value="">Select package family</option>
                  {packageFamilies.map((family: any) => <option key={family.id} value={family.id}>{family.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Speed and Renewal Term</label>
                <select value={packagePriceId} onChange={(event) => setPackagePriceId(event.target.value)} className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold" required>
                  <option value="">Select price</option>
                  {(selectedFamily?.prices || []).map((price: any) => <option key={price.id} value={price.id}>{price.speed_mbps} Mbps · {price.term_months} Month{price.term_months === 1 ? '' : 's'} · {price.amount}</option>)}
                </select>
                {selectedPrice && <p className="text-sm font-black text-emerald-700 mt-2">Renewal price: {selectedPrice.amount}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Recharge Method</label>
                <select
                  value={rechargeMethod}
                  onChange={(e) => setRechargeMethod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
                >
                  <option value="Online Portal">Online Portal</option>
                  <option value="Dealer Cash">Dealer Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setRechargeModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl">Record & Convert</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
