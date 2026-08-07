import { NavLink } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Warehouse,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatCard from '../components/StatCard'
import { useAppContext } from '../hooks/useAppContext'
import { useBreakEven } from '../hooks/useBreakEven'
import { useDashboard } from '../hooks/useDashboard'
import { formatCurrency, formatKg } from '../types'

const MONTHS: Record<string, string> = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр', '05': 'Май', '06': 'Июн',
  '07': 'Июл', '08': 'Авг', '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек',
}

const CHART_COLORS = ['#22c55e', '#f59e0b', '#38bdf8', '#fb7185', '#a78bfa', '#94a3b8']

function monthLabel(month: string) {
  return MONTHS[month.split('-')[1]] ?? month
}

function MoneyRow({ label, value, tone = 'default' }: {
  label: string
  value: number
  tone?: 'default' | 'positive' | 'negative'
}) {
  const toneClass = tone === 'positive'
    ? 'text-emerald-400'
    : tone === 'negative'
      ? 'text-rose-400'
      : 'text-white'
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/7 py-3 last:border-0">
      <span className="text-sm text-white/52">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${toneClass}`}>{formatCurrency(value)}</span>
    </div>
  )
}

export default function Dashboard() {
  const {
    stats,
    monthlyData,
    categoryBreakdown,
    loading: dashboardLoading,
    selectedMonth,
    setSelectedMonth,
    monthOptions,
    refetch,
  } = useDashboard()
  const { calculate, productionPace, loading: breakEvenLoading } = useBreakEven(selectedMonth)
  const { profile, warehouseBalance, inventoryLedger } = useAppContext()
  const breakEven = calculate()
  const loading = dashboardLoading || breakEvenLoading

  const chartData = monthlyData.map(item => ({
    name: monthLabel(item.month),
    Выручка: Math.round(item.total_income),
    Расходы: Math.round(item.total_expenses),
    Прибыль: Math.round(item.net_profit),
  }))

  const progress = Math.min(100, productionPace.progressPercent)
  const tooltipStyle = {
    contentStyle: {
      background: '#111827',
      border: '1px solid rgba(255,255,255,.1)',
      borderRadius: 14,
      boxShadow: '0 20px 45px rgba(0,0,0,.35)',
    },
    labelStyle: { color: '#e2e8f0', fontWeight: 700 },
  }

  return (
    <div className="space-y-5">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Операционная сводка</p>
          <h1 className="page-title">Добрый день{profile?.business_name ? `, ${profile.business_name}` : ''}</h1>
          <p className="page-subtitle">Продажи, деньги, склад и производственный план в одном месте.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="period-select">
            <CalendarDays className="h-4 w-4" />
            <select value={selectedMonth} onChange={event => setSelectedMonth(event.target.value)}>
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button className="icon-action" onClick={refetch} disabled={loading} aria-label="Обновить данные">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {!stats.calculationReady && stats.totalKgSold > 0 && (
        <div className="notice notice-warning">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold text-white">Прибыль пока без себестоимости сырья</p>
            <p>Укажите закупочную цену и процент выхода в настройках либо добавьте закупки и производство за период.</p>
          </div>
          <NavLink to="/settings" className="ml-auto whitespace-nowrap font-semibold text-amber-300">Настроить →</NavLink>
        </div>
      )}

      {inventoryLedger.issues.length > 0 && (
        <div className="notice notice-warning">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold text-white">Найдены ошибки в истории склада</p>
            <p>{inventoryLedger.issues[0].message}{inventoryLedger.issues.length > 1 ? ` · ещё ${inventoryLedger.issues.length - 1}` : ''}</p>
          </div>
          <NavLink to="/warehouse" className="ml-auto whitespace-nowrap font-semibold text-amber-300">Проверить →</NavLink>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Выручка по продажам"
          value={stats.totalIncome}
          icon={TrendingUp}
          variant="income"
          trend={stats.incomeTrend}
          subtitle={`Оплачено ${formatCurrency(stats.paidIncome)}`}
        />
        <StatCard
          title="Дебиторская задолженность"
          value={stats.totalReceivables}
          icon={Clock3}
          variant="personal"
          subtitle={stats.totalReceivables > 0 ? 'Общий долг клиентов на сегодня' : 'Все продажи оплачены'}
        />
        <StatCard
          title="Расчётная прибыль"
          value={stats.netProfit}
          icon={CircleDollarSign}
          variant={stats.netProfit >= 0 ? 'profit' : 'expense'}
          trend={stats.profitTrend}
          subtitle={stats.calculationReady ? 'По методу начисления' : 'Без подтверждённой себестоимости'}
        />
        <StatCard
          title="Денежный результат"
          value={stats.cashAfterPersonal}
          icon={WalletCards}
          variant={stats.cashAfterPersonal >= 0 ? 'neutral' : 'expense'}
          subtitle="После расходов, закупок и личных изъятий"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <div className="panel min-w-0">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Динамика за 6 месяцев</p>
              <h2>Доходы и расчётные расходы</h2>
            </div>
            <NavLink to="/analytics" className="text-link">Вся аналитика <ArrowRight className="h-4 w-4" /></NavLink>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={value => value >= 1000 ? `${Math.round(value / 1000)}k` : value} />
                <ChartTooltip {...tooltipStyle} formatter={value => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="Выручка" stroke="#22c55e" fill="url(#incomeFill)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="Расходы" stroke="#fb7185" fill="url(#expenseFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/45">
            <span className="legend-dot before:bg-emerald-400">Выручка по всем продажам</span>
            <span className="legend-dot before:bg-rose-400">Операционные расходы + себестоимость проданного</span>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Движение денег</p>
              <h2>Кассовая сверка</h2>
            </div>
            <Banknote className="h-5 w-5 text-sky-400" />
          </div>
          <div className="mt-2">
            <MoneyRow label="Получено от клиентов" value={stats.paidIncome} tone="positive" />
            <MoneyRow label="Операционные расходы" value={stats.operatingExpenses} tone="negative" />
            <MoneyRow label="Закуплено на склад" value={stats.inventoryPurchases} tone="negative" />
            <MoneyRow label="Личные изъятия" value={stats.totalPersonal} tone="negative" />
          </div>
          <div className={`mt-4 rounded-2xl border p-4 ${stats.cashAfterPersonal >= 0 ? 'border-emerald-400/20 bg-emerald-400/[.08]' : 'border-rose-400/20 bg-rose-400/[.08]'}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Итого движение денег</p>
            <p className={`mt-1 text-2xl font-extrabold tabular-nums ${stats.cashAfterPersonal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(stats.cashAfterPersonal)}</p>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/38">Личные изъятия уменьшают деньги, но не бухгалтерскую прибыль бизнеса.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="section-heading">
            <div>
              <p className="eyebrow">План производства</p>
              <h2>{breakEven ? 'Путь к точке безубыточности' : 'Настройте экономику продукта'}</h2>
            </div>
            <Target className="h-5 w-5 text-amber-400" />
          </div>
          {breakEven ? (
            <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                  <span>Продано {formatKg(productionPace.totalSoldThisMonth)} из цели</span>
                  <span className="font-bold text-white">{productionPace.progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="metric-box">
                    <span>Точка 0</span>
                    <strong>{formatKg((productionPace.actualBreakEvenResult ?? breakEven).breakEvenFinishedKg)}</strong>
                  </div>
                  <div className="metric-box">
                    <span>Цель по прибыли</span>
                    <strong>{formatKg((productionPace.actualBreakEvenResult ?? breakEven).targetFinishedKg)}</strong>
                  </div>
                </div>
              </div>
              <NavLink to="/breakeven" className="btn-secondary justify-center">Открыть расчёт <ArrowRight className="h-4 w-4" /></NavLink>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-dashed border-white/12 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-sm leading-6 text-white/50">Добавьте закупочную цену, выход готовой продукции и цену продажи — система рассчитает объём для выхода в ноль.</p>
              <NavLink to="/settings" className="btn-primary justify-center">Заполнить настройки</NavLink>
            </div>
          )}
        </div>

        <NavLink to="/warehouse" className="panel group block hover:border-sky-400/25">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Остатки сейчас</p>
              <h2>Склад</h2>
            </div>
            <Warehouse className="h-5 w-5 text-sky-400" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="metric-box flex-row items-center justify-between">
              <span>Сырьё</span>
              <strong className={warehouseBalance.raw_kg_balance < 0 ? 'text-rose-400' : ''}>{formatKg(warehouseBalance.raw_kg_balance)}</strong>
              <small className="mt-1 text-[10px] text-white/25">Стоимость {formatCurrency(stats.rawInventoryValue)}</small>
            </div>
            <div className="metric-box flex-row items-center justify-between">
              <span>Готовая продукция</span>
              <strong className={warehouseBalance.finished_kg_balance < 0 ? 'text-rose-400' : ''}>{formatKg(warehouseBalance.finished_kg_balance)}</strong>
              <small className="mt-1 text-[10px] text-white/25">Стоимость {formatCurrency(stats.finishedInventoryValue)}</small>
            </div>
          </div>
          <span className="mt-5 flex items-center gap-1 text-xs font-semibold text-sky-400">Перейти на склад <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
        </NavLink>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Структура платежей</p>
            <h2>Куда ушли деньги</h2>
          </div>
          <TrendingDown className="h-5 w-5 text-rose-400" />
        </div>
        {categoryBreakdown.length === 0 ? (
          <div className="empty-state">За выбранный период расходов нет.</div>
        ) : (
          <div className="mt-4 grid items-center gap-6 lg:grid-cols-[280px_1fr]">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="value" innerRadius={54} outerRadius={82} paddingAngle={3}>
                    {categoryBreakdown.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip {...tooltipStyle} formatter={value => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {categoryBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2 text-xs text-white/55">
                    <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <strong className="whitespace-nowrap text-xs text-white">{formatCurrency(item.value)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
