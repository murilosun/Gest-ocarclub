import { useState, useMemo } from "react";
import {
  Plus, ChevronLeft, ChevronRight, Trash2, UserPlus,
  RefreshCw, ClipboardList, Clock,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, GhostButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { Badge } from "@/components/shared/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { STATUS_COLOR, APPT_STATUS, todayISO, uid, money } from "@/lib/utils";
import { motion } from "framer-motion";

type ViewMode = "day" | "week" | "month";

interface Appointment {
  id: string;
  clientName: string;
  clientId?: string;
  service: string;
  price?: number;
  discount?: number;
  time: string;
  date: string;
  status: string;
}

interface AgendaProps {
  appointments: Appointment[];
  setAppointments: (u: Appointment[] | ((p: Appointment[]) => Appointment[])) => void;
  clients: any[];
  setClients: (u: any[] | ((p: any[]) => any[])) => void;
  services: any[];
  orders: any[];
  setOrders: (u: any[] | ((p: any[]) => any[])) => void;
  employees: any[];
}

// ─── helpers ────────────────────────────────────────────────
const IC = "w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

/** Parse "2h", "1h30m", "90m", "90min", "2" → minutes */
function parseDurationMins(s: string): number {
  if (!s) return 60;
  const h = s.match(/(\d+)\s*h/i);
  const m = s.match(/(\d+)\s*m/i);
  const hours = h ? parseInt(h[1]) : 0;
  const mins  = m ? parseInt(m[1]) : 0;
  if (!hours && !mins) {
    const n = parseInt(s);
    return isNaN(n) ? 60 : n;
  }
  return hours * 60 + mins || 60;
}

const emptyForm = () => ({
  time: "08:00", clientName: "", clientId: "", service: "",
  price: "", discount: "", status: "Agendado",
  date: todayISO(), repeat: false, weeks: "4",
});
const emptyNC = () => ({ name: "", phone: "" });

// ─── main component ─────────────────────────────────────────
export function Agenda({
  appointments, setAppointments,
  clients, setClients,
  services,
  orders, setOrders,
  employees,
}: AgendaProps) {
  const [viewMode, setViewMode]   = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modal, setModal]         = useState<null | "new" | Appointment>(null);
  const [dragId, setDragId]       = useState<string | null>(null);
  const [form, setForm]           = useState(emptyForm());

  // inline new-client
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient]           = useState(emptyNC());

  // create-OS modal
  const [osAppt, setOsAppt]   = useState<Appointment | null>(null);
  const [osForm, setOsForm]   = useState({ vehicleId: "", tech: "", notes: "" });

  // ── open / close ───────────────────────────────────────────
  const openNew = () => {
    setForm(emptyForm()); setCreatingClient(false); setNewClient(emptyNC()); setModal("new");
  };
  const openEdit = (a: Appointment) => {
    setForm({
      time: a.time, clientName: a.clientName, clientId: a.clientId || "",
      service: a.service, price: String(a.price ?? ""), discount: String(a.discount ?? ""),
      status: a.status, date: a.date, repeat: false, weeks: "4",
    });
    setCreatingClient(false); setNewClient(emptyNC()); setModal(a);
  };

  // ── save agendamento ───────────────────────────────────────
  const save = () => {
    let clientName = form.clientName;
    let clientId   = form.clientId;

    if (creatingClient) {
      if (!newClient.name) return;
      const nc = { id: uid(), name: newClient.name, phone: newClient.phone, doc: "", whats: true, address: "", notes: "", lastVisit: todayISO(), vehicles: [] };
      setClients((p: any[]) => [nc, ...p]);
      clientName = nc.name; clientId = nc.id;
    }
    if (!clientName || !form.service) return;

    const base: Appointment = {
      id: uid(), clientName, clientId, service: form.service,
      price:    form.price    !== "" ? Number(form.price)    : undefined,
      discount: form.discount !== "" ? Number(form.discount) : undefined,
      time: form.time, date: form.date, status: form.status,
    };

    if (modal === "new") {
      if (form.repeat) {
        const count = Math.max(1, Math.min(52, Number(form.weeks) || 4));
        const batch: Appointment[] = Array.from({ length: count }, (_, i) => {
          const d = new Date(form.date); d.setDate(d.getDate() + i * 7);
          return { ...base, id: uid(), date: d.toISOString().slice(0, 10) };
        });
        setAppointments((p) => [...p, ...batch]);
      } else {
        setAppointments((p) => [...p, base]);
      }
    } else {
      setAppointments((p) => p.map((a) =>
        a.id === (modal as Appointment).id
          ? { ...a, clientName, clientId, service: form.service, price: base.price, discount: base.discount, time: form.time, date: form.date, status: form.status }
          : a
      ));
    }
    setModal(null);
  };

  const deleteAppt = (id: string) => setAppointments((p) => p.filter((a) => a.id !== id));

  const moveTo = (hour: number, date: string) => {
    if (!dragId) return;
    setAppointments((p) => p.map((a) => a.id === dragId ? { ...a, time: `${String(hour).padStart(2, "0")}:00`, date } : a));
    setDragId(null);
  };

  // ── save OS from appointment ───────────────────────────────
  const saveOS = () => {
    if (!osAppt) return;
    const client  = clients.find((c: any) => c.id === osAppt.clientId) || clients.find((c: any) => c.name === osAppt.clientName);
    const service = services.find((s: any) => s.name === osAppt.service);
    const vehicle = client?.vehicles.find((v: any) => v.id === osForm.vehicleId);
    const newOrder = {
      id: uid(),
      code: `OS-${1000 + orders.length + Math.floor(Math.random() * 90)}`,
      clientId:     client?.id || "",
      clientName:   osAppt.clientName,
      vehicleLabel: vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}` : "Sem veículo",
      serviceName:  osAppt.service,
      value:        osAppt.price ?? service?.price ?? 0,
      discount:     osAppt.discount ?? 0,
      tech:         osForm.tech,
      notes:        osForm.notes,
      status:       "Em espera",
      createdAt:    todayISO(),
    };
    setOrders((p) => [newOrder, ...p]);
    setOsAppt(null);
    setModal(null);
  };

  // ── navigation ─────────────────────────────────────────────
  const goToday = () => setCurrentDate(new Date());
  const goPrev  = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goNext  = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const viewTitle = useMemo(() => {
    if (viewMode === "month") return currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    if (viewMode === "week") {
      const start = new Date(currentDate); start.setDate(start.getDate() - start.getDay());
      const end = new Date(start); end.setDate(end.getDate() + 6);
      return `${start.getDate()} – ${end.getDate()} ${end.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }, [viewMode, currentDate]);

  const handleServiceChange = (name: string) => {
    const found = services.find((s: any) => s.name === name);
    setForm((f) => ({ ...f, service: name, price: found ? String(found.price) : f.price }));
  };

  const priceNum    = Number(form.price) || 0;
  const discountNum = Math.min(100, Math.max(0, Number(form.discount) || 0));
  const finalPrice  = priceNum * (1 - discountNum / 100);

  // client for OS modal
  const osClient = osAppt
    ? (clients.find((c: any) => c.id === osAppt.clientId) || clients.find((c: any) => c.name === osAppt.clientName))
    : null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Arraste eventos entre horários/dias para reagendar"
        action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Agendamento</PrimaryButton>}
      />

      {/* Controls */}
      <Card className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2 p-1 bg-muted/20 rounded-[11px]">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 h-9 rounded-lg font-medium text-sm transition-all ${
                viewMode === mode ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <IconBtn icon={ChevronLeft} onClick={goPrev} title="Anterior" />
          <GhostButton onClick={goToday}>Hoje</GhostButton>
          <IconBtn icon={ChevronRight} onClick={goNext} title="Próximo" />
        </div>
        <div className="font-semibold text-foreground capitalize">{viewTitle}</div>
      </Card>

      {viewMode === "day"   && <DayView   appointments={appointments} services={services} currentDate={currentDate} dragId={dragId} setDragId={setDragId} moveTo={moveTo} openEdit={openEdit} deleteAppt={deleteAppt} />}
      {viewMode === "week"  && <WeekView  appointments={appointments} currentDate={currentDate} dragId={dragId} setDragId={setDragId} moveTo={moveTo} openEdit={openEdit} deleteAppt={deleteAppt} />}
      {viewMode === "month" && <MonthView appointments={appointments} currentDate={currentDate} openEdit={openEdit} />}

      {/* ── Appointment Modal ──────────────────────────────── */}
      {modal && (
        <Modal
          title={modal === "new" ? "Novo Agendamento" : "Editar Agendamento"}
          onClose={() => setModal(null)}
          footer={
            <div className="flex gap-2 flex-wrap">
              <PrimaryButton onClick={save}>
                {modal === "new"
                  ? form.repeat ? `Criar ${Math.max(1, Number(form.weeks) || 4)} agendamentos` : "Salvar agendamento"
                  : "Salvar alterações"}
              </PrimaryButton>
              {modal !== "new" && (
                <GhostButton
                  icon={ClipboardList}
                  onClick={() => {
                    setOsAppt(modal as Appointment);
                    setOsForm({ vehicleId: "", tech: "", notes: "" });
                  }}
                >
                  Criar OS
                </GhostButton>
              )}
            </div>
          }
        >
          {/* Cliente */}
          <Field label="Cliente">
            {!creatingClient ? (
              <select
                value={form.clientId || ""}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setCreatingClient(true);
                    setForm((f) => ({ ...f, clientName: "", clientId: "" }));
                  } else {
                    const found = clients.find((c: any) => c.id === e.target.value);
                    setForm((f) => ({ ...f, clientId: found?.id || "", clientName: found?.name || "" }));
                  }
                }}
                className={IC}
              >
                <option value="">Selecione um cliente…</option>
                <option value="__new__">➕ Cadastrar novo cliente</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <div className="rounded-[12px] border border-primary/40 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <UserPlus size={13} /> Novo cliente
                  </span>
                  <button onClick={() => setCreatingClient(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Nome *</label>
                    <input value={newClient.name} onChange={(e) => setNewClient((n) => ({ ...n, name: e.target.value }))} placeholder="Nome completo" className={IC} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Telefone / WhatsApp</label>
                    <input value={newClient.phone} onChange={(e) => setNewClient((n) => ({ ...n, phone: e.target.value }))} placeholder="11999998888" className={IC} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">O cliente será cadastrado na aba Clientes ao salvar.</p>
              </div>
            )}
          </Field>

          {/* Serviço */}
          <Field label="Serviço">
            {services.length > 0 ? (
              <select value={form.service} onChange={(e) => handleServiceChange(e.target.value)} className={IC}>
                <option value="">Selecione um serviço…</option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.name}>
                    {s.name} — {money(s.price)}{s.time ? ` · ${s.time}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Ex: Polimento Técnico" className={IC} />
            )}
          </Field>

          {/* Valor + Desconto */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor (R$)">
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0,00" className={IC} />
            </Field>
            <Field label="Desconto (%)">
              <input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="0" className={IC} />
            </Field>
          </div>

          {priceNum > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-xs text-muted-foreground">Total do agendamento</span>
              <span className="text-base font-bold text-primary">{money(finalPrice)}</span>
            </div>
          )}

          {/* Data + Horário */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={IC} />
            </Field>
            <Field label="Horário">
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={IC} />
            </Field>
          </div>

          {/* Status */}
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={IC}>
              {APPT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>

          {/* Repetição semanal */}
          {modal === "new" && (
            <div className="rounded-[12px] border border-border bg-muted/10 p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setForm((f) => ({ ...f, repeat: !f.repeat }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.repeat ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.repeat ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-primary" /> Repetir toda semana
                  </div>
                  <div className="text-xs text-muted-foreground">Para clientes fixos — cria vários agendamentos de uma vez</div>
                </div>
              </label>
              {form.repeat && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Field label="Por quantas semanas">
                    <input type="number" min="1" max="52" value={form.weeks} onChange={(e) => setForm({ ...form, weeks: e.target.value })} className={IC} />
                  </Field>
                  <div className="flex items-end pb-1">
                    <p className="text-xs text-muted-foreground">
                      Serão criados <b className="text-foreground">{Math.max(1, Number(form.weeks) || 4)}</b> agendamentos a partir de{" "}
                      {form.date ? new Date(form.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) : "—"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ── Criar OS a partir do Agendamento ──────────────── */}
      {osAppt && (
        <Modal
          title="Criar OS a partir do Agendamento"
          onClose={() => setOsAppt(null)}
          footer={<PrimaryButton icon={ClipboardList} onClick={saveOS}>Criar Ordem de Serviço</PrimaryButton>}
        >
          {/* Resumo pré-preenchido */}
          <div className="p-4 rounded-[12px] bg-muted/20 border border-border space-y-2 mb-2">
            <div className="flex items-center gap-2">
              <Avatar name={osAppt.clientName} size={32} />
              <div>
                <div className="font-semibold text-sm text-foreground">{osAppt.clientName}</div>
                <div className="text-xs text-muted-foreground">{osAppt.service}</div>
              </div>
              {(osAppt.price ?? 0) > 0 && (
                <span className="ml-auto text-base font-bold text-primary">
                  {money((osAppt.price ?? 0) * (1 - (osAppt.discount ?? 0) / 100))}
                </span>
              )}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground pt-1">
              <span>📅 {new Date(osAppt.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
              <span>🕐 {osAppt.time}</span>
              {osAppt.discount ? <span>Desconto {osAppt.discount}%</span> : null}
            </div>
          </div>

          {/* Veículo */}
          {osClient && osClient.vehicles?.length > 0 && (
            <Field label="Veículo">
              <select value={osForm.vehicleId} onChange={(e) => setOsForm({ ...osForm, vehicleId: e.target.value })} className={IC}>
                <option value="">Sem veículo / selecione…</option>
                {osClient.vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.plate}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Funcionário */}
          <Field label="Funcionário responsável">
            <select value={osForm.tech} onChange={(e) => setOsForm({ ...osForm, tech: e.target.value })} className={IC}>
              <option value="">Selecione…</option>
              {employees.map((e: any) => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
          </Field>

          {/* Observações */}
          <Field label="Observações">
            <textarea rows={2} value={osForm.notes} onChange={(e) => setOsForm({ ...osForm, notes: e.target.value })} className="w-full px-3 py-2 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </Field>
        </Modal>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// DAY VIEW — posicionamento absoluto com duração real
// ────────────────────────────────────────────────────────────
const SLOT_H = 64; // px per hour
const DAY_START = 7;
const DAY_HOURS = 15; // 07:00 – 21:00

function DayView({ appointments, services, currentDate, dragId, setDragId, moveTo, openEdit, deleteAppt }: any) {
  const hours  = Array.from({ length: DAY_HOURS }, (_, i) => DAY_START + i);
  const dayISO = currentDate.toISOString().slice(0, 10);
  const dayAppts: any[] = appointments.filter((a: any) => a.date === dayISO);
  const totalH = DAY_HOURS * SLOT_H;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="relative" style={{ height: totalH }}>
        {/* Hour grid */}
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute flex w-full border-b border-border"
            style={{ top: i * SLOT_H, height: SLOT_H }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => moveTo(h, dayISO)}
          >
            <div className="w-20 flex-shrink-0 flex items-start justify-center pt-2 text-xs font-medium text-muted-foreground border-r border-border">
              {h}:00
            </div>
            <div className="flex-1" />
          </div>
        ))}

        {/* Appointments — absolute overlay */}
        <div className="absolute inset-0" style={{ left: 80 }}>
          {dayAppts.map((appt: any) => {
            const [hStr, mStr] = appt.time.split(":");
            const startH = parseInt(hStr);
            const startM = parseInt(mStr || "0");
            const svc    = services.find((s: any) => s.name === appt.service);
            const durMins = parseDurationMins(svc?.time || "");
            const top    = (startH - DAY_START + startM / 60) * SLOT_H;
            const height = Math.max(SLOT_H * 0.7, (durMins / 60) * SLOT_H - 4);
            const color  = STATUS_COLOR[appt.status] || "#9A9AA0";
            const showDur = durMins > 60;

            return (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                draggable
                onDragStart={() => setDragId(appt.id)}
                onClick={() => openEdit(appt)}
                className="absolute left-2 right-2 rounded-lg cursor-move hover:brightness-110 transition-all overflow-hidden flex flex-col p-2.5"
                style={{
                  top: top + 2,
                  height,
                  borderLeft: `3px solid ${color}`,
                  background: `${color}18`,
                }}
              >
                <div className="flex items-center justify-between gap-2 min-h-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={appt.clientName} size={26} />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground truncate">{appt.clientName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {appt.service}
                        {appt.price ? ` · ${money(appt.price * (1 - (appt.discount || 0) / 100))}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge text={appt.status} color={color} />
                    <IconBtn
                      icon={Trash2}
                      title="Remover"
                      onClick={(e: any) => { e.stopPropagation(); deleteAppt(appt.id); }}
                    />
                  </div>
                </div>
                {showDur && height > 80 && (
                  <div className="mt-auto pt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={10} />
                    {durMins >= 60
                      ? `${Math.floor(durMins / 60)}h${durMins % 60 ? `${durMins % 60}min` : ""}`
                      : `${durMins}min`}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// WEEK VIEW
// ────────────────────────────────────────────────────────────
function WeekView({ appointments, currentDate, dragId, setDragId, moveTo, openEdit, deleteAppt }: any) {
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const days  = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const hours = Array.from({ length: DAY_HOURS }, (_, i) => DAY_START + i);
  const today = todayISO();

  return (
    <Card className="p-0 overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="flex border-b border-border">
          <div className="w-16" />
          {days.map((d, i) => {
            const iso = d.toISOString().slice(0, 10);
            const isToday = iso === today;
            return (
              <div key={i} className={`flex-1 text-center py-3 border-l border-border ${isToday ? "bg-primary/5" : ""}`}>
                <div className="text-xs text-muted-foreground uppercase">{d.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
                <div className={`text-lg font-semibold mt-1 ${isToday ? "text-primary" : "text-foreground"}`}>{d.getDate()}</div>
              </div>
            );
          })}
        </div>
        <div className="divide-y divide-border">
          {hours.map((h) => (
            <div key={h} className="flex" style={{ minHeight: 48 }}>
              <div className="w-16 flex items-center justify-center text-xs text-muted-foreground border-r border-border">{h}:00</div>
              {days.map((d, i) => {
                const iso  = d.toISOString().slice(0, 10);
                const appt = appointments.find((a: any) => a.date === iso && parseInt(a.time) === h);
                return (
                  <div key={i} className="flex-1 border-l border-border p-1" onDragOver={(e) => e.preventDefault()} onDrop={() => moveTo(h, iso)}>
                    {appt && (
                      <div
                        draggable onDragStart={() => setDragId(appt.id)} onClick={() => openEdit(appt)}
                        className="p-1.5 rounded cursor-move text-xs truncate"
                        style={{ background: STATUS_COLOR[appt.status], color: "#fff" }}
                      >
                        {appt.clientName}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// MONTH VIEW
// ────────────────────────────────────────────────────────────
function MonthView({ appointments, currentDate, openEdit }: any) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const startDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayISO();

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(startDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-border border-b border-border">
        {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground uppercase py-3">{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 divide-x divide-border border-b border-border">
          {week.map((day, di) => {
            if (!day) return <div key={di} className="bg-muted/10 min-h-[100px]" />;
            const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayAppts = appointments.filter((a: any) => a.date === iso);
            const isToday = iso === today;
            return (
              <div key={di} className="p-2 min-h-[100px] flex flex-col">
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-2 ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{day}</div>
                <div className="space-y-1">
                  {dayAppts.slice(0, 3).map((a: any) => (
                    <div key={a.id} onClick={() => openEdit(a)} className="text-xs px-2 py-1 rounded cursor-pointer truncate" style={{ background: STATUS_COLOR[a.status], color: "#fff" }}>
                      {a.time.slice(0, 5)} {a.clientName}
                    </div>
                  ))}
                  {dayAppts.length > 3 && <div className="text-xs text-muted-foreground px-2">+{dayAppts.length - 3} mais</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </Card>
  );
}
