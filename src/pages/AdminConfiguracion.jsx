import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './AdminPanel.css'

function AdminConfiguracion() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Mock configuration state - Frontend only
  const [config, setConfig] = useState({
    nombreEmpresa: 'Solpeds Sistema de Gestión',
    emailContacto: 'admin@solpeds.com',
    telefonoContacto: '+1 234 567 8900',
    direccion: 'Av. Principal 123, Ciudad',
    tiempoSesion: '24',
    notificacionesEmail: true,
    aprobarPedidosAutomatico: false,
    requiereFotosPedidos: true,
    requiereTicketCompras: true,
    monedaPredeterminada: 'USD',
    idioma: 'es',
    formatoFecha: 'DD/MM/YYYY'
  })

  const [guardado, setGuardado] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setGuardado(false)
  }

  const handleGuardar = (e) => {
    e.preventDefault()
    // Simulación de guardado
    console.log('Configuración guardada:', config)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
  }

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
          <button className="admin-nav-item" onClick={() => navigate('/admin/reportes')}>
            <span className="nav-icon">📊</span>
            <span>Reportes</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate('/admin/centros-costo')}>
            <span className="nav-icon">🏢</span>
            <span>Centros de Costo</span>
          </button>
          <button className="admin-nav-item active">
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
          <span>Configuración</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>Configuración del Sistema</h1>
            <p>Ajusta los parámetros generales de la aplicación</p>
          </div>
        </div>

        {guardado && (
          <div style={{
            padding: '15px',
            background: '#4caf50',
            color: 'white',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ✓ Configuración guardada exitosamente
          </div>
        )}

        <form onSubmit={handleGuardar}>
          <div className="admin-table-container" style={{ marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Información de la Empresa</h2>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Nombre de la Empresa</label>
              <input
                type="text"
                name="nombreEmpresa"
                value={config.nombreEmpresa}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email de Contacto</label>
              <input
                type="email"
                name="emailContacto"
                value={config.emailContacto}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Teléfono de Contacto</label>
              <input
                type="tel"
                name="telefonoContacto"
                value={config.telefonoContacto}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={config.direccion}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <div className="admin-table-container" style={{ marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Configuración del Sistema</h2>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Tiempo de Sesión (horas)</label>
              <input
                type="number"
                name="tiempoSesion"
                value={config.tiempoSesion}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Moneda Predeterminada</label>
              <select
                name="monedaPredeterminada"
                value={config.monedaPredeterminada}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="ARS">ARS - Peso Argentino</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Idioma</label>
              <select
                name="idioma"
                value={config.idioma}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Formato de Fecha</label>
              <select
                name="formatoFecha"
                value={config.formatoFecha}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container" style={{ marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>Reglas de Negocio</h2>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="notificacionesEmail"
                  checked={config.notificacionesEmail}
                  onChange={handleChange}
                  style={{ marginRight: '10px', width: '18px', height: '18px' }}
                />
                <span>Habilitar notificaciones por email</span>
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="aprobarPedidosAutomatico"
                  checked={config.aprobarPedidosAutomatico}
                  onChange={handleChange}
                  style={{ marginRight: '10px', width: '18px', height: '18px' }}
                />
                <span>Aprobar pedidos automáticamente</span>
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="requiereFotosPedidos"
                  checked={config.requiereFotosPedidos}
                  onChange={handleChange}
                  style={{ marginRight: '10px', width: '18px', height: '18px' }}
                />
                <span>Requerir fotos en pedidos</span>
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="requiereTicketCompras"
                  checked={config.requiereTicketCompras}
                  onChange={handleChange}
                  style={{ marginRight: '10px', width: '18px', height: '18px' }}
                />
                <span>Requerir ticket en compras</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/admin')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              💾 Guardar Cambios
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default AdminConfiguracion
