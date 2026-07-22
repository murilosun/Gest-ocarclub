import { useState, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, GhostButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { Badge } from "@/components/shared/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { STATUS_COLOR, APPT_STATUS, todayISO, uid } from "@/lib/utils";
import { motion } from "framer-motion";

type ViewMode = "day" | "week" | "month";

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  time: string;
  date: string;
  status: string;
  vehicle?: string;
}

interface AgendaProps {
  appointments: Appointment[];
  setAppointments: (updater: Appointment[] | ((prev: Appointment[]) => Appointment[])) => void;
  clients: any[];
}

export function Agenda({ appointments, setAppointments, clients }: AgendaProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modal, setModal] = useState<null | "new" | Appointment>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({
    time: "08:00",
    clientName: "",
    service: "",
    status: "Agendado",
    date: todayISO(),
  });

  const openNew = () => {
    setForm({ time: "08:00", clientName: "", service: "", status: "Agendado", date: todayISO() });
    setModal("new");
  };

  const openEdit = (a: Appointment) => {
    setForm({ time: a.time, clientName: a.clientName, service: a.service, status: a.status, date: a.date });
    setModal(a);
  };

  const save = () => {
    if (!form.clientName || !form.service) return;
    if (modal === "new") {
      setAppointments((prev) => [...prev, { id: uid(), ...form }]);
    } else {
      setAppointments((prev) =>
        prev.map((a) => (a.id === (modal as Appointment).id ? { ...a, ...form } : a))
      );
    }
    setModal(null);
  };

  const deleteAppt = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const moveTo = (hour: number, date: string) => {
    if (!dragId) return;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === dragId ? { ...a, time: `${String(hour).padStart(2, "0")}:00`, date } : a
      )
    );
    setDragId(null);
  };

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  // Title formatter
  const viewTitle = useMemo(() => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    } else if (viewMode === "week") {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getDate()} – ${end.getDate()} ${end.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    }
  }, [viewMode, currentDate]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Arraste eventos entre horários/dias para reagendar"
        action={
          <PrimaryButton icon={Plus} onClick={openNew}>
            Novo Agendamento
          </PrimaryButton>
        }
      />

      {/* Controls */}
      <Card className="flex items-center justify-between flex-wrap gap-4">
        {/* View mode switcher */}
        <div className="flex gap-2 p-1 bg-muted/20 rounded-[11px]">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 h-9 rounded-lg font-medium text-sm transition-all ${
                viewMode === mode
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <IconBtn icon={ChevronLeft} onClick={goPrev} title="Anterior" />
          <GhostButton onClick={goToday}>Hoje</GhostButton>
          <IconBtn icon={ChevronRight} onClick={goNext} title="Próximo" />
        </div>

        <div className="font-semibold text-foreground capitalize">{viewTitle}</div>
      </Card>

      {/* Calendar view */}
      {viewMode === "day" && (
        <DayView
          appointments={appointments}
          currentDate={currentDate}
          dragId={dragId}
          setDragId={setDragId}
          moveTo={moveTo}
          openEdit={openEdit}
          deleteAppt={deleteAppt}
        />
      )}
      {viewMode === "week" && (
        <WeekView
          appointments={appointments}
          currentDate={currentDate}
          dragId={dragId}
          setDragId={setDragId}
          moveTo={moveTo}
          openEdit={openEdit}
          deleteAppt={deleteAppt}
        />
      )}
      {viewMode === "month" && (
        <MonthView
          appointments={appointments}
          currentDate={currentDate}
          openEdit={openEdit}
        />
      )}

      {/* Modal */}
      {modal && (
        <Modal
          title={modal === "new" ? "Novo Agendamento" : "Editar Agendamento"}
          onClose={() => setModal(null)}
          footer={
            <PrimaryButton onClick={save}>
              {modal === "new" ? "Salvar agendamento" : "Salvar alterações"}
            </PrimaryButton>
          }
        >
          <Field label="Cliente">
            <select
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecione…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Serviço">
            <input
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              placeholder="Ex: Polimento Técnico"
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </Field>
            <Field label="Horário">
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </Field>
          </div>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {APPT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </Modal>
      )}
    </div>
  );
}

