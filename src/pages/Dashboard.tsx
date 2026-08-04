import { NavLink } from 'react-router-dom'
import { TrendingUp, TrendingDown, Home, DollarSign, RefreshCw, Calendar, Sparkles, Target, Settings, ShoppingBag, PieChart as PieChartIcon } from 'lucide-react'
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts'
import StatCard from '../components/StatCard'
import Tooltip from '../components/Tooltip'
import HelpModal from '../components/HelpModal'
import { useDashboard } from '../hooks/useDashboard'
import { useBreakEven } from '../hooks/useBreakEven'
import { formatCurrency, formatKg } from '../types'

const MONTH_NAMES: Record<string, string> = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр',
  '05': 'Май', '06': 'Июн', '07': 'Июл', '08': 'Авг',
  '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек',
}

const CATEGORY_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

function monthLabel(m: string) {
  const [, mm] = m.split('-')
  return MONTH_NAMES[mm] ?? m
}

export default function Dashboard() {
  const {
    stats, monthlyData, categoryBreakdown, loading: dashLoading,
    selectedMonth, setSelectedMonth, monthOptions,
    refetch
  } = useDashboard()

  const { calculate, loading: breakEvenLoading } = useBreakEven(selectedMonth)

  const breakEven = calculate()

  const chartData = monthlyData.map(m => ({
    name: monthLabel(m.month),
    Доходы: Math.round(m.total_income),
    Расходы: Math.round(m.total_expenses),
    Прибыль: Math.round(m.net_profit),
  }))

  const customTooltipStyle = {
    contentStyle: {
      background: 'rgba(18, 20, 32, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '12px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      padding: '10px 14px',
    },
    labelStyle: { color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, marginBottom: '6px' },
  }

  const isLoading = dashLoading || breakEvenLoading

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl glass p-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-primary-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              {/* Interactive Month Selector Dropdown */}
              <div className="relative inline-flex items-center">
                <Calendar className="w-4 h-4 text-indigo-400 absolute left-3 pointer-events-none" />
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="bg-surface-900/90 border border-indigo-500/40 rounded-full pl-9 pr-8 py-1.5 text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-400 hover:border-indigo-400/80 transition-all cursor-pointer shadow-sm"
                >
                  {monthOptions.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-surface-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <HelpModal />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Сводка бизнеса
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Управление деньгами, доходами, расходами и план закупки сырья
            </p>
          </div>

          <button
            onClick={refetch}
            className="btn-secondary text-sm gap-2 self-start sm:self-auto"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 text-primary-400 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить данные
          </button>
        </div>
      </div>

      {/* Stats Grid with Month-over-Month Trends */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 h-32 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-white/5 mb-3" />
              <div className="h-3 w-20 bg-white/5 rounded mb-2" />
              <div className="h-7 w-32 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Доходы (Выручка)"
            value={stats.totalIncome}
            icon={TrendingUp}
            variant="income"
            trend={stats.incomeTrend}
            subtitle={`${stats.totalKgSold.toFixed(1)} кг продано`}
          />
          <StatCard
            title="Расходы бизнеса"
            value={stats.totalExpenses}
            icon={TrendingDown}
            variant="expense"
            trend={stats.expenseTrend}
            subtitle="Аренда, зп, коммуналка..."
          />
          <StatCard
            title="Чистая прибыль"
            value={stats.netProfit}
            icon={DollarSign}
            variant={stats.netProfit >= 0 ? 'profit' : 'expense'}
            trend={stats.profitTrend}
            subtitle={stats.netProfit >= 0 ? 'В плюсе ✓' : 'В минусе ✗'}
          />
          <StatCard
            title="Личные расходы"
            value={stats.totalPersonal}
            icon={Home}
            variant="personal"
            subtitle="Отдельно от бизнеса"
          />
        </div>
      )}

      {/* Unconfigured Prices Invitation Card */}
      {!breakEven && (
        <NavLink to="/breakeven" className="card border border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all flex items-center justify-between p-4 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Калькулятор Точки 0 и Закупки сырья не настроен</p>
              <p className="text-white/50 text-xs">Укажите цены закупки и продажи в Настройках, чтобы система автоматически рассчитывала план закупки</p>
            </div>
          </div>
          <span className="btn-secondary text-xs gap-1.5 group-hover:border-indigo-400/60">
            <span>Указать цены</span>
            <span>→</span>
          </span>
        </NavLink>
      )}

      {/* Clean Break-Even & Purchasing Result Cards Section on Main Screen */}
      {breakEven && (
        <div className="card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-indigo-500/5 to-transparent relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Расчёт закупки сырья и Точки 0</span>
                  <Tooltip
                    title="Формула Закупки"
                    content="Закупка сырья ÷ Выход (%) = Себестоимость сырья за кг готовой продукции."
                  />
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Закупка: {formatCurrency(breakEven.rawPurchasePricePerKg)}/кг &bull; Выход: {breakEven.yieldPercent.toFixed(0)}% &bull; Продажа: {formatCurrency(breakEven.sellingPricePerKg)}/кг
                </p>
              </div>
            </div>

            <NavLink
              to="/breakeven"
              className="glass text-xs font-semibold px-3 py-2 rounded-xl text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:text-white transition-all flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Настройки и Цели</span>
            </NavLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Target 0 Result Card */}
            <div className="bg-surface-900/60 p-4 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
              <p className="text-white/40 text-xs font-semibold uppercase mb-1 flex items-center justify-between">
                <span>Точка выхода в 0 (Минимум)</span>
                <Tooltip title="Точка 0" content="Объем продукции для полной компенсации расходов бизнеса за выбранный период." />
              </p>
              <p className="text-2xl font-black text-amber-300">{formatKg(breakEven.breakEvenFinishedKg)}</p>
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-white/40 flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ЗАКУПИТЬ:</span>
                </span>
                <span className="text-indigo-300 font-extrabold">{formatKg(breakEven.breakEvenRawKg)}</span>
              </div>
            </div>

            {/* Target Profit Saved Result Card */}
            {breakEven.desiredProfit > 0 ? (
              <div className="bg-surface-900/60 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all">
                <p className="text-white/40 text-xs font-semibold uppercase mb-1 flex items-center justify-between">
                  <span>Для прибыли {formatCurrency(breakEven.desiredProfit)}</span>
                  <Tooltip title="Целевая прибыль" content="Объем закупки сырья на складе для получения сохранённой желаемой прибыли." />
                </p>
                <p className="text-2xl font-black text-emerald-400">{formatKg(breakEven.targetFinishedKg)}</p>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-white/40 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ЗАКУПИТЬ:</span>
                  </span>
                  <span className="text-indigo-300 font-extrabold">{formatKg(breakEven.targetRawKg)}</span>
                </div>
              </div>
            ) : (
              <NavLink to="/breakeven" className="bg-surface-900/40 p-4 rounded-2xl border border-dashed border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Цель по прибыли</span>
                  </p>
                  <p className="text-sm font-bold text-emerald-300 mt-1 group-hover:text-emerald-200 transition-colors">
                    + Указать желаемую прибыль →
                  </p>
                </div>
                <p className="text-white/30 text-[11px] mt-2">Задайте план прибыли для расчёта закупки</p>
              </NavLink>
            )}

            {/* Unit Net Profit Card */}
            <div className="bg-surface-900/60 p-4 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all">
              <p className="text-white/40 text-xs font-semibold uppercase mb-1 flex items-center justify-between">
                <span>ПОЛНАЯ себестоимость 1 кг</span>
                <Tooltip title="Себестоимость" content="Сырьё + Доля всех расходов бизнеса на 1 кг при данном объёме." />
              </p>
              <p className="text-2xl font-black text-rose-300">{formatCurrency(breakEven.fullCostPerKg)}</p>
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-white/40">Чистая маржа:</span>
                <span className="text-emerald-400 font-extrabold">+{formatCurrency(breakEven.netProfitPerKg)} / кг</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart - Income vs Expenses */}
        <div className="card border border-white/10 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white tracking-tight">Доходы vs Расходы (6 мес.)</h2>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11, fontWeight: 500 }} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10, fontWeight: 500 }} width={60}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <RechartsTooltip
                {...customTooltipStyle}
                formatter={(v) => formatCurrency(Number(v))}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Доходы"  stroke="#10b981" fill="url(#gradIncome)"  strokeWidth={2.5} />
              <Area type="monotone" dataKey="Расходы" stroke="#f43f5e" fill="url(#gradExpense)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - Category Breakdown */}
        <div className="card border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-400" />
              <span>Структура расходов</span>
            </h2>
          </div>
          {categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">
              Нет расходов за выбранный период
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  {...customTooltipStyle}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
