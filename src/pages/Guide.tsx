import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BookOpen,
  Calculator,
  CheckCircle2,
  Circle,
  Clock3,
  Factory,
  HelpCircle,
  PackageCheck,
  ReceiptText,
  Settings,
  ShoppingCart,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { useAppContext } from '../hooks/useAppContext'

const workflow = [
  { number: 1, to: '/settings', icon: Settings, title: 'Настройки', text: 'Цена сырья, выход, цена продажи, начальные остатки и план.' },
  { number: 2, to: '/warehouse', icon: PackageCheck, title: 'Закупка сырья', text: 'Количество, фактическая цена, поставщик и дата поступления.' },
  { number: 3, to: '/warehouse', icon: Factory, title: 'Производство', text: 'Сколько сырья использовано и сколько готового продукта получено.' },
  { number: 4, to: '/expenses', icon: ReceiptText, title: 'Расходы', text: 'Разделите постоянные, производственные и расходы на продажу.' },
  { number: 5, to: '/income', icon: ShoppingCart, title: 'Продажа', text: 'Количество, цена, клиент и статус первоначальной оплаты.' },
  { number: 6, to: '/income', icon: Banknote, title: 'Оплата', text: 'Записывайте каждую частичную оплату фактической датой.' },
  { number: 7, to: '/analytics', icon: TrendingUp, title: 'Проверка отчётов', text: 'Сверьте P&L, Cash Flow, долги и стоимость склада.' },
]

function Formula({ title, formula, explanation }: { title: string; formula: string; explanation: string }) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-black/10 p-4">
      <p className="text-xs font-bold text-white">{title}</p>
      <code className="mt-2 block overflow-x-auto rounded-xl border border-sky-400/10 bg-sky-400/[.055] px-3 py-2.5 text-xs font-semibold text-sky-200">{formula}</code>
      <p className="mt-2 text-xs leading-5 text-white/40">{explanation}</p>
    </div>
  )
}

