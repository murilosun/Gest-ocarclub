import { useState } from "react";
import { Plus, Search, ChevronRight, Phone, MapPin, DollarSign, Clock, MessageCircle, Car, Pencil as PenIcon, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, GhostButton, IconBtn } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Modal } from "@/components/shared/Modal";
import { Field } from "@/components/shared/Field";
import { Avatar } from "@/components/shared/Avatar";
import { money, uid, todayISO, waLink } from "@/lib/utils";

export function Clientes({ clients, setClients, orders }: any) {
  const [selectedId, setSelectedId] = useState(clients[0]?.id || null);
  const [query, setQuery] = useState("");
  const [clientModal, setClientModal] = useState<any>(null);
  const [vehicleModal, setVehicleModal] = useState<any>(null);
  const emptyClient = { name: "", doc: "", phone: "", whats: true, address: "", notes: "" };
  const emptyVehicle = { brand: "", model: "", year: "", color: "", plate: "", km: "", notes: "" };
  const [cForm, setCForm] = useState(emptyClient);
  const [vForm, setVForm] = useState(emptyVehicle);

  const selected = clients.find((c: any) => c.id === selectedId) || clients[0];
  const filtered = clients.filter((c: any) => c.name.toLowerCase().includes(query.toLowerCase()));
  const totalSpent = (client: any) =>
    orders.filter((o: any) => o.clientId === client.id).reduce((s: number, o: any) => s + (Number(o.value) || 0) * (1 - (Number(o.discount) || 0) / 100), 0);

  const openNewClient = () => { setCForm(emptyClient); setClientModal("new"); };
  const openEditClient = (c: any) => { setCForm({ name: c.name, doc: c.doc, phone: c.phone, whats: c.whats, address: c.address, notes: c.notes || "" }); setClientModal(c); };
  const saveClient = () => {
    if (!cForm.name) return;
    if (clientModal === "new") {
      const nc = { id: uid(), ...cForm, lastVisit: todayISO(), vehicles: [] };
      setClients((prev: any) => [nc, ...prev]);
      setSelectedId(nc.id);
    } else {
      setClients((prev: any) => prev.map((c: any) => (c.id === clientModal.id ? { ...c, ...cForm } : c)));
    }
    setClientModal(null);
  };

  const openNewVehicle = () => { setVForm(emptyVehicle); setVehicleModal("new"); };
  const openEditVehicle = (v: any) => { setVForm({ brand: v.brand, model: v.model, year: v.year, color: v.color, plate: v.plate, km: v.km, notes: v.notes || "" }); setVehicleModal(v); };
  const saveVehicle = () => {
    if (!vForm.brand || !vForm.plate) return;
    const clean = { ...vForm, year: Number(vForm.year) || "", km: Number(vForm.km) || 0 };
    if (vehicleModal === "new") {
      setClients((prev: any) => prev.map((c: any) => (c.id === selected.id ? { ...c, vehicles: [...c.vehicles, { id: uid(), ...clean }] } : c)));
    } else {
      setClients((prev: any) => prev.map((c: any) => (c.id === selected.id ? { ...c, vehicles: c.vehicles.map((v: any) => (v.id === vehicleModal.id ? { ...v, ...clean } : v)) } : c)));
    }
    setVehicleModal(null);
  };
  const deleteVehicle = (vid: string) => setClients((prev: any) => prev.map((c: any) => (c.id === selected.id ? { ...c, vehicles: c.vehicles.filter((v: any) => v.id !== vid) } : c)));

  if (!selected) {
    return (
      <div className="p-6">
        <PageHeader title="Clientes" subtitle="Nenhum cliente cadastrado ainda." action={<PrimaryButton icon={Plus} onClick={openNewClient}>Novo Cliente</PrimaryButton>} />
        {clientModal && <ClientForm cForm={cForm} setCForm={setCForm} onClose={() => setClientModal(null)} onSave={saveClient} isEdit={clientModal !== "new"} />}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Clientes" subtitle={`${clients.length} clientes cadastrados`} action={<PrimaryButton icon={Plus} onClick={openNewClient}>Novo Cliente</PrimaryButton>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="space-y-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Buscar cliente…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full h-10 pl-10 pr-3 rounded-lg bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          {filtered.map((c: any) => (
            <button key={c.id} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${selected.id === c.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/20"}`} onClick={() => setSelectedId(c.id)}>
              <Avatar name={c.name} />
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold text-sm text-foreground truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.vehicles[0] ? `${c.vehicles[0].brand} ${c.vehicles[0].model} · ${c.vehicles[0].plate}` : "Sem veículo"}</div>
              </div>
              <ChevronRight size={15} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </Card>
        <Card className="lg:col-span-2 space-y-6">
          <div className="flex items-start gap-4">
            <Avatar name={selected.name} size={54} />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{selected.name}</h2>
              <span className="text-sm text-muted-foreground">{selected.doc || "Sem documento"}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {selected.phone && <GhostButton icon={MessageCircle} onClick={() => window.open(waLink(selected.phone, `Olá ${selected.name.split(" ")[0]}, tudo bem? Aqui é da equipe.`), "_blank")}>WhatsApp</GhostButton>}
              <GhostButton icon={PenIcon} onClick={() => openEditClient(selected)}>Editar</GhostButton>
              <GhostButton icon={Trash2} danger onClick={() => { setClients((prev: any) => prev.filter((c: any) => c.id !== selected.id)); setSelectedId(null); }}>Excluir</GhostButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-foreground"><Phone size={14} className="text-muted-foreground" />{selected.phone || "—"}</div>
            <div className="flex items-center gap-2 text-sm text-foreground"><MapPin size={14} className="text-muted-foreground" />{selected.address || "—"}</div>
            <div className="flex items-center gap-2 text-sm text-foreground"><DollarSign size={14} className="text-muted-foreground" />Total gasto: <b>{money(totalSpent(selected))}</b></div>
            <div className="flex items-center gap-2 text-sm text-foreground"><Clock size={14} className="text-muted-foreground" />Última visita: {selected.lastVisit ? new Date(selected.lastVisit).toLocaleDateString("pt-BR") : "—"}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-foreground">Veículos</h3>
              <GhostButton icon={Plus} onClick={openNewVehicle}>Adicionar</GhostButton>
            </div>
            {selected.vehicles.length ? (
              <div className="space-y-2">
                {selected.vehicles.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary"><Car size={18} /></div>
                    <div className="flex-1"><div className="font-semibold text-sm text-foreground">{v.brand} {v.model} · {v.year}</div><div className="text-xs text-muted-foreground">{v.color} · Placa {v.plate} · {(v.km || 0).toLocaleString("pt-BR")} km</div></div>
                    <div className="flex gap-1"><IconBtn icon={PenIcon} title="Editar veículo" onClick={() => openEditVehicle(v)} /><IconBtn icon={Trash2} title="Excluir veículo" onClick={() => deleteVehicle(v.id)} /></div>
                  </div>
                ))}
              </div>
            ) : <span className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</span>}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-3">Histórico de serviços</h3>
            {orders.filter((o: any) => o.clientId === selected.id).length ? (
              <div className="space-y-2">
                {orders.filter((o: any) => o.clientId === selected.id).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between py-2"><span className="text-sm text-foreground">{o.serviceName}</span><b className="text-sm text-foreground">{money(o.value)}</b></div>
                ))}
              </div>
            ) : <span className="text-sm text-muted-foreground">Nenhuma OS registrada ainda.</span>}
          </div>
        </Card>
      </div>
      {clientModal && <ClientForm cForm={cForm} setCForm={setCForm} onClose={() => setClientModal(null)} onSave={saveClient} isEdit={clientModal !== "new"} />}
      {vehicleModal && (
        <Modal title={vehicleModal === "new" ? `Novo veículo — ${selected.name}` : `Editar veículo — ${selected.name}`} onClose={() => setVehicleModal(null)} footer={<PrimaryButton onClick={saveVehicle}>Salvar veículo</PrimaryButton>}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Marca"><input value={vForm.brand} onChange={(e) => setVForm({ ...vForm, brand: e.target.value })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
            <Field label="Modelo"><input value={vForm.model} onChange={(e) => setVForm({ ...vForm, model: e.target.value })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
            <Field label="Ano"><input type="number" value={vForm.year} onChange={(e) => setVForm({ ...vForm, year: e.target.value })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
            <Field label="Cor"><input value={vForm.color} onChange={(e) => setVForm({ ...vForm, color: e.target.value })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
            <Field label="Placa"><input value={vForm.plate} onChange={(e) => setVForm({ ...vForm, plate: e.target.value.toUpperCase() })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
            <Field label="Quilometragem"><input type="number" value={vForm.km} onChange={(e) => setVForm({ ...vForm, km: e.target.value })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
          </div>
          <Field label="Observações"><textarea rows={2} value={vForm.notes} onChange={(e) => setVForm({ ...vForm, notes: e.target.value })} className="w-full px-3 py-2 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></Field>
        </Modal>
      )}
    </div>
  );
}

function ClientForm({ cForm, setCForm, onClose, onSave, isEdit }: any) {
  return (
    <Modal title={isEdit ? "Editar Cliente" : "Novo Cliente"} onClose={onClose} footer={<PrimaryButton onClick={onSave}>{isEdit ? "Salvar alterações" : "Salvar cliente"}</PrimaryButton>}>
      <Field label="Nome completo"><input value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="CPF/CNPJ"><input value={cForm.doc} onChange={(e) => setCForm({ ...cForm, doc: e.target.value })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
        <Field label="Telefone / WhatsApp"><input value={cForm.phone} onChange={(e) => setCForm({ ...cForm, phone: e.target.value })} placeholder="11999998888" className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
      </div>
      <Field label="Endereço"><input value={cForm.address} onChange={(e) => setCForm({ ...cForm, address: e.target.value })} className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" /></Field>
      <Field label="Observações"><textarea rows={2} value={cForm.notes} onChange={(e) => setCForm({ ...cForm, notes: e.target.value })} className="w-full px-3 py-2 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" /></Field>
    </Modal>
  );
}
