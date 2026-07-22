import { Link, useLocation } from "wouter";
import {
  LayoutGrid,
  Calendar,
  Users,
  ClipboardList,
  Wallet,
  Package,
  MessageCircle,
  Wrench,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { useState } from "react";

const NAV = [
  { key: "dashboard", label: "Início", icon: LayoutGrid, path: "/" },
  { key: "agenda", label: "Agenda", icon: Calendar, path: "/agenda" },
  { key: "clientes", label: "Clientes", icon: Users, path: "/clientes" },
  { key: "os", label: "Ordens de Serviço", icon: ClipboardList, path: "/os" },
  { key: "financeiro", label: "Financeiro", icon: Wallet, path: "/financeiro" },
  { key: "estoque", label: "Estoque", icon: Package, path: "/estoque" },
  { key: "crm", label: "CRM", icon: MessageCircle, path: "/crm" },
  { key: "servicos", label: "Serviços", icon: Wrench, path: "/servicos" },
  { key: "equipe", label: "Equipe", icon: UserCog, path: "/equipe" },
  { key: "relatorios", label: "Relatórios", icon: BarChart3, path: "/relatorios" },
  { key: "config", label: "Configurações", icon: Settings, path: "/configuracoes" },
];

interface SidebarProps {
  brand: { name: string; suffix: string; mark: string; accent: string };
  user: { name: string; email: string } | null;
  onSignOut: () => void;
}

export function Sidebar({ brand, user, onSignOut }: SidebarProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg"
            style={{ background: brand.accent, color: "#fff" }}
          >
            {brand.mark}
          </div>
          <div>
            <div className="text-base font-bold text-sidebar-foreground leading-tight">
              {brand.name}
            </div>
            <div className="text-xs text-muted-foreground">{brand.suffix}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = location === item.path;
          return (
            <Link
              key={item.key}
              href={item.path}
              className={`flex items-center gap-3 px-3 h-10 rounded-lg mb-1 font-medium text-sm transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={18} strokeWidth={2.2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={user?.name || "User"} size={38} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-sidebar-foreground truncate">
              {user?.name || "Usuário"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </div>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 w-full px-3 h-9 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-card border border-border text-foreground"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar border-r border-sidebar-border flex-col h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-64 h-full bg-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
}
