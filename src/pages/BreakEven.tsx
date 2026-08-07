import { useState, useEffect, useMemo } from 'react'
import { Target, Settings, AlertTriangle, Sparkles, PackageCheck, ShoppingBag, Check, Zap, CalendarClock, TrendingUp } from 'lucide-react'
import { useBreakEven } from '../hooks/useBreakEven'
import Tooltip from '../components/Tooltip'
import HelpModal from '../components/HelpModal'
import { formatCurrency, formatKg, CURRENCY } from '../types'

export default function BreakEvenPage() {
  const { profile, loading, updateProfile, calculate, productionPace } = useBreakEven()
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    raw_purchase_price_per_kg: 0,
    yield_percent: 0,
    selling_price_per_kg: 0,
    desired_profit: 0,
    daily_capacity_kg: 0,
    variable_cost_per_kg: 0,
  })
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setEditForm({
        raw_purchase_price_per_kg: profile.raw_purchase_price_per_kg ?? 0,
        yield_percent: profile.yield_percent ?? 0,
        selling_price_per_kg: profile.selling_price_per_kg ?? 0,
        desired_profit: profile.desired_profit ?? 0,
        daily_capacity_kg: profile.daily_capacity_kg ?? 0,
        variable_cost_per_kg: profile.variable_cost_per_kg ?? 0,
      })
    }
  }, [profile])

  const result = calculate(editForm.desired_profit)

  const activeResult = useMemo(() => {
    if (productionPace.actualBreakEvenResult && result) {
      const margin = productionPace.actualBreakEvenResult.marginPerKg
      const desired = editForm.desired_profit || 0
      const targetFinished = (productionPace.actualBreakEvenResult.businessExpenses + desired) / margin
      const yieldRatio = productionPace.actualBreakEvenResult.yieldPercent / 100
      
      return {
        ...productionPace.actualBreakEvenResult,
        desiredProfit: desired,
        targetFinishedKg: targetFinished,
        targetRawKg: targetFinished / yieldRatio,
        targetRevenue: targetFinished * productionPace.actualBreakEvenResult.sellingPricePerKg
      }
    }
    return result
  }, [productionPace.actualBreakEvenResult, result, editForm.desired_profit])

  const handleSave = async () => {
    setSaving(true)
    await updateProfile(editForm)
    setEditMode(false)
    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleQuickProfitSave = async (val: number) => {
    setEditForm(f => ({ ...f, desired_profit: val }))
    await updateProfile({ desired_profit: val })
  }

  const handleDesiredProfitBlur = async () => {
    await updateProfile({ desired_profit: editForm.desired_profit })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl h-36 animate-pulse" />
        ))}
      </div>
    )
  }

  const marginOk = result && result.marginPerKg > 0

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass p-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
                <Target className="w-3.5 h-3.5" />
                <span>Калькулятор объёма закупки</span>
              </div>
              {productionPace.realYieldPercent !== null && profile?.yield_percent && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  productionPace.realYieldPercent >= profile.yield_percent
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  Фактический выход сырья: {productionPace.realYieldPercent.toFixed(1)}%
                </div>
              )}
              <HelpModal />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Точка безубыточности и Закупка
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Расчёт сырьевого выхода, полной себестоимости и необходимого объёма закупки сырья
            </p>
          </div>

          <button onClick={() => setEditMode(!editMode)} className="btn-secondary text-sm gap-2 self-start sm:self-auto">
            <Settings className="w-4 h-4 text-amber-400" />
            {editMode ? 'Закрыть настройки' : 'Настройка цен и Цели'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-4 text-emerald-300 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5 text-emerald-400" />
          <span>Новые настройки и цены успешно сохранены!</span>
        </div>
      )}

      {/* Settings Modal */}
      {editMode && (
        <div className="card border border-indigo-500/40 shadow-glow-primary animate-slide-in">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Параметры цен, выхода и желаемой прибыли</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label flex items-center justify-between">
                <span>Закупка сырья (сом/кг)</span>
                <Tooltip title="Закупка" content="Цена покупки исходного необработанного сырья у поставщика." />
              </label>
              <input type="number" step="0.01" min="0"
                value={editForm.raw_purchase_price_per_kg || ''}
                onChange={e => setEditForm(f => ({ ...f, raw_purchase_price_per_kg: parseFloat(e.target.value) || 0 }))}
                className="input-field" placeholder="например 2.50" />
            </div>
            <div>
              <label className="label flex items-center justify-between">
                <span>Выход продукции (%)</span>
                <Tooltip title="Выход сырья" content="Сколько готового сырья получается из 100% закупленного. Например: 900 кг из 1000 кг = 90%." />
              </label>
              <input type="number" step="0.1" min="1" max="100"
                value={editForm.yield_percent || ''}
                onChange={e => setEditForm(f => ({ ...f, yield_percent: parseFloat(e.target.value) || 0 }))}
                className="input-field" placeholder="например 90" />
            </div>
            <div>
              <label className="label flex items-center justify-between">
                <span>Цена продажи (сом/кг)</span>
                <Tooltip title="Продажа" content="Цена реализации 1 кг готовой обработанной продукции клиентам." />
              </label>
              <input type="number" step="0.01" min="0"
                value={editForm.selling_price_per_kg || ''}
                onChange={e => setEditForm(f => ({ ...f, selling_price_per_kg: parseFloat(e.target.value) || 0 }))}
                className="input-field" placeholder="например 6.50" />
            </div>
            <div>
              <label className="label flex items-center justify-between">
                <span>Желаемая прибыль (сом)</span>
                <Tooltip title="Цель прибыли" content="Текущая целевая чистая прибыль бизнеса за месяц. Можно менять в любой момент!" />
              </label>
              <input type="number" step="500" min="0"
                value={editForm.desired_profit || ''}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0
                  setEditForm(f => ({ ...f, desired_profit: val }))
                }}
                className="input-field text-emerald-400 font-bold" placeholder="например 15000" />
            </div>
            <div>
              <label className="label flex items-center justify-between">
                <span>Переменные затраты (сом/кг)</span>
                <Tooltip title="Переменные затраты" content="Упаковка, сдельная работа и другие затраты на каждый килограмм. Стоимость сырья сюда не включайте." />
              </label>
              <input type="number" step="0.01" min="0"
                value={editForm.variable_cost_per_kg || ''}
                onChange={e => setEditForm(f => ({ ...f, variable_cost_per_kg: parseFloat(e.target.value) || 0 }))}
                className="input-field text-amber-300 font-bold" placeholder="например 0.50" />
            </div>
            <div>
              <label className="label flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Мощность в день (кг)</span>
                <Tooltip title="Дневная мощность" content="Сколько кг готовой продукции вы производите за один рабочий день. Используется для прогноза сроков." />
              </label>
              <input type="number" step="1" min="0"
                value={editForm.daily_capacity_kg || ''}
                onChange={e => setEditForm(f => ({ ...f, daily_capacity_kg: parseFloat(e.target.value) || 0 }))}
                className="input-field text-amber-300 font-bold" placeholder="например 50" />
              <p className="text-white/30 text-[11px] mt-1">кг готовой продукции / день</p>
            </div>

          </div>

          <div className="flex gap-3 justify-end mt-5 border-t border-white/10 pt-4">
            <button onClick={() => setEditMode(false)} className="btn-secondary">Отмена</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </div>
      )}

      {/* Parameter Overview Cards */}
      {activeResult && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {productionPace.actualBreakEvenResult && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider z-10 whitespace-nowrap shadow-glow-emerald">
              Расчет по факту со склада
            </div>
          )}
          <div className="card border border-white/10 text-center">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Закупка сырья</p>
            <p className="text-2xl font-extrabold text-white">{formatCurrency(activeResult.rawPurchasePricePerKg)}</p>
            <p className="text-white/30 text-[11px] mt-1">за 1 кг исходного</p>
          </div>
          <div className="card border border-white/10 text-center">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <span>Выход продукции</span>
              <Tooltip title="Выход" content="Процент готового материала после очистки/переработки." />
            </p>
            <p className="text-2xl font-extrabold text-amber-300">{activeResult.yieldPercent.toFixed(1)}%</p>
            <p className="text-white/30 text-[11px] mt-1">усушка / отходы</p>
          </div>
          <div className="card border border-white/10 text-center">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <span>Реальное сырьё</span>
              <Tooltip title="Реальное сырьё" content="Себестоимость сырья за 1 кг готовой продукции: Закупка (2.50) ÷ Выход (0.90) = 2.78 сом." />
            </p>
            <p className="text-2xl font-extrabold text-indigo-300">{formatCurrency(activeResult.realRawCostPerKg)}</p>
            <p className="text-white/30 text-[11px] mt-1">себестоимость 1 кг готового</p>
          </div>
          <div className="card border border-white/10 text-center">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Цена продажи</p>
            <p className="text-2xl font-extrabold text-emerald-400">{formatCurrency(activeResult.sellingPricePerKg)}</p>
            <p className="text-white/30 text-[11px] mt-1">за 1 кг готовой продукции</p>
          </div>
        </div>
      )}

      {!activeResult && !editMode && (
        <div className="card border border-amber-500/30 text-center py-12 bg-amber-500/5">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-xl font-bold text-white mb-2">Настройте параметры расчета</h3>
          <p className="text-white/50 max-w-md mx-auto mb-5 text-sm">
            Чтобы увидеть расчеты точки безубыточности и план производства, нужно указать цены закупки, продажи и процент выхода сырья.
          </p>
          <button onClick={() => setEditMode(true)} className="btn-primary mx-auto">
            <Settings className="w-4 h-4 mr-2" />
            Открыть настройки
          </button>
        </div>
      )}

    {/* ── Прогноз: Дней до цели ──────────────────────────────────── */}
      {activeResult && (profile?.daily_capacity_kg ?? 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Темп Точки 0 */}
          <div className={`card border text-center ${
            productionPace.breakEvenStatus === 'ahead' ? 'border-emerald-500/40 bg-emerald-500/5' :
            productionPace.breakEvenStatus === 'behind' ? 'border-rose-500/40 bg-rose-500/5' :
            'border-amber-500/30'
          }`}>
            <CalendarClock className={`w-5 h-5 mx-auto mb-2 ${
              productionPace.breakEvenStatus === 'ahead' ? 'text-emerald-400' :
              productionPace.breakEvenStatus === 'behind' ? 'text-rose-400' : 'text-amber-400'
            }`} />
            <p className="text-white/40 text-[10px] uppercase font-semibold mb-1">До Точки 0</p>
            {productionPace.actualDaysToBreakEven === null ? (
              <p className="text-white/60 text-sm font-bold">Внесите производство</p>
            ) : productionPace.actualDaysToBreakEven <= 0 ? (
              <p className="text-emerald-400 text-2xl font-black mt-2">✓ Достигнуто</p>
            ) : (
              <>
                <p className="text-2xl font-black text-white">{Math.max(0, productionPace.actualDaysToBreakEven).toFixed(1)} дн.</p>
                <div className="mt-1 flex flex-col text-[11px]">
                   <span className="text-white/30">Идеальный план: {productionPace.initialDaysToBreakEven?.toFixed(1)} дн.</span>
                   {productionPace.breakEvenStatus === 'ahead' ? <span className="text-emerald-400 font-bold mt-1">Опережаем на {productionPace.breakEvenDiffDays?.toFixed(1)} дн.</span> :
                    productionPace.breakEvenStatus === 'behind' ? <span className="text-rose-400 font-bold mt-1">Отстаем на {Math.abs(productionPace.breakEvenDiffDays || 0).toFixed(1)} дн.</span> :
                    <span className="text-indigo-400 font-bold mt-1">Идем строго по графику</span>}
                </div>
              </>
            )}
          </div>

          {/* Темп Цели */}
          {activeResult.desiredProfit > 0 && (
            <div className={`card border text-center ${
              productionPace.targetStatus === 'ahead' ? 'border-emerald-500/40 bg-emerald-500/5' :
              productionPace.targetStatus === 'behind' ? 'border-rose-500/40 bg-rose-500/5' :
              'border-emerald-500/30'
            }`}>
              <Sparkles className={`w-5 h-5 mx-auto mb-2 ${
                productionPace.targetStatus === 'ahead' ? 'text-emerald-400' :
                productionPace.targetStatus === 'behind' ? 'text-rose-400' : 'text-emerald-400'
              }`} />
              <p className="text-white/40 text-[10px] uppercase font-semibold mb-1">До Желаемой прибыли</p>
              {productionPace.actualDaysToTarget === null ? (
                <p className="text-white/60 text-sm font-bold">Внесите производство</p>
              ) : productionPace.actualDaysToTarget <= 0 ? (
                <p className="text-emerald-400 text-2xl font-black mt-2">✓ Достигнуто!</p>
              ) : (
                <>
                  <p className="text-2xl font-black text-white">{Math.max(0, productionPace.actualDaysToTarget).toFixed(1)} дн.</p>
                  <div className="mt-1 flex flex-col text-[11px]">
                     <span className="text-white/30">Идеальный план: {productionPace.initialDaysToTarget?.toFixed(1)} дн.</span>
                     {productionPace.targetStatus === 'ahead' ? <span className="text-emerald-400 font-bold mt-1">Опережаем на {productionPace.targetDiffDays?.toFixed(1)} дн.</span> :
                      productionPace.targetStatus === 'behind' ? <span className="text-rose-400 font-bold mt-1">Отстаем на {Math.abs(productionPace.targetDiffDays || 0).toFixed(1)} дн.</span> :
                      <span className="text-indigo-400 font-bold mt-1">Идем строго по графику</span>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Факт произведено */}
          <div className="card border border-indigo-500/30 text-center flex flex-col justify-center">
            <TrendingUp className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
            <p className="text-white/40 text-[10px] uppercase font-semibold mb-1">Продано / произведено</p>
            <p className="text-2xl font-black text-indigo-300">{formatKg(productionPace.totalSoldThisMonth)}</p>
            <p className="text-white/30 text-[11px] mt-1">произведено: {formatKg(productionPace.totalProducedThisMonth)}</p>
            <p className="text-white/30 text-[11px] mt-1">
              Отработано смен (дней): <span className="text-white/80 font-bold">{productionPace.daysWorked}</span>
            </p>
          </div>

        </div>
      )}

      {/* Margin Warning */}
      {activeResult && !marginOk && (
        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5">
          <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
          <div>
            <p className="text-rose-300 font-bold text-sm">Невозможно рассчитать точку безубыточности</p>
            <p className="text-rose-200/70 text-xs mt-0.5">
              Цена продажи ({formatCurrency(activeResult.sellingPricePerKg)}) меньше или равна реальной себестоимости сырья ({formatCurrency(activeResult.realRawCostPerKg)}). Вы работаете в убыток с каждого кг!
            </p>
          </div>
        </div>
      )}

      {/* Main Calculation View */}
      {activeResult && marginOk && (
        <>
          {/* Break-Even vs Target Production Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Break-Even (Point 0) Card */}
            <div className="card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base">Точка выхода в 0 (Минимум)</p>
                    <p className="text-amber-300/80 text-xs">Покрывает расходы бизнеса ({formatCurrency(activeResult.businessExpenses)})</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4 bg-surface-900/60 p-4 rounded-2xl border border-white/5">
                <div>
                  <div className="flex items-center gap-1.5 text-white/50 text-xs font-semibold uppercase mb-1">
                    <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Готовой продукции:</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-300">{formatKg(activeResult.breakEvenFinishedKg)}</p>
                  <p className="text-white/40 text-[11px] mt-0.5">Выручка: {formatCurrency(activeResult.breakEvenRevenue)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-white/50 text-xs font-semibold uppercase mb-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ЗАКУПИТЬ сырья:</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-indigo-300">{formatKg(activeResult.breakEvenRawKg)}</p>
                  <p className="text-white/40 text-[11px] mt-0.5">с учётом усушки {activeResult.yieldPercent}%</p>
                </div>
              </div>
            </div>

            {/* Target Profit Interactive Card */}
            <div className="card border border-emerald-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <p className="text-white font-bold text-base">Текущая целевая прибыль</p>
                </div>

                <div className="mb-4">
                  <label className="label flex items-center justify-between">
                    <span>Целевая прибыль ({CURRENCY})</span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Можно изменить в любой момент
                    </span>
                  </label>
                  <input type="number" step="500" min="0"
                    value={editForm.desired_profit || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0
                      setEditForm(f => ({ ...f, desired_profit: val }))
                    }}
                    onBlur={handleDesiredProfitBlur}
                    className="input-field text-lg font-bold text-emerald-400" placeholder="Например: 15000" />

                  {/* Quick Profit Buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[5000, 10000, 15000, 25000, 50000].map(val => (
                      <button key={val} onClick={() => handleQuickProfitSave(val)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          editForm.desired_profit === val
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold shadow-glow-emerald'
                            : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                        }`}>
                        +{val.toLocaleString('ru-RU')} {CURRENCY}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {activeResult.desiredProfit > 0 && (
                <div className="bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 border border-emerald-500/40 rounded-2xl p-4 animate-fade-in grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-white/60 text-[11px] uppercase font-semibold">Произвести готового:</p>
                    <p className="text-emerald-400 font-extrabold text-2xl tracking-tight">{formatKg(activeResult.targetFinishedKg)}</p>
                    <p className="text-white/40 text-[11px]">Выручка: {formatCurrency(activeResult.targetRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-[11px] uppercase font-semibold">ЗАКУПИТЬ на складе:</p>
                    <p className="text-indigo-300 font-extrabold text-2xl tracking-tight">{formatKg(activeResult.targetRawKg)}</p>
                    <p className="text-white/40 text-[11px]">Исходного сырья</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Complete Breakdown Table */}
          <div className="card border border-white/10">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center justify-between">
              <span>📊 Детальный экономический расклад на 1 кг</span>
              <Tooltip title="Сводка 1 кг" content="Все составляющие полной себестоимости и чистой прибыли за 1 кг." />
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/50 flex items-center gap-1.5">
                  <span>Исходная цена закупки сырья</span>
                  <Tooltip title="Закупка" content="Цена за 1 кг исходного закупленного сырья у поставщика." />
                </span>
                <span className="text-white font-medium">{formatCurrency(activeResult.rawPurchasePricePerKg)} / кг</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/50 flex items-center gap-1.5">
                  <span>Реальная себестоимость сырья (с учётом {activeResult.yieldPercent}% выхода)</span>
                  <Tooltip title="Сырьевая себестоимость" content="Цена закупки со склада, разделенная на % выхода. Показывает, сколько РЕАЛЬНО стоит 1 кг готовой продукции только по сырью." />
                </span>
                <span className="text-amber-300 font-semibold">{formatCurrency(activeResult.realRawCostPerKg)} / кг</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/50 flex items-center gap-1.5">
                  <span>Переменные затраты помимо сырья</span>
                  <Tooltip title="Переменные затраты" content="Упаковка, сдельная работа и другие затраты на каждый произведённый килограмм." />
                </span>
                <span className="text-amber-300 font-semibold">{formatCurrency(activeResult.variableCostPerKg)} / кг</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/50 flex items-center gap-1.5">
                  <span>Маржинальный доход (Цена − Сырьё − Переменные)</span>
                  <Tooltip title="Маржинальный доход" content="Сумма с каждого проданного килограмма, которая покрывает постоянные расходы и формирует прибыль." />
                </span>
                <span className="text-emerald-400 font-semibold">{formatCurrency(result.marginPerKg)} / кг</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-white/50 flex items-center gap-1.5">
                  <span>Расходы бизнеса ({formatCurrency(activeResult.businessExpenses)} / {formatKg(activeResult.breakEvenFinishedKg)})</span>
                  <Tooltip title="Бизнес расходы (Без сырья)" content="Ваши постоянные расходы из вкладки Расходы (аренда, з/п). Сюда НЕ ВХОДИТ стоимость закупки сырья на склад, так как она вычитается отдельно!" />
                </span>
                <span className="text-indigo-300 font-medium">{formatCurrency(result.businessExpensePerKg)} / кг</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-white/5 bg-white/[0.03] px-4 rounded-xl">
                <span className="text-white/80 font-bold flex items-center gap-1.5">
                  <span>ПОЛНАЯ себестоимость 1 кг</span>
                  <Tooltip title="Полная себестоимость" content="Сырьё + переменные расходы на кг + доля постоянных расходов." />
                </span>
                <span className="text-rose-400 font-black text-base">{formatCurrency(result.fullCostPerKg)} / кг</span>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-emerald-500/10 px-4 rounded-xl border border-emerald-500/20">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <span>ЧИСТАЯ маржа / прибыль с 1 кг</span>
                  <Tooltip title="ЧИСТАЯ Маржа" content="Цена продажи (6.50) − ПОЛНАЯ себестоимость 1 кг. Твой чистый доход!" />
                </span>
                <span className={`font-black text-lg ${result.netProfitPerKg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.netProfitPerKg >= 0 ? '+' : ''}{formatCurrency(result.netProfitPerKg)} / кг
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
