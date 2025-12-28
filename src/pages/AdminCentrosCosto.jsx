import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { centrosCostoAPI } from '../services/api'
import Modal from '../components/Modal'
import './AdminPanel.css'

function AdminCentrosCosto() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [vista, setVista] = useState('clientes') // 'clientes' o 'obras'
  const [clientes, setClientes] = useState([])
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal de cliente
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [nombreCliente, setNombreCliente] = useState('')

  // Modal de obra
  const [showModalObra, setShowModalObra] = useState(false)
  const [obraEditando, setObraEditando] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState('')
  const [nombreObra, setNombreObra] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [vista])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      if (vista === 'clientes') {
        const data = await centrosCostoAPI.getAllClientes()
        setClientes(data)
      } else {
        const [clientesData, obrasData] = await Promise.all([
          centrosCostoAPI.getAllClientes(),
          centrosCostoAPI.getAllObras()
        ])
        setClientes(clientesData)
        setObras(obrasData)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      alert('Error al cargar datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ===== CLIENTES =====

  const abrirModalCliente = (cliente = null) => {
    setClienteEditando(cliente)
    setNombreCliente(cliente ? cliente.nombre : '')
    setShowModalCliente(true)
  }

  const handleGuardarCliente = async (e) => {
    e.preventDefault()

    if (!nombreCliente.trim()) {
      alert('El nombre del cliente es requerido')
      return
    }

    try {
      if (clienteEditando) {
        await centrosCostoAPI.updateCliente(clienteEditando.id, { nombre: nombreCliente })
        alert('Cliente actualizado exitosamente')
      } else {
        await centrosCostoAPI.createCliente(nombreCliente)
        alert('Cliente creado exitosamente')
      }

      setShowModalCliente(false)
      setNombreCliente('')
      setClienteEditando(null)
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleEliminarCliente = async (cliente) => {
    if (!confirm(`¿Estás seguro de desactivar el cliente "${cliente.nombre}"?\n\nEsto también desactivará todas sus obras asociadas.`)) {
      return
    }

    try {
      await centrosCostoAPI.deleteCliente(cliente.id)
      alert('Cliente desactivado exitosamente')
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    }
  }

  // ===== OBRAS =====

  const abrirModalObra = (obra = null) => {
    setObraEditando(obra)
    setClienteSeleccionado(obra ? obra.cliente_id : '')
    setNombreObra(obra ? obra.nombre : '')
    setShowModalObra(true)
  }

  const handleGuardarObra = async (e) => {
    e.preventDefault()

    if (!clienteSeleccionado || !nombreObra.trim()) {
      alert('El cliente y el nombre de la obra son requeridos')
      return
    }

    try {
      if (obraEditando) {
        await centrosCostoAPI.updateObra(obraEditando.id, { nombre: nombreObra })
        alert('Obra actualizada exitosamente')
      } else {
        await centrosCostoAPI.createObra(clienteSeleccionado, nombreObra)
        alert('Obra creada exitosamente')
      }

      setShowModalObra(false)
      setClienteSeleccionado('')
      setNombreObra('')
      setObraEditando(null)
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleEliminarObra = async (obra) => {
    if (!confirm(`¿Estás seguro de desactivar la obra "${obra.nombre}" del cliente "${obra.cliente_nombre}"?`)) {
      return
    }

    try {
      await centrosCostoAPI.deleteObra(obra.id)
      alert('Obra desactivada exitosamente')
      cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    }
  }

  if (loading) return <div className="admin-panel"><p>Cargando...</p></div>

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
          <button className="admin-nav-item active">
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
          <span>Centros de Costo</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>Centros de Costo</h1>
            <p>Gestiona clientes y obras para los pedidos</p>
          </div>
          <button
            className="btn-nueva-solicitud"
            onClick={() => vista === 'clientes' ? abrirModalCliente() : abrirModalObra()}
          >
            + {vista === 'clientes' ? 'Nuevo Cliente' : 'Nueva Obra'}
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="sub-tabs-admin">
          <button
            className={`sub-tab-admin ${vista === 'clientes' ? 'active' : ''}`}
            onClick={() => setVista('clientes')}
          >
            🏢 Clientes
          </button>
          <button
            className={`sub-tab-admin ${vista === 'obras' ? 'active' : ''}`}
            onClick={() => setVista('obras')}
          >
            🏗️ Obras
          </button>
        </div>

        <div className="admin-table-container">
          {vista === 'clientes' ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NOMBRE DEL CLIENTE</th>
                  <th>FECHA CREACIÓN</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr key={cliente.id}>
                    <td>#{cliente.id}</td>
                    <td><strong>{cliente.nombre}</strong></td>
                    <td>{new Date(cliente.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                      <div className="acciones-cell">
                        <button
                          className="btn-action"
                          onClick={() => abrirModalCliente(cliente)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-cancelar-admin"
                          onClick={() => handleEliminarCliente(cliente)}
                          title="Desactivar"
                        >
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>CLIENTE</th>
                  <th>OBRA / TRABAJO</th>
                  <th>FECHA CREACIÓN</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {obras.map(obra => (
                  <tr key={obra.id}>
                    <td>#{obra.id}</td>
                    <td><strong>{obra.cliente_nombre}</strong></td>
                    <td>{obra.nombre}</td>
                    <td>{new Date(obra.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                      <div className="acciones-cell">
                        <button
                          className="btn-action"
                          onClick={() => abrirModalObra(obra)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-cancelar-admin"
                          onClick={() => handleEliminarObra(obra)}
                          title="Desactivar"
                        >
                          ❌
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {((vista === 'clientes' && clientes.length === 0) || (vista === 'obras' && obras.length === 0)) && (
            <div className="empty-table">
              <p>No hay {vista === 'clientes' ? 'clientes' : 'obras'} registrados</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Cliente */}
      {showModalCliente && (
        <Modal
          title={clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
          onClose={() => setShowModalCliente(false)}
        >
          <form onSubmit={handleGuardarCliente} className="modal-form">
            <div className="form-group">
              <label htmlFor="nombreCliente">Nombre del Cliente *</label>
              <input
                type="text"
                id="nombreCliente"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                placeholder="Ej: Amazonia, BBVA, Telefónica"
                required
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModalCliente(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {clienteEditando ? 'Actualizar' : 'Crear'} Cliente
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Obra */}
      {showModalObra && (
        <Modal
          title={obraEditando ? 'Editar Obra' : 'Nueva Obra'}
          onClose={() => setShowModalObra(false)}
        >
          <form onSubmit={handleGuardarObra} className="modal-form">
            <div className="form-group">
              <label htmlFor="clienteObra">Cliente *</label>
              <select
                id="clienteObra"
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value)}
                required
                disabled={obraEditando !== null}
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
              {obraEditando && (
                <small style={{ color: '#666', fontSize: '0.85em' }}>
                  No puedes cambiar el cliente de una obra existente
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="nombreObra">Nombre de la Obra / Trabajo *</label>
              <input
                type="text"
                id="nombreObra"
                value={nombreObra}
                onChange={(e) => setNombreObra(e.target.value)}
                placeholder="Ej: Belvedere, Edificio Central, Sucursal Norte"
                required
                autoFocus={obraEditando !== null}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowModalObra(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {obraEditando ? 'Actualizar' : 'Crear'} Obra
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default AdminCentrosCosto
