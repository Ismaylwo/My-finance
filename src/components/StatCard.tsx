import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { formatCurrency } from '../types'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  variant: 'income' | 'expense' | 'profit' | 'personal' | 'neutral'
  subtitle?: string
  trend?: number
  isCurrency?: boolean
  suffix?: string
}

const styles = {
  income: {
    card: 'stat-income',
    icon: 'border-emerald-400/15 bg-emerald-400/10 text-emerald-400',
    value: 'text-emerald-400',
  },
  expense: {
    card: 'stat-expense',
    icon: 'border-rose-400/15 bg-rose-400/10 text-rose-400',
    value: 'text-rose-400',
  },
  profit: {
    card: 'stat-profit',
    icon: 'border-sky-400/15 bg-sky-400/10 text-sky-400',
    value: 'text-sky-300',
  },
  personal: {
    card: 'stat-personal',
    icon: 'border-amber-400/15 bg-amber-400/10 text-amber-400',
    value: 'text-amber-300',
  },
  neutral: {
    card: 'border-white/[.075] bg-white/[.025]',
    icon: 'border-white/10 bg-white/[.045] text-white/60',
    value: 'text-white',
  },
} satisfies Record<StatCardProps['variant'], { card: string; icon: string; value: string }>

export default function StatCard({
  title,
  value,
  icon: Icon,
  variant,
  subtitle,
  trend,
  isCurrency = true,
  suffix = '',
}: StatCardProps) {
  const style = styles[variant]
  const positiveTrend = trend !== undefined && trend >= 0
  const TrendIcon = positiveTrend ? ArrowUpRight : ArrowDownRight

  return (
    <article className={`relative min-w-0 overflow-hidden rounded-2xl border p-4 sm:p-5 ${style.card}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${style.icon}`}>
          <Icon className="h-[17px] w-[17px]" />
        </div>
        {trend !== undefined && Number.isFinite(trend) && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${positiveTrend ? 'bg-emerald-400/[.08] text-emerald-400' : 'bg-rose-400/[.08] text-rose-400'}`}>
            <TrendIcon className="h-3 w-3" /> {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="truncate text-[10px] font-bold uppercase tracking-[.11em] text-white/38">{title}</p>
      <p className={`mt-1 truncate text-xl font-extrabold tabular-nums sm:text-2xl ${style.value}`} title={String(value)}>
        {isCurrency ? formatCurrency(value) : `${value.toLocaleString('ru-RU')}${suffix}`}
      </p>
      {subtitle && <p className="mt-2 truncate text-[11px] text-white/32" title={subtitle}>{subtitle}</p>}
    </article>
  )
}
