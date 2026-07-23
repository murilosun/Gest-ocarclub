import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Order, Client, Service } from '../lib/types'
import { ORDER_STATUSES } from '../lib/types'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog, { PageHeader, EmptyState, LoadingState } from '../components/ConfirmDialog'
import { Plus, Search, Pencil, Trash2, ClipboardList } from 'lucide-react'

const statusColors: Record<string, string> = {
  'Em espera': 'bg-amber-100 text-amber-700',
  'Em andamento': 'bg-blue-100 text-blue-700',
  'Concluído': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
}

const emptyForm = { code: '', client_id: '', client_name: '', vehicle_label: 'Sem veículo', service_name: '', value: 0, discount: 0, tech: '', notes: '', status: 'Em espera' }

export default function Orders() {
  const { show } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    const [oRes, cRes, sRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name', { ascending: true }),
      supabase.from('services').select('id, name, price').order('name', { ascending: true }),
    ])
    if (oRes.error) show('Erro ao carregar ordens: ' + oRes.error.message, 'error')
    else setOrders(oRes.data as Order[])
    if (cRes.error) show('Erro ao carregar clientes: ' + cRes.error.message, 'error')
    else setClients(cRes.data as Client[])
    if (sRes.error) show('Erro ao carregar serviços: ' + sRes.error.message, 'error')
    else setServices(sRes.data as Service[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = orders.filter(o => {
    const matchSearch = o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.client_name.toLowerCase().includes(search.toLowerCase()) ||
      o.service_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const openNew = () => {
    setEditId(null)
    setForm({ ...emptyForm, code: 'OS-' + String(orders.length + 1).padStart(4, '0') })
    setModalOpen(true)
  }

  const openEdit = (o: Order) => {
    setEditId(o.id)
    setForm({
      code: o.code,
      client_id: o.client_id ?? '',
      client_name: o.client_name,
      vehicle_label: o.vehicle_label,
      service_name: o.service_name,
      value: o.value,
      discount: o.discount,
      tech: o.tech,
      notes: o.notes,
      status: o.status,
    })
    setModalOpen(true)
  }

  const onClientChange = (id: string) => {
    const client = clients.find(c => c.id === id)
    setForm({ ...form, client_id: id, client_name: client?.name ?? '' })
  }

  const onServiceChange = (name: string) => {
    const service = services.find(s => s.name === name)
    setForm({ ...form, service_name: name, value: service?.price ?? form.value })
  }

  const save = async () => {
    if (!form.code.trim()) { show('Código é obrigatório', 'error'); return }
    if (!form.client_name.trim()) { show('Selecione um cliente', 'error'); return }
    if (!form.service_name.trim()) { show('Selecione um serviço', 'error'); return }
    setSaving(true)
    const payload = {
      ...form,
      client_id: form.client_id || null,
      value: Number(form.value) || 0,
      discount: Number(form.discount) || 0,
    }
    if (editId) {
      const { error } = await supabase.from('orders').update(payload).eq('id', editId)
      if (error) show('Erro ao atualizar: ' + error.message, 'error')
      else { show('Ordem atualizada!'); setModalOpen(false); fetchData() }
    } else {
      const { error } = await supabase.from('orders').insert(payload)
      if (error) show('Erro ao criar: ' + error.message, 'error')
      else { show('Ordem criada!'); setModalOpen(false); fetchData() }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('orders').delete().eq('id', deleteId)
    if (error) show('Erro ao excluir: ' + error.message, 'error')
    else { show('Ordem excluída!'); fetchData() }
    setDeleteId(null)
  }

  const total = (o: Order) => Number(o.value) - Number(o.discount)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Ordens de Serviço"
        subtitle={`${orders.length} cadastradas`}
        action={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Nova ordem</button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Buscar por código, cliente ou serviço..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input sm:w-48">
          <option value="">Todos os status</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={ClipboardList} title="Nenhuma ordem de serviço" message="Crie ordens de serviço para acompanhar os trabalhos da sua estética." /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-ink-500">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Serviço</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b border-ink-100 hover:bg-ink-50 transition">
                    <td className="px-4 py-3 font-mono font-medium text-ink-900">{o.code}</td>
                    <td className="px-4 py-3 text-ink-700">{o.client_name}</td>
                    <td className="px-4 py-3 text-ink-600">{o.service_name}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">R$ {total(o).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${statusColors[o.status] ?? 'bg-ink-100 text-ink-600'}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(o)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(o.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar ordem de serviço' : 'Nova ordem de serviço'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Código *</label>
              <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="OS-0001" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Cliente *</label>
            <select className="input" value={form.client_id} onChange={(e) => onClientChange(e.target.value)}>
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Veículo (descrição)</label>
            <input className="input" value={form.vehicle_label} onChange={(e) => setForm({ ...form, vehicle_label: e.target.value })} placeholder="Honda Civic 2020 - Preto" />
          </div>
          <div>
            <label className="label">Serviço *</label>
            <select className="input" value={form.service_name} onChange={(e) => onServiceChange(e.target.value)}>
              <option value="">Selecione um serviço...</option>
              {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Desconto (R$)</label>
              <input type="number" step="0.01" className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Técnico</label>
              <input className="input" value={form.tech} onChange={(e) => setForm({ ...form, tech: e.target.value })} placeholder="Nome do técnico" />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[70px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas sobre a ordem..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir ordem"
        message="Tem certeza que deseja excluir esta ordem de serviço?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
