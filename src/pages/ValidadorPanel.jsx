import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { pedidosAPI, notificacionesAPI } from '../services/api'
import Modal from '../components/Modal'
import './AdminPanel.css'

function ValidadorPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [filtroEstado, setFiltroEstado] = useState('pendientes')
  const [busqueda, setBusqueda] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showRechazarModal, setShowRechazarModal] = useState(false)
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const data = await pedidosAPI.getAll(user.id, true)
      setPedidos(data)
    } catch (error) {
      console.error('Error al cargar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const pedidosFiltrados = pedidos.filter(pedido => {
    let pasa = true

    if (filtroEstado === 'pendientes') {
      pasa = pedido.estado === 'Pendiente Validación'
    } else if (filtroEstado === 'validados') {
      pasa = pedido.estado === 'Validado'
    }

    if (busqueda) {
      const searchLower = busqueda.toLowerCase()
      pasa = pasa && (
        pedido.obra?.toLowerCase().includes(searchLower) ||
        pedido.cliente?.toLowerCase().includes(searchLower) ||
        pedido.id?.toString().includes(searchLower) ||
        pedido.solicitante?.nombre.toLowerCase().includes(searchLower)
      )
    }

    return pasa
  })

  const contadores = {
    pendientes: pedidos.filter(p => p.estado === 'Pendiente Validación').length,
    validados: pedidos.filter(p => p.estado === 'Validado').length
  }

  const handleItemClick = (pedido) => {
    setItemSeleccionado(pedido)
    setShowModal(true)
    setMotivo('')
  }

  const handleValidar = async () => {
    if (!itemSeleccionado) return

    try {
      await pedidosAPI.validar(itemSeleccionado.id, 'validar')

      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'success',
        titulo: 'Pedido Validado',
        mensaje: `Tu pedido #${itemSeleccionado.id} ha sido validado y está listo para comprar.`,
        icono: '✅'
      })

      await cargarDatos()
      setShowModal(false)
      alert('Pedido validado exitosamente')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al validar: ' + error.message)
    }
  }

  const handleRechazar = async (nuevoEstado) => {
    if (!motivo.trim()) {
      alert('Debes proporcionar un motivo')
      return
    }

    try {
      await pedidosAPI.validar(itemSeleccionado.id, 'rechazar', motivo, nuevoEstado)

      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'warning',
        titulo: 'Pedido Rechazado',
        mensaje: `Tu pedido #${itemSeleccionado.id} fue devuelto a "${nuevoEstado}". Motivo: ${motivo}`,
        icono: '⚠️'
      })

      await cargarDatos()
      setShowModal(false)
      setShowRechazarModal(false)
      setMotivo('')
      alert('Pedido rechazado')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al rechazar: ' + error.message)
    }
  }

  if (loading) return <div className="admin-panel"><p>Cargando...</p></div>

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">✅</div>
          <div className="admin-title">
            <h2>Validador</h2>
            <p>Panel v1.0</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="admin-nav-item active">
            <span className="nav-icon">📋</span>
            <span>Validación</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar">👤</div>
            <div className="admin-user-info">
              <p className="admin-user-name">{user.name}</p>
              <p className="admin-user-role">Validador</p>
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
          <span>Validación</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>Validación de Pedidos</h1>
            <p>Aprueba o rechaza pedidos</p>
          </div>
        </div>

        <div className="admin-tabs">
          <button className={`admin-tab ${filtroEstado === 'pendientes' ? 'active' : ''}`} onClick={() => setFiltroEstado('pendientes')}>
            Pendientes <span className="tab-count">{contadores.pendientes}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'validados' ? 'active' : ''}`} onClick={() => setFiltroEstado('validados')}>
            Validados <span className="tab-count">{contadores.validados}</span>
          </button>
        </div>

        <div className="admin-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar..."
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
                <th>ID</th>
                <th>FECHA</th>
                <th>OBRA</th>
                <th>CLIENTE</th>
                <th>MONTO</th>
                <th>SOLICITANTE</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map(pedido => (
                <tr key={pedido.id}>
                  <td>#{pedido.id}</td>
                  <td>{new Date(pedido.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</td>
                  <td><strong>{pedido.obra}</strong></td>
                  <td>{pedido.cliente}</td>
                  <td>{pedido.monto ? `$${pedido.monto.toFixed(2)}` : '---'}</td>
                  <td>
                    <div className="solicitante-cell">
                      <span className="solicitante-avatar">{pedido.solicitante.avatar}</span>
                      <span>{pedido.solicitante.nombre}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`estado-badge ${pedido.estado === 'Validado' ? 'badge-green' : 'badge-orange'}`}>
                      {pedido.estado === 'Validado' ? '✅ Validado' : '⏳ Pendiente'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action" onClick={() => handleItemClick(pedido)}>
                      {pedido.estado === 'Validado' ? '👁️ Ver' : '✅ Validar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pedidosFiltrados.length === 0 && (
            <div className="empty-state">
              <p>No hay pedidos {filtroEstado === 'pendientes' ? 'pendientes de validación' : 'validados'}</p>
            </div>
          )}
        </div>
      </main>

      {showModal && itemSeleccionado && (
        <Modal onClose={() => setShowModal(false)}>
          <div className="modal-header">
            <h2>Pedido #{itemSeleccionado.id}</h2>
          </div>
          <div className="modal-body">
            <div className="modal-info">
              <div className="info-row">
                <strong>Obra:</strong>
                <span>{itemSeleccionado.obra}</span>
              </div>
              <div className="info-row">
                <strong>Cliente:</strong>
                <span>{itemSeleccionado.cliente}</span>
              </div>
              <div className="info-row">
                <strong>Descripción:</strong>
                <span>{itemSeleccionado.descripcion}</span>
              </div>
              <div className="info-row">
                <strong>Monto:</strong>
                <span>{itemSeleccionado.monto ? `$${itemSeleccionado.monto.toFixed(2)}` : 'No especificado'}</span>
              </div>
              <div className="info-row">
                <strong>Solicitante:</strong>
                <span>{itemSeleccionado.solicitante.nombre}</span>
              </div>
              <div className="info-row">
                <strong>Fecha:</strong>
                <span>{new Date(itemSeleccionado.fecha).toLocaleDateString('es-ES')}</span>
              </div>
              <div className="info-row">
                <strong>Estado:</strong>
                <span className={`estado-badge ${itemSeleccionado.estado === 'Validado' ? 'badge-green' : 'badge-orange'}`}>
                  {itemSeleccionado.estado}
                </span>
              </div>
            </div>

            {itemSeleccionado.estado === 'Pendiente Validación' && (
              <div className="modal-actions">
                <button className="btn btn-success" onClick={handleValidar}>
                  ✅ Validar Pedido
                </button>
                <button className="btn btn-warning" onClick={() => setShowRechazarModal(true)}>
                  ❌ Rechazar
                </button>
              </div>
            )}

            {itemSeleccionado.estado === 'Validado' && (
              <div className="info-message info-success">
                ✅ Este pedido ya ha sido validado
              </div>
            )}
          </div>
        </Modal>
      )}

      {showRechazarModal && itemSeleccionado && (
        <Modal onClose={() => setShowRechazarModal(false)}>
          <div className="modal-header">
            <h2>Rechazar Pedido #{itemSeleccionado.id}</h2>
          </div>
          <div className="modal-body">
            <p>Selecciona a qué estado devolver el pedido y proporciona un motivo:</p>

            <div className="form-group">
              <label>Motivo del rechazo:</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Indica por qué se rechaza el pedido..."
                rows="4"
                style={{ width: '100%', padding: '8px', marginBottom: '16px' }}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-warning"
                onClick={() => handleRechazar('En Proceso')}
              >
                Devolver a "En Proceso"
              </button>
              <button
                className="btn btn-warning"
                onClick={() => handleRechazar('Revisado')}
              >
                Devolver a "Revisado"
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRechazarModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default ValidadorPanel
