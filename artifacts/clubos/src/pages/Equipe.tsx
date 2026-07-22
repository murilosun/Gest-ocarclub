import { useState } from "react";
import { Plus, Pencil as PenIcon, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { Avatar } from "@/components/shared/Avatar";
import { uid, todayISO } from "@/lib/utils";

interface EquipeProps {
  employees: any[];
  setEmployees: (updater: any[] | ((prev: any[]) => any[])) => void;
  orders: any[];
}

export function Equipe({ employees, setEmployees, orders }: EquipeProps) {
  const empty = { name: "", role: "", commission: "", goal: "" };
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [form, setForm] = useState(empty);

  const servicesDone = (name: string) => {
    const month = todayISO().slice(0, 7);
    return orders.filter(o => o.tech === name && o.createdAt?.slice(0, 7) === month).length;
  };

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (e: any) => {
    setForm({ name: e.name, role: e.role, commission: String(e.commission), goal: String(e.goal) });
    setModal(e);
  };

  const save = () => {
    if (!form.name) return;
    const clean = { ...form, commission: Number(form.commission) || 0, goal: Number(form.goal) || 0 };
    if (modal === "new") {
      setEmployees((prev: any[]) => [{ id: uid(), ...clean }, ...prev]);
    } else {
      setEmployees((prev: any[]) => prev.map(e => e.id === modal.id ? { ...e, ...clean } : e));
    }
    setModal(null);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Equipe"
        subtitle="Produtividade, comissões e metas do time."
        action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Funcionário</PrimaryButton>}
      />

      {employees.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Nenhum funcionário cadastrado.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {employees.map(e => {
            const done = servicesDone(e.name);
            const goal = Number(e.goal) || 1;
            const pct = Math.min(100, Math.round((done / goal) * 100));
            return (
              <Card key={e.id} className="flex items-center gap-4">
                <Avatar name={e.name} size={44} />
                <div className="min-w-0" style={{ minWidth: 160 }}>
                  <div className="font-semibold text-foreground">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.role} · Comissão {e.commission}%</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Meta do mês</span>
                    <span className="text-xs font-semibold text-foreground">{done}/{goal}</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct >= 100 ? "#30D158" : "#FF6A00" }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-muted-foreground" style={{ minWidth: 48, textAlign: "right" }}>{pct}%</span>
                <div className="flex gap-1">
                  <IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(e)} />
                  <IconBtn icon={Trash2} title="Excluir" onClick={() => setEmployees((prev: any[]) => prev.filter(x => x.id !== e.id))} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "new" ? "Novo Funcionário" : "Editar Funcionário"}
          onClose={() => setModal(null)}
          footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar funcionário" : "Salvar alterações"}</PrimaryButton>}
        >
          <Field label="Nome">
            <input className="w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Cargo">
            <input className="w-full" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Comissão (%)">
              <input type="number" className="w-full" value={form.commission} onChange={e => setForm({ ...form, commission: e.target.value })} />
            </Field>
            <Field label="Meta mensal (serviços)">
              <input type="number" className="w-full" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
