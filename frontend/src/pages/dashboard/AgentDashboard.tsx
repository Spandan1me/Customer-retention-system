import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  AlertTriangle,
  PhoneCall,
  Flame,
  CheckCircle2,
  Target,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AgentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgentDashboard();
  }, []);

  const fetchAgentDashboard = async () => {
    try {
      const res = await api.get('/dashboard/agent/');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNextCallLog = async () => {
    try {
      const response = await api.get('/customers/my-queue/');
      const nextCustomer = response.data?.next_best_customer;

      navigate(
        nextCustomer
          ? `/customers/${nextCustomer.id}/log`
          : '/new-call-log'
      );
    } catch {
      navigate('/new-call-log');
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 text-center text-slate-500">
        Loading Agent Dashboard...
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const trend = data?.trend || [];

  const kpiCards = [
    {
      label: 'My Assigned',
      value: kpis.my_assigned_customers,
      icon: Users,
      iconClass: 'text-sky-500',
      border: 'border-slate-200',
      hover: 'hover:border-sky-400',
      path: 'assigned',
    },
    {
      label: 'Today Follow-ups',
      value: kpis.today_followups,
      icon: Calendar,
      iconClass: 'text-indigo-500',
      border: 'border-slate-200',
      hover: 'hover:border-indigo-400',
      path: 'followups',
    },
    {
      label: 'Overdue Follow-ups',
      value: kpis.overdue_followups,
      icon: AlertTriangle,
      iconClass: 'text-rose-500',
      border: 'border-rose-200 bg-rose-50/50',
      hover: 'hover:border-rose-400',
      valueClass: 'text-rose-700',
      labelClass: 'text-rose-600',
      path: 'overdue',
    },
    {
      label: 'Today Calls',
      value: kpis.today_calls,
      icon: PhoneCall,
      iconClass: 'text-amber-500',
      border: 'border-slate-200',
      hover: 'hover:border-amber-400',
      path: 'calls',
    },
    {
      label: 'Connected',
      value: kpis.connected,
      icon: TrendingUp,
      iconClass: 'text-blue-500',
      border: 'border-slate-200',
      hover: 'hover:border-blue-400',
      path: 'connected',
    },
    {
      label: 'Positive Intent',
      value: kpis.positive_intent,
      icon: Flame,
      iconClass: 'text-indigo-500',
      border: 'border-indigo-100 bg-indigo-50/30',
      hover: 'hover:border-indigo-400',
      valueClass: 'text-indigo-900',
      labelClass: 'text-indigo-700',
      path: 'positive',
    },
    {
      label: 'Ready To Recharge',
      value: kpis.ready_to_recharge,
      icon: Target,
      iconClass: 'text-amber-600',
      border: 'border-amber-200 bg-amber-50/50',
      hover: 'hover:border-amber-400',
      valueClass: 'text-amber-900',
      labelClass: 'text-amber-700',
      path: 'ready',
    },
    {
      label: 'Recharged Today',
      value: kpis.successfully_recharged,
      icon: CheckCircle2,
      iconClass: 'text-emerald-600',
      border: 'border-emerald-200 bg-emerald-50/50',
      hover: 'hover:border-emerald-400',
      valueClass: 'text-emerald-900',
      labelClass: 'text-emerald-700',
      path: 'recharged',
    },
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-5 lg:space-y-6">

      {/* Header Banner */}
      <section className="bg-gradient-to-r from-sky-700 to-indigo-800 rounded-2xl p-4 sm:p-5 lg:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Agent Retention Command Center
            </h2>

            <p className="text-sky-200 text-xs sm:text-sm mt-1 leading-5 max-w-3xl">
              Focus on high-intent churned customers and convert promises
              to verified recharges today.
            </p>
          </div>

          <button
            onClick={openNextCallLog}
            className="w-full lg:w-auto shrink-0 px-4 sm:px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2 text-sm"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Keep Next Call Log</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Target Progress */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm">

          <span className="font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-600 shrink-0" />
            <span>Today's Recharge Target Achievement</span>
          </span>

          <span className="font-semibold text-slate-600 text-xs sm:text-sm">
            {kpis.successfully_recharged} / {kpis.today_target}{' '}
            Recharges ({kpis.achievement_percentage}%)
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                kpis.achievement_percentage || 0,
                100
              )}%`,
            }}
          />
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.path}
              onClick={() =>
                navigate(
                  `/dashboard/agent/details?metric=${card.path}`
                )
              }
              className={`text-left p-4 sm:p-5 rounded-2xl border shadow-sm transition-all ${card.border} ${card.hover}`}
            >
              <div
                className={`flex items-start justify-between gap-2 text-xs font-bold uppercase tracking-wider mb-2 ${
                  card.labelClass || 'text-slate-500'
                }`}
              >
                <span className="leading-4">{card.label}</span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${card.iconClass}`}
                />
              </div>

              <p
                className={`text-2xl sm:text-3xl font-extrabold ${
                  card.valueClass || 'text-slate-900'
                }`}
              >
                {card.value ?? 0}
              </p>
            </button>
          );
        })}
      </section>

      {/* Performance Trend */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-4">
          Last 7 Days Call Activity & Recharge Trend
        </h3>

        <div className="w-full h-56 sm:h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{
                top: 5,
                right: 5,
                left: -15,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={10}
                tickMargin={8}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
                width={30}
              />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="calls"
                name="Calls Made"
                stroke="#0284c7"
                fill="#e0f2fe"
                strokeWidth={2}
              />

              <Area
                type="monotone"
                dataKey="recharges"
                name="Successful Recharges"
                stroke="#10b981"
                fill="#d1fae5"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};
