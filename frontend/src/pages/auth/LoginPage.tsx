import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api';
import { Shield, PhoneCall, UserCheck, Lock, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('agent1');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login/', { username, password });
      const { access, refresh, user } = res.data;
      setAuth(user, access, refresh);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-extrabold text-xl mb-3 shadow-lg shadow-sky-500/30">
            ISP
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Retention System</h2>
          <p className="text-sm text-slate-500 mt-1">ISP Churn Recovery & Recharge Conversion SaaS</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition duration-150 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Retention Portal'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Quick Role Switcher (65 Seeded Users)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setDemoAccount('agent1', 'password123'); }}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Retention Agent 1
            </button>
            <button
              onClick={() => { setDemoAccount('teamlead1', 'password123'); }}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" /> Team Lead 1
            </button>
            <button
              onClick={() => { setDemoAccount('supervisor1', 'password123'); }}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" /> Supervisor 1
            </button>
            <button
              onClick={() => { setDemoAccount('admin', 'admin123'); }}
              className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" /> Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
