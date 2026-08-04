import { useState } from 'react'
import { Plus, Trash2, TrendingDown, Sparkles } from 'lucide-react'
import { useExpenses } from '../hooks/useExpenses'
import StatCard from '../components/StatCard'
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, CURRENCY } from '../types'
import type { ExpenseInsert } from '../types'

const today = () => new Date().toISOString().split('T')[0]

export default function ExpensesPage() {
  const { expenses, loading, add, remove, total } = useExpenses()
  const [showForm, setShowForm] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [form, setForm] = useState<ExpenseInsert>({
    date: today(), amount: 0, category: EXPENSE_CATEGORIES[0], description: '', type: 'fixed'
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
      setForm({ date: today(), amount: 0, category: EXPENSE_CATEGORIES[0], description: '', type: 'fixed' })
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await remove(id)
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-300 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Управление расходами бизнеса</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Расходы бизнеса</h1>
          <p className="text-white/40 text-sm mt-0.5">Аренда, зарплаты, коммунальные услуги, транспорт и обслуживание</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Добавить расход
        </button>
      </div>

      <StatCard title="Всего расходов бизнеса" value={total} icon={TrendingDown} variant="expense"
        subtitle="Автоматически учитываются в точке 0" />

      {/* Form */}
      {showForm && (
        <div className="card border border-rose-500/30 shadow-glow-rose animate-slide-in">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            <span>Новый расход бизнеса</span>
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
            <div className="sm:col-span-2">
              <label className="label">Категория</label>
              <select value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="input-field">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Описание</label>
              <input type="text" value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input-field" placeholder="Например: Аренда производственного цеха за август" />
            </div>
            {error && (
              <div className="sm:col-span-2 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-300">{error}</div>
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

      {/* Table */}
      <div className={`card p-0 overflow-hidden border border-white/10 ${isCompact ? 'compact-table' : ''}`}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">История расходов</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg glass text-white/70 hover:text-white transition-all border border-white/10"
            >
              {isCompact ? '↕️ Обычный вид' : '↕️ Компактный вид'}
            </button>
            <span className="text-xs text-white/40 font-medium">Всего записей: {expenses.length}</span>
          </div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingDown className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 font-medium">Нет записей расходов</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Дата</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Категория</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Сумма</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Описание</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="table-row">
                    <td className="px-6 py-4 text-sm font-medium text-white/80">{formatDate(exp.date)}</td>
                    <td className="px-4 py-4 text-sm text-white">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-extrabold text-rose-400">{formatCurrency(exp.amount)}</td>
                    <td className="px-4 py-4 text-sm text-white/40 max-w-xs truncate">{exp.description || '—'}</td>
                    <td className="px-4 py-4 text-right">
                      <button onClick={() => handleDelete(exp.id)} disabled={deleting === exp.id}
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
  )
}
