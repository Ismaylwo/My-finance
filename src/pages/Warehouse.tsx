import { useState, useMemo } from 'react'
import {
  Warehouse, PackagePlus, Plus, Trash2, ChevronDown, ChevronUp,
  ArrowDownToLine, Factory, ShoppingCart, TrendingUp, Calendar, Info
} from 'lucide-react'
import { useAppContext } from '../hooks/useAppContext'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { formatKg, formatCurrency, formatDate } from '../types'
import type { DailyProductionInsert, RawMaterialPurchaseInsert } from '../types'

// ── Helper: сегодняшняя дата в ISO ─────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0]
}

// ── Статус склада — цвет остатка ──────────────────────────────────
function StockBadge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className={`flex-1 p-5 rounded-2xl border ${color} bg-surface-900/60`}>
      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-black ${value < 0 ? 'text-rose-400' : 'text-white'}`}>
        {formatKg(Math.max(0, value))}
      </p>
      {value < 0 && (
        <p className="text-rose-400 text-xs mt-1 font-semibold">⚠ Минус — проверьте данные</p>
      )}
    </div>
  )
}

export default function WarehousePage() {
  const { user } = useAuth()
  const {
    profile, warehouseBalance, dailyProduction, rawMaterialPurchases,
    incomes, setDailyProduction, setRawMaterialPurchases,
  } = useAppContext()

  // ── Форма добавления дневного производства ─────────────────────
  const [dpForm, setDpForm] = useState({
    date: today(),
    raw_kg_used: '',
    finished_kg_produced: '',
    notes: '',
  })
  const [dpSaving, setDpSaving] = useState(false)
  const [dpError, setDpError] = useState<string | null>(null)

  // ── Форма закупки сырья ────────────────────────────────────────
  const [rmpForm, setRmpForm] = useState({
    date: today(),
    quantity_kg: '',
    price_per_kg: '',
    supplier: '',
    notes: '',
  })
  const [rmpSaving, setRmpSaving] = useState(false)
  const [rmpError, setRmpError] = useState<string | null>(null)

  // ── Режим раскрытия таблиц ────────────────────────────────────
  const [showDpTable, setShowDpTable] = useState(true)
  const [showRmpTable, setShowRmpTable] = useState(false)

  // ── Вычисляем прибавки от продаж за месяц ──────────────────────
  const now = new Date()
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthlySoldKg = useMemo(
    () => incomes.filter(i => i.date.startsWith(currentMonthPrefix)).reduce((s, i) => s + Number(i.quantity_kg), 0),
    [incomes, currentMonthPrefix]
  )
  const monthlyProducedKg = useMemo(
    () => dailyProduction.filter(d => d.date.startsWith(currentMonthPrefix)).reduce((s, d) => s + Number(d.finished_kg_produced), 0),
    [dailyProduction, currentMonthPrefix]
  )
  const monthlyRawUsed = useMemo(
    () => dailyProduction.filter(d => d.date.startsWith(currentMonthPrefix)).reduce((s, d) => s + Number(d.raw_kg_used), 0),
    [dailyProduction, currentMonthPrefix]
  )

  // ── Сохранить дневное производство ────────────────────────────
  const handleDpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setDpSaving(true); setDpError(null)

    const rawKg = parseFloat(dpForm.raw_kg_used) || 0
    const finishedKg = parseFloat(dpForm.finished_kg_produced) || 0

    if (rawKg <= 0 && finishedKg <= 0) {
      setDpError('Введите хотя бы одно значение > 0')
      setDpSaving(false); return
    }

    if (rawKg > Math.max(0, warehouseBalance.raw_kg_balance)) {
      setDpError(`На складе недостаточно сырья. Доступно: ${formatKg(Math.max(0, warehouseBalance.raw_kg_balance))}`)
      setDpSaving(false); return
    }

    const item: DailyProductionInsert = {
      date: dpForm.date,
      raw_kg_used: rawKg,
      finished_kg_produced: finishedKg,
      notes: dpForm.notes || null,
    }

    const { data, error } = await supabase
      .from('daily_production')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()

    if (error) {
      setDpError(error.message)
    } else {
      setDailyProduction(prev => {
        return [data, ...prev].sort((a, b) => b.date.localeCompare(a.date))
      })
      setDpForm(f => ({ ...f, raw_kg_used: '', finished_kg_produced: '', notes: '' }))
    }
    setDpSaving(false)
  }

  // ── Удалить запись производства ────────────────────────────────
  const handleDpDelete = async (id: string) => {
    setDailyProduction(prev => prev.filter(d => d.id !== id))
    await supabase.from('daily_production').delete().eq('id', id)
  }

  // ── Сохранить закупку сырья ────────────────────────────────────
  const handleRmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setRmpSaving(true); setRmpError(null)

    const qty = parseFloat(rmpForm.quantity_kg)
    if (!qty || qty <= 0) {
      setRmpError('Количество кг должно быть > 0')
      setRmpSaving(false); return
    }

    const item: RawMaterialPurchaseInsert = {
      date: rmpForm.date,
      quantity_kg: qty,
      price_per_kg: parseFloat(rmpForm.price_per_kg) || 0,
      supplier: rmpForm.supplier || null,
      notes: rmpForm.notes || null,
    }

    const { data, error } = await supabase
      .from('raw_material_purchases')
      .insert({ ...item, user_id: user.id })
      .select()
      .single()

    if (error) {
      setRmpError(error.message)
    } else {
      setRawMaterialPurchases(prev => [data, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
      setRmpForm(f => ({ ...f, quantity_kg: '', price_per_kg: '', supplier: '', notes: '' }))
    }
    setRmpSaving(false)
  }

  // ── Удалить закупку ────────────────────────────────────────────
  const handleRmpDelete = async (id: string) => {
    setRawMaterialPurchases(prev => prev.filter(r => r.id !== id))
    await supabase.from('raw_material_purchases').delete().eq('id', id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl glass p-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300 mb-2">
            <Warehouse className="w-3.5 h-3.5" />
            <span>Управление складом</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Склад сырья
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Учёт неготового и готового сырья: закупки, переработка, продажи
          </p>
        </div>
      </div>

      {/* ── Карточки остатков ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StockBadge
          value={warehouseBalance.raw_kg_balance}
          label="Неготовое сырьё (остаток)"
          color="border-amber-500/30"
        />
        <StockBadge
          value={warehouseBalance.finished_kg_balance}
          label="Готовая продукция (остаток)"
          color="border-emerald-500/30"
        />
      </div>

      {/* ── Итоги за месяц ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card border border-white/10 text-center py-3">
          <Factory className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
          <p className="text-white/40 text-[10px] uppercase font-semibold">Переработано (мес.)</p>
          <p className="text-xl font-black text-indigo-300">{formatKg(monthlyRawUsed)}</p>
          <p className="text-white/30 text-[10px]">неготового сырья</p>
        </div>
        <div className="card border border-white/10 text-center py-3">
          <PackagePlus className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-white/40 text-[10px] uppercase font-semibold">Произведено (мес.)</p>
          <p className="text-xl font-black text-emerald-300">{formatKg(monthlyProducedKg)}</p>
          <p className="text-white/30 text-[10px]">готовой продукции</p>
        </div>
        <div className="card border border-white/10 text-center py-3 col-span-2 sm:col-span-1">
          <ShoppingCart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <p className="text-white/40 text-[10px] uppercase font-semibold">Продано (мес.)</p>
          <p className="text-xl font-black text-rose-300">{formatKg(monthlySoldKg)}</p>
          <p className="text-white/30 text-[10px]">списано с готового склада</p>
        </div>
      </div>

      {/* ── Реальный выход за месяц ───────────────────────────── */}
      {monthlyRawUsed > 0 && (
        <div className="card border border-indigo-500/20 flex items-center gap-3 py-3">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <p className="text-white/70 text-sm">
            <span className="text-white font-bold">Реальный выход за месяц: </span>
            {monthlyRawUsed > 0 ? `${((monthlyProducedKg / monthlyRawUsed) * 100).toFixed(1)}%` : '—'}
            {profile?.yield_percent ? ` (план: ${profile.yield_percent}%)` : ''}
          </p>
        </div>
      )}

      {/* ── ФОРМА: Дневное производство ───────────────────────── */}
      <div className="card border border-indigo-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Factory className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Внести производство за день</h2>
        </div>
        <form onSubmit={handleDpSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Дата</label>
            <input type="date" value={dpForm.date}
              onChange={e => setDpForm(f => ({ ...f, date: e.target.value }))}
              className="input-field" max={today()} />
          </div>
          <div>
            <label className="label">Загружено сырья (кг)</label>
            <input type="number" step="0.1" min="0" placeholder="напр. 500"
              value={dpForm.raw_kg_used}
              onChange={e => setDpForm(f => ({ ...f, raw_kg_used: e.target.value }))}
              className="input-field" />
            <p className="text-white/30 text-[11px] mt-1">неготового сырья в переработку</p>
          </div>
          <div>
            <label className="label flex items-center gap-1">
              Вышло готовой продукции (кг)
            </label>
            <input type="number" step="0.1" min="0" placeholder="напр. 450"
              value={dpForm.finished_kg_produced}
              onChange={e => setDpForm(f => ({ ...f, finished_kg_produced: e.target.value }))}
              className="input-field text-emerald-400 font-bold" />
            <p className="text-white/30 text-[11px] mt-1">реально вышло после переработки</p>
          </div>
          <div>
            <label className="label">Заметки (опционально)</label>
            <input type="text" placeholder="Причина отклонения..."
              value={dpForm.notes}
              onChange={e => setDpForm(f => ({ ...f, notes: e.target.value }))}
              className="input-field" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
            {dpError && <p className="text-rose-400 text-xs font-semibold">{dpError}</p>}
            <button type="submit" disabled={dpSaving} className="btn-primary ml-auto gap-2">
              <Plus className="w-4 h-4" />
              {dpSaving ? 'Сохраняю...' : 'Сохранить производство'}
            </button>
          </div>
        </form>
      </div>

      {/* ── ФОРМА: Закупка сырья ──────────────────────────────── */}
      <div className="card border border-amber-500/30">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDownToLine className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Закупить неготовое сырьё</h2>
        </div>
        <form onSubmit={handleRmpSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Дата закупки</label>
            <input type="date" value={rmpForm.date}
              onChange={e => setRmpForm(f => ({ ...f, date: e.target.value }))}
              className="input-field" max={today()} />
          </div>
          <div>
            <label className="label">Количество (кг) *</label>
            <input type="number" step="0.1" min="0.1" placeholder="напр. 1000" required
              value={rmpForm.quantity_kg}
              onChange={e => setRmpForm(f => ({ ...f, quantity_kg: e.target.value }))}
              className="input-field text-amber-400 font-bold" />
          </div>
          <div>
            <label className="label">Цена за кг (сом)</label>
            <input type="number" step="0.01" min="0" placeholder="напр. 2.50"
              value={rmpForm.price_per_kg}
              onChange={e => setRmpForm(f => ({ ...f, price_per_kg: e.target.value }))}
              className="input-field" />
          </div>
          <div>
            <label className="label">Поставщик</label>
            <input type="text" placeholder="Название поставщика"
              value={rmpForm.supplier}
              onChange={e => setRmpForm(f => ({ ...f, supplier: e.target.value }))}
              className="input-field" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
            {rmpError && <p className="text-rose-400 text-xs font-semibold">{rmpError}</p>}
            <button type="submit" disabled={rmpSaving} className="btn-primary ml-auto gap-2 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300">
              <ArrowDownToLine className="w-4 h-4" />
              {rmpSaving ? 'Сохраняю...' : 'Добавить закупку'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Журнал производства ─────────────────────────────────── */}
      <div className="card border border-white/10">
        <button
          onClick={() => setShowDpTable(v => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Журнал производства</h2>
            <span className="text-xs text-white/40 font-medium">({dailyProduction.length} записей)</span>
          </div>
          {showDpTable ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>

        {showDpTable && (
          <div className="mt-4 overflow-x-auto">
            {dailyProduction.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">Нет записей производства</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs uppercase font-semibold border-b border-white/10">
                    <th className="text-left py-2 pr-4">Дата</th>
                    <th className="text-right py-2 pr-4">Загружено (кг)</th>
                    <th className="text-right py-2 pr-4">Вышло (кг)</th>
                    <th className="text-right py-2 pr-4">Выход %</th>
                    <th className="text-left py-2 pr-4">Заметки</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dailyProduction.map(d => {
                    const realYield = d.raw_kg_used > 0 ? (d.finished_kg_produced / d.raw_kg_used) * 100 : null
                    const planYield = profile?.yield_percent ?? 0
                    const isLow = realYield !== null && planYield > 0 && realYield < planYield * 0.9
                    return (
                      <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 pr-4 font-medium text-white/80">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-white/30" />
                            {formatDate(d.date)}
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-right text-amber-300 font-semibold">{formatKg(d.raw_kg_used)}</td>
                        <td className="py-2.5 pr-4 text-right text-emerald-400 font-bold">{formatKg(d.finished_kg_produced)}</td>
                        <td className="py-2.5 pr-4 text-right">
                          {realYield !== null ? (
                            <span className={`font-semibold ${isLow ? 'text-rose-400' : 'text-white/70'}`}>
                              {realYield.toFixed(1)}%
                              {isLow && ' ↓'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2.5 pr-4 text-white/40 text-xs max-w-[180px] truncate">{d.notes || '—'}</td>
                        <td className="py-2.5">
                          <button onClick={() => handleDpDelete(d.id)} className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── История закупок сырья ───────────────────────────────── */}
      <div className="card border border-white/10">
        <button
          onClick={() => setShowRmpTable(v => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">История закупок сырья</h2>
            <span className="text-xs text-white/40 font-medium">({rawMaterialPurchases.length} записей)</span>
          </div>
          {showRmpTable ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
        </button>

        {showRmpTable && (
          <div className="mt-4 overflow-x-auto">
            {rawMaterialPurchases.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-8">Нет записей закупок</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-xs uppercase font-semibold border-b border-white/10">
                    <th className="text-left py-2 pr-4">Дата</th>
                    <th className="text-right py-2 pr-4">Кол-во (кг)</th>
                    <th className="text-right py-2 pr-4">Цена/кг</th>
                    <th className="text-right py-2 pr-4">Итого</th>
                    <th className="text-left py-2 pr-4">Поставщик</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rawMaterialPurchases.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-white/80">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-white/30" />
                          {formatDate(r.date)}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-amber-300 font-bold">{formatKg(r.quantity_kg)}</td>
                      <td className="py-2.5 pr-4 text-right text-white/60">{r.price_per_kg > 0 ? formatCurrency(r.price_per_kg) : '—'}</td>
                      <td className="py-2.5 pr-4 text-right text-white/80 font-semibold">
                        {r.total_cost > 0 ? formatCurrency(r.total_cost) : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-white/50 text-xs">{r.supplier || '—'}</td>
                      <td className="py-2.5">
                        <button onClick={() => handleRmpDelete(r.id)} className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/10">
                    <td colSpan={2} className="pt-2 text-right font-bold text-white/60 text-xs pr-4">ИТОГО ЗАКУПЛЕНО:</td>
                    <td colSpan={2} className="pt-2 text-right">
                      <span className="text-amber-300 font-black">
                        {formatKg(rawMaterialPurchases.reduce((s, r) => s + Number(r.quantity_kg), 0))}
                      </span>
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Легенда формулы склада ───────────────────────────────── */}
      <div className="card border border-white/5 bg-surface-900/40 text-xs text-white/40 space-y-1">
        <p className="text-white/60 font-semibold mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          Как считается остаток склада
        </p>
        <p>🟡 <span className="text-amber-300/80">Неготовое сырьё</span> = Начальный остаток + Закупки − Переработано</p>
        <p>🟢 <span className="text-emerald-300/80">Готовая продукция</span> = Начальный остаток + Произведено − Все продажи</p>
        <p className="text-white/30 mt-2">* Начальный остаток вводится один раз в Настройках бизнеса</p>
      </div>
    </div>
  )
}
