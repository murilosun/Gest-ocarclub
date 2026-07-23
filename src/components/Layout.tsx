import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  LayoutDashboard,
  Users,
  Car,
  Wrench,
  ClipboardList,
  CalendarDays,
  Wallet,
  Package,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/veiculos', label: 'Veículos', icon: Car },
  { to: '/servicos', label: 'Serviços', icon: Wrench },
  { to: '/ordens', label: 'Ordens de Serviço', icon: ClipboardList },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/funcionarios', label: 'Funcionários', icon: UserCog },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Layout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const companyName = profile?.company_name ?? 'ClubOS'
  const companySuffix = profile?.company_suffix ?? 'by Car Club'
  const companyMark = profile?.company_mark ?? 'C'

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-ink-950 text-white shrink-0">
        <SidebarContent
          companyName={companyName}
          companySuffix={companySuffix}
          companyMark={companyMark}
          profileName={profile?.name ?? ''}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Sidebar - Mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-ink-950 text-white animate-slide-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent
              companyName={companyName}
              companySuffix={companySuffix}
              companyMark={companyMark}
              profileName={profile?.name ?? ''}
              onSignOut={handleSignOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-ink-950 text-white">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm">{companyName}</span>
          <div className="w-7" />
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({
  companyName,
  companySuffix,
  companyMark,
  profileName,
  onSignOut,
  onNavigate,
}: {
  companyName: string
  companySuffix: string
  companyMark: string
  profileName: string
  onSignOut: () => void
  onNavigate?: () => void
}) {
  return (
    <>
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white text-lg shrink-0">
            {companyMark}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">{companyName}</div>
            <div className="text-ink-400 text-xs truncate">{companySuffix}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-500 text-white'
                  : 'text-ink-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 mb-2">
          <div className="text-xs text-ink-400 truncate">{profileName}</div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-white transition w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>
    </>
  )
}
