import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MisPedidos from './pages/MisPedidos'
import MisCompras from './pages/MisCompras'
import Notificaciones from './pages/Notificaciones'
import AdminPanel from './pages/AdminPanel'
import AdminPedidos from './pages/AdminPedidos'
import AdminCompras from './pages/AdminCompras'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminReportes from './pages/AdminReportes'
import AdminCentrosCosto from './pages/AdminCentrosCosto'
import AdminConfiguracion from './pages/AdminConfiguracion'
import ValidadorPanel from './pages/ValidadorPanel'
import SupervisorPanel from './pages/SupervisorPanel'
import './App.css'

function PrivateRoute({ children, adminOnly = false, validadorOnly = false }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  if (adminOnly && user.role !== 'admin' && user.role !== 'supervisor') {
    return <Navigate to="/" />
  }

  if (validadorOnly && user.role !== 'validador' && user.role !== 'admin' && user.role !== 'supervisor') {
    return <Navigate to="/" />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/pedidos" element={<PrivateRoute><MisPedidos /></PrivateRoute>} />
      <Route path="/compras" element={<PrivateRoute><MisCompras /></PrivateRoute>} />
      <Route path="/notificaciones" element={<PrivateRoute><Notificaciones /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute adminOnly><AdminPanel /></PrivateRoute>} />
      <Route path="/admin/pedidos" element={<PrivateRoute adminOnly><AdminPedidos /></PrivateRoute>} />
      <Route path="/admin/compras" element={<PrivateRoute adminOnly><AdminCompras /></PrivateRoute>} />
      <Route path="/admin/usuarios" element={<PrivateRoute adminOnly><AdminUsuarios /></PrivateRoute>} />
      <Route path="/admin/reportes" element={<PrivateRoute adminOnly><AdminReportes /></PrivateRoute>} />
      <Route path="/admin/centros-costo" element={<PrivateRoute adminOnly><AdminCentrosCosto /></PrivateRoute>} />
      <Route path="/admin/configuracion" element={<PrivateRoute adminOnly><AdminConfiguracion /></PrivateRoute>} />
      <Route path="/validador" element={<PrivateRoute validadorOnly><ValidadorPanel /></PrivateRoute>} />
      <Route path="/supervisor" element={<PrivateRoute validadorOnly><SupervisorPanel /></PrivateRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App
