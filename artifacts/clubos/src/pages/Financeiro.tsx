import { useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign, Pencil as PenIcon, Trash2, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { KPI } from "@/components/shared/KPI";
import { money, uid, todayISO, PALETTE } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const INPUT = "w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
const SELECT = "w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

interface FinanceiroProps {
  financial: any[];
  setFinancial: (updater: any[] | ((prev: any[]) => any[])) => void;
  orders: any[];
}

export function Financeiro({ financial, setFinancial, orders }: FinanceiroProps) {
  const empty = { type: "saida", desc: "", value: "", date: todayISO(), kind: "avulso" };
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [form, setForm] = useState(empty);

  const monthStart = todayISO().slice(0, 7);
  const netOrder = (o: any) => (Number(o.value) || 0) * (1 - (Number(o.discount) || 0) / 100);

  const entradasMes = orders.filter(o => o.createdAt?.slice(0, 7) === monthStart).reduce((s, o) => s + netOrder(o), 0);
  const saidasMes = financial.filter(f => f.type === "saida" && f.date?.slice(0, 7) === monthStart).reduce((s, f) => s + Number(f.value), 0);
  const aPagar = financial.filter(f => f.kind === "a_pagar" && !f.paid);
  const aReceber = financial.filter(f => f.kind === "a_receber" && !f.paid);
  const lancamentos = financial.filter(f => f.kind === "avulso");

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (f: any) => {
    setForm({ type: f.type, desc: f.desc, value: String(f.value), date: f.date, kind: f.kind });
    setModal(f);
  };

  const save = () => {
    if (!form.desc || !form.value) return;
    if (modal === "new") {
      setFinancial((prev: any[]) => [{ id: uid(), ...form, value: Number(form.value), paid: false }, ...prev]);
    } else {
      setFinancial((prev: any[]) => prev.map(f => f.id === modal.id ? { ...f, ...form, value: Number(form.value) } : f));
    }
    setModal(null);
  };

  const togglePaid = (id: string) => setFinancial((prev: any[]) => prev.map(f => f.id === id ? { ...f, paid: !f.paid } : f));
  const removeEntry = (id: string) => setFinancial((prev: any[]) => prev.filter(f => f.id !== id));

  const weekChart = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      days.push({
        day: label.charAt(0).toUpperCase() + label.slice(1),
        value: orders.filter(o => o.createdAt === iso).reduce((s, o) => s + netOrder(o), 0),
      });
    }
    return days;
  }, [orders]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Financeiro"
        subtitle="Fluxo de caixa, contas a pagar e a receber."
        action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Lançamento</PrimaryButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Entradas do mês" value={money(entradasMes)} icon={TrendingUp} />
        <KPI label="Saídas do mês" value={money(saidasMes)} icon={TrendingDown} />
        <KPI label="Lucro líquido" value={money(entradasMes - saidasMes)} icon={Wallet} />
        <KPI label="A receber" value={money(aReceber.reduce((s, f) => s + Number(f.value), 0))} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <h3 className="font-semibold text-sm text-foreground mb-4">Fluxo de caixa — últimos 7 dias</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9A9AA0", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#202022", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                formatter={(v: any) => [money(v), ""]}
              />
              <Bar dataKey="value" fill="#FF6A00" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-sm mb-3">Contas a pagar</h3>
            {aPagar.length ? (
              <div className="space-y-2">
                {aPagar.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate flex-1">{f.desc}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-red-400 font-medium whitespace-nowrap">{money(f.value)}</span>
                      <IconBtn icon={Check} title="Marcar pago" onClick={() => togglePaid(f.id)} />
                      <IconBtn icon={Trash2} title="Excluir" onClick={() => removeEntry(f.id)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">Nenhuma conta a pagar.</p>}
          </Card>

          <Card>
            <h3 className="font-semibold text-sm mb-3">Contas a receber</h3>
            {aReceber.length ? (
              <div className="space-y-2">
                {aReceber.map(f => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate flex-1">{f.desc}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-green-400 font-medium whitespace-nowrap">{money(f.value)}</span>
                      <IconBtn icon={Check} title="Marcar recebido" onClick={() => togglePaid(f.id)} />
                      <IconBtn icon={Trash2} title="Excluir" onClick={() => removeEntry(f.id)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">Nenhuma conta a receber.</p>}
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="font-semibold text-sm mb-4">Lançamentos avulsos</h3>
        {lancamentos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento cadastrado.</p>
        ) : (
          <div className="space-y-1">
            {lancamentos.map(f => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                <div className="flex-1">
                  <span className="text-foreground font-medium">{f.desc}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{f.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={f.type === "entrada" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                    {f.type === "entrada" ? "+" : "-"}{money(f.value)}
                  </span>
                  <IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(f)} />
                  <IconBtn icon={Trash2} title="Excluir" onClick={() => removeEntry(f.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {modal && (
        <Modal
          title={modal === "new" ? "Novo Lançamento" : "Editar Lançamento"}
          onClose={() => setModal(null)}
          footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar lançamento" : "Salvar alterações"}</PrimaryButton>}
        >
          {/* Tipo de lançamento */}
          <div className="flex gap-2 p-1 bg-muted/20 rounded-[11px]">
            {["entrada", "saida"].map(t => (
              <button
                key={t}
                onClick={() => setForm({ ...form, type: t })}
                className={`flex-1 h-9 rounded-lg font-medium text-sm transition-all ${
                  form.type === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "entrada" ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>

          <Field label="Descrição">
            <input
              className={INPUT}
              value={form.desc}
              onChange={e => setForm({ ...form, desc: e.target.value })}
              placeholder="Ex: Pagamento de aluguel"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor (R$)">
              <input
                type="number"
                className={INPUT}
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                placeholder="0,00"
              />
            </Field>
            <Field label="Data">
              <input
                type="date"
                className={INPUT}
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Tipo">
            <select
              className={SELECT}
              value={form.kind}
              onChange={e => setForm({ ...form, kind: e.target.value })}
            >
              <option value="avulso">Lançamento avulso (já efetivado)</option>
              <option value="a_pagar">Conta a pagar</option>
              <option value="a_receber">Conta a receber</option>
            </select>
          </Field>
        </Modal>
      )}
    </div>
  );
}
