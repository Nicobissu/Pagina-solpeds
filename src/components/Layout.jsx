import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

function Layout({ children, showSidebar = true }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      {showSidebar && user && user.role !== 'admin' && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">📦</div>
            <div className="sidebar-title">
              <h2>Gestión Taller</h2>
              <p>{user.role === 'admin' ? 'Admin Role' : 'Admin Role'}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className="nav-item active"
              onClick={() => navigate('/')}
            >
              <span className="nav-icon">🏠</span>
              <span>Inicio</span>
            </button>
            <button
              className="nav-item"
              onClick={() => navigate('/pedidos')}
            >
              <span className="nav-icon">📦</span>
              <span>Pedidos</span>
            </button>
            <button
              className="nav-item"
              onClick={() => navigate('/compras')}
            >
              <span className="nav-icon">🧾</span>
              <span>Compras</span>
            </button>
            <button
              className="nav-item"
              onClick={() => navigate('/notificaciones')}
            >
              <span className="nav-icon">🔔</span>
              <span>Notificaciones</span>
            </button>
            <button className="nav-item">
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
