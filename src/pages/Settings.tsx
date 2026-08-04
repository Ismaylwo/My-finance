import { useState, useEffect } from 'react'
import { Settings, Building2, Sun, Moon, Trash2, Check, AlertTriangle, Sparkles, ShieldAlert, X } from 'lucide-react'
import { useBreakEven } from '../hooks/useBreakEven'
import { useAuth } from '../hooks/useAuth'
import Tooltip from '../components/Tooltip'
import { CURRENCY } from '../types'

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
  })

  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Danger Zone Modal
  const [showClearModal, setShowClearModal] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        business_name: profile.business_name || '',
        raw_purchase_price_per_kg: profile.raw_purchase_price_per_kg ?? 0,
        yield_percent: profile.yield_percent ?? 0,
        selling_price_per_kg: profile.selling_price_per_kg ?? 0,
        desired_profit: profile.desired_profit ?? 0,
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
    
    // Полное удаление бизнеса из БД и кэша
    await resetEntireBusiness()

    setClearing(false)
    setShowClearModal(false)
    setConfirmInput('')
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="label flex items-center justify-between">
              <span>Закупка сырья</span>
              <Tooltip title="Закупка" content="Цена за 1 кг исходного необработанного материала у поставщика." />
            </label>
            <input
              type="number" step="0.01" min="0"
              value={form.raw_purchase_price_per_kg || ''}
              onChange={e => setForm(f => ({ ...f, raw_purchase_price_per_kg: parseFloat(e.target.value) || 0 }))}
              className="input-field" required
            />
            <p className="text-white/30 text-[11px] mt-1">{CURRENCY} / кг</p>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Выход продукции</span>
              <Tooltip title="Выход %" content="Процент чистого готового сырья из 100% закупленного. Усушка = 100 - Выход." />
            </label>
            <input
              type="number" step="0.1" min="1" max="100"
              value={form.yield_percent || ''}
              onChange={e => setForm(f => ({ ...f, yield_percent: parseFloat(e.target.value) || 0 }))}
              className="input-field text-amber-300 font-bold" required
            />
            <p className="text-white/30 text-[11px] mt-1">% готовности</p>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Цена продажи</span>
              <Tooltip title="Продажа" content="Цена продажи 1 кг готового переработанного сырья клиентам." />
            </label>
            <input
              type="number" step="0.01" min="0"
              value={form.selling_price_per_kg || ''}
              onChange={e => setForm(f => ({ ...f, selling_price_per_kg: parseFloat(e.target.value) || 0 }))}
              className="input-field text-emerald-400 font-bold" required
            />
            <p className="text-white/30 text-[11px] mt-1">{CURRENCY} / кг</p>
          </div>

          <div>
            <label className="label flex items-center justify-between">
              <span>Целевая прибыль</span>
              <Tooltip title="Цель" content="Желаемая чистая прибыль бизнеса за месяц." />
            </label>
            <input
              type="number" step="500" min="0"
              value={form.desired_profit || ''}
              onChange={e => setForm(f => ({ ...f, desired_profit: parseFloat(e.target.value) || 0 }))}
              className="input-field text-indigo-300 font-bold" required
            />
            <p className="text-white/30 text-[11px] mt-1">{CURRENCY} / месяц</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            <Sparkles className="w-4 h-4" />
            {saving ? 'Сохранение...' : 'Сохранить профиль бизнеса'}
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
              Удаляет все существующие записи о доходах, продажах в долг и расходах бизнеса. Параметры цен и профиль останутся сохранёнными.
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
              Вы действительно хотите <strong>удалить всю историю продаж, долгов и расходов</strong>? Это действие нельзя будет отменить!
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
