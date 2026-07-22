import { useMemo } from "react";
import { BarChart3, TrendingUp, Users, ClipboardList, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { GhostButton } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { KPI } from "@/components/shared/KPI";
import { money, todayISO, PALETTE } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

interface RelatoriosProps {
  orders: any[];
  clients: any[];
  products: any[];
  financial: any[];
  services: any[];
}

const COLORS = ["#FF6A00", "#5AC8FA", "#30D158", "#BF5AF2", "#FFD60A", "#FF453A"];

function exportCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function Relatorios({ orders, clients, products, financial, services }: RelatoriosProps) {
  const monthStart = todayISO().slice(0, 7);
  const netOrder = (o: any) => (Number(o.value) || 0) * (1 - (Number(o.discount) || 0) / 100);

  const ordersMonth = orders.filter(o => o.createdAt?.slice(0, 7) === monthStart);
  const revenueMonth = ordersMonth.reduce((s, o) => s + netOrder(o), 0);
  const recurring = clients.filter(c => orders.filter(o => o.clientId === c.id).length > 1).length;

  const byService = useMemo(() => {
    const map: Record<string, number> = {};
    ordersMonth.forEach(o => { map[o.serviceName] = (map[o.serviceName] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [ordersMonth]);

  const monthlyRevenue = useMemo(() => {
    const months: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("pt-BR", { month: "short" });
      const value = orders.filter(o => o.createdAt?.slice(0, 7) === key).reduce((s, o) => s + netOrder(o), 0);
      months.push({ month: label.charAt(0).toUpperCase() + label.slice(1), value });
    }
    return months;
  }, [orders]);

  const topClients = useMemo(() => {
    return clients
      .map(c => ({
        name: c.name,
        total: orders.filter(o => o.clientId === c.id).reduce((s, o) => s + netOrder(o), 0),
        count: orders.filter(o => o.clientId === c.id).length,
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [clients, orders]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Visão geral do desempenho do negócio."
        action={
          <GhostButton
            icon={Download}
            onClick={() => exportCsv("ordens.csv", [
              ["Código", "Cliente", "Serviço", "Valor", "Status", "Data"],
              ...orders.map(o => [o.code, o.clientName, o.serviceName, String(netOrder(o)), o.status, o.createdAt]),
            ])}
          >
            Exportar CSV
          </GhostButton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="OS no mês" value={String(ordersMonth.length)} icon={ClipboardList} />
        <KPI label="Receita no mês" value={money(revenueMonth)} icon={TrendingUp} />
        <KPI label="Clientes ativos" value={String(clients.length)} icon={Users} />
        <KPI label="Clientes recorrentes" value={String(recurring)} icon={BarChart3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold text-sm mb-4">Receita mensal — últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#9A9AA0", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#202022", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: any) => [money(v), ""]}
              />
              <Bar dataKey="value" fill={PALETTE.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold text-sm mb-4">Serviços mais realizados (mês)</h3>
          {byService.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Nenhum serviço este mês.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byService} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                  {byService.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#202022", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#9A9AA0" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-sm mb-4">Top 10 clientes por receita</h3>
        {topClients.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível.</p>
        ) : (
          <div className="space-y-2">
            {topClients.map((c, i) => {
              const pct = topClients[0].total > 0 ? (c.total / topClients[0].total) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      <span className="text-sm font-bold text-foreground">{money(c.total)}</span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PALETTE.accent }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">{c.count} OS</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
