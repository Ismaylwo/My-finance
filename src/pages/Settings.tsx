import { useState, useEffect } from 'react'
import { Settings, Building2, Sun, Moon, Trash2, Check, AlertTriangle, Sparkles, ShieldAlert, X } from 'lucide-react'
import { useBreakEven } from '../hooks/useBreakEven'
import { useAuth } from '../hooks/useAuth'
import Tooltip from '../components/Tooltip'

export default function SettingsPage() {
  const { user } = useAuth()
  const { profile, loading, updateProfile, resetEntireBusiness } = useBreakEven()

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app_theme') as 'dark' | 'light') || 'dark'
  })

  const [form, setForm] = useState({
    business_name: '',
    raw_purchase_price_per_kg: 0,
    yield_percent: 0,
    selling_price_per_kg: 0,
    desired_profit: 0,
    daily_capacity_kg: 0,
    initial_raw_kg: 0,
    initial_finished_kg: 0,
    initial_raw_cost_per_kg: 0,
    initial_finished_cost_per_kg: 0,
    variable_cost_per_kg: 0,
  })

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Danger Zone Modal
  const [showClearModal, setShowClearModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name || '',
        raw_purchase_price_per_kg: profile.raw_purchase_price_per_kg ?? 0,
        yield_percent: profile.yield_percent ?? 0,
        selling_price_per_kg: profile.selling_price_per_kg ?? 0,
        desired_profit: profile.desired_profit ?? 0,
        daily_capacity_kg: profile.daily_capacity_kg ?? 0,
        initial_raw_kg: profile.initial_raw_kg ?? 0,
        initial_finished_kg: profile.initial_finished_kg ?? 0,
        initial_raw_cost_per_kg: profile.initial_raw_cost_per_kg ?? 0,
        initial_finished_cost_per_kg: profile.initial_finished_cost_per_kg ?? 0,
        variable_cost_per_kg: profile.variable_cost_per_kg ?? 0,
      })
    }
  }, [profile])


  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    localStorage.setItem('app_theme', newTheme)
    if (newTheme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  const handleClearBusinessData = async () => {
    if (confirmInput.trim().toUpperCase() !== 'УДАЛИТЬ' || !user) return
    setClearing(true)
    setClearError(null)
    try {
      await resetEntireBusiness()
      setShowClearModal(false)
      setConfirmInput('')
    } catch (error) {
      setClearError(error instanceof Error ? error.message : 'Не удалось очистить данные')
    } finally {
      setClearing(false)
    }
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl glass p-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Настройки системы и Профиля</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Настройки бизнеса
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Управление названием бизнеса, темой оформления, параметрами закупки и очисткой данных
          </p>
        </div>
      </div>



      {/* 1. Theme Selector Section */}
      <div className="card border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
            <span>Внешний вид и Тема оформления</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => toggleTheme('dark')}
            className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
              theme === 'dark'
                ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-glow-primary'
                : 'glass border-white/10 text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-900 flex items-center justify-center text-indigo-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Тёмная тема (Neon Dark)</p>
                <p className="text-xs text-white/40">Стильный неоновый премиум интерфейс</p>
              </div>
            </div>
            {theme === 'dark' && <Check className="w-5 h-5 text-indigo-400" />}
          </button>

          <button
            type="button"
            onClick={() => toggleTheme('light')}
            className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
              theme === 'light'
                ? 'bg-amber-500/20 border-amber-500 text-slate-900 shadow-glow-amber'
                : 'glass border-white/10 text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-amber-500">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-white">Светлая тема (Clean Light)</p>
                <p className="text-xs text-white/40">Чистый светлый фон для дневной работы</p>
              </div>
            </div>
            {theme === 'light' && <Check className="w-5 h-5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* 2. Business Profile Settings Form */}
      <form onSubmit={handleSaveProfile} className="card border border-white/10 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <span>Профиль бизнеса и Исходные параметры</span>
          </h2>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> Настройки сохранены
            </span>
          )}
        </div>

        <div>
          <label className="label">Название вашего бизнеса</label>
          <input
            type="text"
            value={form.business_name}
            onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
            className="input-field text-base font-bold"
            placeholder="Например: Переработка сырья 'Восток'"
            required
          />
          <p className="text-white/40 text-xs mt-1">Отображается в сайдбаре и отчётах</p>
        </div>



        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            {saving ? 'Сохранение...' : 'Сохранить профиль бизнеса'}
          </button>
        </div>
      </form>

      {/* 2.5. Производительность и Начальный склад */}
      <form onSubmit={handleSaveProfile} className="card border border-amber-500/20 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>⚡</span>
            <span>Производительность и Склад</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label flex items-center justify-between">
              <span>Мощность в день (кг)</span>
              <Tooltip title="Мощность" content="Сколько кг готовой продукции производите за один рабочий день. Используется для прогноза дат выхода в 0 и прибыль." />
            </label>
            <input
              type="number" step="1" min="0"
              value={form.daily_capacity_kg || ''}
              onChange={e => setForm(f => ({ ...f, daily_capacity_kg: parseFloat(e.target.value) || 0 }))}
              className="input-field text-amber-300 font-bold"
              placeholder="например 50"
            />
            <p className="text-white/30 text-[11px] mt-1">кг готовой / день</p>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Начальный остаток — неготовое (кг)</span>
              <Tooltip title="Нач. остаток сырья" content="Сколько неготового сырья было на складе ДО начала работы с приложением. Вводится один раз." />
            </label>
            <input
              type="number" step="0.1" min="0"
              value={form.initial_raw_kg || ''}
              onChange={e => setForm(f => ({ ...f, initial_raw_kg: parseFloat(e.target.value) || 0 }))}
              className="input-field text-amber-200 font-bold"
              placeholder="например 1000"
            />
            <p className="text-white/30 text-[11px] mt-1">кг на складе до старта</p>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Начальный остаток — готовое (кг)</span>
              <Tooltip title="Нач. остаток готового" content="Сколько готовой продукции было на складе ДО начала работы с приложением. Вводится один раз." />
            </label>
            <input
              type="number" step="0.1" min="0"
              value={form.initial_finished_kg || ''}
              onChange={e => setForm(f => ({ ...f, initial_finished_kg: parseFloat(e.target.value) || 0 }))}
              className="input-field text-emerald-300 font-bold"
              placeholder="например 200"
            />
            <p className="text-white/30 text-[11px] mt-1">кг готового до старта</p>
          </div>
          <div>
            <label className="label">Стоимость начального сырья (сом/кг)</label>
            <input type="number" step="0.01" min="0"
              value={form.initial_raw_cost_per_kg || ''}
              onChange={e => setForm(f => ({ ...f, initial_raw_cost_per_kg: parseFloat(e.target.value) || 0 }))}
              className="input-field" placeholder="например 2.50" />
            <p className="text-white/30 text-[11px] mt-1">нужно, только если начальный остаток сырья больше нуля</p>
          </div>
          <div>
            <label className="label">Стоимость начальной готовой продукции (сом/кг)</label>
            <input type="number" step="0.01" min="0"
              value={form.initial_finished_cost_per_kg || ''}
              onChange={e => setForm(f => ({ ...f, initial_finished_cost_per_kg: parseFloat(e.target.value) || 0 }))}
              className="input-field" placeholder="например 3.10" />
            <p className="text-white/30 text-[11px] mt-1">нужно, только если начальный готовый остаток больше нуля</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            {saving ? 'Сохранение...' : 'Сохранить настройки производства'}
          </button>
        </div>
      </form>


      {/* 3. Danger Zone Section */}
      <div className="card border border-rose-500/30 bg-rose-500/5 space-y-4">
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
          <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Опасная зона (Сброс данных бизнеса)</span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">Очистить всю историю продаж и расходов</p>
            <p className="text-white/50 text-xs mt-0.5 max-w-xl">
              Удаляет продажи, оплаты, расходы, закупки и производство. Профиль, цены и начальные остатки останутся сохранёнными.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="btn-danger self-start sm:self-auto text-xs px-4 py-2.5 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Сбросить данные бизнеса</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setShowClearModal(false)} />

          <div className="relative glass border border-rose-500/50 rounded-3xl p-6 max-w-md w-full z-10 shadow-glow-rose text-white space-y-4 animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <span>Подтверждение сброса данных</span>
              </div>
              <button onClick={() => setShowClearModal(false)} className="p-1 rounded-lg text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/80 leading-relaxed">
              Вы действительно хотите <strong>удалить всю историю продаж, оплат, расходов, закупок и производства</strong>? Это действие нельзя будет отменить!
            </p>

            <div className="space-y-1.5">
              <label className="label text-rose-300 font-bold">Введите слово УДАЛИТЬ для подтверждения:</label>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                className="input-field border-rose-500/40 font-mono text-center uppercase font-bold tracking-widest text-rose-200"
                placeholder="УДАЛИТЬ"
              />
            </div>

            {clearError && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{clearError}</div>}

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowClearModal(false)} className="btn-secondary text-xs">
                Отмена
              </button>
              <button
                type="button"
                onClick={handleClearBusinessData}
                disabled={confirmInput.trim().toUpperCase() !== 'УДАЛИТЬ' || clearing}
                className="btn-danger text-xs px-4"
              >
                {clearing ? 'Удаление...' : 'Да, очистить всё'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
