import { useDashboard } from '../hooks/useDashboard'
import { formatCurrency } from '../types'
import { BarChart2, Trophy, TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'

const MONTH_NAMES: Record<string, string> = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр',
  '05': 'Май', '06': 'Июн', '07': 'Июл', '08': 'Авг',
  '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек',
}

export default function AnalyticsPage() {
  const { monthlyData, loading } = useDashboard()

  const chartData = monthlyData.map(m => {
    const [, mm] = m.month.split('-')
    return {
      name: MONTH_NAMES[mm] ?? m.month,
      Доходы:    Math.round(m.total_income),
      Расходы:   Math.round(m.total_expenses),
      Личные:    Math.round(m.total_personal),
      Прибыль:   Math.round(m.net_profit),
      'Кг продано': Math.round(m.total_kg_sold * 10) / 10,
    }
  })

  const totalIncome   = monthlyData.reduce((s, m) => s + m.total_income, 0)
  const totalExpenses = monthlyData.reduce((s, m) => s + m.total_expenses, 0)
  const totalProfit   = monthlyData.reduce((s, m) => s + m.net_profit, 0)
  const totalKg       = monthlyData.reduce((s, m) => s + m.total_kg_sold, 0)
  const bestMonth     = [...monthlyData].sort((a, b) => b.net_profit - a.net_profit)[0]

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  const customTooltipStyle = {
    contentStyle: {
      background: 'rgba(18, 20, 32, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      padding: '10px 14px',
    },
    labelStyle: { color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 },
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass p-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-2">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Анализ динамики</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Финансовая аналитика</h1>
          <p className="text-white/50 text-sm mt-1">Тренды доходов, расходов и объёмов продаж за 6 месяцев</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Доходы (6 мес.)',   value: totalIncome,   color: 'text-emerald-400', icon: TrendingUp },
          { label: 'Расходы (6 мес.)',  value: totalExpenses, color: 'text-rose-400',    icon: TrendingDown },
          { label: 'Прибыль (6 мес.)', value: totalProfit,   color: 'text-gradient',    icon: DollarSign },
          { label: 'Продано сырья',     value: totalKg,       color: 'text-amber-400',   icon: Package, isCurrency: false, suffix: ' кг' },
        ].map(({ label, value, color, icon: Icon, isCurrency = true, suffix = '' }) => (
          <div key={label} className="glass rounded-2xl p-5 border border-white/10 text-center hover:border-indigo-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-white/5 mx-auto flex items-center justify-center mb-2 text-white/70">
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-xl sm:text-2xl font-extrabold ${color}`}>
              {isCurrency ? formatCurrency(value) : `${value.toFixed(1)}${suffix}`}
            </p>
          </div>
        ))}
      </div>

      {/* Best month banner */}
      {bestMonth && bestMonth.net_profit > 0 && (
        <div className="glass rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-emerald-300 font-bold text-sm">Самый прибыльный месяц</p>
            <p className="text-white font-extrabold text-lg mt-0.5">
              {bestMonth.month} — прибыль <span className="text-emerald-400">{formatCurrency(bestMonth.net_profit)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Income vs Expenses area */}
      <div className="card border border-white/10">
        <h2 className="text-lg font-bold text-white mb-4">Сравнение: Доходы, Расходы и Личные траты</h2>
        <ResponsiveContainer width="100%" height={270}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11, fontWeight: 500 }} />
            <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10, fontWeight: 500 }} width={65}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip
              {...customTooltipStyle}
              formatter={(v: unknown) => formatCurrency(Number(v))}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
            <Area type="monotone" dataKey="Доходы"  stroke="#10b981" fill="url(#gI)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="Расходы" stroke="#f43f5e" fill="url(#gE)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="Личные"  stroke="#f59e0b" fill="url(#gP)" strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Profit & Kg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">Динамика чистой прибыли</h2>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} width={65}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                {...customTooltipStyle}
                formatter={(v: unknown) => formatCurrency(Number(v))}
              />
              <Bar dataKey="Прибыль" fill="url(#gBar)" radius={[6, 6, 0, 0]} />
              <Line type="monotone" dataKey="Прибыль" stroke="#a5b4fc" strokeWidth={2.5} dot={{ fill: '#a5b4fc', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">Объём продаж в кг</h2>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gKg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} width={50} />
              <Tooltip
                {...customTooltipStyle}
                formatter={(v: unknown) => [`${Number(v)} кг`, 'Продано']}
              />
              <Area type="monotone" dataKey="Кг продано" stroke="#8b5cf6" fill="url(#gKg)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly table */}
      <div className="card p-0 overflow-hidden border border-white/10">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Сводная таблица за 6 месяцев</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Месяц</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Доходы</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Расходы</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Личные</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Прибыль</th>
                <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Продано кг</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(m => (
                <tr key={m.month} className="table-row">
                  <td className="px-6 py-4 text-sm font-semibold text-white">{m.month}</td>
                  <td className="px-6 py-4 text-sm text-right text-emerald-400 font-semibold">{formatCurrency(m.total_income)}</td>
                  <td className="px-6 py-4 text-sm text-right text-rose-400 font-semibold">{formatCurrency(m.total_expenses)}</td>
                  <td className="px-6 py-4 text-sm text-right text-amber-400 font-semibold">{formatCurrency(m.total_personal)}</td>
                  <td className={`px-6 py-4 text-sm text-right font-extrabold ${m.net_profit >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                    {formatCurrency(m.net_profit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-white/70 font-mono">{m.total_kg_sold.toFixed(1)} кг</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
