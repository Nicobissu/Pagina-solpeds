import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usuariosAPI, pedidosAPI, comprasAPI } from '../services/api'
import Modal from '../components/Modal'
import './AdminPanel.css'

function AdminUsuarios() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [usuarios, setUsuarios] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCrearModal, setShowCrearModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: '',
    rol: 'user',
    avatar: '👤'
  })

  const avatares = ['👤', '👨', '👩', '👨‍💼', '👩‍💼', '👷', '👨‍🔧', '👩‍🔧', '🧑‍💻', '👨‍⚕️', '👩‍⚕️']
  const roles = [
    { value: 'user', label: 'Usuario', descripcion: 'Puede crear pedidos y compras' },
    { value: 'validador', label: 'Validador', descripcion: 'Puede validar pedidos' },
    { value: 'admin', label: 'Administrador', descripcion: 'Panel de administración completo' },
    { value: 'supervisor', label: 'Supervisor', descripcion: 'Control total del sistema' }
  ]

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [usuariosData, statsData] = await Promise.all([
        usuariosAPI.getAll(),
        usuariosAPI.getEstadisticas()
      ])
      setUsuarios(usuariosData)
      setEstadisticas(statsData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      alert('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleCrearUsuario = async (e) => {
    e.preventDefault()

    if (!formData.username || !formData.password || !formData.nombre) {
      alert('Todos los campos son requeridos')
      return
    }

    try {
      await usuariosAPI.create(formData)
      alert('Usuario creado exitosamente')
      setShowCrearModal(false)
      setFormData({ username: '', password: '', nombre: '', rol: 'user', avatar: '👤' })
      cargarDatos()
    } catch (error) {
      console.error('Error al crear usuario:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleEditarUsuario = async (e) => {
    e.preventDefault()

    if (!usuarioSeleccionado) return

    try {
      const updateData = {
        nombre: formData.nombre,
        rol: formData.rol,
        avatar: formData.avatar
      }

      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password
      }

      await usuariosAPI.update(usuarioSeleccionado.id, updateData)
      alert('Usuario actualizado exitosamente')
      setShowEditarModal(false)
      setUsuarioSeleccionado(null)
      setFormData({ username: '', password: '', nombre: '', rol: 'user', avatar: '👤' })
      cargarDatos()
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleEliminarUsuario = async (usuario) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${usuario.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }

    try {
      await usuariosAPI.delete(usuario.id)
      alert('Usuario eliminado exitosamente')
      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar usuario:', error)
      alert('Error: ' + error.message)
    }
  }

  const abrirModalEditar = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setFormData({
      username: usuario.username,
      password: '', // No mostrar password actual
      nombre: usuario.nombre,
      rol: usuario.rol,
      avatar: usuario.avatar || '👤'
    })
    setShowEditarModal(true)
  }

  const usuariosFiltrados = usuarios.filter(u => {
    if (!busqueda) return true
    const searchLower = busqueda.toLowerCase()
    return (
      u.nombre?.toLowerCase().includes(searchLower) ||
      u.username?.toLowerCase().includes(searchLower) ||
      u.rol?.toLowerCase().includes(searchLower)
    )
  })

  const getRolBadgeClass = (rol) => {
    const map = {
      'supervisor': 'badge-supervisor',
      'admin': 'badge-admin',
      'validador': 'badge-validador',
      'user': 'badge-user'
    }
    return map[rol] || 'badge-user'
  }

  const getRolLabel = (rol) => {
    const map = {
      'supervisor': 'Supervisor',
      'admin': 'Administrador',
      'validador': 'Validador',
      'user': 'Usuario'
    }
    return map[rol] || rol
  }

  if (loading) {
    return <div className="admin-panel"><p>Cargando...</p></div>
  }

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">{user.role === 'supervisor' ? '👑' : '⚙️'}</div>
          <div className="admin-title">
            <h2>{user.role === 'supervisor' ? 'Supervisor' : 'AdminPanel'}</h2>
            <p>{user.role === 'supervisor' ? 'Control Total' : 'Gestión v2.0'}</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="admin-nav-item" onClick={() => navigate(user.role === 'supervisor' ? '/supervisor' : '/admin')}>
            <span className="nav-icon">{user.role === 'supervisor' ? '👁️' : '📥'}</span>
            <span>{user.role === 'supervisor' ? 'Vista General' : 'Bandeja de Entrada'}</span>
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
            <div className="admin-user-avatar">{user.role === 'supervisor' ? '👑' : '👤'}</div>
            <div className="admin-user-info">
              <p className="admin-user-name">{user.name}</p>
              <p className="admin-user-role">{getRolLabel(user.role)}</p>
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
            <h1>👥 Gestión de Usuarios</h1>
            <p>Administra usuarios, roles y permisos del sistema</p>
          </div>
          {user.role === 'supervisor' && (
            <button className="btn-nueva-solicitud" onClick={() => setShowCrearModal(true)}>
              + Crear Usuario
            </button>
          )}
        </div>

        {estadisticas && (
          <div className="stats-grid" style={{ marginBottom: '30px' }}>
            <div className="stat-card blue">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <p className="stat-label">Total Usuarios</p>
                <p className="stat-value">{estadisticas.total}</p>
              </div>
            </div>

            <div className="stat-card purple">
              <div className="stat-icon">👑</div>
              <div className="stat-content">
                <p className="stat-label">Supervisores</p>
                <p className="stat-value">{estadisticas.supervisores}</p>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon">⚙️</div>
              <div className="stat-content">
                <p className="stat-label">Administradores</p>
                <p className="stat-value">{estadisticas.admins}</p>
              </div>
            </div>

            <div className="stat-card orange">
              <div className="stat-icon">✓</div>
              <div className="stat-content">
                <p className="stat-label">Validadores</p>
                <p className="stat-value">{estadisticas.validadores}</p>
              </div>
            </div>
          </div>
        )}

        <div className="admin-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="filter-btn" onClick={cargarDatos}>🔄 Actualizar</button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>USERNAME</th>
                <th>ROL</th>
                <th>AVATAR</th>
                <th>FECHA CREACIÓN</th>
                {user.role === 'supervisor' && <th>ACCIONES</th>}
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map(usuario => (
                <tr key={usuario.id}>
                  <td>
                    <div className="solicitante-cell">
                      <span className="solicitante-avatar">{usuario.avatar || '👤'}</span>
                      <span><strong>{usuario.nombre}</strong></span>
                    </div>
                  </td>
                  <td>{usuario.username}</td>
                  <td>
                    <span className={`estado-badge ${getRolBadgeClass(usuario.rol)}`}>
                      {getRolLabel(usuario.rol)}
                    </span>
                  </td>
                  <td style={{ fontSize: '24px', textAlign: 'center' }}>{usuario.avatar || '👤'}</td>
                  <td>{new Date(usuario.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  {user.role === 'supervisor' && (
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          className="btn-action"
                          onClick={() => abrirModalEditar(usuario)}
                          title="Editar usuario"
                          style={{ backgroundColor: '#4CAF50', color: 'white' }}
                        >
                          ✏️
                        </button>
                        {usuario.id !== user.id && usuario.id !== 1 && (
                          <button
                            className="btn-action"
                            onClick={() => handleEliminarUsuario(usuario)}
                            title="Eliminar usuario"
                            style={{ backgroundColor: '#ff6b6b', color: 'white' }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {usuariosFiltrados.length === 0 && (
            <div className="empty-table"><p>No se encontraron usuarios.</p></div>
          )}

          <div className="table-footer">
            <p>Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios</p>
          </div>
        </div>
      </main>

      {/* Modal Crear Usuario */}
      {showCrearModal && (
        <Modal
          title="➕ Crear Nuevo Usuario"
          onClose={() => {
            setShowCrearModal(false)
            setFormData({ username: '', password: '', nombre: '', rol: 'user', avatar: '👤' })
          }}
        >
          <form onSubmit={handleCrearUsuario} className="modal-form">
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="usuario123"
                required
              />
            </div>

            <div className="form-group">
              <label>Contraseña *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label>Rol</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label} - {r.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Avatar</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {avatares.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: av })}
                    style={{
                      fontSize: '32px',
                      padding: '10px',
                      border: formData.avatar === av ? '3px solid #4CAF50' : '2px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: formData.avatar === av ? '#e8f5e9' : 'white'
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowCrearModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Crear Usuario
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Editar Usuario */}
      {showEditarModal && usuarioSeleccionado && (
        <Modal
          title={`✏️ Editar Usuario: ${usuarioSeleccionado.nombre}`}
          onClose={() => {
            setShowEditarModal(false)
            setUsuarioSeleccionado(null)
            setFormData({ username: '', password: '', nombre: '', rol: 'user', avatar: '👤' })
          }}
        >
          <form onSubmit={handleEditarUsuario} className="modal-form">
            <div className="form-group">
              <label>Username (no se puede cambiar)</label>
              <input
                type="text"
                value={formData.username}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label>Nueva Contraseña (dejar vacío para mantener la actual)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label>Nombre Completo *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label>Rol</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label} - {r.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Avatar</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {avatares.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar: av })}
                    style={{
                      fontSize: '32px',
                      padding: '10px',
                      border: formData.avatar === av ? '3px solid #4CAF50' : '2px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: formData.avatar === av ? '#e8f5e9' : 'white'
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowEditarModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default AdminUsuarios