// DAY VIEW
function DayView({ appointments, currentDate, dragId, setDragId, moveTo, openEdit, deleteAppt }: any) {
  const hours = Array.from({ length: 15 }, (_, i) => 7 + i);
  const dayISO = currentDate.toISOString().slice(0, 10);
  const dayAppts = appointments.filter((a: Appointment) => a.date === dayISO);

  const byHour: Record<number, Appointment> = {};
  dayAppts.forEach((a: Appointment) => {
    byHour[parseInt(a.time)] = a;
  });

  return (
    <Card className="p-0 overflow-hidden">
      <div className="space-y-0 divide-y divide-border">
        {hours.map((h) => {
          const appt = byHour[h];
          return (
            <div
              key={h}
              className="flex items-stretch min-h-[64px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => moveTo(h, dayISO)}
            >
              <div className="w-20 flex items-center justify-center text-sm font-medium text-muted-foreground border-r border-border">
                {h}:00
              </div>
              <div className="flex-1 p-2">
                {appt ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    draggable
                    onDragStart={() => setDragId(appt.id)}
                    onClick={() => openEdit(appt)}
                    className="flex items-center justify-between p-3 rounded-lg cursor-move hover:brightness-110 transition-all"
                    style={{
                      borderLeft: `3px solid ${STATUS_COLOR[appt.status]}`,
                      background: `${STATUS_COLOR[appt.status]}15`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={appt.clientName} size={32} />
                      <div>
                        <div className="font-semibold text-sm text-foreground">
                          {appt.clientName}
                        </div>
                        <div className="text-xs text-muted-foreground">{appt.service}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge text={appt.status} color={STATUS_COLOR[appt.status]} />
                      <IconBtn
                        icon={Trash2}
                        title="Remover"
                        onClick={(e: any) => {
                          e.stopPropagation();
                          deleteAppt(appt.id);
                        }}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// WEEK VIEW
function WeekView({ appointments, currentDate, dragId, setDragId, moveTo, openEdit, deleteAppt }: any) {
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 15 }, (_, i) => 7 + i);
  const today = todayISO();

  return (
    <Card className="p-0 overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="flex border-b border-border">
          <div className="w-16" />
          {days.map((d, i) => {
            const iso = d.toISOString().slice(0, 10);
            const isToday = iso === today;
            return (
              <div
                key={i}
                className={`flex-1 text-center py-3 border-l border-border ${
                  isToday ? "bg-primary/5" : ""
                }`}
              >
                <div className="text-xs text-muted-foreground uppercase">
                  {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                </div>
                <div
                  className={`text-lg font-semibold mt-1 ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="divide-y divide-border">
          {hours.map((h) => (
            <div key={h} className="flex" style={{ minHeight: 48 }}>
              <div className="w-16 flex items-center justify-center text-xs text-muted-foreground border-r border-border">
                {h}:00
              </div>
              {days.map((d, i) => {
                const iso = d.toISOString().slice(0, 10);
                const appt = appointments.find(
                  (a: Appointment) => a.date === iso && parseInt(a.time) === h
                );
                return (
                  <div
                    key={i}
                    className="flex-1 border-l border-border p-1"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => moveTo(h, iso)}
                  >
                    {appt && (
                      <div
                        draggable
                        onDragStart={() => setDragId(appt.id)}
                        onClick={() => openEdit(appt)}
                        className="p-1.5 rounded cursor-move text-xs truncate"
                        style={{
                          background: `${STATUS_COLOR[appt.status]}`,
                          color: "#fff",
                        }}
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

// MONTH VIEW
function MonthView({ appointments, currentDate, openEdit }: any) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const weeks = [];
  let week = [];
  for (let i = 0; i < startDay; i++) {
    week.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const today = todayISO();

  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid grid-cols-7 divide-x divide-border border-b border-border">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-muted-foreground uppercase py-3"
          >
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 divide-x divide-border border-b border-border">
          {week.map((day, di) => {
            if (!day) return <div key={di} className="bg-muted/10 min-h-[100px]" />;
            const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayAppts = appointments.filter((a: Appointment) => a.date === iso);
            const isToday = iso === today;

            return (
              <div key={di} className="p-2 min-h-[100px] flex flex-col">
                <div
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-2 ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayAppts.slice(0, 3).map((a: Appointment) => (
                    <div
                      key={a.id}
                      onClick={() => openEdit(a)}
                      className="text-xs px-2 py-1 rounded cursor-pointer truncate"
                      style={{
                        background: `${STATUS_COLOR[a.status]}`,
                        color: "#fff",
                      }}
                    >
                      {a.time.slice(0, 5)} {a.clientName}
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <div className="text-xs text-muted-foreground px-2">
                      +{dayAppts.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </Card>
  );
}
