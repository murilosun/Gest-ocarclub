import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Users, Car, ClipboardList, CalendarDays, TrendingUp, Wallet, Clock, CheckCircle2 } from 'lucide-react'

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    clients: 0,
    vehicles: 0,
    orders: 0,
    ordersPending: 0,
    appointmentsToday: 0,
    revenueMonth: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

      const [clients, vehicles, orders, ordersPending, appointments, revenue] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['Em espera', 'Em andamento']),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('date', today),
        supabase.from('financial').select('value').eq('type', 'Receita').eq('paid', true).gte('date', monthStart),
      ])

      const monthRevenue = revenue.data?.reduce((sum, r) => sum + Number(r.value), 0) ?? 0

      setStats({
        clients: clients.count ?? 0,
        vehicles: vehicles.count ?? 0,
        orders: orders.count ?? 0,
        ordersPending: ordersPending.count ?? 0,
        appointmentsToday: appointments.count ?? 0,
        revenueMonth: monthRevenue,
      })
      setLoading(false)
    }
    fetchStats()
  }, [])

  const firstName = profile?.name?.split(' ')[0] ?? 'Usuário'

  const cards = [
    { label: 'Clientes', value: stats.clients, icon: Users, color: 'bg-blue-500' },
    { label: 'Veículos', value: stats.vehicles, icon: Car, color: 'bg-emerald-500' },
    { label: 'Ordens de Serviço', value: stats.orders, icon: ClipboardList, color: 'bg-brand-500' },
    { label: 'OS em andamento', value: stats.ordersPending, icon: Clock, color: 'bg-amber-500' },
    { label: 'Agenda hoje', value: stats.appointmentsToday, icon: CalendarDays, color: 'bg-purple-500' },
    { label: 'Receita do mês', value: stats.revenueMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: TrendingUp, color: 'bg-green-600' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-ink-900">Olá, {firstName}!</h1>
        <p className="text-sm text-ink-500 mt-0.5">Aqui está um resumo do seu negócio.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="card p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center shrink-0`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-ink-500 truncate">{card.label}</div>
                  <div className="text-xl font-bold text-ink-900 truncate">{card.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
