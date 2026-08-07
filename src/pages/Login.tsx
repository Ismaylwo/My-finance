import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CircleDollarSign,
  Eye,
  EyeOff,
  LineChart,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const switchMode = (login: boolean) => {
    setIsLogin(login)
    setError(null)
    setSuccess(null)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (isLogin) {
      const result = await signIn(email, password)
      if (result.error) setError(result.error)
    } else {
      const result = await signUp(email, password) as { error: string | null; needsEmailConfirmation?: boolean }
      if (result.error) setError(result.error)
      else setSuccess(result.needsEmailConfirmation
        ? 'Аккаунт создан. Подтвердите регистрацию по ссылке в письме.'
        : 'Аккаунт создан. Выполняем вход…')
    }
    setLoading(false)
  }

  return (
    <main className="grid min-h-screen bg-[#080b12] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/[.07] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute -bottom-52 right-0 h-[480px] w-[480px] rounded-full bg-emerald-500/[.07] blur-[120px]" />
        <div className="relative flex items-center gap-3">
          <div className="brand-mark"><CircleDollarSign className="h-5 w-5" /></div>
          <div>
            <p className="font-extrabold text-white">Бизнес Контроль</p>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-400/70">Финансы и производство</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <p className="eyebrow">Управляйте на основе цифр</p>
          <h1 className="text-4xl font-extrabold leading-[1.12] text-white xl:text-5xl">Весь бизнес.<br /><span className="text-sky-300">В одном понятном отчёте.</span></h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/45">Контролируйте продажи, задолженности, расходы, склад и точку безубыточности без сложных таблиц.</p>
          <div className="mt-9 grid grid-cols-3 gap-3">
            {[
              { icon: LineChart, label: 'Финансы' },
              { icon: Boxes, label: 'Склад' },
              { icon: BarChart3, label: 'Аналитика' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                <Icon className="h-5 w-5 text-sky-400" />
                <p className="mt-3 text-xs font-semibold text-white/60">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-white/30"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Данные защищены политиками доступа Supabase</div>
      </section>

      <section className="flex min-h-screen items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="brand-mark"><CircleDollarSign className="h-5 w-5" /></div>
            <div><p className="font-extrabold">Бизнес Контроль</p><p className="text-[10px] uppercase tracking-widest text-sky-400/70">Business control</p></div>
          </div>

          <p className="eyebrow">{isLogin ? 'С возвращением' : 'Начало работы'}</p>
          <h2 className="text-3xl font-extrabold text-white">{isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}</h2>
          <p className="mt-2 text-sm text-white/40">{isLogin ? 'Продолжите работу с показателями бизнеса.' : 'Настройка займёт меньше двух минут.'}</p>

          <div className="mt-7 grid grid-cols-2 rounded-xl border border-white/[.07] bg-white/[.025] p-1">
            <button type="button" onClick={() => switchMode(true)} className={`rounded-lg py-2.5 text-xs font-bold transition ${isLogin ? 'bg-white/[.08] text-white' : 'text-white/35 hover:text-white/60'}`}>Вход</button>
            <button type="button" onClick={() => switchMode(false)} className={`rounded-lg py-2.5 text-xs font-bold transition ${!isLogin ? 'bg-white/[.08] text-white' : 'text-white/35 hover:text-white/60'}`}>Регистрация</button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" value={email} onChange={event => setEmail(event.target.value)} className="input-field h-12" placeholder="name@company.com" required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="auth-password">Пароль</label>
              <div className="relative">
                <input id="auth-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} className="input-field h-12 pr-12" placeholder="Минимум 6 символов" required minLength={6} autoComplete={isLogin ? 'current-password' : 'new-password'} />
                <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition hover:text-white/60" aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <div className="notice border-rose-400/20 bg-rose-400/[.07] text-rose-300">{error}</div>}
            {success && <div className="notice border-emerald-400/20 bg-emerald-400/[.07] text-emerald-300"><Check className="h-4 w-4 shrink-0" />{success}</div>}

            <button type="submit" disabled={loading} className="btn-primary h-12 w-full justify-center">
              {loading ? 'Пожалуйста, подождите…' : isLogin ? 'Войти' : 'Создать аккаунт'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-5 text-white/25">Нажимая кнопку, вы соглашаетесь хранить данные бизнеса в своей защищённой учётной записи.</p>
        </div>
      </section>
    </main>
  )
}
