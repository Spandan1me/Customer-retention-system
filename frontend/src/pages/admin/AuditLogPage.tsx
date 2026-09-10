import React, { useEffect, useState } from 'react';
import api from '../../api';
import { History, Shield } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit/');
      setLogs(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading System Audit Logs...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" /> Immutable System Audit Trail
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Immutable record of assignments, follow-ups, recharges, and administrative data modifications.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User / Actor</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-4 py-3">Target Model</th>
                <th className="px-4 py-3">Target ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l: any) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3.5 font-bold text-slate-900">{l.actor_name}</td>
                  <td className="px-6 py-3.5 font-semibold text-indigo-700">{l.action}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-700">{l.target_model}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-800">{l.target_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
