import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../lib/types'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog, { PageHeader, EmptyState, LoadingState } from '../components/ConfirmDialog'
import { Plus, Search, Pencil, Trash2, Users, Phone, MessageCircle } from 'lucide-react'

const emptyForm = { name: '', doc: '', phone: '', whats: true, address: '', notes: '' }

export default function Clients() {
  const { show } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      show('Erro ao carregar clientes: ' + error.message, 'error')
    } else {
      setClients(data as Client[])
    }
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.doc.includes(search)
  )

  const openNew = () => {
    setEditId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (c: Client) => {
    setEditId(c.id)
    setForm({ name: c.name, doc: c.doc, phone: c.phone, whats: c.whats, address: c.address, notes: c.notes })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) {
      show('Nome é obrigatório', 'error')
      return
    }
    setSaving(true)
    if (editId) {
      const { error } = await supabase.from('clients').update(form).eq('id', editId)
      if (error) show('Erro ao atualizar: ' + error.message, 'error')
      else { show('Cliente atualizado!'); setModalOpen(false); fetchClients() }
    } else {
      const { error } = await supabase.from('clients').insert(form)
      if (error) show('Erro ao criar: ' + error.message, 'error')
      else { show('Cliente criado!'); setModalOpen(false); fetchClients() }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('clients').delete().eq('id', deleteId)
    if (error) show('Erro ao excluir: ' + error.message, 'error')
    else { show('Cliente excluído!'); fetchClients() }
    setDeleteId(null)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Clientes"
        subtitle={`${clients.length} cadastrados`}
        action={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Novo cliente</button>}
      />

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={Users} title="Nenhum cliente" message="Cadastre seu primeiro cliente para começar." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-ink-500">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-ink-100 hover:bg-ink-50 transition">
                    <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                    <td className="px-4 py-3 text-ink-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-ink-400" />
                        {c.phone || '—'}
                        {c.whats && c.phone && <MessageCircle className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{c.doc || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar cliente' : 'Novo cliente'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do cliente" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="label">Documento (CPF/CNPJ)</label>
              <input className="input" value={form.doc} onChange={(e) => setForm({ ...form, doc: e.target.value })} placeholder="000.000.000-00" />
            </div>
          </div>
          <div>
            <label className="label">Endereço</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Endereço completo" />
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input min-h-[80px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas sobre o cliente..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.whats} onChange={(e) => setForm({ ...form, whats: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            <span className="text-sm text-ink-700">Possui WhatsApp</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
