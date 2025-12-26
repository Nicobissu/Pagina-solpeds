import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { pedidosAPI } from '../services/api'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import './MisPedidos.css'

function MisPedidos() {
  const { user } = useAuth()
  const [vista, setVista] = useState('activos') // 'activos' o 'cancelados'
  const [filtro, setFiltro] = useState('todos')
  const [misPedidos, setMisPedidos] = useState([])
  const [pedidosCancelados, setPedidosCancelados] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalCancelar, setModalCancelar] = useState(false)
  const [pedidoACancelar, setPedidoACancelar] = useState(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [pedidoDetalle, setPedidoDetalle] = useState(null)
  const [modalDetalle, setModalDetalle] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [user, vista])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      if (vista === 'activos') {
        const data = await pedidosAPI.getAll(user.id, user.role === 'admin')
        setMisPedidos(data)
      } else {
        const data = await pedidosAPI.getCancelados(user.id, user.role === 'admin')
        setPedidosCancelados(data)
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const abrirModalCancelar = (pedido) => {
    setPedidoACancelar(pedido)
    setMotivoCancelacion('')
    setModalCancelar(true)
  }

  const confirmarCancelacion = async () => {
    if (!motivoCancelacion.trim()) {
      alert('Debes proporcionar un motivo de cancelación')
      return
    }

    try {
      await pedidosAPI.cancelar(pedidoACancelar.id, motivoCancelacion)
      setModalCancelar(false)
      setPedidoACancelar(null)
      setMotivoCancelacion('')
      cargarDatos()
      alert('Pedido cancelado exitosamente')
    } catch (error) {
      console.error('Error al cancelar pedido:', error)
      alert('Error al cancelar el pedido: ' + error.message)
    }
  }

  const verDetalleCancelacion = (pedido) => {
    setPedidoDetalle(pedido)
    setModalDetalle(true)
  }

  const pedidosFiltrados = vista === 'activos'
    ? misPedidos.filter(pedido => {
        if (filtro === 'urgentes') return pedido.urgente
        if (filtro === 'incompletos') return pedido.incompleto
        return true
      })
    : pedidosCancelados

  const getEstadoIcon = (estado) => {
    const map = {
      'Registrado': '📝',
      'En Proceso': '🔄',
      'Pendiente Foto': '📷',
      'Revisión Pendiente': '⚠️',
      'Revisado': '✅',
      'Completado': '✅',
      'Cerrado': '📦'
    }
    return map[estado] || '📝'
  }

  const getEstadoBadgeClass = (estado) => {
    const map = {
      'Registrado': 'badge-blue',
      'En Proceso': 'badge-blue',
      'Pendiente Foto': 'badge-orange',
      'Revisión Pendiente': 'badge-orange',
      'Revisado': 'badge-green',
      'Completado': 'badge-green',
      'Cerrado': 'badge-gray'
    }
    return map[estado] || 'badge-blue'
  }

  const formatearTiempo = (fecha) => {
    const diff = new Date() - new Date(fecha)
    const horas = Math.floor(diff / (1000 * 60 * 60))

    if (horas < 1) return 'Hace menos de 1 hora'
    if (horas < 24) return `Hace ${horas} horas`
    const dias = Math.floor(horas / 24)
    return `Hace ${dias} día${dias > 1 ? 's' : ''}`
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="mis-pedidos">
          <p>Cargando pedidos...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mis-pedidos">
        <div className="page-header">
          <div>
            <h1>Mis Pedidos</h1>
            <p>Gestiona y rastrea el estado de tus requisiciones.</p>
          </div>
          <button className="btn-new-pedido" onClick={() => window.location.href = '/'}>+ Nuevo Pedido</button>
        </div>

        <div className="tabs">
          <button className="tab active">Pedidos</button>
          <button className="tab" onClick={() => window.location.href = '/compras'}>Compras</button>
        </div>

        {/* Pestañas Activos/Cancelados */}
        <div className="sub-tabs">
          <button
            className={`sub-tab ${vista === 'activos' ? 'active' : ''}`}
            onClick={() => setVista('activos')}
          >
            📋 Activos
          </button>
          <button
            className={`sub-tab ${vista === 'cancelados' ? 'active' : ''}`}
            onClick={() => setVista('cancelados')}
          >
            ❌ Cancelados
          </button>
        </div>

        {vista === 'activos' && (
          <div className="filters">
            <button
              className={`filter-btn ${filtro === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltro('todos')}
            >
              Todos
            </button>
            <button
              className={`filter-btn urgente ${filtro === 'urgentes' ? 'active' : ''}`}
              onClick={() => setFiltro('urgentes')}
            >
              ⚡ Solo Urgentes
            </button>
            <button
              className={`filter-btn incompleto ${filtro === 'incompletos' ? 'active' : ''}`}
              onClick={() => setFiltro('incompletos')}
            >
              ⚠️ Incompletos
            </button>
          </div>
        )}

        <div className="pedidos-list">
          {pedidosFiltrados.map(pedido => (
            <div key={pedido.id} className={`pedido-card ${pedido.urgente ? 'urgente' : ''} ${pedido.cancelado ? 'cancelado' : ''}`}>
              <div className="pedido-header">
                <div className="pedido-icon">{pedido.cancelado ? '❌' : getEstadoIcon(pedido.estado)}</div>
                <div className="pedido-info">
                  <div className="pedido-meta">
                    <span className={`badge ${pedido.cancelado ? 'badge-red' : getEstadoBadgeClass(pedido.estado)}`}>
                      {pedido.cancelado ? 'CANCELADO' : pedido.estado}
                    </span>
                    <span className="pedido-time">
                      {pedido.cancelado ? formatearFecha(pedido.fecha_cancelacion) : formatearTiempo(pedido.fecha)}
                    </span>
                  </div>
                  <h3 className="pedido-title">{pedido.obra} - {pedido.cliente}</h3>
                  {(() => {
                    try {
                      const productos = JSON.parse(pedido.descripcion)
                      return (
                        <div className="productos-lista" style={{ marginTop: '10px', fontSize: '0.9em' }}>
                          <strong>Productos:</strong>
                          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                            {productos.map((producto, idx) => (
                              <li key={idx}>
                                {producto.nombre} - {producto.cantidad} {producto.unidad}
                                {producto.descripcion && <span style={{ color: '#666' }}> ({producto.descripcion})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    } catch (e) {
                      return <p className="pedido-description">{pedido.descripcion}</p>
                    }
                  })()}

                  <div className="pedido-details">
                    {pedido.fotos > 0 && (
                      <span className="detail-badge">📸 {pedido.fotos} fotos</span>
                    )}
                    {pedido.monto && (
                      <span className="detail-badge">💰 ${pedido.monto.toFixed(2)}</span>
                    )}
                    {pedido.incompleto && (
                      <span className="detail-badge warning">❗ Incompleto</span>
                    )}
                    {pedido.urgente && (
                      <span className="detail-badge urgent">⚡ Urgente</span>
                    )}
                  </div>

                  {pedido.cancelado && pedido.cancelado_por && (
                    <div className="cancelacion-info">
                      <p>
                        <strong>Cancelado por:</strong> {pedido.cancelado_por.avatar} {pedido.cancelado_por.nombre}
                        {pedido.cancelado_por.rol === 'admin' && ' (Administrador)'}
                      </p>
                      <button
                        className="btn-ver-motivo"
                        onClick={() => verDetalleCancelacion(pedido)}
                      >
                        Ver motivo
                      </button>
                    </div>
                  )}

                  {pedido.comentarios && pedido.comentarios.length > 0 && (
                    <div className="pedido-comments">
                      {pedido.comentarios.map((comentario, idx) => (
                        <p key={idx} className="comment">{comentario}</p>
                      ))}
                    </div>
                  )}

                  {pedido.solicitante && (
                    <div className="pedido-solicitante">
                      <span>{pedido.solicitante.avatar} {pedido.solicitante.nombre}</span>
                    </div>
                  )}
                </div>
                {!pedido.cancelado && (
                  <div className="pedido-actions">
                    <button
                      className="btn-cancelar"
                      onClick={() => abrirModalCancelar(pedido)}
                      title="Cancelar pedido"
                    >
                      ❌
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {pedidosFiltrados.length === 0 && (
            <div className="empty-state">
              <p>
                {vista === 'cancelados'
                  ? 'No hay pedidos cancelados.'
                  : 'No se encontraron pedidos con los filtros seleccionados.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal para cancelar */}
        {modalCancelar && (
          <Modal title="Cancelar Pedido" onClose={() => setModalCancelar(false)}>
            <div className="modal-form">
              <p style={{ marginBottom: '15px' }}>
                ¿Estás seguro de que deseas cancelar este pedido?
              </p>
              <div className="pedido-cancelar-info">
                <p><strong>Obra:</strong> {pedidoACancelar.obra}</p>
                <p><strong>Cliente:</strong> {pedidoACancelar.cliente}</p>
              </div>
              <div className="form-group">
                <label htmlFor="motivo">Motivo de cancelación *</label>
                <textarea
                  id="motivo"
                  rows="4"
                  placeholder="Explica por qué se cancela este pedido..."
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
        {modalDetalle && pedidoDetalle && (
          <Modal title="Detalle de Cancelación" onClose={() => setModalDetalle(false)}>
            <div className="detalle-cancelacion">
              <div className="info-row">
                <strong>Pedido:</strong>
                <span>#{pedidoDetalle.id} - {pedidoDetalle.obra}</span>
              </div>
              <div className="info-row">
                <strong>Cancelado por:</strong>
                <span>
                  {pedidoDetalle.cancelado_por.avatar} {pedidoDetalle.cancelado_por.nombre}
                  {pedidoDetalle.cancelado_por.rol === 'admin' && ' (Administrador)'}
                </span>
              </div>
              <div className="info-row">
                <strong>Fecha de cancelación:</strong>
                <span>{formatearFecha(pedidoDetalle.fecha_cancelacion)}</span>
              </div>
              <div className="info-row motivo">
                <strong>Motivo:</strong>
                <p>{pedidoDetalle.motivo_cancelacion}</p>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  )
}

export default MisPedidos
