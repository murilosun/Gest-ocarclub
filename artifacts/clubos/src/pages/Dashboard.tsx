import { useMemo } from "react";
import { Plus, DollarSign, TrendingUp, BarChart3, Star, Wallet, Car } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { KPI } from "@/components/shared/KPI";
import { Badge } from "@/components/shared/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { money, STATUS_COLOR, todayISO } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

interface DashboardProps {
  orders: any[];
  appointments: any[];
  financial: any[];
  clients: any[];
  user: any;
  onNavigate: (page: string) => void;
}

export function Dashboard({ orders, appointments, financial, clients, user, onNavigate }: DashboardProps) {
  const today = todayISO();
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const monthStart = today.slice(0, 7);

  const netOrder = (o: any) => (Number(o.value) || 0) * (1 - (Number(o.discount) || 0) / 100);

  const revenueToday = orders.filter((o) => o.createdAt === today).reduce((s, o) => s + netOrder(o), 0);
  const revenueWeek = orders
    .filter((o) => o.createdAt >= weekAgo.toISOString().slice(0, 10))
    .reduce((s, o) => s + netOrder(o), 0);
  const ordersMonth = orders.filter((o) => o.createdAt.slice(0, 7) === monthStart);
  const revenueMonth = ordersMonth.reduce((s, o) => s + netOrder(o), 0);
  const ticketMedio = ordersMonth.length ? revenueMonth / ordersMonth.length : 0;
  const saidasMonth = financial
    .filter((f) => f.type === "saida" && f.date.slice(0, 7) === monthStart)
    .reduce((s, f) => s + Number(f.value), 0);
  const lucro = revenueMonth - saidasMonth;
  const carrosHoje = orders.filter((o) => o.createdAt === today).length;

  const weekChart = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      const value = orders.filter((o) => o.createdAt === iso).reduce((s, o) => s + netOrder(o), 0);
      days.push({ day: label.charAt(0).toUpperCase() + label.slice(1), value });
    }
    return days;
  }, [orders]);

  const topServices = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.serviceName] = (map[o.serviceName] || 0) + netOrder(o);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [orders]);

  const nextAppts = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const entradasHoje = revenueToday;
  const saidasHoje = financial
    .filter((f) => f.date === today && f.type === "saida")
    .reduce((s, f) => s + Number(f.value), 0);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Bom dia, ${user?.name || ""}`}
        subtitle="Aqui está o resumo real da sua unidade, atualizado agora."
        action={
          <PrimaryButton icon={Plus} onClick={() => onNavigate("/os")}>
            Nova Ordem de Serviço
          </PrimaryButton>
        }
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <motion.div variants={item}>
          <KPI label="Faturamento do dia" value={money(revenueToday)} icon={DollarSign} />
        </motion.div>
        <motion.div variants={item}>
          <KPI label="Faturamento da semana" value={money(revenueWeek)} icon={TrendingUp} />
        </motion.div>
        <motion.div variants={item}>
          <KPI label="Faturamento do mês" value={money(revenueMonth)} icon={BarChart3} />
        </motion.div>
        <motion.div variants={item}>
          <KPI label="Ticket médio" value={money(ticketMedio)} icon={Star} />
        </motion.div>
        <motion.div variants={item}>
          <KPI label="Lucro do mês" value={money(lucro)} icon={Wallet} positive={lucro >= 0} />
        </motion.div>
        <motion.div variants={item}>
          <KPI label="Carros atendidos hoje" value={String(carrosHoje)} icon={Car} />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Crescimento da semana</h3>
              <span className="text-sm text-muted-foreground">Faturamento diário</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weekChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#9A9AA0", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#202022",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(v: any) => [money(v), "Faturamento"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground">Caixa do dia</h3>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Entradas</span>
              <b className="text-sm text-green-500">{money(entradasHoje)}</b>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Saídas</span>
              <b className="text-sm text-red-500">{money(-saidasHoje)}</b>
            </div>
            <div className="border-t border-border my-3" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold text-foreground">Saldo</span>
              <b className="text-base text-foreground">{money(entradasHoje - saidasHoje)}</b>
            </div>

            <div className="mt-6 mb-3">
              <h3 className="text-base font-semibold text-foreground">Serviços mais vendidos</h3>
            </div>
            {topServices.length ? (
              topServices.map(([name, val]) => (
                <div key={name} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{name}</span>
                  <b className="text-sm text-foreground">{money(val)}</b>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Sem vendas registradas ainda.</span>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Próximos agendamentos</h3>
            <span className="text-sm text-muted-foreground">Hoje</span>
          </div>
          <div className="space-y-3">
            {nextAppts.length ? (
              nextAppts.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-semibold text-primary w-12">{a.time}</span>
                  <Avatar name={a.clientName} size={30} />
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-foreground">{a.clientName}</div>
                    <div className="text-xs text-muted-foreground">{a.service}</div>
                  </div>
                  <Badge text={a.status} color={STATUS_COLOR[a.status] || "#9A9AA0"} />
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</span>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
