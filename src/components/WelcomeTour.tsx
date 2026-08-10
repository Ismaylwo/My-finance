import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Calculator, Factory, ReceiptText, Settings, ShoppingCart, X } from 'lucide-react'

const slides = [
  {
    icon: Settings,
    eyebrow: 'Шаг 1 из 5',
    title: 'Сначала настройте экономику продукта',
    text: 'Укажите цену сырья, процент выхода, цену продажи, начальные остатки и их стоимость. Без этих данных прибыль нельзя рассчитать точно.',
    note: 'Настройки задают план. Фактические закупки и производство уточняют расчёт.',
  },
  {
    icon: Factory,
    eyebrow: 'Шаг 2 из 5',
    title: 'Записывайте движение склада по порядку',
    text: 'Сначала закупка сырья, затем производство, затем продажа готового продукта. Даты операций важны: система не разрешает отрицательный остаток даже в прошлом.',
    note: 'Закупка уменьшает деньги, но не является расходом P&L до продажи товара.',
  },
  {
    icon: ShoppingCart,
    eyebrow: 'Шаг 3 из 5',
    title: 'Продажа и оплата — разные события',
    text: 'Продажа создаёт выручку и списывает товар. Оплата показывает фактическое поступление денег. Клиент может заплатить сразу, частично или позже.',
    note: 'Неоплаченная часть автоматически попадает в долг клиента.',
  },
  {
    icon: ReceiptText,
    eyebrow: 'Шаг 4 из 5',
    title: 'Правильно выбирайте тип расхода',
    text: 'Постоянные: аренда и оклад. На производство: упаковка и сдельная работа. На продажу: доставка клиенту и комиссия.',
    note: 'Производственный расход входит в стоимость товара; расход на продажу списывается сразу.',
  },
  {
    icon: Calculator,
    eyebrow: 'Шаг 5 из 5',
    title: 'Читайте прибыль и деньги отдельно',
    text: 'P&L показывает прибыль бизнеса, Cash Flow — движение денег, склад — стоимость непроданных запасов, а дебиторка — сколько должны клиенты.',
    note: 'В учебном центре есть формулы и полный пример с контрольными цифрами.',
  },
]

interface WelcomeTourProps {
  userId?: string
  enabled: boolean
  onOpenGuide: () => void
}

export default function WelcomeTour({ userId, enabled, onOpenGuide }: WelcomeTourProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const storageKey = userId ? `business-control-tour:${userId}` : ''

  useEffect(() => {
    if (enabled && storageKey && localStorage.getItem(storageKey) !== 'done') {
      setOpen(true)
    }
  }, [enabled, storageKey])

  if (!open) return null

  const current = slides[step]
  const Icon = current.icon
  const finish = () => {
    localStorage.setItem(storageKey, 'done')
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="glass relative w-full max-w-xl overflow-hidden rounded-3xl border border-sky-400/20 p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <button onClick={finish} className="absolute right-4 top-4 rounded-xl p-2 text-white/35 transition hover:bg-white/5 hover:text-white" aria-label="Закрыть обучение">
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          <div className="mb-6 flex gap-2">
            {slides.map((_, index) => (
              <span key={index} className={`h-1.5 flex-1 rounded-full transition ${index <= step ? 'bg-sky-400' : 'bg-white/8'}`} />
            ))}
          </div>

          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 text-sky-300">
            <Icon className="h-7 w-7" />
          </div>
          <p className="eyebrow">{current.eyebrow}</p>
          <h2 id="tour-title" className="pr-8 text-2xl font-extrabold text-white">{current.title}</h2>
          <p className="mt-3 text-sm leading-7 text-white/55">{current.text}</p>
          <div className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-400/[.06] p-4 text-xs leading-5 text-amber-100/65">
            {current.note}
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={finish} className="px-2 py-2 text-xs font-semibold text-white/35 transition hover:text-white/65">Пропустить</button>
            <div className="flex gap-2">
              {step > 0 && <button onClick={() => setStep(value => value - 1)} className="btn-secondary flex-1 justify-center sm:flex-none">Назад</button>}
              {step < slides.length - 1 ? (
                <button onClick={() => setStep(value => value + 1)} className="btn-primary flex-1 justify-center sm:flex-none">Далее <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button onClick={() => { finish(); onOpenGuide() }} className="btn-primary flex-1 justify-center sm:flex-none"><BookOpen className="h-4 w-4" /> Открыть учебник</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
