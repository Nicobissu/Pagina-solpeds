import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { comprasAPI, notificacionesAPI } from '../services/api'
import Modal from '../components/Modal'
import './AdminPanel.css'

function AdminCompras() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [vista, setVista] = useState('activas') // 'activas' o 'canceladas'
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [compras, setCompras] = useState([])
  const [comprasCanceladas, setComprasCanceladas] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [comentario, setComentario] = useState('')
  const [modalCancelar, setModalCancelar] = useState(false)
  const [compraACancelar, setCompraACancelar] = useState(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [modalDetalle, setModalDetalle] = useState(false)
  const [compraDetalle, setCompraDetalle] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [vista])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      if (vista === 'activas') {
        const data = await comprasAPI.getAll(user.id, true)
        setCompras(data)
      } else {
        const data = await comprasAPI.getCanceladas(user.id, true)
        setComprasCanceladas(data)
      }
    } catch (error) {
      console.error('Error al cargar compras:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarCompras = cargarDatos

  const abrirModalCancelar = (compra) => {
    setCompraACancelar(compra)
    setMotivoCancelacion('')
    setModalCancelar(true)
  }

  const confirmarCancelacion = async () => {
    if (!motivoCancelacion.trim()) {
      alert('Debes proporcionar un motivo de cancelación')
      return
    }

    try {
      await comprasAPI.cancelar(compraACancelar.id, motivoCancelacion)
      setModalCancelar(false)
      setCompraACancelar(null)
      setMotivoCancelacion('')
      cargarDatos()
      alert('Compra cancelada exitosamente')
    } catch (error) {
      console.error('Error al cancelar compra:', error)
      alert('Error al cancelar la compra: ' + error.message)
    }
  }

  const verDetalleCancelacion = (compra) => {
    setCompraDetalle(compra)
    setModalDetalle(true)
  }

  const formatearFechaCompleta = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const listaCompras = vista === 'activas' ? compras : comprasCanceladas

  const comprasFiltradas = listaCompras.filter(compra => {
    let pasa = true

    if (vista === 'activas' && filtroEstado !== 'todos') {
      if (filtroEstado === 'pendiente') pasa = !compra.ticket
      else if (filtroEstado === 'subido') pasa = compra.ticket !== null
      else if (filtroEstado === 'urgentes') pasa = compra.urgente
    }

    if (busqueda) {
      const searchLower = busqueda.toLowerCase()
      pasa = pasa && (
        compra.obra?.toLowerCase().includes(searchLower) ||
        compra.proveedor?.toLowerCase().includes(searchLower) ||
        compra.descripcion?.toLowerCase().includes(searchLower) ||
        compra.id?.toString().includes(searchLower) ||
        compra.solicitante?.nombre.toLowerCase().includes(searchLower)
      )
    }

    return pasa
  })

  const contadores = {
    todos: compras.length,
    pendiente: compras.filter(c => !c.ticket).length,
    subido: compras.filter(c => c.ticket !== null).length,
    urgentes: compras.filter(c => c.urgente).length
  }

  const handleItemClick = (compra) => {
    setItemSeleccionado(compra)
    setShowModal(true)
    setComentario('')
  }

  const handleEnviarComentario = async () => {
    if (!itemSeleccionado || !comentario.trim()) return

    try {
      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'warning',
        titulo: `Comentario en Compra #${itemSeleccionado.id}`,
        mensaje: comentario,
        icono: '💬'
      })
      await cargarCompras()
      setComentario('')
      alert('Comentario enviado')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al enviar el comentario')
    }
  }

  const handleMarcarUrgente = async () => {
    if (!itemSeleccionado) return

    try {
      await comprasAPI.update(itemSeleccionado.id, { urgente: 1 })
      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'error',
        titulo: `Compra marcada como urgente`,
        mensaje: `Tu compra #${itemSeleccionado.id} ha sido marcada como urgente. Por favor, revisa la información.`,
        icono: '⚠️'
      })
      await cargarCompras()
      setShowModal(false)
      alert('Marcada como urgente')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al marcar como urgente')
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
          <button className="admin-nav-item active">
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
          <span>Compras</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>Gestión de Compras</h1>
            <p>Administra todas las compras del sistema</p>
          </div>
          <button className="btn-nueva-solicitud" onClick={() => navigate('/')}>+ Nueva Compra</button>
        </div>

        {/* Sub-tabs para Activas/Canceladas */}
        <div className="sub-tabs-admin">
          <button
            className={`sub-tab-admin ${vista === 'activas' ? 'active' : ''}`}
            onClick={() => setVista('activas')}
          >
            📋 Activas
          </button>
          <button
            className={`sub-tab-admin ${vista === 'canceladas' ? 'active' : ''}`}
            onClick={() => setVista('canceladas')}
          >
            ❌ Canceladas
          </button>
        </div>

        {vista === 'activas' && (
          <div className="admin-tabs">
          <button className={`admin-tab ${filtroEstado === 'todos' ? 'active' : ''}`} onClick={() => setFiltroEstado('todos')}>
            Todos <span className="tab-count">{contadores.todos}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'pendiente' ? 'active' : ''}`} onClick={() => setFiltroEstado('pendiente')}>
            Pendiente <span className="tab-count">{contadores.pendiente}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'subido' ? 'active' : ''}`} onClick={() => setFiltroEstado('subido')}>
            Subido <span className="tab-count">{contadores.subido}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'urgentes' ? 'active' : ''}`} onClick={() => setFiltroEstado('urgentes')}>
            Urgentes <span className="tab-count">{contadores.urgentes}</span>
          </button>
          </div>
        )}

        <div className="admin-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por Obra, Proveedor o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="filter-btn" onClick={cargarCompras}>🔄 Actualizar</button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>FECHA</th>
                <th>PROVEEDOR</th>
                <th>OBRA</th>
                <th>DESCRIPCIÓN</th>
                <th>MONTO</th>
                <th>TICKET</th>
                <th>SOLICITANTE</th>
                {vista === 'canceladas' && <th>CANCELADO POR</th>}
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {comprasFiltradas.map(compra => (
                <tr key={compra.id} className={compra.cancelado ? 'row-cancelado' : ''}>
                  <td>#{compra.id}</td>
                  <td>{new Date(compra.cancelado ? compra.fecha_cancelacion : compra.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</td>
                  <td><strong>{compra.proveedor}</strong></td>
                  <td>{compra.obra}</td>
                  <td className="descripcion-cell">{compra.descripcion?.substring(0, 50)}...</td>
                  <td>${compra.monto.toFixed(2)}</td>
                  <td>
                    <div className="estado-cell">
                      {compra.cancelado ? (
                        <span className="estado-badge cancelado">CANCELADA</span>
                      ) : compra.ticket ? (
                        <span className="estado-badge">✅ {compra.ticket}</span>
                      ) : (
                        <span className="estado-badge" style={{ background: '#ffa500' }}>⏳ Pendiente</span>
                      )}
                      {!compra.cancelado && compra.urgente && <span className="urgente-icon">🔴</span>}
                    </div>
                  </td>
                  <td>
                    <div className="solicitante-cell">
                      <span className="solicitante-avatar">{compra.solicitante.avatar}</span>
                      <span>{compra.solicitante.nombre}</span>
                    </div>
                  </td>
                  {vista === 'canceladas' && (
                    <td>
                      {compra.cancelado_por && (
                        <div className="solicitante-cell">
                          <span className="solicitante-avatar">{compra.cancelado_por.avatar}</span>
                          <span>{compra.cancelado_por.nombre}</span>
                        </div>
                      )}
                    </td>
                  )}
                  <td>
                    <div className="acciones-cell">
                      <button className="btn-action" onClick={() => compra.cancelado ? verDetalleCancelacion(compra) : handleItemClick(compra)}>
                        {compra.cancelado ? '👁️' : '⚙️'}
                      </button>
                      {!compra.cancelado && (
                        <button className="btn-cancelar-admin" onClick={() => abrirModalCancelar(compra)} title="Cancelar compra">
                          ❌
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {comprasFiltradas.length === 0 && (
            <div className="empty-table"><p>No se encontraron compras.</p></div>
          )}

          <div className="table-footer">
            <p>Mostrando {comprasFiltradas.length} compras</p>
          </div>
        </div>
      </main>

      {showModal && itemSeleccionado && (
        <Modal title={`Gestionar Compra #${itemSeleccionado.id}`} onClose={() => setShowModal(false)}>
          <div className="modal-form">
            <div className="info-section">
              <h3>Información</h3>
              <p><strong>Solicitante:</strong> {itemSeleccionado.solicitante.nombre}</p>
              <p><strong>Proveedor:</strong> {itemSeleccionado.proveedor}</p>
              <p><strong>Obra:</strong> {itemSeleccionado.obra}</p>
              <p><strong>Descripción:</strong> {itemSeleccionado.descripcion}</p>
              <p><strong>Monto:</strong> ${itemSeleccionado.monto.toFixed(2)}</p>
              <p><strong>Ticket:</strong> {itemSeleccionado.ticket || 'Sin ticket'}</p>
            </div>

            <div className="form-group">
              <button onClick={handleMarcarUrgente} className="btn-warning" style={{ width: '100%' }}>
                ⚠️ Marcar como Urgente
              </button>
            </div>

            <div className="form-group">
              <h3>Agregar Comentario</h3>
              <textarea
                rows="4"
                placeholder="Escribe un comentario..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              ></textarea>
              <button onClick={handleEnviarComentario} className="btn-primary" disabled={!comentario.trim()} style={{ marginTop: '10px' }}>
                💬 Enviar Comentario
              </button>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal para cancelar */}
      {modalCancelar && compraACancelar && (
        <Modal title="Cancelar Compra" onClose={() => setModalCancelar(false)}>
          <div className="modal-form">
            <p style={{ marginBottom: '15px' }}>
              ¿Estás seguro de que deseas cancelar esta compra?
            </p>
            <div className="pedido-cancelar-info">
              <p><strong>Compra ID:</strong> #{compraACancelar.id}</p>
              <p><strong>Proveedor:</strong> {compraACancelar.proveedor}</p>
              <p><strong>Obra:</strong> {compraACancelar.obra}</p>
              <p><strong>Monto:</strong> ${compraACancelar.monto.toFixed(2)}</p>
              <p><strong>Solicitante:</strong> {compraACancelar.solicitante.nombre}</p>
            </div>
            <div className="form-group">
              <label htmlFor="motivo">Motivo de cancelación *</label>
              <textarea
                id="motivo"
                rows="4"
                placeholder="Explica por qué se cancela esta compra..."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                required
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setModalCancelar(false)}
              >
                Volver
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmarCancelacion}
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de detalle de cancelación */}
      {modalDetalle && compraDetalle && (
        <Modal title="Detalle de Cancelación" onClose={() => setModalDetalle(false)}>
          <div className="detalle-cancelacion">
            <div className="info-row">
              <strong>Compra:</strong>
              <span>#{compraDetalle.id} - {compraDetalle.proveedor}</span>
            </div>
            <div className="info-row">
              <strong>Obra:</strong>
              <span>{compraDetalle.obra}</span>
            </div>
            <div className="info-row">
              <strong>Monto:</strong>
              <span>${compraDetalle.monto.toFixed(2)}</span>
            </div>
            <div className="info-row">
              <strong>Solicitante:</strong>
              <span>
                {compraDetalle.solicitante.avatar} {compraDetalle.solicitante.nombre}
              </span>
            </div>
            <div className="info-row">
              <strong>Cancelado por:</strong>
              <span>
                {compraDetalle.cancelado_por.avatar} {compraDetalle.cancelado_por.nombre}
                {compraDetalle.cancelado_por.rol === 'admin' && ' (Administrador)'}
              </span>
            </div>
            <div className="info-row">
              <strong>Fecha de cancelación:</strong>
              <span>{formatearFechaCompleta(compraDetalle.fecha_cancelacion)}</span>
            </div>
            <div className="info-row motivo">
              <strong>Motivo:</strong>
              <p>{compraDetalle.motivo_cancelacion}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminCompras
