import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Appointment, Client, Service } from '../lib/types'
import { APPOINTMENT_STATUSES } from '../lib/types'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog, { PageHeader, EmptyState, LoadingState } from '../components/ConfirmDialog'
import { Plus, Pencil, Trash2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const statusColors: Record<string, string> = {
  'Agendado': 'bg-amber-100 text-amber-700',
  'Confirmado': 'bg-blue-100 text-blue-700',
  'Concluído': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
}

const emptyForm = { client_id: '', client_name: '', service: '', price: 0, discount: 0, time: '09:00', date: new Date().toISOString().slice(0, 10), status: 'Agendado' }

export default function Appointments() {
  const { show } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 10))

  const fetchData = async () => {
    setLoading(true)
    const [aRes, cRes, sRes] = await Promise.all([
      supabase.from('appointments').select('*').order('date', { ascending: true }),
      supabase.from('clients').select('id, name').order('name', { ascending: true }),
      supabase.from('services').select('id, name, price').order('name', { ascending: true }),
    ])
    if (aRes.error) show('Erro ao carregar agenda: ' + aRes.error.message, 'error')
    else setAppointments(aRes.data as Appointment[])
    if (cRes.error) show('Erro ao carregar clientes: ' + cRes.error.message, 'error')
    else setClients(cRes.data as Client[])
    if (sRes.error) show('Erro ao carregar serviços: ' + sRes.error.message, 'error')
    else setServices(sRes.data as Service[])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const dayAppointments = appointments
    .filter(a => a.date === viewDate)
    .sort((a, b) => a.time.localeCompare(b.time))

  const changeDay = (delta: number) => {
    const d = new Date(viewDate)
    d.setDate(d.getDate() + delta)
    setViewDate(d.toISOString().slice(0, 10))
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const openNew = () => {
    setEditId(null)
    setForm({ ...emptyForm, date: viewDate })
    setModalOpen(true)
  }

  const openEdit = (a: Appointment) => {
    setEditId(a.id)
    setForm({
      client_id: a.client_id ?? '',
      client_name: a.client_name,
      service: a.service,
      price: a.price ?? 0,
      discount: a.discount ?? 0,
      time: a.time,
      date: a.date,
      status: a.status,
    })
    setModalOpen(true)
  }

  const onClientChange = (id: string) => {
    const client = clients.find(c => c.id === id)
    setForm({ ...form, client_id: id, client_name: client?.name ?? '' })
  }

  const onServiceChange = (name: string) => {
    const service = services.find(s => s.name === name)
    setForm({ ...form, service: name, price: service?.price ?? form.price })
  }

  const save = async () => {
    if (!form.client_name.trim()) { show('Selecione um cliente', 'error'); return }
    if (!form.service.trim()) { show('Selecione um serviço', 'error'); return }
    setSaving(true)
    const payload = {
      ...form,
      client_id: form.client_id || null,
      price: Number(form.price) || null,
      discount: Number(form.discount) || null,
    }
    if (editId) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', editId)
      if (error) show('Erro ao atualizar: ' + error.message, 'error')
      else { show('Agendamento atualizado!'); setModalOpen(false); fetchData() }
    } else {
      const { error } = await supabase.from('appointments').insert(payload)
      if (error) show('Erro ao criar: ' + error.message, 'error')
      else { show('Agendamento criado!'); setModalOpen(false); fetchData() }
    }
    setSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    const { error } = await supabase.from('appointments').delete().eq('id', deleteId)
    if (error) show('Erro ao excluir: ' + error.message, 'error')
    else { show('Agendamento excluído!'); fetchData() }
    setDeleteId(null)
  }

  const upcomingDates = [...new Set(appointments.map(a => a.date))].sort().slice(0, 7)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Agenda"
        subtitle="Gerencie seus agendamentos"
        action={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4" /> Novo agendamento</button>}
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar day selector */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeDay(-1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-600"><ChevronLeft className="w-5 h-5" /></button>
                <button onClick={() => setViewDate(new Date().toISOString().slice(0, 10))} className="text-sm font-semibold text-brand-600 hover:underline">Hoje</button>
                <button onClick={() => changeDay(1)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-600"><ChevronRight className="w-5 h-5" /></button>
              </div>
              <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="input" />
              <div className="mt-4 space-y-1">
                <div className="text-xs font-medium text-ink-400 mb-2">Próximas datas com agendamentos:</div>
                {upcomingDates.length === 0 ? (
                  <div className="text-sm text-ink-400">Nenhum agendamento futuro.</div>
                ) : (
                  upcomingDates.map(d => (
                    <button
                      key={d}
                      onClick={() => setViewDate(d)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${d === viewDate ? 'bg-brand-500 text-white' : 'hover:bg-ink-100 text-ink-700'}`}
                    >
                      {new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      <span className="ml-2 text-xs opacity-70">({appointments.filter(a => a.date === d).length})</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Day appointments */}
          <div className="lg:col-span-2">
            <div className="card p-5">
              <h2 className="font-bold text-ink-900 capitalize mb-4">{formatDate(viewDate)}</h2>
              {dayAppointments.length === 0 ? (
                <EmptyState icon={CalendarDays} title="Sem agendamentos" message="Não há agendamentos para esta data." />
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map(a => (
                    <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-ink-100 hover:border-ink-200 transition">
                      <div className="text-center shrink-0">
                        <div className="text-lg font-bold text-brand-600">{a.time}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink-900 truncate">{a.client_name}</div>
                        <div className="text-sm text-ink-500 truncate">{a.service}</div>
                      </div>
                      <span className={`badge ${statusColors[a.status] ?? 'bg-ink-100 text-ink-600'} shrink-0`}>{a.status}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-ink-100 text-ink-500"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar agendamento' : 'Novo agendamento'}>
        <div className="space-y-4">
          <div>
            <label className="label">Cliente *</label>
            <select className="input" value={form.client_id} onChange={(e) => onClientChange(e.target.value)}>
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Serviço *</label>
            <select className="input" value={form.service} onChange={(e) => onServiceChange(e.target.value)}>
              <option value="">Selecione um serviço...</option>
              {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Horário</label>
              <input type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Preço (R$)</label>
              <input type="number" step="0.01" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Desconto (R$)</label>
              <input type="number" step="0.01" className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {APPOINTMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir agendamento"
        message="Tem certeza que deseja excluir este agendamento?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
