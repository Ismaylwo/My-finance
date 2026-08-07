import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Target,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useBreakEven } from '../hooks/useBreakEven'
import OnboardingPage from '../pages/Onboarding'

const navGroups = [
  {
    label: 'Обзор',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Главная' },
      { to: '/analytics', icon: BarChart3, label: 'Аналитика' },
    ],
  },
  {
    label: 'Операции',
    items: [
      { to: '/income', icon: TrendingUp, label: 'Продажи' },
      { to: '/expenses', icon: ReceiptText, label: 'Расходы бизнеса' },
      { to: '/personal', icon: UserRound, label: 'Личные расходы' },
      { to: '/warehouse', icon: Boxes, label: 'Склад и производство' },
    ],
  },
  {
    label: 'Планирование',
    items: [
      { to: '/breakeven', icon: Target, label: 'Точка безубыточности' },
      { to: '/settings', icon: Settings, label: 'Настройки' },
    ],
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const { profile, loading } = useBreakEven()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const businessName = profile?.business_name?.trim() ?? ''

  if (!loading && !businessName) return <OnboardingPage />

  const logout = async () => {
    await signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <>
      <div className="flex h-[76px] items-center gap-3 border-b border-white/7 px-5">
        <div className="brand-mark"><CircleDollarSign className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-white">{businessName || 'Мой бизнес'}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-sky-400/75">Business control</p>
        </div>
        <button className="ml-auto rounded-lg p-2 text-white/45 hover:bg-white/5 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {navGroups.map(group => (
          <div key={group.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-white/25">{group.label}</p>
            <div className="space-y-1">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="h-[18px] w-[18px]" />
                      <span>{label}</span>
                      {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/7 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] p-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-400/[.12] text-xs font-bold text-sky-300">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white/78">{user?.email}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/30"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Данные синхронизированы</p>
          </div>
        </div>
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-white/[.38] transition hover:bg-rose-400/[.08] hover:text-rose-300">
          <LogOut className="h-4 w-4" /> Выйти из аккаунта
        </button>
      </div>
    </>
  )

  return (
    <div className="app-shell">
      <aside className="sidebar hidden lg:flex"><Sidebar /></aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-label="Закрыть меню" />
          <aside className="sidebar relative flex animate-slide-in"><Sidebar /></aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="mobile-header lg:hidden">
          <button className="icon-action" onClick={() => setSidebarOpen(true)} aria-label="Открыть меню"><Menu className="h-5 w-5" /></button>
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="brand-mark h-8 w-8"><CircleDollarSign className="h-4 w-4" /></div>
            <strong className="truncate text-sm">{businessName}</strong>
          </div>
          <div className="h-9 w-9" />
        </header>
        <main className="main-scroll">
          <div className="mx-auto w-full max-w-[1440px] animate-fade-in px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</div>
        </main>
      </div>
    </div>
  )
}
