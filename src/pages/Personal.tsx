import { useState } from 'react'
import { Plus, Trash2, Home, Sparkles } from 'lucide-react'
import { usePersonal } from '../hooks/usePersonal'
import StatCard from '../components/StatCard'
import { formatCurrency, formatDate, PERSONAL_CATEGORIES, CURRENCY } from '../types'
import type { PersonalExpenseInsert } from '../types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const today = () => new Date().toISOString().split('T')[0]

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316']

export default function PersonalPage() {
  const { items, loading, add, remove, total } = usePersonal()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<PersonalExpenseInsert>({
    date: today(), amount: 0, category: PERSONAL_CATEGORIES[0], description: ''
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const { error } = await add(form)
    if (error) setError(error)
    else {
      setShowForm(false)
      setForm({ date: today(), amount: 0, category: PERSONAL_CATEGORIES[0], description: '' })
    }
    setSaving(false)
  }

  // Данные для пирога по категориям
  const categoryTotals = PERSONAL_CATEGORIES
    .map(cat => ({
      name: cat,
      value: items.filter(i => i.category === cat).reduce((s, i) => s + i.amount, 0)
    }))
    .filter(c => c.value > 0)

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Личный бюджет</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Личные расходы</h1>
          <p className="text-white/40 text-sm mt-0.5">Личные траты владельца бизнесa отдельно от операционных расходов</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Добавить расход
        </button>
      </div>

      <StatCard title="Личные расходы (всего)" value={total} icon={Home} variant="personal" />

      {/* Form */}
      {showForm && (
        <div className="card border border-amber-500/30 shadow-glow-amber animate-slide-in">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-amber-400" />
            <span>Новый личный расход</span>
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Дата</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input-field" required />
            </div>
            <div>
              <label className="label">Сумма ({CURRENCY})</label>
              <input type="number" step="0.01" min="0.01"
                value={form.amount || ''}
                onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className="input-field" placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Категория</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="input-field">
                {PERSONAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Описание</label>
              <input type="text" value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input-field" placeholder="Необязательно..." />
            </div>
            {error && (
              <div className="sm:col-span-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}
            <div className="sm:col-span-2 flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        {categoryTotals.length > 0 && (
          <div className="card border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4">Структура по категориям</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryTotals} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={4} dataKey="value">
                  {categoryTotals.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  {...customTooltipStyle}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Table */}
        <div className="card p-0 overflow-hidden border border-white/10">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">История личных трат</h2>
            <span className="text-xs text-white/40 font-medium">Всего: {items.length}</span>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Home className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/40 font-medium">Нет записей личных расходов</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Дата</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Категория</th>
                    <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Сумма</th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="px-6 py-4 text-sm font-medium text-white/80">{formatDate(item.date)}</td>
                      <td className="px-4 py-4 text-sm text-white">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-right font-extrabold text-amber-400">{formatCurrency(item.amount)}</td>
                      <td className="px-4 py-4 text-right">
                        <button onClick={() => { setDeleting(item.id); remove(item.id).then(() => setDeleting(null)) }}
                          disabled={deleting === item.id}
                          className="p-2 rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Удалить">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
