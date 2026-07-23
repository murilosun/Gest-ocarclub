import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Profile } from '../lib/types'
import { useToast } from '../components/Toast'
import { PageHeader } from '../components/ConfirmDialog'
import { Save, Loader2, Building2, User } from 'lucide-react'

const accentColors = [
  { name: 'Laranja', value: '#FF6A00' },
  { name: 'Azul', value: '#2563EB' },
  { name: 'Verde', value: '#16A34A' },
  { name: 'Vermelho', value: '#DC2626' },
  { name: 'Roxo', value: '#9333EA' },
  { name: 'Ciano', value: '#0891B2' },
  { name: 'Rosa', value: '#DB2777' },
  { name: 'Amarelo', value: '#CA8A04' },
]

export default function Settings() {
  const { profile, user, refreshProfile } = useAuth()
  const { show } = useToast()
  const [form, setForm] = useState({
    name: '',
    role: 'Administrador',
    company_name: 'ClubOS',
    company_suffix: 'by Car Club',
    company_mark: 'C',
    company_accent: '#FF6A00',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        role: profile.role,
        company_name: profile.company_name,
        company_suffix: profile.company_suffix,
        company_mark: profile.company_mark,
        company_accent: profile.company_accent,
      })
    }
  }, [profile])

  const save = async () => {
    if (!form.name.trim()) { show('Nome é obrigatório', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', user!.id)
    if (error) {
      show('Erro ao salvar: ' + error.message, 'error')
    } else {
      show('Configurações salvas!')
      await refreshProfile()
    }
    setSaving(false)
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Configurações" subtitle="Personalize seu perfil e sua empresa" />

      <div className="space-y-6">
        {/* Personal info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-ink-900">Dados pessoais</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" />
            </div>
            <div>
              <label className="label">Cargo</label>
              <input className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Administrador, Gerente..." />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input bg-ink-50" value={user?.email ?? ''} disabled />
            </div>
          </div>
        </div>

        {/* Company info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-ink-900">Identidade da empresa</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome da empresa</label>
                <input className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="ClubOS" />
              </div>
              <div>
                <label className="label">Sufixo</label>
                <input className="input" value={form.company_suffix} onChange={(e) => setForm({ ...form, company_suffix: e.target.value })} placeholder="by Car Club" />
              </div>
            </div>
            <div>
              <label className="label">Marca (iniciais)</label>
              <input className="input sm:w-24" maxLength={2} value={form.company_mark} onChange={(e) => setForm({ ...form, company_mark: e.target.value })} placeholder="C" />
            </div>
            <div>
              <label className="label">Cor de destaque</label>
              <div className="flex flex-wrap gap-2">
                {accentColors.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setForm({ ...form, company_accent: c.value })}
                    className={`w-10 h-10 rounded-xl transition ${form.company_accent === c.value ? 'ring-2 ring-offset-2 ring-ink-400 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-6">
          <h2 className="font-bold text-ink-900 mb-4">Pré-visualização</h2>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-ink-950">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg shrink-0"
              style={{ backgroundColor: form.company_accent }}
            >
              {form.company_mark}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-sm truncate">{form.company_name}</div>
              <div className="text-ink-400 text-xs truncate">{form.company_suffix}</div>
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}
