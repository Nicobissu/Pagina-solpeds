import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './AdminPanel.css'

function AdminReportes() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [periodo, setPeriodo] = useState('mes')

  // Mock data - Frontend only
  const estadisticasPorArea = [
    {
      area: 'Construcción',
      pedidos: 45,
      compras: 67,
      totalGastado: 125300.50,
      promedioGasto: 1869.41,
      urgentes: 8
    },
    {
      area: 'Mantenimiento',
      pedidos: 32,
      compras: 41,
      totalGastado: 78450.25,
      promedioGasto: 1913.42,
      urgentes: 5
    },
    {
      area: 'Logística',
      pedidos: 28,
      compras: 35,
      totalGastado: 52100.00,
      promedioGasto: 1488.57,
      urgentes: 3
    },
    {
      area: 'Administración',
      pedidos: 19,
      compras: 22,
      totalGastado: 34200.75,
      promedioGasto: 1554.58,
      urgentes: 2
    },
    {
      area: 'Desarrollo',
      pedidos: 25,
      compras: 30,
      totalGastado: 61500.00,
      promedioGasto: 2050.00,
      urgentes: 4
    }
  ]

  const estadisticasGenerales = {
    totalPedidos: estadisticasPorArea.reduce((sum, a) => sum + a.pedidos, 0),
    totalCompras: estadisticasPorArea.reduce((sum, a) => sum + a.compras, 0),
    totalGastado: estadisticasPorArea.reduce((sum, a) => sum + a.totalGastado, 0),
    totalUrgentes: estadisticasPorArea.reduce((sum, a) => sum + a.urgentes, 0),
    promedioGastoPorArea: (estadisticasPorArea.reduce((sum, a) => sum + a.totalGastado, 0) / estadisticasPorArea.length)
  }

  const topProveedores = [
    { nombre: 'Ferretería López', compras: 23, total: 45600.00 },
    { nombre: 'Materiales Construcción SA', compras: 19, total: 38200.50 },
    { nombre: 'Suministros Industriales', compras: 15, total: 32100.75 },
    { nombre: 'Distribuidora Central', compras: 12, total: 28900.00 },
    { nombre: 'Proveedores Unidos', compras: 10, total: 21500.25 }
  ]

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
          <button className="admin-nav-item" onClick={() => navigate('/admin/usuarios')}>
            <span className="nav-icon">👥</span>
            <span>Usuarios</span>
          </button>
          <button className="admin-nav-item active">
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
          <span>Reportes</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>Reportes y Estadísticas</h1>
            <p>Análisis general del sistema por áreas</p>
          </div>
          <div className="admin-filters">
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="trimestre">Último trimestre</option>
              <option value="año">Último año</option>
            </select>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stat-card blue">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <p className="stat-label">Total Pedidos</p>
              <p className="stat-value">{estadisticasGenerales.totalPedidos}</p>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">🛒</div>
            <div className="stat-content">
              <p className="stat-label">Total Compras</p>
              <p className="stat-value">{estadisticasGenerales.totalCompras}</p>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <p className="stat-label">Total Gastado</p>
              <p className="stat-value">${estadisticasGenerales.totalGastado.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card red">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <p className="stat-label">Urgentes</p>
              <p className="stat-value">{estadisticasGenerales.totalUrgentes}</p>
            </div>
          </div>
        </div>

        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Estadísticas por Área</h2>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ÁREA</th>
                <th>PEDIDOS</th>
                <th>COMPRAS</th>
                <th>TOTAL GASTADO</th>
                <th>PROMEDIO GASTO</th>
                <th>URGENTES</th>
              </tr>
            </thead>
            <tbody>
              {estadisticasPorArea.map((area, idx) => (
                <tr key={idx}>
                  <td><strong>{area.area}</strong></td>
                  <td>{area.pedidos}</td>
                  <td>{area.compras}</td>
                  <td>${area.totalGastado.toLocaleString()}</td>
                  <td>${area.promedioGasto.toFixed(2)}</td>
                  <td>
                    {area.urgentes > 0 && (
                      <span className="urgente-icon">{area.urgentes} 🔴</span>
                    )}
                    {area.urgentes === 0 && '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-footer">
            <p>Mostrando estadísticas de {estadisticasPorArea.length} áreas</p>
          </div>
        </div>

        <h2 style={{ marginTop: '40px', marginBottom: '20px', fontSize: '1.5rem' }}>Top 5 Proveedores</h2>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>POSICIÓN</th>
                <th>PROVEEDOR</th>
                <th>COMPRAS</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {topProveedores.map((proveedor, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>#{idx + 1}</strong>
                  </td>
                  <td>{proveedor.nombre}</td>
                  <td>{proveedor.compras}</td>
                  <td>${proveedor.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="table-footer">
            <p>Top {topProveedores.length} proveedores más utilizados</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminReportes
