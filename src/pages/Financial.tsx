import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Financial } from '../lib/types'
import { FINANCIAL_TYPES, FINANCIAL_KINDS } from '../lib/types'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog, { PageHeader, EmptyState, LoadingState } from '../components/ConfirmDialog'
import { Plus, Search, Pencil, Trash2, Wallet, TrendingUp, TrendingDown } from 'lucide-react'

const emptyForm = { type: 'Receita', kind: 'Serviço', description: '', value: 0, date: new Date().toISOString().slice(0, 10), paid: false }

export default function FinancialPage() {
  const { show } = useToast()
  const [entries, setEntries] = useState<Financial[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchEntries = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('financial').select('*').order('date', { ascending: false })
    if (error) show('Erro ao carregar financeiro: ' + error.message, 'error')
    else setEntries(data as Financial[])
    setLoading(false)
  }

  useEffect(() => { fetchEntries() }, [])

  const filtered = entries.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || e.type === typeFilter
    return matchSearch && matchType
  })

  const totalReceita = entries.filter(e => e.type === 'Receita' && e.paid).reduce((s, e) => s + Number(e.value), 0)
  const totalDespesa = entries.filter(e => e.type === 'Despesa' && e.paid).reduce((s, e) => s + Number(e.value), 0)
  const saldo = totalReceita - totalDespesa

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (e: Financial) => {
    setEditId(e.id)
    setForm({ type: e.type, kind: e.kind, description: e.description, value: e.value, date: e.date, paid: e.paid })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.description.trim()) { show('Descrição é obrigatória', 'error'); return }
    setSaving(true)
    const payload = { ...form, value: Number(form.value) || 0 }
    if (editId) {
      const { error } = await supabase.from('financial').update(payload).eq('id', editId)
      if (error) show('Erro ao atualizar: ' + error.message, 'error')
      else { show('Lançamento atualizado!'); setModalOpen(false); fetchEntries() }
    } else {
      const { error } = await supabase.from('financial').insert(payload)
      if (error) show('Erro ao criar: ' + error.message, 'error')
      else { show('Lançamento criado!'); setModalOpen(false); fetchEntries() }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('financial').delete().eq('id', deleteId)
    if (error) show('Erro ao excluir: ' + error.message, 'error')
    else { show('Lançamento excluído!'); fetchEntries() }
    setDeleteId(null)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Financeiro"
        subtitle="Controle de receitas e despesas"
        action={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Novo lançamento</button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <div>
              <div className="text-sm text-ink-500">Receitas</div>
              <div className="text-lg font-bold text-green-600">R$ {totalReceita.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <div>
              <div className="text-sm text-ink-500">Despesas</div>
              <div className="text-lg font-bold text-red-600">R$ {totalDespesa.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center"><Wallet className="w-5 h-5 text-brand-600" /></div>
            <div>
              <div className="text-sm text-ink-500">Saldo</div>
              <div className={`text-lg font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {saldo.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Buscar lançamento..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input sm:w-48">
          <option value="">Todos</option>
          {FINANCIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Wallet} title="Nenhum lançamento" message="Registre receitas e despesas para acompanhar suas finanças." /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-ink-500">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Pago</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b border-ink-100 hover:bg-ink-50 transition">
                    <td className="px-4 py-3 text-ink-600">{new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{e.description}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${e.type === 'Receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{e.type}</span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${e.type === 'Receita' ? 'text-green-600' : 'text-red-600'}`}>R$ {Number(e.value).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${e.paid ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>{e.paid ? 'Pago' : 'Pendente'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(e.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar lançamento' : 'Novo lançamento'}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {FINANCIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {FINANCIAL_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição *</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do lançamento" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" className="input" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            <span className="text-sm text-ink-700">Pago</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir lançamento"
        message="Tem certeza que deseja excluir este lançamento?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
