import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBreakEven } from '../hooks/useBreakEven'
import OnboardingPage from '../pages/Onboarding'
import {
  LayoutDashboard, TrendingUp, TrendingDown, Home,
  Target, BarChart2, LogOut, BarChart3, Menu, Sparkles, Settings
} from 'lucide-react'

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Дэшборд'       },
  { to: '/income',     icon: TrendingUp,      label: 'Доходы'         },
  { to: '/expenses',   icon: TrendingDown,    label: 'Расходы'        },
  { to: '/personal',   icon: Home,            label: 'Личные расходы' },
  { to: '/breakeven',  icon: Target,          label: 'Точка 0'        },
  { to: '/analytics',  icon: BarChart2,       label: 'Аналитика'      },
  { to: '/settings',   icon: Settings,        label: 'Настройки'      },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const { profile, loading: profileLoading } = useBreakEven()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const businessName = profile?.business_name || ''
  // Бизнес считается настроенным, если у профиля есть непустое название
  const isBusinessConfigured = Boolean(businessName && businessName.trim().length > 0)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'

  // Показываем Onboarding ТОЛЬКО если данные уже загружены И профиля нет/название пустое
  // profileLoading = true означает что данные ещё в пути — не трогаем экран
  if (!profileLoading && !isBusinessConfigured) {
    return <OnboardingPage />
  }

  const SidebarContent = () => (
    <>
      {/* Brand Header with Real Business Name */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10 relative overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-glow-primary">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-sm text-white tracking-tight truncate">{businessName}</h1>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
          </div>
          <p className="text-[11px] text-indigo-300/60 font-medium">Финансовая аналитика TJS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Навигация</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                isActive
                  ? 'bg-gradient-to-r from-primary-600/30 to-indigo-600/20 text-white border border-primary-500/40 shadow-glow-primary'
                  : 'text-white/60 hover:text-white hover:bg-white/5 hover:border-white/10 border border-transparent'
              }`
            }
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-500/30 text-primary-300' : 'text-white/40 group-hover:text-white/80'
                }`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                </div>
                <span className="truncate">{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-4 rounded-full bg-primary-400 shadow-glow-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile & Logout footer */}
      <div className="p-3 border-t border-white/10 bg-surface-900/40 space-y-2">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-sm flex-shrink-0">
            {userInitial}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold text-white/90 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> В сети
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300/80 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 w-full"
        >
          <LogOut className="w-3.5 h-3.5" />
          Выйти из системы
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass border-r border-white/10 flex-shrink-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 glass border-r border-white/10 z-10 animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 glass border-b border-white/10 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl glass hover:bg-white/10 transition-colors text-white/70"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-sm text-white truncate">{businessName}</span>
            </div>
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
