import type { LucideIcon } from 'lucide-react'
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

const variantStyles: Record<StatCardProps['variant'], string> = {
  income:   'stat-income',
  expense:  'stat-expense',
  profit:   'stat-profit',
  personal: 'stat-personal',
  neutral:  'glass border border-white/10',
}

const iconContainers: Record<StatCardProps['variant'], string> = {
  income:   'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-glow-emerald',
  expense:  'bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-glow-rose',
  profit:   'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shadow-glow-primary',
  personal: 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-glow-amber',
  neutral:  'bg-white/10 border border-white/15 text-white/70',
}

const valueColors: Record<StatCardProps['variant'], string> = {
  income:   'text-emerald-400',
  expense:  'text-rose-400',
  profit:   'text-gradient',
  personal: 'text-amber-400',
  neutral:  'text-white',
}

export default function StatCard({
  title, value, icon: Icon, variant, subtitle, trend, isCurrency = true, suffix = ''
}: StatCardProps) {
  return (
    <div className={`rounded-2xl p-5 ${variantStyles[variant]} transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative group z-10 hover:z-20`}>
      {/* Decorative background glow circle */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-2xl group-hover:scale-150 transition-transform duration-500" />
      
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconContainers[variant]} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
            trend >= 0
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
          }`}>
            {trend >= 0 ? '↑ +' : '↓ '}{trend.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <p className={`text-2xl lg:text-3xl font-extrabold ${valueColors[variant]} tracking-tight`}>
          {isCurrency ? formatCurrency(value) : `${value.toLocaleString('ru-RU')}${suffix}`}
        </p>
        {subtitle && (
          <p className="text-white/40 text-xs mt-2 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