export default function GuidePage() {
  const { profile, rawMaterialPurchases, dailyProduction, incomes, incomePayments, expenses } = useAppContext()
  const checks = [
    { label: 'Настройки экономики заполнены', done: Number(profile?.raw_purchase_price_per_kg) > 0 && Number(profile?.yield_percent) > 0 && Number(profile?.selling_price_per_kg) > 0, to: '/settings' },
    { label: 'Добавлена первая закупка', done: rawMaterialPurchases.length > 0, to: '/warehouse' },
    { label: 'Добавлено первое производство', done: dailyProduction.length > 0, to: '/warehouse' },
    { label: 'Классифицированы расходы', done: expenses.length > 0, to: '/expenses' },
    { label: 'Добавлена первая продажа', done: incomes.length > 0, to: '/income' },
    { label: 'Записана первая оплата', done: incomePayments.length > 0, to: '/income' },
  ]
  const completed = checks.filter(item => item.done).length
  const progress = Math.round((completed / checks.length) * 100)

  return (
    <div className="space-y-6">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Обучение системе</p>
          <h1 className="page-title">Как вести учёт без ошибок</h1>
          <p className="page-subtitle">Правильный порядок операций, формулы и полный пример для одного сырья и одного продукта.</p>
        </div>
        <div className="flex h-12 items-center gap-3 rounded-2xl border border-sky-400/15 bg-sky-400/[.06] px-4">
          <BookOpen className="h-5 w-5 text-sky-300" />
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Освоено</p><p className="text-sm font-extrabold text-white">{completed} из {checks.length} · {progress}%</p></div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
        <div className="panel">
          <div className="section-heading"><div><p className="eyebrow">Первый запуск</p><h2>Ваш чек-лист</h2></div><CheckCircle2 className="h-5 w-5 text-emerald-400" /></div>
          <div className="mt-4 space-y-2">
            {checks.map(item => (
              <NavLink key={item.label} to={item.to} className="flex items-center gap-3 rounded-xl border border-white/[.06] p-3 transition hover:border-sky-400/20 hover:bg-white/[.02]">
                {item.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <Circle className="h-4 w-4 shrink-0 text-white/20" />}
                <span className={`text-xs font-semibold ${item.done ? 'text-white/45 line-through' : 'text-white/75'}`}>{item.label}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-white/20" />
              </NavLink>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading"><div><p className="eyebrow">Главное правило</p><h2>Вводите операции в реальном порядке</h2></div><Clock3 className="h-5 w-5 text-amber-400" /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {workflow.map(({ number, to, icon: Icon, title, text }) => (
              <NavLink key={`${number}-${title}`} to={to} className="group flex gap-3 rounded-2xl border border-white/[.065] bg-white/[.02] p-4 transition hover:border-sky-400/20">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-400/[.08] text-sky-300"><Icon className="h-4 w-4" /></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-white/25">Шаг {number}</p><p className="mt-0.5 text-sm font-bold text-white">{title}</p><p className="mt-1 text-xs leading-5 text-white/38">{text}</p></div>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">Как система считает</p><h2>Основные формулы</h2></div><Calculator className="h-5 w-5 text-sky-400" /></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Formula title="Остаток сырья" formula="Начальный остаток + Закупки − Использовано" explanation="Система проверяет остаток на каждую дату и запрещает производство без сырья." />
          <Formula title="Остаток готового продукта" formula="Начальный остаток + Произведено − Продано" explanation="Продажа автоматически уменьшает готовый склад." />
          <Formula title="Средняя стоимость сырья" formula="Стоимость остатка и закупок ÷ Количество" explanation="После закупок по разным ценам применяется средневзвешенная стоимость." />
          <Formula title="Себестоимость проданного" formula="Проданные кг × Средняя стоимость готового кг" explanation="В неё входят сырьё и производственно-переменные расходы." />
          <Formula title="Расчётная прибыль (P&L)" formula="Выручка − Себестоимость проданного − Расходы периода" explanation="Закупка непроданного сырья и личные изъятия сюда не входят." />
          <Formula title="Движение денег" formula="Оплаты − Закупки − Расходы бизнеса − Личные" explanation="Показывает изменение денег, а не бухгалтерскую прибыль." />
          <Formula title="Долг клиента" formula="Сумма продажи − Все оплаты этой продажи" explanation="Оплата может поступать несколькими частями и в другом месяце." />
          <Formula title="Стоимость сырья в готовом кг" formula="Цена сырья ÷ Процент выхода" explanation="При цене 2 и выходе 80% сырьё в готовом килограмме стоит 2,50." />
          <Formula title="Точка безубыточности" formula="Постоянные расходы ÷ Маржа на кг" explanation="Маржа = цена продажи − сырьё в готовом кг − переменные затраты на кг." />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="section-heading"><div><p className="eyebrow">Контрольный пример</p><h2>Что должно получиться</h2></div><PackageCheck className="h-5 w-5 text-emerald-400" /></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-300">Введите</p>
              <ol className="mt-3 space-y-2 text-xs leading-5 text-white/50">
                <li>1. Закупка: 500 кг × 2 = 1 000 сом</li>
                <li>2. Производство: 500 кг → 400 кг</li>
                <li>3. Расход производства: 200 сом</li>
                <li>4. Постоянный расход: 100 сом</li>
                <li>5. Продажа: 100 кг × 10 = 1 000 сом</li>
                <li>6. Частичная оплата: 400 сом</li>
                <li>7. Личное изъятие: 50 сом</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[.045] p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Увидите</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-white/55">
                <li>• Готовый склад: 300 кг стоимостью 900 сом</li>
                <li>• Себестоимость 1 кг: 3 сом</li>
                <li>• Себестоимость проданного: 300 сом</li>
                <li>• Расчётная прибыль: 600 сом</li>
                <li>• Долг клиента: 600 сом</li>
                <li>• Деньги до личных: −900 сом</li>
                <li>• Деньги после личных: −950 сом</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="section-heading"><div><p className="eyebrow">Не перепутайте</p><h2>Три разных отчёта</h2></div><WalletCards className="h-5 w-5 text-violet-300" /></div>
          <div className="mt-4 space-y-3">
            <div className="metric-box"><span>P&amp;L</span><strong className="!text-sm">Заработал ли бизнес</strong><p className="mt-1 text-xs leading-5 text-white/35">Продажи и себестоимость независимо от оплаты.</p></div>
            <div className="metric-box"><span>Cash Flow</span><strong className="!text-sm">Как изменились деньги</strong><p className="mt-1 text-xs leading-5 text-white/35">Только реальные оплаты и выплаты.</p></div>
            <div className="metric-box"><span>Склад и долги</span><strong className="!text-sm">Где находятся активы</strong><p className="mt-1 text-xs leading-5 text-white/35">Запасы и деньги, которые должны клиенты.</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="notice notice-warning">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div><p className="font-bold text-white">Частые ошибки</p><p className="mt-1">Не записывайте закупку сырья как обычный расход. Не отмечайте продажу оплаченной, если деньги ещё не получены. Не меняйте начальные остатки вместо внесения новой операции.</p></div>
        </div>
        <div className="rounded-2xl border border-sky-400/15 bg-sky-400/[.055] p-4">
          <div className="flex gap-3"><HelpCircle className="h-5 w-5 shrink-0 text-sky-300" /><div><p className="text-sm font-bold text-white">Когда цифрам можно доверять?</p><p className="mt-1 text-xs leading-5 text-white/45">Когда заполнена стоимость начальных остатков, все операции внесены правильными датами, у закупок есть цена, а расходы выбраны правильного типа.</p></div></div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.045] p-5 sm:flex-row">
        <div><p className="font-bold text-white">Готовы начать?</p><p className="mt-1 text-xs text-white/40">Откройте чек-лист сверху и выполните первый незавершённый шаг.</p></div>
        <NavLink to="/settings" className="btn-primary justify-center">Перейти к настройкам <ArrowRight className="h-4 w-4" /></NavLink>
      </div>
    </div>
  )
}
