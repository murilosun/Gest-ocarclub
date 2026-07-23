import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Employee } from '../lib/types'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog, { PageHeader, EmptyState, LoadingState } from '../components/ConfirmDialog'
import { Plus, Search, Pencil, Trash2, UserCog } from 'lucide-react'

const emptyForm = { name: '', role: '', commission: 0, goal: 0 }

export default function Employees() {
  const { show } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchEmployees = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('employees').select('*').order('name', { ascending: true })
    if (error) show('Erro ao carregar funcionários: ' + error.message, 'error')
    else setEmployees(data as Employee[])
    setLoading(false)
  }

  useEffect(() => { fetchEmployees() }, [])

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()))

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (e: Employee) => {
    setEditId(e.id)
    setForm({ name: e.name, role: e.role, commission: e.commission, goal: e.goal })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) { show('Nome é obrigatório', 'error'); return }
    setSaving(true)
    const payload = { ...form, commission: Number(form.commission) || 0, goal: Number(form.goal) || 0 }
    if (editId) {
      const { error } = await supabase.from('employees').update(payload).eq('id', editId)
      if (error) show('Erro ao atualizar: ' + error.message, 'error')
      else { show('Funcionário atualizado!'); setModalOpen(false); fetchEmployees() }
    } else {
      const { error } = await supabase.from('employees').insert(payload)
      if (error) show('Erro ao criar: ' + error.message, 'error')
      else { show('Funcionário criado!'); setModalOpen(false); fetchEmployees() }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('employees').delete().eq('id', deleteId)
    if (error) show('Erro ao excluir: ' + error.message, 'error')
    else { show('Funcionário excluído!'); fetchEmployees() }
    setDeleteId(null)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Funcionários"
        subtitle={`${employees.length} cadastrados`}
        action={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Novo funcionário</button>}
      />

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input type="text" placeholder="Buscar funcionário..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={UserCog} title="Nenhum funcionário" message="Cadastre sua equipe para gerenciar comissões e metas." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(e => (
            <div key={e.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <span className="font-bold text-brand-600">{e.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink-900 truncate">{e.name}</h3>
                    <p className="text-sm text-ink-500 truncate">{e.role || 'Sem cargo'}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(e)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(e.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-ink-100">
                <div>
                  <div className="text-xs text-ink-400">Comissão</div>
                  <div className="text-sm font-bold text-ink-900">{Number(e.commission).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-xs text-ink-400">Meta</div>
                  <div className="text-sm font-bold text-ink-900">R$ {Number(e.goal).toFixed(0)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar funcionário' : 'Novo funcionário'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do funcionário" />
          </div>
          <div>
            <label className="label">Cargo</label>
            <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Lavador, Polidor..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Comissão (%)</label>
              <input type="number" className="input" value={form.commission} onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })} placeholder="0" />
            </div>
            <div>
              <label className="label">Meta (R$)</label>
              <input type="number" step="0.01" className="input" value={form.goal} onChange={(e) => setForm({ ...form, goal: Number(e.target.value) })} placeholder="0.00" />
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
        title="Excluir funcionário"
        message="Tem certeza que deseja excluir este funcionário?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
