import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Pencil as PenIcon, Trash2, AlertTriangle, Package } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { Badge } from "@/components/shared/Badge";
import { money, uid, PALETTE } from "@/lib/utils";

interface EstoqueProps {
  products: any[];
  setProducts: (updater: any[] | ((prev: any[]) => any[])) => void;
}

export function Estoque({ products, setProducts }: EstoqueProps) {
  const empty = { name: "", qty: "", min: "", unitCost: "", supplier: "" };
  const [modal, setModal] = useState<null | "new" | any>(null);
  const [form, setForm] = useState(empty);

  const lowCount = products.filter(p => Number(p.qty) <= Number(p.min)).length;

  const openNew = () => { setForm(empty); setModal("new"); };
  const openEdit = (p: any) => {
    setForm({ name: p.name, qty: String(p.qty), min: String(p.min), unitCost: String(p.unitCost), supplier: p.supplier || "" });
    setModal(p);
  };

  const save = () => {
    if (!form.name) return;
    const clean = { ...form, qty: Number(form.qty) || 0, min: Number(form.min) || 0, unitCost: Number(form.unitCost) || 0 };
    if (modal === "new") {
      setProducts((prev: any[]) => [{ id: uid(), ...clean }, ...prev]);
    } else {
      setProducts((prev: any[]) => prev.map(p => p.id === modal.id ? { ...p, ...clean } : p));
    }
    setModal(null);
  };

  const adjustQty = (id: string, delta: number) =>
    setProducts((prev: any[]) => prev.map(p => p.id === id ? { ...p, qty: Math.max(0, Number(p.qty) + delta) } : p));

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Estoque"
        subtitle="Controle de produtos e insumos utilizados nos serviços."
        action={<PrimaryButton icon={Plus} onClick={openNew}>Novo Produto</PrimaryButton>}
      />

      {lowCount > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm"
          style={{ borderColor: `${PALETTE.danger}55`, background: `${PALETTE.danger}11`, color: PALETTE.danger }}
        >
          <AlertTriangle size={16} />
          <span>{lowCount} produto(s) abaixo do estoque mínimo. Considere fazer um novo pedido.</span>
        </div>
      )}

      <Card className="!p-0 overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Nenhum produto cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Produto</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quantidade</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor unit.</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fornecedor</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const low = Number(p.qty) <= Number(p.min);
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground">{p.name}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <IconBtn icon={ChevronLeft} title="Diminuir" onClick={() => adjustQty(p.id, -1)} />
                          <span className={`font-semibold ${low ? "text-red-400" : "text-foreground"}`}>{p.qty} un.</span>
                          <IconBtn icon={ChevronRight} title="Aumentar" onClick={() => adjustQty(p.id, 1)} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{money(p.unitCost)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p.supplier || "—"}</td>
                      <td className="px-5 py-3">
                        <Badge text={low ? "Estoque baixo" : "Normal"} color={low ? PALETTE.danger : PALETTE.success} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <IconBtn icon={PenIcon} title="Editar" onClick={() => openEdit(p)} />
                          <IconBtn icon={Trash2} title="Excluir" onClick={() => setProducts((prev: any[]) => prev.filter(x => x.id !== p.id))} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal && (
        <Modal
          title={modal === "new" ? "Novo Produto" : "Editar Produto"}
          onClose={() => setModal(null)}
          footer={<PrimaryButton onClick={save}>{modal === "new" ? "Salvar produto" : "Salvar alterações"}</PrimaryButton>}
        >
          <Field label="Nome do produto">
            <input className="w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantidade atual">
              <input type="number" className="w-full" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} />
            </Field>
            <Field label="Estoque mínimo">
              <input type="number" className="w-full" value={form.min} onChange={e => setForm({ ...form, min: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor de compra (R$)">
              <input type="number" className="w-full" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} />
            </Field>
            <Field label="Fornecedor">
              <input className="w-full" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
