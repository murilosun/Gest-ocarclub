import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../lib/types'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog, { PageHeader, EmptyState, LoadingState } from '../components/ConfirmDialog'
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle } from 'lucide-react'

const emptyForm = { name: '', qty: 0, min_qty: 0, unit_cost: 0, supplier: '' }

export default function Products() {
  const { show } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true })
    if (error) show('Erro ao carregar produtos: ' + error.message, 'error')
    else setProducts(data as Product[])
    setLoading(false)
  }

  useEffect(() => { fetchProducts() }, [])

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const lowStock = products.filter(p => p.qty <= p.min_qty)

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (p: Product) => {
    setEditId(p.id)
    setForm({ name: p.name, qty: p.qty, min_qty: p.min_qty, unit_cost: p.unit_cost, supplier: p.supplier })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) { show('Nome é obrigatório', 'error'); return }
    setSaving(true)
    const payload = { ...form, qty: Number(form.qty) || 0, min_qty: Number(form.min_qty) || 0, unit_cost: Number(form.unit_cost) || 0 }
    if (editId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editId)
      if (error) show('Erro ao atualizar: ' + error.message, 'error')
      else { show('Produto atualizado!'); setModalOpen(false); fetchProducts() }
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) show('Erro ao criar: ' + error.message, 'error')
      else { show('Produto criado!'); setModalOpen(false); fetchProducts() }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('products').delete().eq('id', deleteId)
    if (error) show('Erro ao excluir: ' + error.message, 'error')
    else { show('Produto excluído!'); fetchProducts() }
    setDeleteId(null)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} cadastrados${lowStock.length > 0 ? ` · ${lowStock.length} com estoque baixo` : ''}`}
        action={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Novo produto</button>}
      />

      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {lowStock.length} produto(s) com estoque baixo ou zerado.
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={Package} title="Nenhum produto" message="Cadastre produtos para controlar seu estoque." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const isLow = p.qty <= p.min_qty
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink-900 truncate">{p.name}</h3>
                    {p.supplier && <p className="text-sm text-ink-500 mt-0.5 truncate">{p.supplier}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ink-100">
                  <div>
                    <div className="text-xs text-ink-400">Estoque</div>
                    <div className={`font-bold ${isLow ? 'text-red-600' : 'text-ink-900'}`}>{p.qty} un.</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-400">Mínimo</div>
                    <div className="text-sm font-medium text-ink-700">{p.min_qty} un.</div>
                  </div>
                  <div className="ml-auto">
                    <div className="text-xs text-ink-400">Custo unit.</div>
                    <div className="text-sm font-medium text-ink-700">R$ {Number(p.unit_cost).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar produto' : 'Novo produto'}>
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Shampoo automotivo..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Quantidade em estoque</label>
              <input type="number" className="input" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} placeholder="0" />
            </div>
            <div>
              <label className="label">Estoque mínimo</label>
              <input type="number" className="input" value={form.min_qty} onChange={(e) => setForm({ ...form, min_qty: Number(e.target.value) })} placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Custo unitário (R$)</label>
              <input type="number" step="0.01" className="input" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Fornecedor</label>
              <input className="input" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Nome do fornecedor" />
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
        title="Excluir produto"
        message="Tem certeza que deseja excluir este produto?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
