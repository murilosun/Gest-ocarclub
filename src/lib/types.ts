export interface Profile {
  id: string
  name: string
  role: string
  company_name: string
  company_suffix: string
  company_mark: string
  company_accent: string
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  doc: string
  phone: string
  whats: boolean
  address: string
  notes: string
  last_visit: string | null
  created_at: string
}

export interface Vehicle {
  id: string
  client_id: string
  user_id: string
  brand: string
  model: string
  year: string
  color: string
  plate: string
  km: number
  notes: string
}

export interface Service {
  id: string
  user_id: string
  name: string
  description: string
  time_estimate: string
  price: number
  commission: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  code: string
  client_id: string | null
  client_name: string
  vehicle_label: string
  service_name: string
  value: number
  discount: number
  tech: string
  notes: string
  status: string
  created_at: string
}

export interface Appointment {
  id: string
  user_id: string
  client_id: string | null
  client_name: string
  service: string
  price: number | null
  discount: number | null
  time: string
  date: string
  status: string
}

export interface Employee {
  id: string
  user_id: string
  name: string
  role: string
  commission: number
  goal: number
  created_at: string
}

export interface Financial {
  id: string
  user_id: string
  type: string
  kind: string
  description: string
  value: number
  date: string
  paid: boolean
  created_at: string
}

export interface Product {
  id: string
  user_id: string
  name: string
  qty: number
  min_qty: number
  unit_cost: number
  supplier: string
  created_at: string
}

export const ORDER_STATUSES = ['Em espera', 'Em andamento', 'Concluído', 'Cancelado'] as const
export const APPOINTMENT_STATUSES = ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'] as const
export const FINANCIAL_TYPES = ['Receita', 'Despesa'] as const
export const FINANCIAL_KINDS = ['Venda', 'Serviço', 'Fixo', 'Variável', 'Investimento', 'Outro'] as const
