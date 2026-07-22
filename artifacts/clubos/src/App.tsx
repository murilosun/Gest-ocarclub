import { useState, useEffect, useRef } from "react";
import { Route, Switch } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";
import {
  useApiCollection,
  useClientsWithVehicles,
  ordersMap,
  appointmentsMap,
  servicesMap,
  productsMap,
  employeesMap,
  financialMap,
} from "@/lib/dataHooks";
import { DEFAULT_BRAND } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Agenda, type Appointment } from "@/pages/Agenda";
import { Clientes } from "@/pages/Clientes";
import { OrdensServico } from "@/pages/OrdensServico";
import { Financeiro } from "@/pages/Financeiro";
import { Estoque } from "@/pages/Estoque";
import { CRM } from "@/pages/CRM";
import { Servicos } from "@/pages/Servicos";
import { Equipe } from "@/pages/Equipe";
import { Relatorios } from "@/pages/Relatorios";
import { Configuracoes } from "@/pages/Configuracoes";
import { useLocation } from "wouter";

/* ── DB error toast ──────────────────────────────────────────── */
function DbErrorToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setMsg(detail?.message ?? "Erro ao salvar");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg(null), 6000);
    };
    window.addEventListener("clubos:dberror", handler);
    return () => window.removeEventListener("clubos:dberror", handler);
  }, []);

  if (!msg) return null;
  return (
    <div
      style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, maxWidth: 480, width: "calc(100% - 48px)" }}
      className="bg-destructive text-white text-sm px-4 py-3 rounded-xl shadow-xl flex items-start gap-3 cursor-pointer"
      onClick={() => setMsg(null)}
    >
      <span className="text-base mt-0.5">⚠️</span>
      <span className="flex-1">{msg}</span>
      <span className="opacity-60 text-xs mt-0.5 shrink-0">clique para fechar</span>
    </div>
  );
}

/* ── Authenticated shell — hooks only mount after login ──────── */
function AuthenticatedApp({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const [, setLocation] = useLocation();
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  const [orders,       setOrders,       ordersReady]       = useApiCollection("orders",       ordersMap.toJs,       ordersMap.toDb);
  const [appointments, setAppointments, appointmentsReady] = useApiCollection<Appointment>("appointments", appointmentsMap.toJs, appointmentsMap.toDb);
  const [services,     setServices,     servicesReady]     = useApiCollection("services",     servicesMap.toJs,     servicesMap.toDb);
  const [products,     setProducts,     productsReady]     = useApiCollection("products",     productsMap.toJs,     productsMap.toDb);
  const [employees,    setEmployees,    employeesReady]    = useApiCollection("employees",    employeesMap.toJs,    employeesMap.toDb);
  const [financial,    setFinancial,    financialReady]    = useApiCollection("financial",    financialMap.toJs,    financialMap.toDb);
  const [clients,      setClients,      clientsReady]      = useClientsWithVehicles();

  useEffect(() => {
    apiJson<{ name: string; suffix: string; mark: string; accent: string }>("/company")
      .then((data) => {
        if (data?.name) setBrand({ name: data.name, suffix: data.suffix, mark: data.mark, accent: data.accent });
      })
      .catch(() => {/* keep default */});
  }, []);

  const ready = ordersReady && appointmentsReady && servicesReady && productsReady && employeesReady && financialReady && clientsReady;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar brand={brand} user={auth.profile} onSignOut={() => auth.signOut()} />
      <main className="flex-1 overflow-y-auto">
        <Switch>
          <Route path="/">
            <Dashboard
              orders={orders}
              appointments={appointments}
              financial={financial}
              clients={clients}
              user={auth.profile}
              onNavigate={(path) => setLocation(path)}
            />
          </Route>
          <Route path="/agenda">
            <Agenda
              appointments={appointments}
              setAppointments={setAppointments}
              clients={clients}
              setClients={setClients}
              services={services}
              orders={orders}
              setOrders={setOrders}
              employees={employees}
            />
          </Route>
          <Route path="/clientes">
            <Clientes clients={clients} setClients={setClients} orders={orders} />
          </Route>
          <Route path="/os">
            <OrdensServico
              orders={orders}
              setOrders={setOrders}
              clients={clients}
              services={services}
              employees={employees}
              brand={brand}
            />
          </Route>
          <Route path="/financeiro">
            <Financeiro financial={financial} setFinancial={setFinancial} orders={orders} />
          </Route>
          <Route path="/estoque">
            <Estoque products={products} setProducts={setProducts} />
          </Route>
          <Route path="/crm">
            <CRM clients={clients} orders={orders} appointments={appointments} />
          </Route>
          <Route path="/servicos">
            <Servicos services={services} setServices={setServices} />
          </Route>
          <Route path="/equipe">
            <Equipe employees={employees} setEmployees={setEmployees} orders={orders} />
          </Route>
          <Route path="/relatorios">
            <Relatorios orders={orders} clients={clients} products={products} financial={financial} services={services} />
          </Route>
          <Route path="/configuracoes">
            <Configuracoes brand={brand} user={auth.profile} onSignOut={() => auth.signOut()} />
          </Route>
          <Route>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-foreground">404</h1>
              <p className="text-muted-foreground">Página não encontrada</p>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

/* ── Root ────────────────────────────────────────────────────── */
export default function App() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!auth.session) {
    return <Login brand={DEFAULT_BRAND} auth={auth} />;
  }

  return (
    <>
      <DbErrorToast />
      <AuthenticatedApp auth={auth} />
    </>
  );
}
