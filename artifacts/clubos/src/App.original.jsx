import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutGrid, Calendar, Users, Car, ClipboardList, Wallet, Package,
  MessageCircle, Wrench, UserCog, BarChart3, Settings, Search, Bell,
  Plus, ChevronRight, ChevronLeft, X, Check, Clock, Trash2,
  TrendingUp, TrendingDown, DollarSign, Sparkles, AlertTriangle,
  Phone, MapPin, Star, LogOut, Menu, Loader2, ArrowRight, Pencil as PenIcon
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid
} from "recharts";

/* =========================================================================
   IDENTIDADE — troque aqui para rebatizar o sistema inteiro.
   ========================================================================= */
const DEFAULT_BRAND = {
  name: "ClubOS",
  suffix: "by Car Club",
  mark: "C",
  accent: "#FF6A00",
};
const PALETTE = { bg: "#111111", surface: "#1A1A1C", surfaceAlt: "#202022", border: "rgba(255,255,255,0.08)", white: "#FFFFFF", textDim: "#9A9AA0", success: "#30D158", warning: "#FFD60A", danger: "#FF453A" };

const STATUS_FLOW = ["Recebido", "Lavagem", "Polimento", "Vitrificação", "Higienização", "Finalizado", "Entregue"];
const APPT_STATUS = ["Agendado", "Confirmado", "Em andamento", "Finalizado", "Cancelado"];
const STATUS_COLOR = {
  "Agendado": "#9A9AA0", "Confirmado": "#30D158", "Em andamento": "#FF6A00", "Finalizado": "#3B82F6",
  "Cancelado": "#FF453A", "Entregue": "#30D158", "Recebido": "#9A9AA0", "Lavagem": "#5AC8FA",
  "Polimento": "#FF6A00", "Vitrificação": "#BF5AF2", "Higienização": "#FFD60A",
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const money = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const onlyDigits = (s) => (s || "").replace(/\D/g, "");
const waLink = (phone, text) => `https://wa.me/55${onlyDigits(phone)}?text=${encodeURIComponent(text)}`;

import { supabase, COMPANY_ID } from "./supabaseClient";
import { useAuth } from "./lib/auth";
import { useSupabaseCollection, useClientsWithVehicles, ordersMap, appointmentsMap, servicesMap, productsMap, employeesMap, financialMap } from "./lib/dataHooks";

/* ---------------------------------------------------------------------- */
/* PRIMITIVOS DE UI                                                        */
/* ---------------------------------------------------------------------- */
function Card({ children, style, className = "" }) { return <div className={`co-card ${className}`} style={style}>{children}</div>; }

function Badge({ text, color }) {
  return <span className="co-badge" style={{ color, background: `${color}1F`, borderColor: `${color}40` }}><span className="co-dot" style={{ background: color }} />{text}</span>;
}

function KPI({ label, value, delta, icon: Icon, positive = true }) {
  return (
    <Card className="kpi">
      <div className="kpi-top"><span className="kpi-label">{label}</span><div className="kpi-icon"><Icon size={15} strokeWidth={2} /></div></div>
      <div className="kpi-value">{value}</div>
      {delta && <div className={`kpi-delta ${positive ? "up" : "down"}`}>{positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {delta}</div>}
    </Card>
  );
}

function Avatar({ name, size = 34 }) {
  const initials = (name || "?").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return <div className="co-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</div>;
}

function PrimaryButton({ children, icon: Icon, onClick, style, type = "button" }) {
  return <button type={type} className="co-btn-primary" onClick={onClick} style={style}>{Icon && <Icon size={15} strokeWidth={2.4} />}{children}</button>;
}
function GhostButton({ children, icon: Icon, onClick, danger, style }) {
  return <button type="button" className="co-btn-ghost" style={{ ...(danger ? { color: PALETTE.danger, borderColor: `${PALETTE.danger}55` } : null), ...style }} onClick={onClick}>{Icon && <Icon size={15} strokeWidth={2.2} />}{children}</button>;
}
function IconBtn({ icon: Icon, onClick, title }) { return <button type="button" title={title} className="co-icon-btn" onClick={onClick}><Icon size={16} /></button>; }

function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }

function Modal({ title, onClose, children, width = 480, footer }) {
  return (
    <div className="co-modal-veil" onClick={onClose}>
      <div className="co-modal" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <div className="co-modal-head"><h3>{title}</h3><IconBtn icon={X} onClick={onClose} /></div>
        <div className="co-modal-body">{children}</div>
        {footer && <div className="co-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }) {
  return <div className="page-header"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function Toast({ text }) { return text ? <div className="co-toast"><Check size={14} />{text}</div> : null; }

/* ---------------------------------------------------------------------- */
/* DASHBOARD                                                               */
/* ---------------------------------------------------------------------- */
function Dashboard({ orders, appointments, financial, clients, user, setPage }) {
  const today = todayISO();
  const now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 6);
  const monthStart = today.slice(0, 7);

  const netOrder = (o) => (Number(o.value) || 0) * (1 - (Number(o.discount) || 0) / 100);

  const revenueToday = orders.filter(o => o.createdAt === today).reduce((s, o) => s + netOrder(o), 0);
  const revenueWeek = orders.filter(o => o.createdAt >= weekAgo.toISOString().slice(0, 10)).reduce((s, o) => s + netOrder(o), 0);
  const ordersMonth = orders.filter(o => o.createdAt.slice(0, 7) === monthStart);
  const revenueMonth = ordersMonth.reduce((s, o) => s + netOrder(o), 0);
  const ticketMedio = ordersMonth.length ? revenueMonth / ordersMonth.length : 0;
  const saidasMonth = financial.filter(f => f.type === "saida" && f.date.slice(0, 7) === monthStart).reduce((s, f) => s + Number(f.value), 0);
  const lucro = revenueMonth - saidasMonth;
  const carrosHoje = orders.filter(o => o.createdAt === today).length;

  const weekChart = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      const value = orders.filter(o => o.createdAt === iso).reduce((s, o) => s + netOrder(o), 0);
      days.push({ day: label.charAt(0).toUpperCase() + label.slice(1), value });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const topServices = useMemo(() => {
    const map = {};
    orders.forEach(o => { map[o.serviceName] = (map[o.serviceName] || 0) + netOrder(o); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [orders]);

  const nextAppts = appointments.filter(a => a.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const entradasHoje = revenueToday;
  const saidasHoje = financial.filter(f => f.date === today && f.type === "saida").reduce((s, f) => s + Number(f.value), 0);

  return (
    <div className="page">
      <PageHeader title={`Bom dia, ${user?.name || ""} 👋`} subtitle="Aqui está o resumo real da sua unidade, atualizado agora." action={<PrimaryButton icon={Plus} onClick={() => setPage("os")}>Nova Ordem de Serviço</PrimaryButton>} />
      <div className="kpi-grid">
        <KPI label="Faturamento do dia" value={money(revenueToday)} icon={DollarSign} />
        <KPI label="Faturamento da semana" value={money(revenueWeek)} icon={TrendingUp} />
        <KPI label="Faturamento do mês" value={money(revenueMonth)} icon={BarChart3} />
        <KPI label="Ticket médio" value={money(ticketMedio)} icon={Star} />
        <KPI label="Lucro do mês" value={money(lucro)} icon={Wallet} positive={lucro >= 0} />
        <KPI label="Carros atendidos hoje" value={String(carrosHoje)} icon={Car} />
      </div>
      <div className="dash-row">
        <Card className="chart-card">
          <div className="card-head"><h3>Crescimento da semana</h3><span className="muted">Faturamento diário</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9A9AA0", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#202022", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#fff" }} formatter={(v) => [money(v), "Faturamento"]} />
              <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="side-card">
          <div className="card-head"><h3>Caixa do dia</h3></div>
          <div className="cash-row"><span>Entradas</span><b className="pos">{money(entradasHoje)}</b></div>
          <div className="cash-row"><span>Saídas</span><b className="neg">{money(-saidasHoje)}</b></div>
          <div className="cash-divider" />
          <div className="cash-row total"><span>Saldo</span><b>{money(entradasHoje - saidasHoje)}</b></div>
          <div className="card-head" style={{ marginTop: 18 }}><h3>Serviços mais vendidos</h3></div>
          {topServices.length ? topServices.map(([name, val]) => <div key={name} className="mini-row"><span>{name}</span><b>{money(val)}</b></div>) : <span className="muted" style={{ fontSize: 12 }}>Sem vendas registradas ainda.</span>}
        </Card>
      </div>
      <Card>
        <div className="card-head"><h3>Próximos agendamentos</h3><span className="muted">Hoje</span></div>
        <div className="appt-list">
          {nextAppts.length ? nextAppts.map(a => (
            <div key={a.id} className="appt-item">
              <span className="appt-time">{a.time}</span><Avatar name={a.clientName} size={30} />
              <div className="appt-info"><b>{a.clientName}</b><span className="muted">{a.service}</span></div>
              <Badge text={a.status} color={STATUS_COLOR[a.status] || "#9A9AA0"} />
            </div>
          )) : <span className="muted" style={{ fontSize: 12 }}>Nenhum agendamento para hoje.</span>}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* AGENDA                                                                   */
/* ---------------------------------------------------------------------- */
function Agenda({ appointments, setAppointments, clients }) {
  const empty = { time: "08:00", clientName: "", service: "", status: "Agendado" };
  const [modal, setModal] = useState(null); // null | "new" | appointment being edited
  const [dragId, setDragId] = useState(null);
  const [form, setForm] = useState(empty);
  const today = todayISO();
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i);
  const dayAppts = appointments.filter(a => a.date === today);
  const byHour = {};
  dayAppts.forEach(a => { byHour[parseInt(a.time)] = a; });

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (a) => { setForm({ time: a.time, clientName: a.clientName, service: a.service, status: a.status }); setModal(a); };

  const save = () => {
    if (!form.clientName || !form.service) return;
    if (modal === "new") setAppointments(prev => [...prev, { id: uid(), date: today, ...form }]);
    else setAppointments(prev => prev.map(a => a.id === modal.id ? { ...a, ...form } : a));
    setModal(null);
  };
  const moveTo = (hour) => {
    if (!dragId) return;
    setAppointments(prev => prev.map(a => a.id === dragId ? { ...a, time: `${String(hour).padStart(2, "0")}:00` } : a));
    setDragId(null);
  };

  return (
    <div className="page">
      <PageHeader title="Agenda" subtitle="Arraste um agendamento para outro horário, ou clique para editar." action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Agendamento</PrimaryButton>} />
      <Card>
        <div className="day-grid">
          {hours.map(h => {
            const appt = byHour[h];
            return (
              <div key={h} className="day-slot" onDragOver={(e) => e.preventDefault()} onDrop={() => moveTo(h)}>
                <span className="slot-hour">{h}:00</span>
                <div className="slot-track">
                  {appt ? (
                    <div className="slot-event" style={{ borderColor: STATUS_COLOR[appt.status] }} draggable onDragStart={() => setDragId(appt.id)} onClick={() => openEdit(appt)}>
                      <div className="slot-event-top">
                        <b>{appt.clientName}</b>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Badge text={appt.status} color={STATUS_COLOR[appt.status]} />
                          <IconBtn icon={Trash2} title="Remover" onClick={(e) => { e.stopPropagation(); setAppointments(prev => prev.filter(a => a.id !== appt.id)); }} />
                        </div>
                      </div>
                      <span className="muted">{appt.service}</span>
                    </div>
                  ) : <div className="slot-empty" />}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {modal && (
        <Modal title={modal === "new" ? "Novo Agendamento" : "Editar Agendamento"} onClose={() => setModal(null)} footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar agendamento" : "Salvar alterações"}</PrimaryButton>}>
          <Field label="Cliente">
            <select value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })}>
              <option value="">Selecione…</option>
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Serviço"><input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} placeholder="Ex: Polimento Técnico" /></Field>
          <div className="form-grid-2">
            <Field label="Horário"><input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></Field>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {APPT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* CLIENTES                                                                 */
/* ---------------------------------------------------------------------- */
function Clientes({ clients, setClients, orders }) {
  const [selectedId, setSelectedId] = useState(clients[0]?.id || null);
  const [query, setQuery] = useState("");
  const [clientModal, setClientModal] = useState(null); // null | "new" | client object being edited
  const [vehicleModal, setVehicleModal] = useState(null); // null | "new" | vehicle object being edited
  const emptyClient = { name: "", doc: "", phone: "", whats: true, address: "", notes: "" };
  const emptyVehicle = { brand: "", model: "", year: "", color: "", plate: "", km: "", notes: "" };
  const [cForm, setCForm] = useState(emptyClient);
  const [vForm, setVForm] = useState(emptyVehicle);

  const selected = clients.find(c => c.id === selectedId) || clients[0];
  const filtered = clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  const totalSpent = (client) => orders.filter(o => o.clientId === client.id).reduce((s, o) => s + (Number(o.value) || 0) * (1 - (Number(o.discount) || 0) / 100), 0);

  const openNewClient = () => { setCForm(emptyClient); setClientModal("new"); };
  const openEditClient = (c) => { setCForm({ name: c.name, doc: c.doc, phone: c.phone, whats: c.whats, address: c.address, notes: c.notes || "" }); setClientModal(c); };
  const saveClient = () => {
    if (!cForm.name) return;
    if (clientModal === "new") {
      const nc = { id: uid(), ...cForm, lastVisit: todayISO(), vehicles: [] };
      setClients(prev => [nc, ...prev]);
      setSelectedId(nc.id);
    } else {
      setClients(prev => prev.map(c => c.id === clientModal.id ? { ...c, ...cForm } : c));
    }
    setClientModal(null);
  };

  const openNewVehicle = () => { setVForm(emptyVehicle); setVehicleModal("new"); };
  const openEditVehicle = (v) => { setVForm({ brand: v.brand, model: v.model, year: v.year, color: v.color, plate: v.plate, km: v.km, notes: v.notes || "" }); setVehicleModal(v); };
  const saveVehicle = () => {
    if (!vForm.brand || !vForm.plate) return;
    const clean = { ...vForm, year: Number(vForm.year) || "", km: Number(vForm.km) || 0 };
    if (vehicleModal === "new") {
      setClients(prev => prev.map(c => c.id === selected.id ? { ...c, vehicles: [...c.vehicles, { id: uid(), ...clean }] } : c));
    } else {
      setClients(prev => prev.map(c => c.id === selected.id ? { ...c, vehicles: c.vehicles.map(v => v.id === vehicleModal.id ? { ...v, ...clean } : v) } : c));
    }
    setVehicleModal(null);
  };
  const deleteVehicle = (vid) => setClients(prev => prev.map(c => c.id === selected.id ? { ...c, vehicles: c.vehicles.filter(v => v.id !== vid) } : c));

  if (!selected) return (
    <div className="page">
      <PageHeader title="Clientes" subtitle="Nenhum cliente cadastrado ainda." action={<PrimaryButton icon={Plus} onClick={openNewClient}>Novo Cliente</PrimaryButton>} />
      {clientModal && <ClientForm cForm={cForm} setCForm={setCForm} onClose={() => setClientModal(null)} onSave={saveClient} isEdit={clientModal !== "new"} />}
    </div>
  );

  return (
    <div className="page">
      <PageHeader title="Clientes" subtitle={`${clients.length} clientes cadastrados`} action={<PrimaryButton icon={Plus} onClick={openNewClient}>Novo Cliente</PrimaryButton>} />
      <div className="split">
        <Card className="list-col">
          <div className="search-box"><Search size={15} /><input placeholder="Buscar cliente…" value={query} onChange={e => setQuery(e.target.value)} /></div>
          {filtered.map(c => (
            <button key={c.id} className={`client-row ${selected.id === c.id ? "active" : ""}`} onClick={() => setSelectedId(c.id)}>
              <Avatar name={c.name} />
              <div className="client-row-info"><b>{c.name}</b><span className="muted">{c.vehicles[0] ? `${c.vehicles[0].brand} ${c.vehicles[0].model} · ${c.vehicles[0].plate}` : "Sem veículo"}</span></div>
              <ChevronRight size={15} className="muted" />
            </button>
          ))}
        </Card>
        <Card className="detail-col">
          <div className="detail-head">
            <Avatar name={selected.name} size={54} />
            <div><h2>{selected.name}</h2><span className="muted">{selected.doc || "Sem documento"}</span></div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selected.phone && <GhostButton icon={MessageCircle} onClick={() => window.open(waLink(selected.phone, `Olá ${selected.name.split(" ")[0]}, tudo bem? Aqui é da equipe.`), "_blank")}>WhatsApp</GhostButton>}
              <GhostButton icon={PenIcon} onClick={() => openEditClient(selected)}>Editar</GhostButton>
              <GhostButton icon={Trash2} danger onClick={() => { setClients(prev => prev.filter(c => c.id !== selected.id)); setSelectedId(null); }}>Excluir</GhostButton>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-item"><Phone size={14} /><span>{selected.phone || "—"}</span></div>
            <div className="detail-item"><MapPin size={14} /><span>{selected.address || "—"}</span></div>
            <div className="detail-item"><DollarSign size={14} /><span>Total gasto: <b>{money(totalSpent(selected))}</b></span></div>
            <div className="detail-item"><Clock size={14} /><span>Última visita: {selected.lastVisit ? new Date(selected.lastVisit).toLocaleDateString("pt-BR") : "—"}</span></div>
          </div>
          <div className="card-head" style={{ marginTop: 6 }}><h3>Veículos</h3><GhostButton icon={Plus} onClick={openNewVehicle}>Adicionar</GhostButton></div>
          {selected.vehicles.length ? selected.vehicles.map(v => (
            <div key={v.id} className="vehicle-card">
              <div className="vehicle-icon"><Car size={18} /></div>
              <div className="vehicle-info"><b>{v.brand} {v.model} · {v.year}</b><span className="muted">{v.color} · Placa {v.plate} · {(v.km || 0).toLocaleString("pt-BR")} km</span></div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                <IconBtn icon={PenIcon} title="Editar veículo" onClick={() => openEditVehicle(v)} />
                <IconBtn icon={Trash2} title="Excluir veículo" onClick={() => deleteVehicle(v.id)} />
              </div>
            </div>
          )) : <span className="muted" style={{ fontSize: 12 }}>Nenhum veículo cadastrado.</span>}
          <div className="card-head" style={{ marginTop: 18 }}><h3>Histórico de serviços</h3></div>
          {orders.filter(o => o.clientId === selected.id).length ? orders.filter(o => o.clientId === selected.id).map(o => (
            <div key={o.id} className="mini-row"><span>{o.serviceName}</span><b>{money(o.value)}</b></div>
          )) : <span className="muted" style={{ fontSize: 12 }}>Nenhuma OS registrada ainda.</span>}
        </Card>
      </div>
      {clientModal && <ClientForm cForm={cForm} setCForm={setCForm} onClose={() => setClientModal(null)} onSave={saveClient} isEdit={clientModal !== "new"} />}
      {vehicleModal && (
        <Modal title={vehicleModal === "new" ? `Novo veículo — ${selected.name}` : `Editar veículo — ${selected.name}`} onClose={() => setVehicleModal(null)} footer={<PrimaryButton onClick={saveVehicle}>Salvar veículo</PrimaryButton>}>
          <div className="form-grid-2">
            <Field label="Marca"><input value={vForm.brand} onChange={e => setVForm({ ...vForm, brand: e.target.value })} /></Field>
            <Field label="Modelo"><input value={vForm.model} onChange={e => setVForm({ ...vForm, model: e.target.value })} /></Field>
            <Field label="Ano"><input type="number" value={vForm.year} onChange={e => setVForm({ ...vForm, year: e.target.value })} /></Field>
            <Field label="Cor"><input value={vForm.color} onChange={e => setVForm({ ...vForm, color: e.target.value })} /></Field>
            <Field label="Placa"><input value={vForm.plate} onChange={e => setVForm({ ...vForm, plate: e.target.value.toUpperCase() })} /></Field>
            <Field label="Quilometragem"><input type="number" value={vForm.km} onChange={e => setVForm({ ...vForm, km: e.target.value })} /></Field>
          </div>
          <Field label="Observações"><textarea rows={2} value={vForm.notes} onChange={e => setVForm({ ...vForm, notes: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}

function ClientForm({ cForm, setCForm, onClose, onSave, isEdit }) {
  return (
    <Modal title={isEdit ? "Editar Cliente" : "Novo Cliente"} onClose={onClose} footer={<PrimaryButton onClick={onSave}>{isEdit ? "Salvar alterações" : "Salvar cliente"}</PrimaryButton>}>
      <Field label="Nome completo"><input value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} /></Field>
      <div className="form-grid-2">
        <Field label="CPF/CNPJ"><input value={cForm.doc} onChange={e => setCForm({ ...cForm, doc: e.target.value })} /></Field>
        <Field label="Telefone / WhatsApp"><input value={cForm.phone} onChange={e => setCForm({ ...cForm, phone: e.target.value })} placeholder="11999998888" /></Field>
      </div>
      <Field label="Endereço"><input value={cForm.address} onChange={e => setCForm({ ...cForm, address: e.target.value })} /></Field>
      <Field label="Observações"><textarea rows={2} value={cForm.notes} onChange={e => setCForm({ ...cForm, notes: e.target.value })} /></Field>
    </Modal>
  );
}

/* ---------------------------------------------------------------------- */
/* ORDENS DE SERVIÇO — KANBAN COM DRAG AND DROP REAL                       */
/* ---------------------------------------------------------------------- */
function OrdensServico({ orders, setOrders, clients, services, employees }) {
  const [showNew, setShowNew] = useState(false);
  const [openOrder, setOpenOrder] = useState(null);
  const [editingOS, setEditingOS] = useState(false);
  const [eForm, setEForm] = useState({});
  const [dragId, setDragId] = useState(null);
  const [form, setForm] = useState({ clientId: "", vehicleId: "", serviceId: "", value: "", discount: 0, tech: "", notes: "" });

  const selClient = clients.find(c => c.id === form.clientId);

  const onServiceChange = (serviceId) => {
    const s = services.find(sv => sv.id === serviceId);
    setForm({ ...form, serviceId, value: s ? s.price : "" });
  };

  const save = () => {
    const client = clients.find(c => c.id === form.clientId);
    const service = services.find(s => s.id === form.serviceId);
    const vehicle = client?.vehicles.find(v => v.id === form.vehicleId);
    if (!client || !service) return;
    const newOrder = {
      id: uid(), code: `OS-${1000 + orders.length + Math.floor(Math.random() * 90)}`,
      clientId: client.id, clientName: client.name,
      vehicleLabel: vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}` : "Sem veículo",
      serviceName: service.name, value: Number(form.value) || service.price, discount: Number(form.discount) || 0,
      tech: form.tech, notes: form.notes, status: "Recebido", createdAt: todayISO(),
    };
    setOrders(prev => [newOrder, ...prev]);
    setShowNew(false);
    setForm({ clientId: "", vehicleId: "", serviceId: "", value: "", discount: 0, tech: "", notes: "" });
  };

  const advanceStatus = (order, dir = 1) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[Math.min(STATUS_FLOW.length - 1, Math.max(0, idx + dir))];
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
    setOpenOrder(prev => prev && prev.id === order.id ? { ...prev, status: next } : prev);
  };
  const dropOnColumn = (status) => {
    if (!dragId) return;
    setOrders(prev => prev.map(o => o.id === dragId ? { ...o, status } : o));
    setDragId(null);
  };

  const startEditOS = (order) => {
    setEForm({ serviceName: order.serviceName, vehicleLabel: order.vehicleLabel, value: order.value, discount: order.discount, tech: order.tech, notes: order.notes || "" });
    setEditingOS(true);
  };
  const saveEditOS = (order) => {
    const updated = { ...order, ...eForm, value: Number(eForm.value) || 0, discount: Number(eForm.discount) || 0 };
    setOrders(prev => prev.map(o => o.id === order.id ? updated : o));
    setOpenOrder(updated);
    setEditingOS(false);
  };

  return (
    <div className="page">
      <PageHeader title="Ordens de Serviço" subtitle="Arraste o card entre as colunas para mudar o status." action={<PrimaryButton icon={Plus} onClick={() => setShowNew(true)}>Nova OS</PrimaryButton>} />
      <div className="kanban">
        {STATUS_FLOW.map(status => (
          <div key={status} className="kanban-col" onDragOver={(e) => e.preventDefault()} onDrop={() => dropOnColumn(status)}>
            <div className="kanban-col-head"><Badge text={status} color={STATUS_COLOR[status] || "#9A9AA0"} /><span className="muted">{orders.filter(o => o.status === status).length}</span></div>
            {orders.filter(o => o.status === status).map(o => (
              <div key={o.id} className="kanban-card" draggable onDragStart={() => setDragId(o.id)} onClick={() => { setOpenOrder(o); setEditingOS(false); }}>
                <div className="kanban-card-top"><span className="muted">{o.code || o.id}</span></div>
                <b>{o.clientName}</b><span className="muted">{o.vehicleLabel}</span>
                <div className="kanban-card-foot"><span>{o.serviceName}</span><b>{money(o.value)}</b></div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {openOrder && (() => {
        const order = orders.find(o => o.id === openOrder.id) || openOrder;
        const client = clients.find(c => c.id === order.clientId);
        return (
          <Modal title={order.code || order.id} onClose={() => { setOpenOrder(null); setEditingOS(false); }} width={560}>
            {editingOS ? (
              <div className="os-detail">
                <Field label="Serviço"><input value={eForm.serviceName} onChange={e => setEForm({ ...eForm, serviceName: e.target.value })} /></Field>
                <Field label="Veículo"><input value={eForm.vehicleLabel} onChange={e => setEForm({ ...eForm, vehicleLabel: e.target.value })} /></Field>
                <div className="form-grid-2">
                  <Field label="Valor (R$)"><input type="number" value={eForm.value} onChange={e => setEForm({ ...eForm, value: e.target.value })} /></Field>
                  <Field label="Desconto (%)"><input type="number" value={eForm.discount} onChange={e => setEForm({ ...eForm, discount: e.target.value })} /></Field>
                </div>
                <Field label="Funcionário responsável">
                  <select value={eForm.tech} onChange={e => setEForm({ ...eForm, tech: e.target.value })}>
                    <option value="">Selecione…</option>
                    {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                  </select>
                </Field>
                <Field label="Observações"><textarea rows={2} value={eForm.notes} onChange={e => setEForm({ ...eForm, notes: e.target.value })} /></Field>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <PrimaryButton onClick={() => saveEditOS(order)}>Salvar alterações</PrimaryButton>
                  <GhostButton onClick={() => setEditingOS(false)}>Cancelar</GhostButton>
                </div>
              </div>
            ) : (
              <div className="os-detail">
                <div className="detail-item"><Users size={14} /><span>{order.clientName}</span></div>
                <div className="detail-item"><Car size={14} /><span>{order.vehicleLabel}</span></div>
                <div className="detail-item"><Wrench size={14} /><span>{order.serviceName}</span></div>
                <div className="detail-item"><UserCog size={14} /><span>Responsável: {order.tech || "—"}</span></div>
                <div className="detail-item"><DollarSign size={14} /><span>Valor: <b>{money(order.value)}</b>{order.discount ? ` (desconto ${order.discount}%)` : ""}</span></div>

                <div className="status-track">
                  {STATUS_FLOW.map((s, i) => (
                    <React.Fragment key={s}>
                      <div className={`status-node ${STATUS_FLOW.indexOf(order.status) >= i ? "done" : ""}`}>{STATUS_FLOW.indexOf(order.status) > i ? <Check size={11} /> : i + 1}</div>
                      {i < STATUS_FLOW.length - 1 && <div className={`status-line ${STATUS_FLOW.indexOf(order.status) > i ? "done" : ""}`} />}
                    </React.Fragment>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <GhostButton icon={ChevronLeft} onClick={() => advanceStatus(order, -1)}>Voltar etapa</GhostButton>
                  <GhostButton icon={ArrowRight} onClick={() => advanceStatus(order, 1)}>Avançar etapa</GhostButton>
                  <GhostButton icon={PenIcon} onClick={() => startEditOS(order)}>Editar OS</GhostButton>
                  {client?.phone && order.status === "Entregue" && (
                    <GhostButton icon={MessageCircle} onClick={() => window.open(waLink(client.phone, `Olá ${client.name.split(" ")[0]}, seu veículo está pronto para retirada! 🚗✨`), "_blank")}>Avisar veículo pronto</GhostButton>
                  )}
                  <GhostButton icon={Trash2} danger onClick={() => { setOrders(prev => prev.filter(o => o.id !== order.id)); setOpenOrder(null); }}>Excluir OS</GhostButton>
                </div>
              </div>
            )}
          </Modal>
        );
      })()}

      {showNew && (
        <Modal title="Nova Ordem de Serviço" onClose={() => setShowNew(false)} width={520} footer={<PrimaryButton onClick={save}>Criar OS</PrimaryButton>}>
          <Field label="Cliente">
            <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value, vehicleId: "" })}>
              <option value="">Selecione…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          {selClient && (
            <Field label="Veículo">
              <select value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Selecione…</option>
                {selClient.vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.plate}</option>)}
              </select>
            </Field>
          )}
          <Field label="Serviço">
            <select value={form.serviceId} onChange={e => onServiceChange(e.target.value)}>
              <option value="">Selecione…</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} — {money(s.price)}</option>)}
            </select>
          </Field>
          <div className="form-grid-2">
            <Field label="Valor (R$)"><input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></Field>
            <Field label="Desconto (%)"><input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} /></Field>
          </div>
          <Field label="Funcionário responsável">
            <select value={form.tech} onChange={e => setForm({ ...form, tech: e.target.value })}>
              <option value="">Selecione…</option>
              {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="Observações"><textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* FINANCEIRO                                                              */
/* ---------------------------------------------------------------------- */
function Financeiro({ financial, setFinancial, orders }) {
  const empty = { type: "saida", desc: "", value: "", date: todayISO(), kind: "avulso" };
  const [modal, setModal] = useState(null); // null | "new" | entry being edited
  const [form, setForm] = useState(empty);
  const monthStart = todayISO().slice(0, 7);
  const netOrder = (o) => (Number(o.value) || 0) * (1 - (Number(o.discount) || 0) / 100);

  const entradasMes = orders.filter(o => o.createdAt.slice(0, 7) === monthStart).reduce((s, o) => s + netOrder(o), 0);
  const saidasMes = financial.filter(f => f.type === "saida" && f.date.slice(0, 7) === monthStart).reduce((s, f) => s + Number(f.value), 0);
  const aPagar = financial.filter(f => f.kind === "a_pagar" && !f.paid);
  const aReceber = financial.filter(f => f.kind === "a_receber" && !f.paid);

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (f) => { setForm({ type: f.type, desc: f.desc, value: f.value, date: f.date, kind: f.kind }); setModal(f); };

  const save = () => {
    if (!form.desc || !form.value) return;
    if (modal === "new") setFinancial(prev => [{ id: uid(), ...form, value: Number(form.value), paid: false }, ...prev]);
    else setFinancial(prev => prev.map(f => f.id === modal.id ? { ...f, ...form, value: Number(form.value) } : f));
    setModal(null);
  };
  const togglePaid = (id) => setFinancial(prev => prev.map(f => f.id === id ? { ...f, paid: !f.paid } : f));
  const removeEntry = (id) => setFinancial(prev => prev.filter(f => f.id !== id));

  const weekChart = useMemo(() => {
    const days = []; const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      days.push({ day: label.charAt(0).toUpperCase() + label.slice(1), value: orders.filter(o => o.createdAt === iso).reduce((s, o) => s + netOrder(o), 0) });
    }
    return days;
  }, [orders]);

  return (
    <div className="page">
      <PageHeader title="Financeiro" subtitle="Fluxo de caixa, contas a pagar e a receber." action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Lançamento</PrimaryButton>} />
      <div className="kpi-grid four">
        <KPI label="Entradas do mês" value={money(entradasMes)} icon={TrendingUp} />
        <KPI label="Saídas do mês" value={money(saidasMes)} icon={TrendingDown} positive={false} />
        <KPI label="Lucro líquido" value={money(entradasMes - saidasMes)} icon={Wallet} />
        <KPI label="A receber" value={money(aReceber.reduce((s, f) => s + f.value, 0))} icon={DollarSign} />
      </div>
      <div className="dash-row">
        <Card className="chart-card">
          <div className="card-head"><h3>Fluxo de caixa</h3></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9A9AA0", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: "#202022", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} formatter={(v) => [money(v), ""]} />
              <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="side-card">
          <div className="card-head"><h3>Contas a pagar</h3></div>
          {aPagar.length ? aPagar.map(f => (
            <div key={f.id} className="mini-row"><span>{f.desc}</span><span style={{ display: "flex", gap: 6, alignItems: "center" }}><b className="neg">{money(-f.value)}</b><IconBtn icon={Check} title="Marcar como pago" onClick={() => togglePaid(f.id)} /><IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(f)} /></span></div>
          )) : <span className="muted" style={{ fontSize: 12 }}>Nenhuma conta pendente.</span>}
          <div className="card-head" style={{ marginTop: 16 }}><h3>Contas a receber</h3></div>
          {aReceber.length ? aReceber.map(f => (
            <div key={f.id} className="mini-row"><span>{f.desc}</span><span style={{ display: "flex", gap: 6, alignItems: "center" }}><b className="pos">{money(f.value)}</b><IconBtn icon={Check} title="Marcar como recebido" onClick={() => togglePaid(f.id)} /><IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(f)} /></span></div>
          )) : <span className="muted" style={{ fontSize: 12 }}>Nenhuma conta pendente.</span>}
        </Card>
      </div>

      <Card>
        <div className="card-head"><h3>Todos os lançamentos</h3></div>
        {financial.length ? financial.slice().sort((a, b) => b.date.localeCompare(a.date)).map(f => (
          <div key={f.id} className="mini-row">
            <span>{new Date(f.date + "T00:00").toLocaleDateString("pt-BR")} · {f.desc}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <b className={f.type === "entrada" ? "pos" : "neg"}>{f.type === "entrada" ? money(f.value) : money(-f.value)}</b>
              <IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(f)} />
              <IconBtn icon={Trash2} title="Excluir" onClick={() => removeEntry(f.id)} />
            </span>
          </div>
        )) : <span className="muted" style={{ fontSize: 12 }}>Nenhum lançamento ainda.</span>}
      </Card>

      {modal && (
        <Modal title={modal === "new" ? "Novo Lançamento" : "Editar Lançamento"} onClose={() => setModal(null)} footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar lançamento" : "Salvar alterações"}</PrimaryButton>}>
          <div className="segmented full" style={{ marginBottom: 14 }}>
            {["entrada", "saida"].map(t => <button key={t} className={form.type === t ? "active" : ""} onClick={() => setForm({ ...form, type: t })}>{t === "entrada" ? "Entrada" : "Saída"}</button>)}
          </div>
          <Field label="Descrição"><input value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} /></Field>
          <div className="form-grid-2">
            <Field label="Valor (R$)"><input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></Field>
            <Field label="Data"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
          </div>
          <Field label="Tipo">
            <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}>
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

/* ---------------------------------------------------------------------- */
/* ESTOQUE                                                                  */
/* ---------------------------------------------------------------------- */
function Estoque({ products, setProducts }) {
  const empty = { name: "", qty: "", min: "", unitCost: "", supplier: "" };
  const [modal, setModal] = useState(null); // null | "new" | product being edited
  const [form, setForm] = useState(empty);
  const lowCount = products.filter(p => p.qty <= p.min).length;

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (p) => { setForm({ name: p.name, qty: p.qty, min: p.min, unitCost: p.unitCost, supplier: p.supplier }); setModal(p); };

  const save = () => {
    if (!form.name) return;
    const clean = { ...form, qty: Number(form.qty) || 0, min: Number(form.min) || 0, unitCost: Number(form.unitCost) || 0 };
    if (modal === "new") setProducts(prev => [{ id: uid(), ...clean }, ...prev]);
    else setProducts(prev => prev.map(p => p.id === modal.id ? { ...p, ...clean } : p));
    setModal(null);
  };
  const adjustQty = (id, delta) => setProducts(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p));

  return (
    <div className="page">
      <PageHeader title="Estoque" subtitle="Ajuste a quantidade manualmente ou dê baixa ao usar em uma OS." action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Produto</PrimaryButton>} />
      <Card>
        <table className="co-table">
          <thead><tr><th>Produto</th><th>Quantidade</th><th>Valor médio</th><th>Fornecedor</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map(p => {
              const low = p.qty <= p.min;
              return (
                <tr key={p.id}>
                  <td><b>{p.name}</b></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <IconBtn icon={ChevronLeft} title="Diminuir" onClick={() => adjustQty(p.id, -1)} />
                      {p.qty} un.
                      <IconBtn icon={ChevronRight} title="Aumentar" onClick={() => adjustQty(p.id, 1)} />
                    </div>
                  </td>
                  <td>{money(p.unitCost)}</td>
                  <td>{p.supplier}</td>
                  <td>{low ? <Badge text="Estoque baixo" color={PALETTE.danger} /> : <Badge text="Normal" color={PALETTE.success} />}</td>
                  <td style={{ display: "flex", gap: 4 }}>
                    <IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(p)} />
                    <IconBtn icon={Trash2} title="Excluir" onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {lowCount > 0 && (
        <Card style={{ marginTop: 14, borderColor: `${PALETTE.danger}55` }}>
          <div className="alert-row"><AlertTriangle size={16} color={PALETTE.danger} /><span>{lowCount} produto(s) abaixo do estoque mínimo. Considere fazer um novo pedido.</span></div>
        </Card>
      )}
      {modal && (
        <Modal title={modal === "new" ? "Novo Produto" : "Editar Produto"} onClose={() => setModal(null)} footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar produto" : "Salvar alterações"}</PrimaryButton>}>
          <Field label="Nome do produto"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="form-grid-2">
            <Field label="Quantidade atual"><input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} /></Field>
            <Field label="Estoque mínimo"><input type="number" value={form.min} onChange={e => setForm({ ...form, min: e.target.value })} /></Field>
          </div>
          <div className="form-grid-2">
            <Field label="Valor de compra (R$)"><input type="number" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} /></Field>
            <Field label="Fornecedor"><input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* CRM                                                                      */
/* ---------------------------------------------------------------------- */
function CRM({ clients, setClients }) {
  const windows = [15, 30, 60, 90, 180];
  const daysSince = (dateStr) => dateStr ? Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000) : 9999;
  const bucketOf = (days) => { for (let i = windows.length - 1; i >= 0; i--) if (days >= windows[i]) return windows[i]; return null; };
  const queue = clients.map(c => ({ ...c, days: daysSince(c.lastVisit), bucket: bucketOf(daysSince(c.lastVisit)) })).filter(c => c.bucket);
  const markContacted = (id) => setClients(prev => prev.map(c => c.id === id ? { ...c, lastVisit: todayISO() } : c));

  return (
    <div className="page">
      <PageHeader title="CRM" subtitle="Clientes prontos para receber um contato de retorno." />
      <div className="crm-windows">
        {windows.map(w => <Card key={w} className="crm-window-card"><span className="muted">{w}+ dias sem visita</span><b>{queue.filter(c => c.bucket === w).length}</b></Card>)}
      </div>
      <Card>
        <div className="card-head"><h3>Fila de contato</h3></div>
        {queue.length ? queue.sort((a, b) => b.days - a.days).map(c => (
          <div key={c.id} className="crm-row">
            <Avatar name={c.name} />
            <div className="client-row-info"><b>{c.name}</b><span className="muted">{c.days} dias sem visitar · {c.phone || "sem telefone"}</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              {c.phone && <GhostButton icon={MessageCircle} onClick={() => window.open(waLink(c.phone, `Olá ${c.name.split(" ")[0]}, faz um tempinho que você não vem aqui! Que tal agendar uma nova lavagem ou revisão do vitrificado? 🚗✨`), "_blank")}>Enviar WhatsApp</GhostButton>}
              <GhostButton icon={Check} onClick={() => markContacted(c.id)}>Marcar contatado</GhostButton>
            </div>
          </div>
        )) : <span className="muted" style={{ fontSize: 12 }}>Nenhum cliente na fila de contato agora.</span>}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SERVIÇOS                                                                 */
/* ---------------------------------------------------------------------- */
function Servicos({ services, setServices }) {
  const empty = { name: "", time: "", price: "", commission: "" };
  const [modal, setModal] = useState(null); // null | "new" | service being edited
  const [form, setForm] = useState(empty);
  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (s) => { setForm({ name: s.name, time: s.time, price: s.price, commission: s.commission }); setModal(s); };
  const save = () => {
    if (!form.name) return;
    const clean = { ...form, price: Number(form.price) || 0, commission: Number(form.commission) || 0 };
    if (modal === "new") setServices(prev => [{ id: uid(), ...clean }, ...prev]);
    else setServices(prev => prev.map(s => s.id === modal.id ? { ...s, ...clean } : s));
    setModal(null);
  };
  return (
    <div className="page">
      <PageHeader title="Serviços" subtitle="Catálogo de serviços, tempo médio e comissão." action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Serviço</PrimaryButton>} />
      <div className="service-grid">
        {services.map(s => (
          <Card key={s.id} className="service-card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="service-icon"><Sparkles size={17} /></div>
              <div style={{ display: "flex", gap: 4 }}>
                <IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(s)} />
                <IconBtn icon={Trash2} title="Excluir" onClick={() => setServices(prev => prev.filter(x => x.id !== s.id))} />
              </div>
            </div>
            <b>{s.name}</b>
            <div className="service-meta"><span><Clock size={12} /> {s.time || "—"}</span><span>Comissão {s.commission}%</span></div>
            <div className="service-price">{money(s.price)}</div>
          </Card>
        ))}
      </div>
      {modal && (
        <Modal title={modal === "new" ? "Novo Serviço" : "Editar Serviço"} onClose={() => setModal(null)} footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar serviço" : "Salvar alterações"}</PrimaryButton>}>
          <Field label="Nome do serviço"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="form-grid-2">
            <Field label="Tempo médio"><input value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} placeholder="Ex: 1h30" /></Field>
            <Field label="Valor (R$)"><input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field>
          </div>
          <Field label="Comissão (%)"><input type="number" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* EQUIPE                                                                   */
/* ---------------------------------------------------------------------- */
function Equipe({ employees, setEmployees, orders }) {
  const empty = { name: "", role: "", commission: "", goal: "" };
  const [modal, setModal] = useState(null); // null | "new" | employee being edited
  const [form, setForm] = useState(empty);
  const monthStart = todayISO().slice(0, 7);
  const servicesDone = (name) => orders.filter(o => o.tech === name && o.createdAt.slice(0, 7) === monthStart).length;

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (e) => { setForm({ name: e.name, role: e.role, commission: e.commission, goal: e.goal }); setModal(e); };
  const save = () => {
    if (!form.name) return;
    const clean = { ...form, commission: Number(form.commission) || 0, goal: Number(form.goal) || 1 };
    if (modal === "new") setEmployees(prev => [{ id: uid(), ...clean }, ...prev]);
    else setEmployees(prev => prev.map(e => e.id === modal.id ? { ...e, ...clean } : e));
    setModal(null);
  };

  return (
    <div className="page">
      <PageHeader title="Equipe" subtitle="Produtividade, comissões e metas do time." action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Funcionário</PrimaryButton>} />
      <Card>
        {employees.map(e => {
          const done = servicesDone(e.name);
          const pct = Math.min(100, Math.round((done / (e.goal || 1)) * 100));
          return (
            <div key={e.id} className="employee-row">
              <Avatar name={e.name} size={40} />
              <div className="client-row-info" style={{ minWidth: 180 }}><b>{e.name}</b><span className="muted">{e.role} · Comissão {e.commission}%</span></div>
              <div className="goal-bar"><div className="goal-fill" style={{ width: `${pct}%` }} /></div>
              <span className="muted" style={{ width: 100, textAlign: "right" }}>{done}/{e.goal} serviços</span>
              <IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(e)} />
              <IconBtn icon={Trash2} title="Excluir" onClick={() => setEmployees(prev => prev.filter(x => x.id !== e.id))} />
            </div>
          );
        })}
      </Card>
      {modal && (
        <Modal title={modal === "new" ? "Novo Funcionário" : "Editar Funcionário"} onClose={() => setModal(null)} footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar funcionário" : "Salvar alterações"}</PrimaryButton>}>
          <Field label="Nome"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Cargo"><input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></Field>
          <div className="form-grid-2">
            <Field label="Comissão (%)"><input type="number" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} /></Field>
            <Field label="Meta mensal (serviços)"><input type="number" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* RELATÓRIOS                                                              */
/* ---------------------------------------------------------------------- */
function Relatorios({ orders, clients, products }) {
  const monthStart = todayISO().slice(0, 7);
  const ordersMonth = orders.filter(o => o.createdAt.slice(0, 7) === monthStart);
  const byService = {};
  ordersMonth.forEach(o => { byService[o.serviceName] = (byService[o.serviceName] || 0) + 1; });
  const recurring = clients.filter(c => orders.filter(o => o.clientId === c.id).length > 1);

  const exportCsv = (filename, rows) => {
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const reports = [
    { title: "Lucro e faturamento", rows: [["Data", "Cliente", "Serviço", "Valor"], ...orders.map(o => [o.createdAt, o.clientName, o.serviceName, o.value])] },
    { title: "Serviços vendidos", rows: [["Serviço", "Quantidade no mês"], ...Object.entries(byService)] },
    { title: "Clientes recorrentes", rows: [["Cliente", "Nº de OS"], ...recurring.map(c => [c.name, orders.filter(o => o.clientId === c.id).length])] },
    { title: "Estoque de produtos", rows: [["Produto", "Quantidade", "Fornecedor"], ...products.map(p => [p.name, p.qty, p.supplier])] },
  ];

  return (
    <div className="page">
      <PageHeader title="Relatórios" subtitle="Exporte os dados reais do sistema em CSV (compatível com Excel)." />
      <div className="report-grid">
        {reports.map(r => (
          <Card key={r.title} className="report-card">
            <BarChart3 size={18} /><b>{r.title}</b>
            <div className="report-actions"><GhostButton onClick={() => exportCsv(`${r.title}.csv`, r.rows)}>Exportar Excel/CSV</GhostButton></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* CONFIGURAÇÕES                                                           */
/* ---------------------------------------------------------------------- */
function Configuracoes({ brand, currentUser, onSignOut }) {
  const [form, setForm] = useState(brand);
  const [teamUsers, setTeamUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("app_users").select("*").then(({ data }) => setTeamUsers(data || []));
  }, []);

  const save = async () => {
    await supabase.from("companies").update({ name: form.name, suffix: form.suffix, mark: form.mark, accent: form.accent }).eq("id", COMPANY_ID);
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  };
  const saveEditedUser = async () => {
    await supabase.from("app_users").update({ name: editingUser.name, role: editingUser.role }).eq("id", editingUser.id);
    setTeamUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
  };

  return (
    <div className="page">
      <PageHeader title="Configurações" subtitle="Identidade do sistema e pessoas com acesso." action={<PrimaryButton icon={Check} onClick={save}>Salvar alterações</PrimaryButton>} />
      <Toast text={saved ? "Alterações salvas" : ""} />
      <Card style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Identidade</h3></div>
        <div className="form-grid-2">
          <Field label="Nome do sistema"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Subtítulo"><input value={form.suffix} onChange={e => setForm({ ...form, suffix: e.target.value })} /></Field>
          <Field label="Inicial do logo"><input maxLength={2} value={form.mark} onChange={e => setForm({ ...form, mark: e.target.value.toUpperCase() })} /></Field>
          <Field label="Cor de destaque"><input type="color" value={form.accent} onChange={e => setForm({ ...form, accent: e.target.value })} style={{ height: 38, padding: 4 }} /></Field>
        </div>
      </Card>
      <Card>
        <div className="card-head"><h3>Pessoas com acesso</h3></div>
        {teamUsers.map(u => (
          <div key={u.id} className="employee-row">
            <Avatar name={u.name} size={38} />
            <div className="client-row-info" style={{ minWidth: 180 }}><b>{u.name}</b><span className="muted">{u.email}</span></div>
            <Badge text={u.role} color={PALETTE.warning} />
            <IconBtn icon={PenIcon} title="Editar" onClick={() => setEditingUser({ ...u })} />
          </div>
        ))}
        <p className="muted" style={{ fontSize: 11.5, marginTop: 14, lineHeight: 1.5 }}>
          Pra dar acesso a mais alguém, peça pra essa pessoa abrir o app e usar "Criar acesso" na tela de login — ela aparece aqui automaticamente.
          Quando o sistema virar multiempresa, cada empresa passa a ter sua própria lista de usuários e seus próprios dados isolados.
        </p>
      </Card>
      <Card style={{ marginTop: 14 }}>
        <div className="card-head"><h3>Sua conta</h3></div>
        <div className="detail-item"><Users size={14} /><span>{currentUser?.name} · {currentUser?.email}</span></div>
        <GhostButton icon={LogOut} onClick={onSignOut} style={{ marginTop: 12 }}>Sair</GhostButton>
      </Card>

      {editingUser && (
        <Modal title="Editar acesso" onClose={() => setEditingUser(null)} footer={<PrimaryButton onClick={saveEditedUser}>Salvar alterações</PrimaryButton>}>
          <Field label="Nome"><input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} /></Field>
          <Field label="Papel">
            <select value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
              <option value="Administrador">Administrador</option>
              <option value="Funcionário">Funcionário</option>
            </select>
          </Field>
          <p className="muted" style={{ fontSize: 11.5 }}>E-mail e senha não podem ser trocados por aqui — quem quiser trocar a própria senha faz isso pela tela de login do Supabase (em breve direto no app).</p>
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* LOGIN                                                                    */
/* ---------------------------------------------------------------------- */
function Login({ brand, auth }) {
  const [mode, setMode] = useState("entrar"); // entrar | criar
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Administrador");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(""); setInfo(""); setBusy(true);
    const em = email.trim().toLowerCase();
    const pw = password.trim();
    if (!em || !pw) { setError("Preencha e-mail e senha."); setBusy(false); return; }

    if (mode === "entrar") {
      const err = await auth.signIn(em, pw);
      if (err) setError("E-mail ou senha incorretos.");
    } else {
      if (!name.trim()) { setError("Digite seu nome."); setBusy(false); return; }
      if (pw.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); setBusy(false); return; }
      const { error: err, needsConfirmation } = await auth.signUp(em, pw, name.trim(), role);
      if (err) setError(err.message === "User already registered" ? "Esse e-mail já tem conta — clique em Entrar." : "Não foi possível criar a conta. Tente novamente.");
      else if (needsConfirmation) setInfo("Conta criada! Verifique seu e-mail para confirmar o acesso antes de entrar.");
    }
    setBusy(false);
  };
  const onKey = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="logo-mark">{brand.mark}</div>
        <h1>{brand.name}</h1>
        <span className="muted">{brand.suffix}</span>

        <div className="segmented full" style={{ marginTop: 18 }}>
          <button className={mode === "entrar" ? "active" : ""} onClick={() => { setMode("entrar"); setError(""); setInfo(""); }}>Entrar</button>
          <button className={mode === "criar" ? "active" : ""} onClick={() => { setMode("criar"); setError(""); setInfo(""); }}>Criar acesso</button>
        </div>

        {mode === "criar" && (
          <div className="login-field"><label>Seu nome</label><input value={name} onChange={e => setName(e.target.value)} /></div>
        )}
        <div className="login-field"><label>E-mail</label><input autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKey} /></div>
        <div className="login-field"><label>Senha</label><input type="password" autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onKey} /></div>
        {mode === "criar" && (
          <div className="login-field">
            <label>Papel</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="Administrador">Administrador</option>
              <option value="Funcionário">Funcionário</option>
            </select>
          </div>
        )}

        {error && <span style={{ color: PALETTE.danger, fontSize: 12, marginTop: 10 }}>{error}</span>}
        {info && <span style={{ color: PALETTE.success, fontSize: 12, marginTop: 10 }}>{info}</span>}

        <PrimaryButton onClick={submit} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>
          {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar minha conta"}
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* APP SHELL                                                                */
/* ---------------------------------------------------------------------- */
const NAV = [
  { key: "dashboard", label: "Início", icon: LayoutGrid },
  { key: "agenda", label: "Agenda", icon: Calendar },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "os", label: "Ordens de Serviço", icon: ClipboardList },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "estoque", label: "Estoque", icon: Package },
  { key: "crm", label: "CRM", icon: MessageCircle },
  { key: "servicos", label: "Serviços", icon: Wrench },
  { key: "equipe", label: "Equipe", icon: UserCog },
  { key: "relatorios", label: "Relatórios", icon: BarChart3 },
  { key: "config", label: "Configurações", icon: Settings },
];

export default function ClubOSApp() {
  const auth = useAuth();
  const [brand, setBrandState] = useState(DEFAULT_BRAND);

  useEffect(() => {
    supabase.from("companies").select("*").eq("id", COMPANY_ID).single().then(({ data }) => {
      if (data) setBrandState({ name: data.name, suffix: data.suffix, mark: data.mark, accent: data.accent });
    });
  }, [auth.session]);

  const [clients, setClients, clientsReady] = useClientsWithVehicles();
  const [orders, setOrders, ordersReady] = useSupabaseCollection("orders", ordersMap.toJs, ordersMap.toDb, "created_at");
  const [appointments, setAppointments, apptsReady] = useSupabaseCollection("appointments", appointmentsMap.toJs, appointmentsMap.toDb, "date");
  const [services, setServices, servicesReady] = useSupabaseCollection("services", servicesMap.toJs, servicesMap.toDb);
  const [products, setProducts, productsReady] = useSupabaseCollection("products", productsMap.toJs, productsMap.toDb);
  const [employees, setEmployees, employeesReady] = useSupabaseCollection("employees", employeesMap.toJs, employeesMap.toDb);
  const [financial, setFinancial, financialReady] = useSupabaseCollection("financial_entries", financialMap.toJs, financialMap.toDb, "date");

  const allReady = !auth.loading && auth.session && auth.profile && clientsReady && ordersReady && apptsReady && servicesReady && productsReady && employeesReady && financialReady;
  const authedUser = auth.profile;

  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifications = useMemo(() => {
    const today = todayISO();
    const list = [];
    products.filter(p => p.qty <= p.min).forEach(p => list.push({ id: `stock-${p.id}`, icon: AlertTriangle, color: PALETTE.danger, text: `Estoque baixo: ${p.name} (${p.qty} un.)`, page: "estoque" }));
    financial.filter(f => f.kind === "a_pagar" && !f.paid && f.date <= today).forEach(f => list.push({ id: `pay-${f.id}`, icon: Wallet, color: PALETTE.danger, text: `Conta a pagar: ${f.desc} — ${money(f.value)}`, page: "financeiro" }));
    appointments.filter(a => a.date === today && !["Finalizado", "Cancelado"].includes(a.status)).forEach(a => list.push({ id: `appt-${a.id}`, icon: Calendar, color: PALETTE.warning, text: `Hoje ${a.time} — ${a.clientName} (${a.service})`, page: "agenda" }));
    clients.forEach(c => {
      const days = c.lastVisit ? Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / 86400000) : 9999;
      if (days >= 90) list.push({ id: `crm-${c.id}`, icon: MessageCircle, color: PALETTE.warning, text: `${c.name} sem visitar há ${days} dias`, page: "crm" });
    });
    return list.slice(0, 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, financial, appointments, clients]);

  const visibleNav = authedUser?.role === "Administrador" ? NAV : NAV.filter(n => ["dashboard", "agenda", "clientes", "os", "servicos"].includes(n.key));

  const PAGES = {
    dashboard: <Dashboard orders={orders} appointments={appointments} financial={financial} clients={clients} user={authedUser} setPage={setPage} />,
    agenda: <Agenda appointments={appointments} setAppointments={setAppointments} clients={clients} />,
    clientes: <Clientes clients={clients} setClients={setClients} orders={orders} />,
    os: <OrdensServico orders={orders} setOrders={setOrders} clients={clients} services={services} employees={employees} />,
    financeiro: <Financeiro financial={financial} setFinancial={setFinancial} orders={orders} />,
    estoque: <Estoque products={products} setProducts={setProducts} />,
    crm: <CRM clients={clients} setClients={setClients} />,
    servicos: <Servicos services={services} setServices={setServices} />,
    equipe: <Equipe employees={employees} setEmployees={setEmployees} orders={orders} />,
    relatorios: <Relatorios orders={orders} clients={clients} products={products} />,
    config: <Configuracoes brand={brand} currentUser={authedUser} onSignOut={auth.signOut} />,
  };

  return (
    <div className="co-root">
      <style>{`
        .co-root, .co-root * { box-sizing: border-box; }
        .co-root {
          --bg:${PALETTE.bg}; --surface:${PALETTE.surface}; --surface-alt:${PALETTE.surfaceAlt};
          --border:${PALETTE.border}; --accent:${brand.accent}; --accent-soft:${brand.accent}24;
          --white:${PALETTE.white}; --dim:${PALETTE.textDim};
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
          background: var(--bg); color: var(--white);
          width: 100%; min-height: 640px; border-radius: 20px; overflow: hidden;
          display: flex; position: relative; -webkit-font-smoothing: antialiased;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .splash { width:100%; min-height:640px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color: var(--dim); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-screen { width:100%; min-height:640px; display:flex; align-items:center; justify-content:center; background: radial-gradient(circle at 50% 0%, #1c1c1e 0%, #111111 70%); }
        .login-card { width: 340px; background: var(--surface); border:1px solid var(--border); border-radius:20px; padding: 36px 30px; display:flex; flex-direction:column; align-items:center; text-align:center; }
        .logo-mark { width:52px; height:52px; border-radius:14px; background: var(--accent); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:22px; margin-bottom:14px; box-shadow: 0 8px 24px var(--accent-soft); }
        .login-card h1 { font-size:22px; font-weight:800; margin:0; letter-spacing:-0.5px; }
        .login-field { width:100%; text-align:left; margin-top:16px; }
        .login-field label { font-size:12px; color:var(--dim); display:block; margin-bottom:6px; }
        .login-field input { width:100%; background:var(--surface-alt); border:1px solid var(--border); border-radius:10px; padding:10px 12px; color:var(--white); font-size:13.5px; outline:none; }
        .login-field input:focus { border-color: var(--accent); }

        .sidebar { width: ${collapsed ? "72px" : "232px"}; transition: width .25s ease; background: var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; padding: 18px 12px; flex-shrink:0; }
        .sidebar-brand { display:flex; align-items:center; gap:10px; padding: 4px 8px 20px; }
        .sidebar-brand .logo-mark { width:32px; height:32px; font-size:15px; border-radius:9px; margin:0; flex-shrink:0; }
        .sidebar-brand-text { display:flex; flex-direction:column; line-height:1.1; overflow:hidden; white-space:nowrap; }
        .sidebar-brand-text b { font-size:14.5px; font-weight:800; letter-spacing:-0.3px; }
        .sidebar-brand-text span { font-size:10px; color:var(--dim); }
        .nav-item { display:flex; align-items:center; gap:12px; padding:9px 10px; border-radius:10px; color:var(--dim); background:none; border:none; cursor:pointer; font-size:13.5px; font-weight:500; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-align:left; }
        .nav-item svg { flex-shrink:0; }
        .nav-item:hover { background: var(--surface-alt); color: var(--white); }
        .nav-item.active { background: var(--accent-soft); color: var(--accent); font-weight:600; }
        .sidebar-foot { margin-top:auto; display:flex; flex-direction:column; gap:2px; }

        .main { flex:1; display:flex; flex-direction:column; min-width:0; background: var(--bg); }
        .topbar { height:60px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; padding: 0 22px; flex-shrink:0; }
        .topbar-search { display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:7px 12px; width:260px; color:var(--dim); }
        .topbar-search input { background:none; border:none; outline:none; color:var(--white); font-size:13px; width:100%; }
        .topbar-actions { display:flex; align-items:center; gap:14px; }
        .dropdown-wrap { position: relative; }
        .dropdown-veil { position: fixed; inset: 0; z-index: 60; }
        .co-dropdown { position:absolute; top:42px; right:0; width:300px; max-height:360px; overflow-y:auto; background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:8px; z-index:61; box-shadow:0 16px 40px rgba(0,0,0,.5); }
        .co-dropdown-head { font-size:11px; font-weight:700; color:var(--dim); text-transform:uppercase; letter-spacing:.03em; padding:8px 10px 6px; }
        .co-dropdown-item { display:flex; align-items:center; gap:9px; width:100%; text-align:left; background:none; border:none; color:var(--white); font-size:12.5px; padding:9px 10px; border-radius:9px; cursor:pointer; }
        .co-dropdown-item:hover { background:var(--surface-alt); }
        .co-dropdown-empty { padding:14px 10px; font-size:12px; color:var(--dim); }
        .co-dropdown-profile { display:flex; align-items:center; gap:10px; padding:6px 4px 10px; }
        .notif-dot { position:absolute; top:-4px; right:-4px; background:var(--accent); color:#fff; font-size:9px; font-weight:800; min-width:15px; height:15px; border-radius:8px; display:flex; align-items:center; justify-content:center; padding:0 3px; }
        .avatar-btn { background:none; border:none; padding:0; cursor:pointer; border-radius:50%; }
        .content-scroll { flex:1; overflow-y:auto; padding: 24px 28px 40px; }

        .co-card { background: var(--surface); border:1px solid var(--border); border-radius:16px; padding:18px; }
        .page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:22px; gap:14px; flex-wrap:wrap; }
        .page-header h1 { font-size:22px; font-weight:800; letter-spacing:-0.5px; margin:0 0 4px; }
        .page-header p { margin:0; color:var(--dim); font-size:13px; }
        .muted { color: var(--dim); }
        .card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
        .card-head h3 { font-size:14.5px; font-weight:700; margin:0; }

        .co-btn-primary { background:var(--accent); color:#fff; border:none; border-radius:11px; padding:10px 16px; font-size:13.5px; font-weight:600; display:flex; align-items:center; gap:7px; cursor:pointer; box-shadow: 0 6px 18px var(--accent-soft); transition: transform .15s ease, filter .15s ease; }
        .co-btn-primary:hover { filter:brightness(1.08); transform: translateY(-1px); }
        .co-btn-ghost { background:var(--surface-alt); color:var(--white); border:1px solid var(--border); border-radius:10px; padding:8px 13px; font-size:12.5px; font-weight:600; display:flex; align-items:center; gap:6px; cursor:pointer; }
        .co-btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .co-icon-btn { width:30px; height:30px; border-radius:9px; background:var(--surface-alt); border:1px solid var(--border); color:var(--white); display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
        .co-icon-btn:hover { border-color:var(--accent); color:var(--accent); }

        .co-badge { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; padding:4px 9px; border-radius:20px; border:1px solid; white-space:nowrap; }
        .co-dot { width:6px; height:6px; border-radius:50%; }
        .co-avatar { border-radius:50%; background: var(--surface-alt); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--accent); flex-shrink:0; }
        .co-toast { position:fixed; top:18px; right:18px; background:var(--accent); color:#fff; padding:9px 16px; border-radius:10px; font-size:12.5px; font-weight:600; display:flex; align-items:center; gap:8px; z-index:80; box-shadow:0 8px 20px rgba(0,0,0,.4); }

        .field { display:flex; flex-direction:column; gap:6px; font-size:12px; color:var(--dim); margin-bottom:12px; }
        .field input, .field select, .field textarea { background:var(--surface-alt); border:1px solid var(--border); border-radius:10px; padding:9px 11px; color:var(--white); font-size:13px; outline:none; font-family:inherit; }
        .field input:focus, .field select:focus, .field textarea:focus { border-color:var(--accent); }
        .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }

        .kpi-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; margin-bottom:18px; }
        .kpi-grid.four { grid-template-columns: repeat(4, 1fr); }
        .kpi-top { display:flex; align-items:center; justify-content:space-between; }
        .kpi-label { font-size:12px; color:var(--dim); font-weight:500; }
        .kpi-icon { width:26px; height:26px; border-radius:8px; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; }
        .kpi-value { font-size:23px; font-weight:800; margin-top:10px; letter-spacing:-0.5px; }
        .kpi-delta { font-size:11.5px; font-weight:600; display:flex; align-items:center; gap:4px; margin-top:6px; }
        .kpi-delta.up { color: var(--success); } .kpi-delta.down { color: var(--danger); }

        .dash-row { display:grid; grid-template-columns: 1.6fr 1fr; gap:14px; margin-bottom:14px; align-items:start; }
        .cash-row { display:flex; justify-content:space-between; font-size:13px; padding:6px 0; }
        .cash-row.total b { color: var(--accent); font-size:16px; }
        .cash-divider { height:1px; background:var(--border); margin:6px 0; }
        .pos { color: var(--success); } .neg { color: var(--danger); }
        .mini-row { display:flex; justify-content:space-between; align-items:center; font-size:12.5px; padding:7px 0; border-bottom:1px solid var(--border); }
        .mini-row:last-child { border-bottom:none; }

        .appt-list { display:flex; flex-direction:column; gap:2px; }
        .appt-item { display:flex; align-items:center; gap:12px; padding:10px 4px; border-bottom:1px solid var(--border); }
        .appt-item:last-child { border-bottom:none; }
        .appt-time { font-size:12.5px; font-weight:700; color:var(--dim); width:44px; }
        .appt-info { flex:1; display:flex; flex-direction:column; }
        .appt-info span { font-size:12px; }

        .segmented { display:flex; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:3px; }
        .segmented.full { width:100%; }
        .segmented button { background:none; border:none; color:var(--dim); font-size:12.5px; font-weight:600; padding:7px 14px; border-radius:8px; cursor:pointer; flex:1; }
        .segmented button.active { background:var(--accent); color:#fff; }
        .day-grid { display:flex; flex-direction:column; }
        .day-slot { display:flex; gap:14px; padding:8px 0; border-bottom:1px solid var(--border); }
        .day-slot:last-child { border-bottom:none; }
        .slot-hour { width:44px; font-size:12px; color:var(--dim); padding-top:6px; flex-shrink:0; }
        .slot-track { flex:1; }
        .slot-empty { height:24px; }
        .slot-event { background:var(--surface-alt); border-left:3px solid; border-radius:8px; padding:8px 12px; cursor:grab; }
        .slot-event-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:2px; gap:8px; }
        .slot-event span { font-size:12px; }

        .split { display:grid; grid-template-columns: 300px 1fr; gap:14px; align-items:start; }
        .search-box { display:flex; align-items:center; gap:8px; background:var(--surface-alt); border:1px solid var(--border); border-radius:10px; padding:8px 12px; margin-bottom:12px; color:var(--dim); }
        .search-box input { background:none; border:none; outline:none; color:var(--white); font-size:13px; width:100%; }
        .client-row { display:flex; align-items:center; gap:10px; width:100%; background:none; border:none; padding:9px; border-radius:11px; cursor:pointer; margin-bottom:2px; }
        .client-row:hover { background: var(--surface-alt); }
        .client-row.active { background: var(--accent-soft); }
        .client-row-info { flex:1; display:flex; flex-direction:column; text-align:left; overflow:hidden; }
        .client-row-info b { font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .client-row-info span { font-size:11.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .detail-head { display:flex; align-items:center; gap:14px; margin-bottom:16px; flex-wrap:wrap; }
        .detail-head h2 { font-size:18px; margin:0; font-weight:800; }
        .detail-grid { display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:18px; }
        .detail-item { display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--white); }
        .detail-item svg { color:var(--dim); flex-shrink:0; }
        .vehicle-card { display:flex; align-items:center; gap:12px; background:var(--surface-alt); border:1px solid var(--border); border-radius:12px; padding:10px 12px; margin-bottom:8px; }
        .vehicle-icon { width:34px; height:34px; border-radius:9px; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .vehicle-info { display:flex; flex-direction:column; }
        .vehicle-info b { font-size:13px; } .vehicle-info span { font-size:11.5px; }

        .kanban { display:grid; grid-template-columns: repeat(7, minmax(160px,1fr)); gap:12px; overflow-x:auto; padding-bottom:8px; }
        .kanban-col-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .kanban-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:11px; margin-bottom:9px; cursor:pointer; display:flex; flex-direction:column; gap:2px; }
        .kanban-card:hover { border-color: var(--accent); }
        .kanban-card-top { display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; }
        .kanban-card b { font-size:12.5px; }
        .kanban-card span { font-size:11.5px; }
        .kanban-card-foot { display:flex; justify-content:space-between; margin-top:6px; font-size:12px; }
        .os-detail { display:flex; flex-direction:column; gap:9px; }
        .status-track { display:flex; align-items:center; margin-top:18px; }
        .status-node { width:22px; height:22px; border-radius:50%; background:var(--surface-alt); border:1px solid var(--border); color:var(--dim); font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .status-node.done { background:var(--accent); border-color:var(--accent); color:#fff; }
        .status-line { flex:1; height:2px; background:var(--border); }
        .status-line.done { background:var(--accent); }

        .co-table { width:100%; border-collapse:collapse; }
        .co-table th { text-align:left; font-size:11px; color:var(--dim); font-weight:600; padding:8px 10px; border-bottom:1px solid var(--border); }
        .co-table td { padding:12px 10px; font-size:13px; border-bottom:1px solid var(--border); }
        .co-table tr:last-child td { border-bottom:none; }
        .alert-row { display:flex; align-items:center; gap:10px; font-size:12.5px; }

        .crm-windows { display:grid; grid-template-columns: repeat(5,1fr); gap:12px; margin-bottom:14px; }
        .crm-window-card { display:flex; flex-direction:column; gap:6px; }
        .crm-window-card b { font-size:22px; font-weight:800; }
        .crm-row { display:flex; align-items:center; gap:12px; padding:10px 4px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
        .crm-row:last-child { border-bottom:none; }

        .service-grid { display:grid; grid-template-columns: repeat(3,1fr); gap:14px; }
        .service-card { display:flex; flex-direction:column; gap:8px; }
        .service-icon { width:32px; height:32px; border-radius:9px; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; }
        .service-meta { display:flex; gap:12px; font-size:11.5px; color:var(--dim); }
        .service-meta span { display:flex; align-items:center; gap:4px; }
        .service-price { font-size:18px; font-weight:800; color:var(--accent); margin-top:4px; }

        .employee-row { display:flex; align-items:center; gap:14px; padding:12px 4px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
        .employee-row:last-child { border-bottom:none; }
        .goal-bar { flex:1; min-width: 80px; height:7px; border-radius:5px; background:var(--surface-alt); overflow:hidden; }
        .goal-fill { height:100%; background:var(--accent); border-radius:5px; }

        .report-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:14px; }
        .report-card { display:flex; flex-direction:column; gap:10px; }
        .report-card svg { color: var(--accent); }
        .report-actions { display:flex; gap:8px; margin-top:4px; }

        .co-modal-veil { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:50; backdrop-filter: blur(4px); padding: 20px; }
        .co-modal { background:var(--surface); border:1px solid var(--border); border-radius:18px; max-height:85vh; overflow-y:auto; width:100%; }
        .co-modal-head { display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--surface); }
        .co-modal-head h3 { margin:0; font-size:15px; font-weight:700; }
        .co-modal-body { padding:18px; }
        .co-modal-foot { padding: 0 18px 18px; }

        ::-webkit-scrollbar { width:8px; height:8px; }
        ::-webkit-scrollbar-thumb { background: var(--surface-alt); border-radius:8px; }
      `}</style>

      {auth.loading ? (
        <div className="splash"><Loader2 size={22} className="spin" /><span>Carregando…</span></div>
      ) : !auth.session ? (
        <Login brand={brand} auth={auth} />
      ) : !allReady ? (
        <div className="splash"><Loader2 size={22} className="spin" /><span>Carregando dados…</span></div>
      ) : (
        <>
          <div className="sidebar">
            <div className="sidebar-brand">
              <div className="logo-mark">{brand.mark}</div>
              {!collapsed && <div className="sidebar-brand-text"><b>{brand.name}</b><span>{brand.suffix}</span></div>}
            </div>
            {visibleNav.map(n => (
              <button key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => setPage(n.key)}>
                <n.icon size={17} strokeWidth={2} />{!collapsed && n.label}
              </button>
            ))}
            <div className="sidebar-foot">
              <button className="nav-item" onClick={() => setCollapsed(!collapsed)}><Menu size={17} strokeWidth={2} />{!collapsed && "Recolher menu"}</button>
              <button className="nav-item" onClick={() => auth.signOut()}><LogOut size={17} strokeWidth={2} />{!collapsed && "Sair"}</button>
            </div>
          </div>
          <div className="main">
            <div className="topbar">
              <div className="topbar-search"><Search size={14} /><input placeholder="Buscar cliente, veículo, OS…" /></div>
              <div className="topbar-actions">
                <div className="dropdown-wrap">
                  <button className="co-icon-btn" style={{ position: "relative" }} onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}>
                    <Bell size={16} />
                    {notifications.length > 0 && <span className="notif-dot">{notifications.length > 9 ? "9+" : notifications.length}</span>}
                  </button>
                  {showNotif && (
                    <>
                      <div className="dropdown-veil" onClick={() => setShowNotif(false)} />
                      <div className="co-dropdown">
                        <div className="co-dropdown-head">Notificações</div>
                        {notifications.length ? notifications.map(n => (
                          <button key={n.id} className="co-dropdown-item" onClick={() => { setPage(n.page); setShowNotif(false); }}>
                            <n.icon size={14} color={n.color} /><span>{n.text}</span>
                          </button>
                        )) : <div className="co-dropdown-empty">Tudo em dia por aqui.</div>}
                      </div>
                    </>
                  )}
                </div>
                <IconBtn icon={Settings} title="Configurações" onClick={() => setPage("config")} />
                <div className="dropdown-wrap">
                  <button className="avatar-btn" onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}>
                    <Avatar name={authedUser.name} size={32} />
                  </button>
                  {showProfile && (
                    <>
                      <div className="dropdown-veil" onClick={() => setShowProfile(false)} />
                      <div className="co-dropdown" style={{ width: 220 }}>
                        <div className="co-dropdown-profile">
                          <Avatar name={authedUser.name} size={38} />
                          <div><b>{authedUser.name}</b><span className="muted" style={{ display: "block", fontSize: 11 }}>{authedUser.email}</span></div>
                        </div>
                        <Badge text={authedUser.role} color={PALETTE.warning} />
                        <button className="co-dropdown-item" style={{ marginTop: 10 }} onClick={() => { setPage("config"); setShowProfile(false); }}><Settings size={14} /><span>Configurações</span></button>
                        <button className="co-dropdown-item" onClick={() => auth.signOut()}><LogOut size={14} /><span>Sair</span></button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="content-scroll">{PAGES[page]}</div>
          </div>
        </>
      )}
    </div>
  );
}
