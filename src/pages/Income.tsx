import { useState } from 'react'
import { Plus, Trash2, TrendingUp, Sparkles, CheckCircle2, Clock } from 'lucide-react'
import { useIncome } from '../hooks/useIncome'
import StatCard from '../components/StatCard'
import Tooltip from '../components/Tooltip'
import { formatCurrency, formatDate, formatKg, CURRENCY } from '../types'
import type { IncomeInsert } from '../types'

const today = () => new Date().toISOString().split('T')[0]

export default function IncomePage() {
  const { incomes, loading, add, remove, togglePaid, totalAmount, totalKg, totalUnpaid } = useIncome()
  const [showForm, setShowForm] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const [form, setForm] = useState<IncomeInsert>({
    date: today(),
    quantity_kg: 0,
    price_per_kg: 6.50,
    description: '',
    is_paid: true,
    client_name: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const { error } = await add(form)
    if (error) setError(error)
    else {
      setShowForm(false)
      setForm({
        date: today(),
        quantity_kg: 0,
        price_per_kg: 6.50,
        description: '',
        is_paid: true,
        client_name: '',
      })
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    await remove(id)
    setDeleting(null)
  }

  const handleTogglePaid = async (id: string, currentStatus: boolean) => {
    setToggling(id)
    await togglePaid(id, !currentStatus)
    setToggling(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Учёт продаж готового сырья</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Доходы и Продажи</h1>
          <p className="text-white/40 text-sm mt-0.5">Фиксация продаж готового сырья и отслеживание задолженностей</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Добавить продажу
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Выручка всего" value={totalAmount} icon={TrendingUp} variant="income"
          subtitle={`${totalKg.toFixed(1)} кг продано`} />

        <div className="card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span>В долгах (Неоплачено)</span>
              <Tooltip title="Продажи в долг" content="Сумма проданного сырья с отсрочкой платежа, по которым еще не поступила оплата." />
            </p>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-amber-300">
            {formatCurrency(totalUnpaid)}
          </p>
          <p className="text-white/40 text-xs mt-2 font-medium">
            {incomes.filter(i => i.is_paid === false).length} неоплаченных сделок
          </p>
        </div>

        <div className="card border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Фактическая оплата</p>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl lg:text-3xl font-extrabold text-emerald-400">
            {formatCurrency(totalAmount - totalUnpaid)}
          </p>
          <p className="text-emerald-300/60 text-xs mt-2 font-medium">
            Деньги поступили в кассу ✓
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card border border-emerald-500/30 shadow-glow-emerald animate-slide-in">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Новая продажа сырья</span>
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Дата</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input-field" required />
            </div>
            <div>
              <label className="label">Количество (кг)</label>
              <input type="number" step="0.1" min="0.1"
                value={form.quantity_kg || ''}
                onChange={e => setForm(f => ({ ...f, quantity_kg: parseFloat(e.target.value) || 0 }))}
                className="input-field" placeholder="например 500" required />
            </div>
            <div>
              <label className="label">Цена продажи (сом/кг)</label>
              <input type="number" step="0.01" min="0.01"
                value={form.price_per_kg || ''}
                onChange={e => setForm(f => ({ ...f, price_per_kg: parseFloat(e.target.value) || 0 }))}
                className="input-field" placeholder="6.50" required />
            </div>

            {/* Paid Status Switcher */}
            <div className="sm:col-span-3 bg-surface-900/60 p-4 rounded-2xl border border-white/10 space-y-3">
              <label className="label text-white/70">Статус оплаты сделки:</label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_paid: true }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    form.is_paid
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-glow-emerald'
                      : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>🟢 Оплачено сразу</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_paid: false }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    !form.is_paid
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-glow-amber'
                      : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>⏳ В долг (Отсрочка платежа)</span>
                </button>
              </div>

              {/* Client Name Input */}
              {!form.is_paid && (
                <div className="pt-2 animate-fade-in">
                  <label className="label">Имя покупателя / должника</label>
                  <input
                    type="text"
                    value={form.client_name ?? ''}
                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    className="input-field border-amber-500/40 text-amber-200"
                    placeholder="Например: Ислом, Парвиз, ООО Восток..."
                    required={!form.is_paid}
                  />
                </div>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="label">Примечание (опционально)</label>
              <input type="text" value={form.description ?? ''}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input-field" placeholder="Например: Партия очищенного сырья №4" />
            </div>

            {/* Total calculation preview */}
            {form.quantity_kg > 0 && form.price_per_kg > 0 && (
              <div className="sm:col-span-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-300 flex justify-between items-center font-bold">
                <span>Итого к получению ({formatKg(form.quantity_kg)} × {form.price_per_kg} {CURRENCY}):</span>
                <span className="text-lg text-emerald-400">{formatCurrency(form.quantity_kg * form.price_per_kg)}</span>
              </div>
            )}

            {error && (
              <div className="sm:col-span-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-300">{error}</div>
            )}
            <div className="sm:col-span-3 flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Сохранение...' : 'Сохранить продажу'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className={`card p-0 overflow-hidden border border-white/10 ${isCompact ? 'compact-table' : ''}`}>
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">История продаж</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg glass text-white/70 hover:text-white transition-all border border-white/10"
            >
              {isCompact ? '↕️ Обычный вид' : '↕️ Компактный вид'}
            </button>
            <span className="text-xs text-white/40 font-medium">Всего записей: {incomes.length}</span>
          </div>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : incomes.length === 0 ? (
          <div className="py-16 text-center">
            <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/40 font-medium">Нет записей продаж</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Дата</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Объём</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Цена за кг</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Выручка</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Статус оплаты</th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wider">Покупатель / Примечание</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {incomes.map(inc => (
                  <tr key={inc.id} className="table-row">
                    <td className="px-6 py-4 text-sm font-medium text-white/80">{formatDate(inc.date)}</td>
                    <td className="px-4 py-4 text-sm font-bold text-white">{formatKg(inc.quantity_kg)}</td>
                    <td className="px-4 py-4 text-sm text-white/60">{formatCurrency(inc.price_per_kg)}</td>
                    <td className="px-4 py-4 text-sm text-right font-black text-emerald-400">{formatCurrency(inc.total_amount)}</td>
                    
                    {/* Status Badge + Quick Toggle Button */}
                    <td className="px-4 py-4 text-sm">
                      {inc.is_paid !== false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Оплачено</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>В долг</span>
                          </span>
                          <button
                            onClick={() => handleTogglePaid(inc.id, inc.is_paid)}
                            disabled={toggling === inc.id}
                            className="glass text-[11px] font-bold px-2.5 py-1 rounded-lg text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all border border-emerald-500/30"
                            title="Нажмите если долг погашен"
                          >
                            ✓ Оплачено?
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm text-white/60 max-w-xs truncate">
                      {inc.client_name && (
                        <span className="text-amber-300 font-bold mr-1.5">[Клиент: {inc.client_name}]</span>
                      )}
                      {inc.description || '—'}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button onClick={() => handleDelete(inc.id)} disabled={deleting === inc.id}
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
