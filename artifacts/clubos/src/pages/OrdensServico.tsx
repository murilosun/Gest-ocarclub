import { useState } from "react";
import {
  Plus,
  ChevronLeft,
  ArrowRight,
  Trash2,
  MessageCircle,
  Check,
  Users,
  Car,
  Wrench,
  UserCog,
  DollarSign,
  Clock,
  Pencil as PenIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, GhostButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { Badge } from "@/components/shared/Badge";
import { Avatar } from "@/components/shared/Avatar";
import { STATUS_COLOR, STATUS_FLOW, money, uid, todayISO, waLink } from "@/lib/utils";
import { motion } from "framer-motion";

interface OrdensServicoProps {
  orders: any[];
  setOrders: (updater: any[] | ((prev: any[]) => any[])) => void;
  clients: any[];
  services: any[];
  employees: any[];
}

export function OrdensServico({ orders, setOrders, clients, services, employees }: OrdensServicoProps) {
  const [showNew, setShowNew] = useState(false);
  const [openOrder, setOpenOrder] = useState<any>(null);
  const [editingOS, setEditingOS] = useState(false);
  const [eForm, setEForm] = useState<any>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: "",
    vehicleId: "",
    serviceId: "",
    value: "",
    discount: 0,
    tech: "",
    notes: "",
  });

  const selClient = clients.find((c) => c.id === form.clientId);

  const onServiceChange = (serviceId: string) => {
    const s = services.find((sv) => sv.id === serviceId);
    setForm({ ...form, serviceId, value: s ? s.price : "" });
  };

  const save = () => {
    const client = clients.find((c) => c.id === form.clientId);
    const service = services.find((s) => s.id === form.serviceId);
    const vehicle = client?.vehicles.find((v: any) => v.id === form.vehicleId);
    if (!client || !service) return;
    const newOrder = {
      id: uid(),
      code: `OS-${1000 + orders.length + Math.floor(Math.random() * 90)}`,
      clientId: client.id,
      clientName: client.name,
      vehicleLabel: vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.plate}` : "Sem veículo",
      serviceName: service.name,
      value: Number(form.value) || service.price,
      discount: Number(form.discount) || 0,
      tech: form.tech,
      notes: form.notes,
      status: "Em espera",
      createdAt: todayISO(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    setShowNew(false);
    setForm({ clientId: "", vehicleId: "", serviceId: "", value: "", discount: 0, tech: "", notes: "" });
  };

  const advanceStatus = (order: any, dir = 1) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[Math.min(STATUS_FLOW.length - 1, Math.max(0, idx + dir))];
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    setOpenOrder((prev: any) => (prev && prev.id === order.id ? { ...prev, status: next } : prev));
  };

  const dropOnColumn = (status: string) => {
    if (!dragId) return;
    setOrders((prev) => prev.map((o) => (o.id === dragId ? { ...o, status } : o)));
    setDragId(null);
  };

  const startEditOS = (order: any) => {
    setEForm({
      serviceName: order.serviceName,
      vehicleLabel: order.vehicleLabel,
      value: order.value,
      discount: order.discount,
      tech: order.tech,
      notes: order.notes || "",
    });
    setEditingOS(true);
  };

  const saveEditOS = (order: any) => {
    const updated = {
      ...order,
      ...eForm,
      value: Number(eForm.value) || 0,
      discount: Number(eForm.discount) || 0,
    };
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    setOpenOrder(updated);
    setEditingOS(false);
  };

  const deleteOS = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setOpenOrder(null);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Ordens de Serviço"
        subtitle="Arraste o card entre as colunas para mudar o status."
        action={
          <PrimaryButton icon={Plus} onClick={() => setShowNew(true)}>
            Nova OS
          </PrimaryButton>
        }
      />

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_FLOW.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dropOnColumn(status)}
          >
            <div className="flex items-center justify-between mb-3 px-2">
              <Badge text={status} color={STATUS_COLOR[status] || "#9A9AA0"} />
              <span className="text-sm text-muted-foreground">
                {orders.filter((o) => o.status === status).length}
              </span>
            </div>
            <div className="space-y-3">
              {orders
                .filter((o) => o.status === status)
                .map((o, i) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    draggable
                    onDragStart={() => setDragId(o.id)}
                    onClick={() => {
                      setOpenOrder(o);
                      setEditingOS(false);
                    }}
                    className="p-4 rounded-xl bg-card border border-card-border cursor-move hover:brightness-110 transition-all"
                    style={{ borderLeftWidth: 3, borderLeftColor: STATUS_COLOR[o.status] }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{o.code || o.id}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.createdAt + "T00:00").toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-foreground mb-1">{o.clientName}</div>
                    <div className="text-xs text-muted-foreground mb-2">{o.vehicleLabel}</div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">{o.serviceName}</span>
                      <b className="text-sm text-foreground">{money(o.value)}</b>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Sheet Modal */}
      {openOrder && (() => {
        const order = orders.find((o) => o.id === openOrder.id) || openOrder;
        const client = clients.find((c) => c.id === order.clientId);
        return (
          <Modal
            title={order.code || order.id}
            onClose={() => {
              setOpenOrder(null);
              setEditingOS(false);
            }}
            width={640}
          >
            {editingOS ? (
              <div className="space-y-4">
                <Field label="Serviço">
                  <input
                    value={eForm.serviceName}
                    onChange={(e) => setEForm({ ...eForm, serviceName: e.target.value })}
                    className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </Field>
                <Field label="Veículo">
                  <input
                    value={eForm.vehicleLabel}
                    onChange={(e) => setEForm({ ...eForm, vehicleLabel: e.target.value })}
                    className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Valor (R$)">
                    <input
                      type="number"
                      value={eForm.value}
                      onChange={(e) => setEForm({ ...eForm, value: e.target.value })}
                      className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </Field>
                  <Field label="Desconto (%)">
                    <input
                      type="number"
                      value={eForm.discount}
                      onChange={(e) => setEForm({ ...eForm, discount: e.target.value })}
                      className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </Field>
                </div>
                <Field label="Funcionário responsável">
                  <select
                    value={eForm.tech}
                    onChange={(e) => setEForm({ ...eForm, tech: e.target.value })}
                    className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione…</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.name}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Observações">
                  <textarea
                    rows={2}
                    value={eForm.notes}
                    onChange={(e) => setEForm({ ...eForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </Field>
                <div className="flex gap-2 pt-2">
                  <PrimaryButton onClick={() => saveEditOS(order)}>Salvar alterações</PrimaryButton>
                  <GhostButton onClick={() => setEditingOS(false)}>Cancelar</GhostButton>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Dados do Cliente */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Dados do Cliente
                  </h4>
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20">
                    <Avatar name={order.clientName} size={48} />
                    <div className="flex-1">
                      <div className="font-semibold text-base text-foreground">{order.clientName}</div>
                      {client?.phone && (
                        <div className="text-sm text-muted-foreground">{client.phone}</div>
                      )}
                    </div>
                    <Badge text={order.code} color={STATUS_COLOR[order.status]} />
                  </div>
                </div>

                {/* Veículo */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Veículo
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Car size={16} className="text-muted-foreground" />
                    {order.vehicleLabel}
                  </div>
                </div>

                {/* Serviço e Valores */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Serviço e Valores
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Wrench size={16} className="text-muted-foreground" />
                      {order.serviceName}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <UserCog size={16} className="text-muted-foreground" />
                      Responsável: {order.tech || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <DollarSign size={16} className="text-muted-foreground" />
                      Valor: <b>{money(order.value)}</b>
                      {order.discount > 0 && ` (desconto ${order.discount}%)`}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock size={16} className="text-muted-foreground" />
                      Data de abertura: {new Date(order.createdAt + "T00:00").toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  {order.discount > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="text-sm font-semibold text-green-500">
                        Valor final: {money(order.value * (1 - order.discount / 100))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status e Progresso */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Status e Progresso
                  </h4>
                  <div className="flex items-center gap-2 mb-4">
                    {STATUS_FLOW.map((s, i) => (
                      <div key={s} className="flex items-center gap-2">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                            STATUS_FLOW.indexOf(order.status) >= i
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {STATUS_FLOW.indexOf(order.status) > i ? <Check size={14} /> : i + 1}
                        </div>
                        {i < STATUS_FLOW.length - 1 && (
                          <div
                            className={`h-0.5 w-8 transition-all ${
                              STATUS_FLOW.indexOf(order.status) > i ? "bg-primary" : "bg-muted/30"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <GhostButton icon={ChevronLeft} onClick={() => advanceStatus(order, -1)}>
                      Voltar etapa
                    </GhostButton>
                    <GhostButton icon={ArrowRight} onClick={() => advanceStatus(order, 1)}>
                      Avançar etapa
                    </GhostButton>
                  </div>
                </div>

                {/* Observações */}
                {order.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                      Observações
                    </h4>
                    <p className="text-sm text-foreground">{order.notes}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="pt-4 border-t border-border flex gap-2 flex-wrap">
                  <GhostButton icon={PenIcon} onClick={() => startEditOS(order)}>
                    Editar OS
                  </GhostButton>
                  {client?.phone && order.status === "Finalizado" && (
                    <GhostButton
                      icon={MessageCircle}
                      onClick={() =>
                        window.open(
                          waLink(
                            client.phone,
                            `Olá ${client.name.split(" ")[0]}, seu veículo está pronto para retirada!`
                          ),
                          "_blank"
                        )
                      }
                    >
                      Avisar cliente
                    </GhostButton>
                  )}
                  <GhostButton icon={Trash2} danger onClick={() => deleteOS(order.id)}>
                    Excluir OS
                  </GhostButton>
                </div>
              </div>
            )}
          </Modal>
        );
      })()}

      {/* New OS Modal */}
      {showNew && (
        <Modal
          title="Nova Ordem de Serviço"
          onClose={() => setShowNew(false)}
          width={520}
          footer={<PrimaryButton onClick={save}>Criar OS</PrimaryButton>}
        >
          <Field label="Cliente">
            <select
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value, vehicleId: "" })}
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecione…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          {selClient && (
            <Field label="Veículo">
              <select
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Selecione…</option>
                {selClient.vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} · {v.plate}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Serviço">
            <select
              value={form.serviceId}
              onChange={(e) => onServiceChange(e.target.value)}
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecione…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {money(s.price)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor (R$)">
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </Field>
            <Field label="Desconto (%)">
              <input
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </Field>
          </div>
          <Field label="Funcionário responsável">
            <select
              value={form.tech}
              onChange={(e) => setForm({ ...form, tech: e.target.value })}
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecione…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Observações">
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </Field>
        </Modal>
      )}
    </div>
  );
}
