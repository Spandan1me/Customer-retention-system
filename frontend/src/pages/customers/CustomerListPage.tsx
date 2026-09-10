import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, UserCheck, Eye, CheckSquare, Square } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const CustomerListPage: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bucketFilter, setBucketFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [targetAgentId, setTargetAgentId] = useState('');

  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, bucketFilter, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers/', {
        params: {
          search,
          status: statusFilter,
          churn_bucket: bucketFilter
        }
      });
      setCustomers(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = async () => {
    try {
      const res = await api.get('/users/', { params: { role: 'AGENT' } });
      setAgents(res.data.results || res.data);
      setAssignModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkAssign = async () => {
    if (!targetAgentId || selectedIds.length === 0) return;
    try {
      await api.post('/customers/assign/', {
        customer_ids: selectedIds,
        agent_id: parseInt(targetAgentId)
      });
      setAssignModalOpen(false);
      setSelectedIds([]);
      fetchCustomers();
      alert('Customers reassigned successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to reassign customers.');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" /> Customer Master 360 Database
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Central repository of churned and active retention customer accounts.</p>
        </div>

        {(user?.role === 'SUPER_ADMIN' || user?.role === 'SUPERVISOR' || user?.role === 'TEAM_LEAD') && selectedIds.length > 0 && (
          <button
            onClick={openAssignModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" /> Reassign Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Name, Mobile or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium"
        >
          <option value="">-- All Customer Statuses --</option>
          <option value="NEW">New</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="CONTACTED">Contacted</option>
          <option value="POSITIVE_INTENT">Positive Intent</option>
          <option value="READY_TO_RECHARGE">Ready to Recharge</option>
          <option value="RECHARGED">Recharged</option>
          <option value="LOST">Lost</option>
        </select>

        <select
          value={bucketFilter}
          onChange={(e) => setBucketFilter(e.target.value)}
          className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 font-medium"
        >
          <option value="">-- All Churn Buckets --</option>
          <option value="0-29">0 - 29 Days</option>
          <option value="30-59">30 - 59 Days</option>
          <option value="60-89">60 - 89 Days</option>
          <option value="90-180">90 - 180 Days</option>
          <option value="181-365">181 - 365 Days</option>
          <option value="366+">366+ Days</option>
        </select>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading customer records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10">#</th>
                  <th className="px-4 py-3">Customer ID</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Days Churned</th>
                  <th className="px-4 py-3">Assigned Agent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5">
                      <button onClick={() => toggleSelect(c.id)}>
                        {selectedIds.includes(c.id) ? (
                          <CheckSquare className="w-4 h-4 text-sky-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">{c.customer_id}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{c.name}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{c.mobile_number}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">{c.package}</td>
                    <td className="px-4 py-3.5 font-bold text-amber-700">{c.days_since_churn} d</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800">{c.assigned_agent_name}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        c.customer_status === 'RECHARGED' ? 'bg-emerald-100 text-emerald-800' :
                        c.customer_status === 'POSITIVE_INTENT' ? 'bg-indigo-100 text-indigo-800' :
                        c.customer_status === 'READY_TO_RECHARGE' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.customer_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View 360
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reassign {selectedIds.length} Customers</h3>
            <p className="text-xs text-slate-500">Select target agent to balance workload.</p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Agent</label>
              <select
                value={targetAgentId}
                onChange={(e) => setTargetAgentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              >
                <option value="">-- Choose Agent --</option>
                {agents.map((ag: any) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.first_name ? `${ag.first_name} ${ag.last_name}` : ag.username} ({ag.team_lead_name || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button onClick={() => setAssignModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">Cancel</button>
              <button onClick={handleBulkAssign} className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl">Confirm Reassignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
