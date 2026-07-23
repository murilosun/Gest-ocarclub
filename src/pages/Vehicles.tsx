import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Vehicle, Client } from '../lib/types'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog, { PageHeader, EmptyState, LoadingState } from '../components/ConfirmDialog'
import { Plus, Search, Pencil, Trash2, Car } from 'lucide-react'

const emptyForm = { client_id: '', brand: '', model: '', year: '', color: '', plate: '', km: 0, notes: '' }

export default function Vehicles() {
  const { show } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [vRes, cRes] = await Promise.all([
      supabase.from('vehicles').select('*').order('brand', { ascending: true }),
      supabase.from('clients').select('id, name').order('name', { ascending: true }),
    ])
    if (vRes.error) show('Erro ao carregar veículos: ' + vRes.error.message, 'error')
    else setVehicles(vRes.data as Vehicle[])
    if (cRes.error) show('Erro ao carregar clientes: ' + cRes.error.message, 'error')
    else setClients(cRes.data as Client[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const clientName = (id: string) => clients.find(c => c.id === id)?.name ?? '—'

  const filtered = vehicles.filter(v =>
    v.brand.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase()) ||
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    clientName(v.client_id).toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => {
    setEditId(null)
    setForm({ ...emptyForm, client_id: clients[0]?.id ?? '' })
    setModalOpen(true)
  }

  const openEdit = (v: Vehicle) => {
    setEditId(v.id)
    setForm({ client_id: v.client_id, brand: v.brand, model: v.model, year: v.year, color: v.color, plate: v.plate, km: v.km, notes: v.notes })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.client_id) { show('Selecione um cliente', 'error'); return }
    if (!form.brand.trim() && !form.model.trim()) { show('Informe marca ou modelo', 'error'); return }
    setSaving(true)
    const payload = { ...form, km: Number(form.km) || 0 }
    if (editId) {
      const { error } = await supabase.from('vehicles').update(payload).eq('id', editId)
      if (error) show('Erro ao atualizar: ' + error.message, 'error')
      else { show('Veículo atualizado!'); setModalOpen(false); fetchData() }
    } else {
      const { error } = await supabase.from('vehicles').insert(payload)
      if (error) show('Erro ao criar: ' + error.message, 'error')
      else { show('Veículo criado!'); setModalOpen(false); fetchData() }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('vehicles').delete().eq('id', deleteId)
    if (error) show('Erro ao excluir: ' + error.message, 'error')
    else { show('Veículo excluído!'); fetchData() }
    setDeleteId(null)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Veículos"
        subtitle={`${vehicles.length} cadastrados`}
        action={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Novo veículo</button>}
      />

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Buscar por marca, modelo, placa ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Car} title="Nenhum veículo" message="Cadastre veículos vinculados aos seus clientes." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-ink-500">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Marca/Modelo</th>
                  <th className="px-4 py-3 font-medium">Ano</th>
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Cor</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-ink-100 hover:bg-ink-50 transition">
                    <td className="px-4 py-3 font-medium text-ink-900">{clientName(v.client_id)}</td>
                    <td className="px-4 py-3 text-ink-700">{v.brand} {v.model}</td>
                    <td className="px-4 py-3 text-ink-600">{v.year || '—'}</td>
                    <td className="px-4 py-3 text-ink-600 font-mono uppercase">{v.plate || '—'}</td>
                    <td className="px-4 py-3 text-ink-600">{v.color || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(v.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar veículo' : 'Novo veículo'}>
        <div className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select className="input" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Marca</label>
              <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Toyota, Honda..." />
            </div>
            <div>
              <label className="label">Modelo</label>
              <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Corolla, Civic..." />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Ano</label>
              <input className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2024" />
            </div>
            <div>
              <label className="label">Cor</label>
              <input className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Preto" />
            </div>
            <div>
              <label className="label">Placa</label>
              <input className="input" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="ABC-1234" />
            </div>
          </div>
          <div>
            <label className="label">KM</label>
            <input type="number" className="input" value={form.km} onChange={(e) => setForm({ ...form, km: Number(e.target.value) })} placeholder="0" />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[60px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas sobre o veículo..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir veículo"
        message="Tem certeza que deseja excluir este veículo?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
