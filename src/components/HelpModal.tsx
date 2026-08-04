import { useState } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle, X, Sparkles, Target, TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react'
import { CURRENCY } from '../types'

export default function HelpModal() {
  const [open, setOpen] = useState(false)

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Centered Modal Card (Escapes any parent container via React Portal!) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-2xl max-h-[85vh] glass border border-indigo-500/50 rounded-3xl p-5 sm:p-6 z-10 shadow-2xl flex flex-col animate-slide-in text-white">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/20 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>Инструкция и Формулы расчёта</span>
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Полный разбор себестоимости, маржи и закупки сырья</p>
            </div>
          </div>

          <button onClick={() => setOpen(false)} className="p-2 rounded-xl glass text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="overflow-y-auto pr-1 space-y-3.5 text-xs text-white/80 relative z-10">
          {/* Step 1 */}
          <div className="bg-surface-900/80 p-4 rounded-2xl border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs">
                <Target className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span>1. Себестоимость сырья и Усушка / Выход (%)</span>
            </div>
            <p className="text-white/70 leading-relaxed">
              Купив исходное сырьё по <strong className="text-white">2.50 {CURRENCY}/кг</strong>, при выходе в <strong className="text-amber-300">90%</strong> (900 кг готового из 1000 кг), реальная цена чистого материала становится выше:
            </p>
            <div className="bg-amber-500/10 p-2.5 rounded-xl font-mono text-xs text-amber-300 border border-amber-500/30">
              Реальное сырьё = 2.50 ÷ 0.90 = <strong>2.78 {CURRENCY} / кг готового</strong>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-900/80 p-4 rounded-2xl border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xs">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <span>2. Расходы бизнеса и ПОЛНАЯ себестоимость</span>
            </div>
            <p className="text-white/70 leading-relaxed">
              Все расходы на Аренду, Зарплату, Коммуналку и Транспорт суммируются за месяц и делятся на объём проданного/планируемого сырья:
            </p>
            <div className="bg-rose-500/10 p-2.5 rounded-xl font-mono text-xs text-rose-300 border border-rose-500/30">
              ПОЛНАЯ себестоимость 1 кг = Сырьё (2.78) + (Расходы бизнеса ÷ Объём в кг)
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-surface-900/80 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span>3. ЧИСТАЯ маржа / прибыль с 1 кг</span>
            </div>
            <p className="text-white/70 leading-relaxed">
              Это чистый заработок с каждого килограмма после покрытия абсолютно всех расходов бизнеса:
            </p>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl font-mono text-xs text-emerald-300 border border-emerald-500/30">
              Чистая маржа 1 кг = Цена продажи (6.50) − ПОЛНАЯ себестоимость 1 кг
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-surface-900/80 p-4 rounded-2xl border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs">
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span>4. Расчёт объёма ЗАКУПКИ на складе</span>
            </div>
            <p className="text-white/70 leading-relaxed">
              Чтобы выпустить нужный объём готовой продукции, закупка с учётом усушки рассчитывается так:
            </p>
            <div className="bg-indigo-500/10 p-2.5 rounded-xl font-mono text-xs text-indigo-300 border border-indigo-500/30">
              ЗАКУПКА сырья = Объём готового сырья ÷ 0.90 (процент выхода)
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between relative z-10">
          <span className="text-white/40 text-xs font-medium">Всё рассчитывается автоматически</span>
          <button onClick={() => setOpen(false)} className="btn-primary px-5 py-2 text-xs">
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="glass text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all flex items-center gap-1.5 shadow-sm focus:outline-none"
      >
        <HelpCircle className="w-4 h-4 text-indigo-400" />
        <span>Как всё считается?</span>
      </button>

      {open && createPortal(modalContent, document.body)}
    </>
  )
}
