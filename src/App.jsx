import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MisPedidos from './pages/MisPedidos'
import MisCompras from './pages/MisCompras'
import Notificaciones from './pages/Notificaciones'
import AdminPanel from './pages/AdminPanel'
import './App.css'

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  if (adminOnly && user.role !== 'admin') {
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
