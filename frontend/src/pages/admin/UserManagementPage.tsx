import React, { useEffect, useState } from 'react';
import api from '../../api';
import { UserCheck, UserPlus } from 'lucide-react';

type UserRole = 'AGENT' | 'TEAM_LEAD' | 'SUPERVISOR';

interface CreateUserForm {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string;
  role: UserRole;
}

const emptyForm: CreateUserForm = {
  username: '',
  password: '',
  email: '',
  first_name: '',
  last_name: '',
  mobile: '',
  role: 'AGENT',
};

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CreateUserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/');
      setUsers(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof CreateUserForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setSuccessMessage('');

    try {
      await api.post('/auth/users/', form);
      setForm(emptyForm);
      setSuccessMessage(`${form.username} was created successfully.`);
      await fetchUsers();
    } catch (err: any) {
      const details = err.response?.data;
      const message = typeof details === 'object'
        ? Object.values(details).flat().join(' ')
        : 'Unable to create this user.';
      setFormError(String(message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading User Hierarchy...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-600" /> User Hierarchy & Staff Roster
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Create staff accounts and manage your organization&apos;s user hierarchy.</p>
      </div>

      <form onSubmit={createUser} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900">Create staff user</h3>
            <p className="text-xs text-slate-500">New accounts are created inside your organization.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Username *
            <input required value={form.username} onChange={(event) => updateForm('username', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Temporary password *
            <input required minLength={8} type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Role *
            <select value={form.role} onChange={(event) => updateForm('role', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500">
              <option value="AGENT">Agent</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="SUPERVISOR">Supervisor</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            First name
            <input value={form.first_name} onChange={(event) => updateForm('first_name', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Last name
            <input value={form.last_name} onChange={(event) => updateForm('last_name', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Email
            <input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500" />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Mobile
            <input value={form.mobile} onChange={(event) => updateForm('mobile', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500" />
          </label>
        </div>

        {formError && <p className="text-sm font-medium text-red-600">{formError}</p>}
        {successMessage && <p className="text-sm font-medium text-emerald-600">{successMessage}</p>}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
          <UserPlus className="w-4 h-4" />
          {saving ? 'Creating...' : 'Create user'}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Team Lead</th>
                <th className="px-4 py-3">Supervisor</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3.5 font-bold font-mono text-xs text-slate-900">{u.username}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-800">{u.first_name ? `${u.first_name} ${u.last_name}` : u.username}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded font-bold ${
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'SUPERVISOR' ? 'bg-blue-100 text-blue-800' :
                      u.role === 'TEAM_LEAD' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">{u.team_lead_name || 'N/A'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">{u.supervisor_name || 'N/A'}</td>
                  <td className="px-4 py-3.5">
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded font-bold">Active</span>
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
