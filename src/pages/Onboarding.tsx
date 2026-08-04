import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Rocket, ArrowRight } from 'lucide-react'
import { useBreakEven } from '../hooks/useBreakEven'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { updateProfile } = useBreakEven()

  const [businessName, setBusinessName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = businessName.trim()
    if (!trimmed) {
      setError('Пожалуйста, введите название бизнеса!')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Сохраняем ТОЛЬКО название бизнеса. Цены пользователь указывает сам в настройках Точки 0
      await updateProfile({
        business_name: trimmed,
        desired_profit: 0,
      })
      setSaving(false)
      navigate('/')
    } catch (err: any) {
      console.error('Onboarding save error:', err)
      setError(err?.message || 'Ошибка сохранения. Попробуйте еще раз.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-surface-950/95 backdrop-blur-md">
      {/* Subtle Background Light */}
      <div className="fixed top-1/4 left-1/3 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Compact Modal Card */}
      <div className="relative glass border border-indigo-500/30 rounded-3xl p-6 max-w-md w-full z-10 shadow-2xl space-y-5 animate-slide-in">
        {/* Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-primary-600 flex items-center justify-center mx-auto shadow-glow-primary mb-2">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">
            Создание бизнеса
          </h1>
          <p className="text-white/50 text-xs">
            Введите название вашей компании для старта
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label text-white/80 text-xs">Название вашего бизнеса</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className="input-field text-sm font-bold border-indigo-500/50 focus:border-indigo-400 py-2.5"
              placeholder="Например: Переработка сырья 'Восток'"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-xs text-rose-300 font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !businessName.trim()}
            className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-glow-primary"
          >
            {saving ? (
              <span>Сохранение...</span>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                <span>Запустить бизнес</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
