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
            <div className="sidebar-logo">{user.role === 'supervisor' ? '👑' : '📦'}</div>
            <div className="sidebar-title">
              <h2>Gestión Taller</h2>
              <p>{user.role === 'supervisor' ? 'Supervisor' : user.role === 'admin' ? 'Administrador' : user.role === 'validador' ? 'Validador' : 'Usuario'}</p>
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
            {user.role === 'supervisor' ? (
              <>
                <button
                  className={`nav-item ${isActive('/supervisor') ? 'active' : ''}`}
                  onClick={() => navigate('/supervisor')}
                  style={{ backgroundColor: '#ff6b6b', color: 'white', fontWeight: 'bold' }}
                >
                  <span className="nav-icon">👑</span>
                  <span>Panel Supervisor</span>
                </button>
                <button
                  className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
                  onClick={() => navigate('/admin')}
                >
                  <span className="nav-icon">⚙️</span>
                  <span>Panel Admin</span>
                </button>
                <button
                  className={`nav-item ${isActive('/validador') ? 'active' : ''}`}
                  onClick={() => navigate('/validador')}
                >
                  <span className="nav-icon">✓</span>
                  <span>Panel Validador</span>
                </button>
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
            ) : user.role === 'admin' ? (
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
            ) : user.role === 'validador' ? (
              <>
                <button
                  className={`nav-item ${isActive('/validador') ? 'active' : ''}`}
                  onClick={() => navigate('/validador')}
                >
                  <span className="nav-icon">✓</span>
                  <span>Panel Validador</span>
                </button>
                <button
                  className={`nav-item ${isActive('/pedidos') ? 'active' : ''}`}
                  onClick={() => navigate('/pedidos')}
                >
                  <span className="nav-icon">📦</span>
                  <span>Mis Pedidos</span>
                </button>
                <button
                  className={`nav-item ${isActive('/compras') ? 'active' : ''}`}
                  onClick={() => navigate('/compras')}
                >
                  <span className="nav-icon">🧾</span>
                  <span>Mis Compras</span>
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
            {(user.role === 'admin' || user.role === 'supervisor') && (
              <button
                className={`nav-item ${isActive('/admin/configuracion') ? 'active' : ''}`}
                onClick={() => navigate('/admin/configuracion')}
              >
                <span className="nav-icon">⚙️</span>
                <span>Configuración</span>
              </button>
            )}
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
