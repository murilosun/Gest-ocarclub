import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Service } from '../lib/types'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog, { PageHeader, EmptyState, LoadingState } from '../components/ConfirmDialog'
import { Plus, Search, Pencil, Trash2, Wrench, Clock } from 'lucide-react'

const emptyForm = { name: '', description: '', time_estimate: '', price: 0, commission: 0 }

export default function Services() {
  const { show } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchServices = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('services').select('*').order('name', { ascending: true })
    if (error) show('Erro ao carregar serviços: ' + error.message, 'error')
    else setServices(data as Service[])
    setLoading(false)
  }

  useEffect(() => { fetchServices() }, [])

  const filtered = services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (s: Service) => {
    setEditId(s.id)
    setForm({ name: s.name, description: s.description, time_estimate: s.time_estimate, price: s.price, commission: s.commission })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) { show('Nome é obrigatório', 'error'); return }
    setSaving(true)
    const payload = { ...form, price: Number(form.price) || 0, commission: Number(form.commission) || 0 }
    if (editId) {
      const { error } = await supabase.from('services').update(payload).eq('id', editId)
      if (error) show('Erro ao atualizar: ' + error.message, 'error')
      else { show('Serviço atualizado!'); setModalOpen(false); fetchServices() }
    } else {
      const { error } = await supabase.from('services').insert(payload)
      if (error) show('Erro ao criar: ' + error.message, 'error')
      else { show('Serviço criado!'); setModalOpen(false); fetchServices() }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('services').delete().eq('id', deleteId)
    if (error) show('Erro ao excluir: ' + error.message, 'error')
    else { show('Serviço excluído!'); fetchServices() }
    setDeleteId(null)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Serviços"
        subtitle={`${services.length} cadastrados`}
        action={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Novo serviço</button>}
      />

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input type="text" placeholder="Buscar serviço..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Wrench} title="Nenhum serviço" message="Cadastre os serviços oferecidos pela sua estética." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-ink-900 truncate">{s.name}</h3>
                  <p className="text-sm text-ink-500 mt-1 line-clamp-2">{s.description || 'Sem descrição'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ink-100">
                <div>
                  <div className="text-xs text-ink-400">Preço</div>
                  <div className="font-bold text-brand-600">R$ {Number(s.price).toFixed(2)}</div>
                </div>
                {s.time_estimate && (
                  <div className="flex items-center gap-1 text-sm text-ink-500">
                    <Clock className="w-3.5 h-3.5" />
                    {s.time_estimate}
                  </div>
                )}
                <div className="ml-auto">
                  <div className="text-xs text-ink-400">Comissão</div>
                  <div className="text-sm font-medium text-ink-700">{Number(s.commission).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar serviço' : 'Novo serviço'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Polimento técnico, Lavagem completa..." />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input min-h-[70px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o serviço..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Preço (R$)</label>
              <input type="number" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Comissão (%)</label>
              <input type="number" className="input" value={form.commission} onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })} placeholder="0" />
            </div>
            <div>
              <label className="label">Tempo estimado</label>
              <input className="input" value={form.time_estimate} onChange={(e) => setForm({ ...form, time_estimate: e.target.value })} placeholder="2h, 1 dia..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir serviço"
        message="Tem certeza que deseja excluir este serviço?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
