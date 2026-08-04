import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BarChart3, Eye, EyeOff, LogIn, UserPlus, TrendingUp, TrendingDown, Target, Sparkles } from 'lucide-react'

export default function Login() {
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Автоперенаправление на дашборд когда пользователь авторизован
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } else {
      const res = await signUp(email, password) as { error: string | null; needsEmailConfirmation?: boolean }
      if (res.error) {
        setError(res.error)
      } else if (res.needsEmailConfirmation) {
        setSuccessMsg('Аккаунт создан! Проверьте почту и подтвердите регистрацию.')
      } else {
        setSuccessMsg('Аккаунт создан! Входим...')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-surface-950">
      {/* Animated Background Mesh Globs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary-600/25 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-primary-600 mb-4 shadow-glow-primary border border-white/20">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-gradient tracking-tight">БизнесДэшборд</h1>
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Управление бизнесом &bull; TJS</p>
        </div>

        {/* Feature Pills Preview */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: TrendingUp, label: 'Доходы', color: 'text-emerald-400' },
            { icon: TrendingDown, label: 'Расходы', color: 'text-rose-400' },
            { icon: Target, label: 'Точка 0', color: 'text-amber-400' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="glass rounded-2xl p-3 text-center border border-white/10 hover:border-white/20 transition-all">
              <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
              <p className="text-xs font-semibold text-white/70">{label}</p>
            </div>
          ))}
        </div>

        {/* Auth Card */}
        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Tab Switcher */}
          <div className="flex rounded-2xl bg-surface-900/80 p-1 mb-6 border border-white/10">
            <button
              onClick={() => { setIsLogin(true); setError(null) }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 uppercase tracking-wider ${
                isLogin
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-glow-primary'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null) }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 uppercase tracking-wider ${
                !isLogin
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-glow-primary'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email адрес</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-xs font-medium text-rose-300 animate-fade-in">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-xs font-medium text-emerald-300 animate-fade-in">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-sm font-bold tracking-wide mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Загрузка...
                </span>
              ) : isLogin ? (
                <><LogIn className="w-4 h-4" /> Войти в систему</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Создать аккаунт</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-6 font-medium">
          Business Dashboard v1.0 &bull; Валюта: Сомони (TJS)
        </p>
      </div>
    </div>
  )
}
