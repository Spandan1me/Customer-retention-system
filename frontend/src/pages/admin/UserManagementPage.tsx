import React, { useEffect, useState } from 'react';
import api from '../../api';
import {
  UserCheck,
  UserPlus,
  KeyRound,
  Power,
  Trash2,
  ShieldCheck,
  X,
} from 'lucide-react';

type UserRole =
  | 'AGENT'
  | 'TEAM_LEAD'
  | 'SUPERVISOR'
  | 'SUPER_ADMIN';

interface CreateUserForm {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string;
  role: 'AGENT' | 'TEAM_LEAD' | 'SUPERVISOR';
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

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [passwordModalUser, setPasswordModalUser] =
    useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [actionUser, setActionUser] = useState<any>(null);
  const [actionType, setActionType] = useState<
    'toggle' | 'delete' | null
  >(null);
  const [actionSaving, setActionSaving] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me/');
      setCurrentUser(res.data);
    } catch (err) {
      console.error('Unable to load current user:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/');
      setUsers(res.data.results || res.data);
    } catch (err) {
      console.error('Unable to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (
    field: keyof CreateUserForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const getErrorMessage = (err: any, fallback: string) => {
    const details = err.response?.data;

    if (details?.detail) {
      return String(details.detail);
    }

    if (typeof details === 'object' && details) {
      return Object.values(details)
        .flat()
        .join(' ');
    }

    return fallback;
  };

  const createUser = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setSaving(true);
    setFormError('');
    setSuccessMessage('');

    try {
      await api.post('/auth/users/', form);

      setSuccessMessage(
        `${form.username} was created successfully.`
      );

      setForm(emptyForm);

      await fetchUsers();
    } catch (err: any) {
      setFormError(
        getErrorMessage(
          err,
          'Unable to create this user.'
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = (user: any) => {
    setPasswordModalUser(user);
    setNewPassword('');
    setFormError('');
    setSuccessMessage('');
  };

  const closePasswordModal = () => {
    if (passwordSaving) return;

    setPasswordModalUser(null);
    setNewPassword('');
  };

  const resetPassword = async () => {
    if (!passwordModalUser) return;

    if (newPassword.length < 8) {
      setFormError(
        'Password must be at least 8 characters long.'
      );
      return;
    }

    setPasswordSaving(true);
    setFormError('');
    setSuccessMessage('');

    try {
      await api.post(
        `/auth/users/${passwordModalUser.id}/reset-password/`,
        {
          password: newPassword,
        }
      );

      setSuccessMessage(
        `Password reset successfully for ${passwordModalUser.username}.`
      );

      closePasswordModal();
    } catch (err: any) {
      setFormError(
        getErrorMessage(
          err,
          'Unable to reset password.'
        )
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const openToggleConfirmation = (user: any) => {
    setActionUser(user);
    setActionType('toggle');
    setFormError('');
    setSuccessMessage('');
  };

  const openDeleteConfirmation = (user: any) => {
    setActionUser(user);
    setActionType('delete');
    setFormError('');
    setSuccessMessage('');
  };

  const closeActionModal = () => {
    if (actionSaving) return;

    setActionUser(null);
    setActionType(null);
  };

  const performUserAction = async () => {
    if (!actionUser || !actionType) return;

    setActionSaving(true);
    setFormError('');
    setSuccessMessage('');

    try {
      if (actionType === 'toggle') {
        const res = await api.post(
          `/auth/users/${actionUser.id}/toggle-status/`
        );

        setSuccessMessage(
          res.data.detail ||
            `${actionUser.username} status updated.`
        );
      }

      if (actionType === 'delete') {
        const res = await api.delete(
          `/auth/users/${actionUser.id}/`
        );

        setSuccessMessage(
          res.data.detail ||
            `${actionUser.username} was deleted.`
        );
      }

      closeActionModal();

      await fetchUsers();
    } catch (err: any) {
      setFormError(
        getErrorMessage(
          err,
          'Unable to complete this action.'
        )
      );
      closeActionModal();
    } finally {
      setActionSaving(false);
    }
  };

  const isSuperAdmin =
    currentUser?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading User Hierarchy...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          User Hierarchy & Staff Roster
        </h2>

        <p className="text-xs text-slate-500 mt-0.5">
          Create staff accounts and manage your
          organization&apos;s user hierarchy.
        </p>
      </div>

      {/* Global messages */}
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          {formError}
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Create User */}
      <form
        onSubmit={createUser}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />

          <div>
            <h3 className="font-bold text-slate-900">
              Create staff user
            </h3>

            <p className="text-xs text-slate-500">
              New accounts are created inside your organization.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          <label className="text-xs font-semibold text-slate-600">
            Username *
            <input
              required
              value={form.username}
              onChange={(event) =>
                updateForm(
                  'username',
                  event.target.value
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Temporary password *
            <input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) =>
                updateForm(
                  'password',
                  event.target.value
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Role *
            <select
              value={form.role}
              onChange={(event) =>
                updateForm(
                  'role',
                  event.target.value as CreateUserForm['role']
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            >
              <option value="AGENT">
                Agent
              </option>

              <option value="TEAM_LEAD">
                Team Lead
              </option>

              <option value="SUPERVISOR">
                Supervisor
              </option>
            </select>
          </label>

          <label className="text-xs font-semibold text-slate-600">
            First name
            <input
              value={form.first_name}
              onChange={(event) =>
                updateForm(
                  'first_name',
                  event.target.value
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Last name
            <input
              value={form.last_name}
              onChange={(event) =>
                updateForm(
                  'last_name',
                  event.target.value
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                updateForm(
                  'email',
                  event.target.value
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-xs font-semibold text-slate-600">
            Mobile
            <input
              value={form.mobile}
              onChange={(event) =>
                updateForm(
                  'mobile',
                  event.target.value
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus className="w-4 h-4" />

          {saving
            ? 'Creating...'
            : 'Create user'}
        </button>
      </form>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">
            Staff Accounts
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Manage account access and credentials.
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm text-slate-600">

            <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-bold border-b border-slate-200">

              <tr>
                <th className="px-6 py-3">
                  Username
                </th>

                <th className="px-6 py-3">
                  Name
                </th>

                <th className="px-4 py-3">
                  Role
                </th>

                <th className="px-4 py-3">
                  Team Lead
                </th>

                <th className="px-4 py-3">
                  Supervisor
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {users.map((u: any) => {

                const isSelf =
                  currentUser?.id === u.id;

                const isActive =
                  Boolean(u.is_active);

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50"
                  >

                    <td className="px-6 py-3.5 font-bold font-mono text-xs text-slate-900">
                      {u.username}
                    </td>

                    <td className="px-6 py-3.5 font-semibold text-slate-800">
                      {u.first_name
                        ? `${u.first_name} ${u.last_name}`
                        : u.username}
                    </td>

                    <td className="px-4 py-3.5">

                      <span
                        className={`text-xs px-2.5 py-1 rounded font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'SUPERVISOR'
                            ? 'bg-blue-100 text-blue-800'
                            : u.role === 'TEAM_LEAD'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>

                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                      {u.team_lead_name || 'N/A'}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                      {u.supervisor_name || 'N/A'}
                    </td>

                    <td className="px-4 py-3.5">

                      <span
                        className={`text-xs px-2 py-1 rounded font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {isActive
                          ? 'Active'
                          : 'Deactivated'}
                      </span>

                    </td>

                    <td className="px-6 py-3.5">

                      {isSelf ? (

                        <span className="text-xs text-slate-400 font-medium">
                          Current user
                        </span>

                      ) : (

                        <div className="flex justify-end gap-2">

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() =>
                              openPasswordModal(u)
                            }
                            title="Reset password"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Password
                          </button>

                          {/* Activate / Deactivate */}
                          <button
                            type="button"
                            onClick={() =>
                              openToggleConfirmation(u)
                            }
                            title={
                              isActive
                                ? 'Deactivate user'
                                : 'Activate user'
                            }
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                              isActive
                                ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />

                            {isActive
                              ? 'Deactivate'
                              : 'Activate'}
                          </button>

                          {/* Delete */}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                openDeleteConfirmation(u)
                              }
                              title="Permanently delete user"
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}

                        </div>
                      )}

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        </div>
      </div>

      {/* Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">

              <div>
                <h3 className="font-bold text-slate-900">
                  Reset Password
                </h3>

                <p className="text-xs text-slate-500 mt-1">
                  User: {passwordModalUser.username}
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <div className="p-5 space-y-4">

              <label className="text-xs font-semibold text-slate-600 block">
                New temporary password *

                <input
                  autoFocus
                  type="text"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Minimum 8 characters"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>

              <p className="text-xs text-slate-500">
                Give this temporary password to the agent
                through your approved internal communication
                method.
              </p>

              {formError && (
                <p className="text-sm font-medium text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={passwordSaving}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={resetPassword}
                  disabled={
                    passwordSaving ||
                    newPassword.length < 8
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <KeyRound className="w-4 h-4" />

                  {passwordSaving
                    ? 'Resetting...'
                    : 'Reset password'}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Activate / Deactivate / Delete Confirmation */}
      {actionUser && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">

              <div className="flex items-center gap-3">

                {actionType === 'delete' ? (
                  <Trash2 className="w-5 h-5 text-red-600" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                )}

                <h3 className="font-bold text-slate-900">
                  {actionType === 'delete'
                    ? 'Delete User'
                    : actionUser.is_active
                    ? 'Deactivate User'
                    : 'Activate User'}
                </h3>

              </div>

              <button
                type="button"
                onClick={closeActionModal}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>

            </div>

            <div className="p-5 space-y-4">

              {actionType === 'delete' ? (

                <p className="text-sm text-slate-600">
                  Are you sure you want to permanently delete
                  <strong className="text-slate-900">
                    {' '}
                    {actionUser.username}
                  </strong>
                  ?
                  <br />
                  <br />
                  Historical records may prevent deletion.
                  If this user has existing records, use
                  <strong> Deactivate </strong>
                  instead.
                </p>

              ) : actionUser.is_active ? (

                <p className="text-sm text-slate-600">
                  Deactivate
                  <strong className="text-slate-900">
                    {' '}
                    {actionUser.username}
                  </strong>
                  ?
                  <br />
                  <br />
                  They will no longer be able to log in,
                  but their historical records will remain.
                </p>

              ) : (

                <p className="text-sm text-slate-600">
                  Activate
                  <strong className="text-slate-900">
                    {' '}
                    {actionUser.username}
                  </strong>
                  ?
                  <br />
                  <br />
                  They will be able to log in again.
                </p>

              )}

              {formError && (
                <p className="text-sm font-medium text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2">

                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={actionSaving}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={performUserAction}
                  disabled={actionSaving}
                  className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                    actionType === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : actionUser.is_active
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionSaving
                    ? 'Processing...'
                    : actionType === 'delete'
                    ? 'Delete permanently'
                    : actionUser.is_active
                    ? 'Deactivate'
                    : 'Activate'}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
