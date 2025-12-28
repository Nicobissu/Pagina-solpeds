import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

function Layout({ children, showSidebar = true }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Helper para verificar si una ruta está activa
  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="layout">
      {showSidebar && user && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">📦</div>
            <div className="sidebar-title">
              <h2>Gestión Taller</h2>
              <p>{user.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${isActive('/') ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              <span className="nav-icon">🏠</span>
              <span>Inicio</span>
            </button>
            {user.role === 'admin' ? (
              <>
                <button
                  className={`nav-item ${isActive('/admin/pedidos') ? 'active' : ''}`}
                  onClick={() => navigate('/admin/pedidos')}
                >
                  <span className="nav-icon">📦</span>
                  <span>Pedidos</span>
                </button>
                <button
                  className={`nav-item ${isActive('/admin/compras') ? 'active' : ''}`}
                  onClick={() => navigate('/admin/compras')}
                >
                  <span className="nav-icon">🧾</span>
                  <span>Compras</span>
                </button>
                <button
                  className={`nav-item ${isActive('/admin/usuarios') ? 'active' : ''}`}
                  onClick={() => navigate('/admin/usuarios')}
                >
                  <span className="nav-icon">👥</span>
                  <span>Usuarios</span>
                </button>
                <button
                  className={`nav-item ${isActive('/admin/reportes') ? 'active' : ''}`}
                  onClick={() => navigate('/admin/reportes')}
                >
                  <span className="nav-icon">📊</span>
                  <span>Reportes</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className={`nav-item ${isActive('/pedidos') ? 'active' : ''}`}
                  onClick={() => navigate('/pedidos')}
                >
                  <span className="nav-icon">📦</span>
                  <span>Pedidos</span>
                </button>
                <button
                  className={`nav-item ${isActive('/compras') ? 'active' : ''}`}
                  onClick={() => navigate('/compras')}
                >
                  <span className="nav-icon">🧾</span>
                  <span>Compras</span>
                </button>
              </>
            )}
            <button
              className={`nav-item ${isActive('/notificaciones') ? 'active' : ''}`}
              onClick={() => navigate('/notificaciones')}
            >
              <span className="nav-icon">🔔</span>
              <span>Notificaciones</span>
            </button>
            <button
              className={`nav-item ${isActive(user.role === 'admin' ? '/admin/configuracion' : '/configuracion') ? 'active' : ''}`}
              onClick={() => navigate(user.role === 'admin' ? '/admin/configuracion' : '/configuracion')}
            >
              <span className="nav-icon">⚙️</span>
              <span>Configuración</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>
      )}

      <main className={`main-content ${!showSidebar ? 'full-width' : ''}`}>
        {children}
      </main>
    </div>
  )
}

export default Layout
