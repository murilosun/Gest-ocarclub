import { useState, useMemo } from "react";
import {
  Plus, TrendingUp, TrendingDown, Wallet, AlertCircle,
  Pencil as PenIcon, Trash2, Check, ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { KPI } from "@/components/shared/KPI";
import { money, uid, todayISO } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const INPUT = "w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

interface FinanceiroProps {
  financial: any[];
  setFinancial: (updater: any[] | ((prev: any[]) => any[])) => void;
  orders: any[];
}

type PanelTab = "pagar" | "receber" | "pagas";

export function Financeiro({ financial, setFinancial, orders }: FinanceiroProps) {
  const empty = { type: "saida", desc: "", value: "", date: todayISO(), kind: "avulso" };
  const [modal, setModal]       = useState<null | "new" | any>(null);
  const [form, setForm]         = useState(empty);
  const [panelTab, setPanelTab] = useState<PanelTab>("pagar");

  const monthStart = todayISO().slice(0, 7);
  const netOrder   = (o: any) => (Number(o.value) || 0) * (1 - (Number(o.discount) || 0) / 100);

  // ── listas segmentadas ─────────────────────────────────────
  const aPagar     = financial.filter((f) => f.kind === "a_pagar"   && !f.paid);
  const aReceber   = financial.filter((f) => f.kind === "a_receber" && !f.paid);
  const contasPagas = financial.filter((f) => f.paid && (f.kind === "a_pagar" || f.kind === "a_receber"));
  const lancamentos = financial.filter((f) => f.kind === "avulso");

  // ── KPIs ───────────────────────────────────────────────────
  // Entradas = OS do mês + a_receber pago no mês
  const entradasOS     = orders
    .filter((o) => o.createdAt?.slice(0, 7) === monthStart)
    .reduce((s, o) => s + netOrder(o), 0);

  const entradasRecebidas = financial
    .filter((f) => f.kind === "a_receber" && f.paid && f.date?.slice(0, 7) === monthStart)
    .reduce((s, f) => s + Number(f.value), 0);

  const entradasMes = entradasOS + entradasRecebidas;

  // Saídas = avulso saida do mês + a_pagar pago no mês
  const saidasAvulso = financial
    .filter((f) => f.kind === "avulso" && f.type === "saida" && f.date?.slice(0, 7) === monthStart)
    .reduce((s, f) => s + Number(f.value), 0);

  const saidasPagas = financial
    .filter((f) => f.kind === "a_pagar" && f.paid && f.date?.slice(0, 7) === monthStart)
    .reduce((s, f) => s + Number(f.value), 0);

  const saidasMes = saidasAvulso + saidasPagas;

  // Pendentes
  const totalAPagar   = aPagar.reduce((s, f) => s + Number(f.value), 0);
  const totalAReceber = aReceber.reduce((s, f) => s + Number(f.value), 0);

  // ── gráfico semanal ────────────────────────────────────────
  const weekChart = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      const iso   = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      const entradas =
        orders.filter((o) => o.createdAt === iso).reduce((s, o) => s + netOrder(o), 0) +
        financial.filter((f) => f.kind === "a_receber" && f.paid && f.date === iso).reduce((s, f) => s + Number(f.value), 0);
      const saidas =
        financial.filter((f) => f.kind === "avulso" && f.type === "saida" && f.date === iso).reduce((s, f) => s + Number(f.value), 0) +
        financial.filter((f) => f.kind === "a_pagar" && f.paid && f.date === iso).reduce((s, f) => s + Number(f.value), 0);
      return {
        day: label.charAt(0).toUpperCase() + label.slice(1),
        Entradas: entradas,
        Saídas: saidas,
      };
    });
  }, [orders, financial]);

  // ── ações ─────────────────────────────────────────────────
  const openNew  = () => { setForm(empty); setModal("new"); };
  const openEdit = (f: any) => {
    setForm({ type: f.type, desc: f.desc, value: String(f.value), date: f.date, kind: f.kind });
    setModal(f);
  };

  const save = () => {
    if (!form.desc || !form.value) return;
    if (modal === "new") {
      setFinancial((prev: any[]) => [{ id: uid(), ...form, value: Number(form.value), paid: false }, ...prev]);
    } else {
      setFinancial((prev: any[]) => prev.map((f) => f.id === modal.id ? { ...f, ...form, value: Number(form.value) } : f));
    }
    setModal(null);
  };

  // ao marcar como pago, registra a data de hoje como data efetiva (se ainda não tiver)
  const togglePaid = (id: string) => {
    setFinancial((prev: any[]) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, paid: !f.paid, date: !f.paid ? todayISO() : f.date }
          : f
      )
    );
    // se estiver na aba pagas, volta para a aba correspondente ao desmarcar
  };

  const removeEntry = (id: string) => setFinancial((prev: any[]) => prev.filter((f) => f.id !== id));

  // ── tabs do painel ─────────────────────────────────────────
  const TABS: { key: PanelTab; label: string; count: number }[] = [
    { key: "pagar",   label: "A pagar",      count: aPagar.length },
    { key: "receber", label: "A receber",     count: aReceber.length },
    { key: "pagas",   label: "Contas pagas",  count: contasPagas.length },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Financeiro"
        subtitle="Fluxo de caixa, contas a pagar e a receber."
        action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Lançamento</PrimaryButton>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Entradas do mês"  value={money(entradasMes)}          icon={TrendingUp}   />
        <KPI label="Saídas do mês"    value={money(saidasMes)}            icon={TrendingDown}  />
        <KPI label="Lucro líquido"    value={money(entradasMes - saidasMes)} icon={Wallet}    />
        <KPI label="A pagar (pendente)" value={money(totalAPagar)}        icon={AlertCircle}  />
      </div>

      {/* Gráfico + Painel lateral */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Gráfico */}
        <Card className="xl:col-span-2">
          <h3 className="font-semibold text-sm text-foreground mb-4">
            Fluxo de caixa — últimos 7 dias
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekChart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9A9AA0", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#202022",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: any, name: string) => [money(v), name]}
              />
              <Bar dataKey="Entradas" fill="#FF6A00"   radius={[6, 6, 0, 0]} />
              <Bar dataKey="Saídas"   fill="#FF6A0055" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 justify-end">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-sm bg-[#FF6A00] inline-block" />Entradas
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-sm bg-[#FF6A0055] inline-block border border-[#FF6A00]/40" />Saídas
            </span>
          </div>
        </Card>

        {/* Painel lateral com abas */}
        <Card className="flex flex-col p-0 overflow-hidden">
          {/* Tab header */}
          <div className="flex border-b border-border">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPanelTab(tab.key)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors relative ${
                  panelTab === tab.key
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    panelTab === tab.key ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"
                  }`}>
                    {tab.count}
                  </span>
                )}
                {panelTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-4 flex-1 overflow-y-auto space-y-2">

            {/* ── A pagar ── */}
            {panelTab === "pagar" && (
              <>
                {aPagar.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma conta a pagar.</p>
                ) : aPagar.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{f.desc}</div>
                      <div className="text-xs text-muted-foreground">{f.date}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-red-400 font-semibold text-sm whitespace-nowrap">{money(f.value)}</span>
                      <IconBtn icon={Check}  title="Marcar como pago" onClick={() => { togglePaid(f.id); setPanelTab("pagas"); }} />
                      <IconBtn icon={Trash2} title="Excluir"           onClick={() => removeEntry(f.id)} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── A receber ── */}
            {panelTab === "receber" && (
              <>
                {aReceber.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma conta a receber.</p>
                ) : aReceber.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{f.desc}</div>
                      <div className="text-xs text-muted-foreground">{f.date}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-green-400 font-semibold text-sm whitespace-nowrap">{money(f.value)}</span>
                      <IconBtn icon={Check}  title="Marcar como recebido" onClick={() => { togglePaid(f.id); setPanelTab("pagas"); }} />
                      <IconBtn icon={Trash2} title="Excluir"              onClick={() => removeEntry(f.id)} />
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* ── Contas pagas ── */}
            {panelTab === "pagas" && (
              <>
                {contasPagas.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Nenhuma conta liquidada ainda.</p>
                ) : contasPagas
                    .slice()
                    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                    .map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {f.kind === "a_receber" ? (
                        <ArrowUpRight size={14} className="text-green-400 flex-shrink-0" />
                      ) : (
                        <ArrowDownLeft size={14} className="text-red-400 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm text-foreground truncate">{f.desc}</div>
                        <div className="text-xs text-muted-foreground">
                          {f.kind === "a_receber" ? "Recebido" : "Pago"} em {f.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`font-semibold text-sm whitespace-nowrap ${f.kind === "a_receber" ? "text-green-400" : "text-red-400"}`}>
                        {f.kind === "a_receber" ? "+" : "-"}{money(f.value)}
                      </span>
                      {/* Desfazer */}
                      <button
                        title="Desfazer pagamento"
                        onClick={() => togglePaid(f.id)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                      >
                        ↩
                      </button>
                      <IconBtn icon={Trash2} title="Excluir" onClick={() => removeEntry(f.id)} />
                    </div>
                  </div>
                ))}
                {/* Totalizador */}
                {contasPagas.length > 0 && (() => {
                  const totalIn  = contasPagas.filter((f) => f.kind === "a_receber").reduce((s, f) => s + Number(f.value), 0);
                  const totalOut = contasPagas.filter((f) => f.kind === "a_pagar").reduce((s, f) => s + Number(f.value), 0);
                  return (
                    <div className="pt-3 mt-2 border-t border-border space-y-1">
                      {totalIn > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total recebido</span>
                          <span className="text-green-400 font-semibold">{money(totalIn)}</span>
                        </div>
                      )}
                      {totalOut > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total pago</span>
                          <span className="text-red-400 font-semibold">{money(totalOut)}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Lançamentos avulsos */}
      <Card>
        <h3 className="font-semibold text-sm mb-4">Lançamentos avulsos</h3>
        {lancamentos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum lançamento cadastrado.</p>
        ) : (
          <div className="space-y-1">
            {lancamentos.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-foreground font-medium">{f.desc}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{f.date}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={f.type === "entrada" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                    {f.type === "entrada" ? "+" : "-"}{money(f.value)}
                  </span>
                  <IconBtn icon={PenIcon} title="Editar"  onClick={() => openEdit(f)} />
                  <IconBtn icon={Trash2}  title="Excluir" onClick={() => removeEntry(f.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal Novo / Editar */}
      {modal && (
        <Modal
          title={modal === "new" ? "Novo Lançamento" : "Editar Lançamento"}
          onClose={() => setModal(null)}
          footer={
            <PrimaryButton onClick={save}>
              {modal === "new" ? "Salvar lançamento" : "Salvar alterações"}
            </PrimaryButton>
          }
        >
          {/* Tipo entrada/saída só faz sentido para avulso */}
          {form.kind === "avulso" && (
            <div className="flex gap-2 p-1 bg-muted/20 rounded-[11px]">
              {["entrada", "saida"].map((t) => (
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
          )}

          <Field label="Descrição">
            <input
              className={INPUT}
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder="Ex: Pagamento de aluguel"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor (R$)">
              <input
                type="number"
                className={INPUT}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="0,00"
              />
            </Field>
            <Field label="Data">
              <input
                type="date"
                className={INPUT}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Tipo">
            <select
              className={INPUT}
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value })}
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
