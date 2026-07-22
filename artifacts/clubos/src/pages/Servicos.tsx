import { useState } from "react";
import { Plus, Pencil as PenIcon, Trash2, Wrench } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { money, uid } from "@/lib/utils";

interface ServicosProps {
  services: any[];
  setServices: (updater: any[] | ((prev: any[]) => any[])) => void;
}

export function Servicos({ services, setServices }: ServicosProps) {
  const empty = { name: "", description: "", price: "", duration: "" };
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [form, setForm] = useState(empty);

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (s: any) => {
    setForm({ name: s.name, description: s.description || "", price: String(s.price), duration: s.duration || "" });
    setModal(s);
  };

  const save = () => {
    if (!form.name || !form.price) return;
    const clean = { ...form, price: Number(form.price) || 0 };
    if (modal === "new") {
      setServices((prev: any[]) => [{ id: uid(), ...clean, active: true }, ...prev]);
    } else {
      setServices((prev: any[]) => prev.map(s => s.id === modal.id ? { ...s, ...clean } : s));
    }
    setModal(null);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Serviços"
        subtitle="Catálogo de serviços oferecidos pela sua estética."
        action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Serviço</PrimaryButton>}
      />

      {services.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Wrench size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Nenhum serviço cadastrado.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <Card key={s.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Wrench size={18} className="text-primary" />
                </div>
                <div className="flex gap-1">
                  <IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(s)} />
                  <IconBtn icon={Trash2} title="Excluir" onClick={() => setServices((prev: any[]) => prev.filter(x => x.id !== s.id))} />
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{s.name}</h3>
              {s.description && <p className="text-xs text-muted-foreground mb-3 flex-1">{s.description}</p>}
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                <span className="text-xl font-bold text-primary">{money(s.price)}</span>
                {s.duration && <span className="text-xs text-muted-foreground">{s.duration}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          title={modal === "new" ? "Novo Serviço" : "Editar Serviço"}
          onClose={() => setModal(null)}
          footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar serviço" : "Salvar alterações"}</PrimaryButton>}
        >
          <Field label="Nome do serviço">
            <input className="w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea className="w-full min-h-[80px] resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço (R$)">
              <input type="number" className="w-full" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Duração (ex: 2h)">
              <input className="w-full" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
