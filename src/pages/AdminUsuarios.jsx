import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './AdminPanel.css'

function AdminUsuarios() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')

  // Mock data - Frontend only
  const usuarios = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      avatar: '👨',
      email: 'juan@example.com',
      rol: 'Usuario',
      comprasMes: 12,
      totalGastado: 45320.50,
      pedidosTotales: 28,
      frecuenciaPedidos: '2.3 por semana',
      ultimaActividad: '2024-12-24'
    },
    {
      id: 2,
      nombre: 'Luis Gómez',
      avatar: '👨‍💼',
      email: 'luis@example.com',
      rol: 'Usuario',
      comprasMes: 8,
      totalGastado: 32150.75,
      pedidosTotales: 19,
      frecuenciaPedidos: '1.8 por semana',
      ultimaActividad: '2024-12-23'
    },
    {
      id: 3,
      nombre: 'Carlos Ruiz',
      avatar: '👷',
      email: 'carlos@example.com',
      rol: 'Usuario',
      comprasMes: 15,
      totalGastado: 58900.00,
      pedidosTotales: 34,
      frecuenciaPedidos: '3.1 por semana',
      ultimaActividad: '2024-12-25'
    },
    {
      id: 4,
      nombre: 'Ana Martínez',
      avatar: '👩',
      email: 'ana@example.com',
      rol: 'Usuario',
      comprasMes: 6,
      totalGastado: 21400.25,
      pedidosTotales: 15,
      frecuenciaPedidos: '1.2 por semana',
      ultimaActividad: '2024-12-22'
    },
    {
      id: 5,
      nombre: 'Sofía López',
      avatar: '👩‍💼',
      email: 'sofia@example.com',
      rol: 'Usuario',
      comprasMes: 10,
      totalGastado: 38750.60,
      pedidosTotales: 22,
      frecuenciaPedidos: '2.0 por semana',
      ultimaActividad: '2024-12-24'
    },
    {
      id: 6,
      nombre: 'Admin',
      avatar: '👤',
      email: 'admin@example.com',
      rol: 'Administrador',
      comprasMes: 0,
      totalGastado: 0,
      pedidosTotales: 0,
      frecuenciaPedidos: '-',
      ultimaActividad: '2024-12-25'
    }
  ]

  const usuariosFiltrados = usuarios.filter(u => {
    if (!busqueda) return true
    const searchLower = busqueda.toLowerCase()
    return (
      u.nombre.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.rol.toLowerCase().includes(searchLower)
    )
  })

  const totalUsuarios = usuarios.filter(u => u.rol === 'Usuario').length
  const totalComprasMes = usuarios.reduce((sum, u) => sum + u.comprasMes, 0)
  const totalGastadoGeneral = usuarios.reduce((sum, u) => sum + u.totalGastado, 0)
  const promedioPedidos = (usuarios.reduce((sum, u) => sum + u.pedidosTotales, 0) / totalUsuarios).toFixed(1)

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">⚙️</div>
          <div className="admin-title">
            <h2>AdminPanel</h2>
            <p>Gestión v2.0</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="admin-nav-item" onClick={() => navigate('/admin')}>
            <span className="nav-icon">📥</span>
            <span>Bandeja de Entrada</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate('/admin/pedidos')}>
            <span className="nav-icon">📦</span>
            <span>Pedidos</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate('/admin/compras')}>
            <span className="nav-icon">🧾</span>
            <span>Compras</span>
          </button>
          <button className="admin-nav-item active">
            <span className="nav-icon">👥</span>
            <span>Usuarios</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate('/admin/reportes')}>
            <span className="nav-icon">📊</span>
            <span>Reportes</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate('/admin/centros-costo')}>
            <span className="nav-icon">🏢</span>
            <span>Centros de Costo</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate('/admin/configuracion')}>
            <span className="nav-icon">⚙️</span>
            <span>Configuración</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar">👤</div>
            <div className="admin-user-info">
              <p className="admin-user-name">{user.name}</p>
              <p className="admin-user-role">Administrador</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={() => { logout(); navigate('/login'); }}>
            <span>🚪</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-breadcrumb">
          <span>Inicio</span>
          <span>›</span>
          <span>Usuarios</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>Gestión de Usuarios</h1>
            <p>Monitorea la actividad y estadísticas de los usuarios</p>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card blue">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <p className="stat-label">Total Usuarios</p>
              <p className="stat-value">{totalUsuarios}</p>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <p className="stat-label">Compras Este Mes</p>
              <p className="stat-value">{totalComprasMes}</p>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <p className="stat-label">Total Gastado</p>
              <p className="stat-value">${totalGastadoGeneral.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <p className="stat-label">Promedio Pedidos</p>
              <p className="stat-value">{promedioPedidos}</p>
            </div>
          </div>
        </div>

        <div className="admin-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, email o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>EMAIL</th>
                <th>ROL</th>
                <th>COMPRAS MES</th>
                <th>TOTAL GASTADO</th>
                <th>PEDIDOS TOTALES</th>
                <th>FRECUENCIA</th>
                <th>ÚLTIMA ACTIVIDAD</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(usuario => (
                <tr key={usuario.id}>
                  <td>
                    <div className="solicitante-cell">
                      <span className="solicitante-avatar">{usuario.avatar}</span>
                      <span>{usuario.nombre}</span>
                    </div>
                  </td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={`estado-badge ${usuario.rol === 'Administrador' ? 'admin-badge' : ''}`}>
                      {usuario.rol}
                    </span>
                  </td>
                  <td>{usuario.comprasMes}</td>
                  <td>${usuario.totalGastado.toLocaleString()}</td>
                  <td>{usuario.pedidosTotales}</td>
                  <td>{usuario.frecuenciaPedidos}</td>
                  <td>{new Date(usuario.ultimaActividad).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {usuariosFiltrados.length === 0 && (
            <div className="empty-table"><p>No se encontraron usuarios.</p></div>
          )}

          <div className="table-footer">
            <p>Mostrando {usuariosFiltrados.length} usuarios</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminUsuarios
