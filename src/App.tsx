import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Vehicles from './pages/Vehicles'
import Services from './pages/Services'
import Orders from './pages/Orders'
import Appointments from './pages/Appointments'
import Financial from './pages/Financial'
import Products from './pages/Products'
import Employees from './pages/Employees'
import Settings from './pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { session } = useAuth()
  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="veiculos" element={<Vehicles />} />
        <Route path="servicos" element={<Services />} />
        <Route path="ordens" element={<Orders />} />
        <Route path="agenda" element={<Appointments />} />
        <Route path="financeiro" element={<Financial />} />
        <Route path="produtos" element={<Products />} />
        <Route path="funcionarios" element={<Employees />} />
        <Route path="configuracoes" element={<Settings />} />
      </Route>
    </Routes>
  )
}
