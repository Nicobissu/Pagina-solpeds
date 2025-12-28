import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { pedidosAPI, notificacionesAPI } from '../services/api'
import Modal from '../components/Modal'
import './AdminPanel.css'

function AdminPedidos() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [vista, setVista] = useState('activos') // 'activos' o 'cancelados'
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [pedidosCancelados, setPedidosCancelados] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [comentario, setComentario] = useState('')
  const [modalCancelar, setModalCancelar] = useState(false)
  const [pedidoACancelar, setPedidoACancelar] = useState(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [modalDetalle, setModalDetalle] = useState(false)
  const [pedidoDetalle, setPedidoDetalle] = useState(null)

  useEffect(() => {
    cargarDatos()
  }, [vista])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      if (vista === 'activos') {
        const data = await pedidosAPI.getAll(user.id, true)
        setPedidos(data)
      } else {
        const data = await pedidosAPI.getCancelados(user.id, true)
        setPedidosCancelados(data)
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarPedidos = cargarDatos

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

  const formatearFechaCompleta = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const listaPedidos = vista === 'activos' ? pedidos : pedidosCancelados

  const pedidosFiltrados = listaPedidos.filter(pedido => {
    let pasa = true

    if (vista === 'activos' && filtroEstado !== 'todos') {
      if (filtroEstado === 'registrado') pasa = pedido.estado === 'Registrado'
      else if (filtroEstado === 'proceso') pasa = pedido.estado === 'En Proceso'
      else if (filtroEstado === 'aRevisar') pasa = pedido.estado === 'Revisado'
      else if (filtroEstado === 'validacion') pasa = pedido.estado === 'Pendiente Validación'
      else if (filtroEstado === 'validado') pasa = pedido.estado === 'Validado'
      else if (filtroEstado === 'completado') pasa = pedido.estado === 'Completado'
      else if (filtroEstado === 'cerrado') pasa = pedido.estado === 'Cerrado'
      else if (filtroEstado === 'urgentes') pasa = pedido.urgente
      else if (filtroEstado === 'incompletos') pasa = pedido.incompleto
    }

    if (busqueda) {
      const searchLower = busqueda.toLowerCase()
      pasa = pasa && (
        pedido.obra?.toLowerCase().includes(searchLower) ||
        pedido.cliente?.toLowerCase().includes(searchLower) ||
        pedido.descripcion?.toLowerCase().includes(searchLower) ||
        pedido.id?.toString().includes(searchLower) ||
        pedido.solicitante?.nombre.toLowerCase().includes(searchLower)
      )
    }

    return pasa
  })

  const contadores = {
    todos: pedidos.length,
    registrado: pedidos.filter(p => p.estado === 'Registrado').length,
    proceso: pedidos.filter(p => p.estado === 'En Proceso').length,
    aRevisar: pedidos.filter(p => p.estado === 'Revisado').length,
    validacion: pedidos.filter(p => p.estado === 'Pendiente Validación').length,
    validado: pedidos.filter(p => p.estado === 'Validado').length,
    completado: pedidos.filter(p => p.estado === 'Completado').length,
    cerrado: pedidos.filter(p => p.estado === 'Cerrado').length,
    urgentes: pedidos.filter(p => p.urgente).length,
    incompletos: pedidos.filter(p => p.incompleto).length
  }

  const handleItemClick = (pedido) => {
    setItemSeleccionado(pedido)
    setShowModal(true)
    setComentario('')
  }

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!itemSeleccionado) {
      alert('No hay pedido seleccionado')
      return
    }

    // Bloquear cambios de estado si el pedido está en Pendiente Validación
    if (itemSeleccionado.estado === 'Pendiente Validación') {
      alert('No puedes cambiar el estado de un pedido que está en Pendiente Validación. Espera a que el validador lo apruebe o rechace.')
      return
    }

    try {
      console.log('Actualizando pedido:', itemSeleccionado.id, 'a estado:', nuevoEstado)

      // Si el nuevo estado es "Revisado", automáticamente cambiar a "Pendiente Validación"
      const estadoFinal = nuevoEstado === 'Revisado' ? 'Pendiente Validación' : nuevoEstado

      const updateResult = await pedidosAPI.update(itemSeleccionado.id, { estado: estadoFinal })
      console.log('Resultado update:', updateResult)

      console.log('Creando notificación para usuario:', itemSeleccionado.solicitante.id)
      const notifResult = await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'info',
        titulo: `Estado de pedido actualizado`,
        mensaje: `Tu pedido #${itemSeleccionado.id} cambió a estado: ${estadoFinal}`,
        icono: '📝'
      })
      console.log('Resultado notificación:', notifResult)

      await cargarPedidos()
      setShowModal(false)
      alert(`Estado actualizado a: ${estadoFinal}`)
    } catch (error) {
      console.error('Error completo:', error)
      alert(`Error al cambiar el estado: ${error.message}`)
    }
  }

  const handleEnviarComentario = async () => {
    if (!itemSeleccionado || !comentario.trim()) {
      alert('Debes escribir un comentario')
      return
    }

    try {
      console.log('Agregando comentario al pedido:', itemSeleccionado.id)
      await pedidosAPI.addComentario(itemSeleccionado.id, comentario)

      console.log('Creando notificación de comentario')
      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'warning',
        titulo: `Comentario en Pedido #${itemSeleccionado.id}`,
        mensaje: comentario,
        icono: '💬'
      })

      await cargarPedidos()
      setComentario('')
      alert('Comentario enviado exitosamente')
    } catch (error) {
      console.error('Error completo:', error)
      alert(`Error al enviar el comentario: ${error.message}`)
    }
  }

  const handleMarcarIncompleto = async () => {
    if (!itemSeleccionado) {
      alert('No hay pedido seleccionado')
      return
    }

    try {
      console.log('Marcando pedido como incompleto:', itemSeleccionado.id)
      await pedidosAPI.update(itemSeleccionado.id, { incompleto: 1 })

      console.log('Creando notificación de incompleto')
      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'warning',
        titulo: `Pedido marcado como incompleto`,
        mensaje: `Tu pedido #${itemSeleccionado.id} ha sido marcado como incompleto. Por favor, revisa la información.`,
        icono: '⚠️'
      })

      await cargarPedidos()
      setShowModal(false)
      alert('Marcado como incompleto exitosamente')
    } catch (error) {
      console.error('Error completo:', error)
      alert(`Error al marcar como incompleto: ${error.message}`)
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
          <button className="admin-nav-item active">
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
          <span>Pedidos</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>Gestión de Pedidos</h1>
            <p>Administra todos los pedidos del sistema</p>
          </div>
          <button className="btn-nueva-solicitud" onClick={() => navigate('/')}>+ Nuevo Pedido</button>
        </div>

        {/* Sub-tabs para Activos/Cancelados */}
        <div className="sub-tabs-admin">
          <button
            className={`sub-tab-admin ${vista === 'activos' ? 'active' : ''}`}
            onClick={() => setVista('activos')}
          >
            📋 Activos
          </button>
          <button
            className={`sub-tab-admin ${vista === 'cancelados' ? 'active' : ''}`}
            onClick={() => setVista('cancelados')}
          >
            ❌ Cancelados
          </button>
        </div>

        {vista === 'activos' && (
          <div className="admin-tabs">
          <button className={`admin-tab ${filtroEstado === 'todos' ? 'active' : ''}`} onClick={() => setFiltroEstado('todos')}>
            Todos <span className="tab-count">{contadores.todos}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'registrado' ? 'active' : ''}`} onClick={() => setFiltroEstado('registrado')}>
            Registrado <span className="tab-count">{contadores.registrado}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'proceso' ? 'active' : ''}`} onClick={() => setFiltroEstado('proceso')}>
            En Proceso <span className="tab-count">{contadores.proceso}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'aRevisar' ? 'active' : ''}`} onClick={() => setFiltroEstado('aRevisar')}>
            🔄 A Revisar <span className="tab-count">{contadores.aRevisar}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'validacion' ? 'active' : ''}`} onClick={() => setFiltroEstado('validacion')}>
            ⏳ Pendiente Validación <span className="tab-count">{contadores.validacion}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'validado' ? 'active' : ''}`} onClick={() => setFiltroEstado('validado')}>
            ✅ Validado <span className="tab-count">{contadores.validado}</span>
          </button>
          <button className={`admin-tab ${filtroEstado === 'completado' ? 'active' : ''}`} onClick={() => setFiltroEstado('completado')}>
            Completado <span className="tab-count">{contadores.completado}</span>
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
              placeholder="Buscar por Obra, Solicitante o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="filter-btn" onClick={cargarPedidos}>🔄 Actualizar</button>
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
                {vista === 'cancelados' && <th>CANCELADO POR</th>}
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map(pedido => (
                <tr key={pedido.id} className={pedido.cancelado ? 'row-cancelado' : ''}>
                  <td>#{pedido.id}</td>
                  <td>{new Date(pedido.cancelado ? pedido.fecha_cancelacion : pedido.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</td>
                  <td><strong>{pedido.obra}</strong></td>
                  <td>{pedido.cliente}</td>
                  <td>{pedido.monto ? `$${pedido.monto.toFixed(2)}` : '---'}</td>
                  <td>
                    <div className="solicitante-cell">
                      <span className="solicitante-avatar">{pedido.solicitante.avatar}</span>
                      <span>{pedido.solicitante.nombre}</span>
                    </div>
                  </td>
                  {vista === 'cancelados' && (
                    <td>
                      {pedido.cancelado_por && (
                        <div className="solicitante-cell">
                          <span className="solicitante-avatar">{pedido.cancelado_por.avatar}</span>
                          <span>{pedido.cancelado_por.nombre}</span>
                        </div>
                      )}
                    </td>
                  )}
                  <td>
                    <div className="estado-cell">
                      {pedido.cancelado ? (
                        <span className="estado-badge cancelado">CANCELADO</span>
                      ) : (
                        <>
                          <span className="estado-badge">{pedido.estado}</span>
                          {pedido.urgente && <span className="urgente-icon">🔴</span>}
                          {pedido.incompleto && <span className="incompleto-icon">⚠️</span>}
                        </>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="acciones-cell">
                      <button className="btn-action" onClick={() => pedido.cancelado ? verDetalleCancelacion(pedido) : handleItemClick(pedido)} title={pedido.cancelado ? "Ver detalle de cancelación" : "Ver detalle y gestionar"}>
                        👁️
                      </button>
                      {!pedido.cancelado && (
                        <button className="btn-cancelar-admin" onClick={() => abrirModalCancelar(pedido)} title="Cancelar pedido">
                          ❌
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pedidosFiltrados.length === 0 && (
            <div className="empty-table"><p>No se encontraron pedidos.</p></div>
          )}

          <div className="table-footer">
            <p>Mostrando {pedidosFiltrados.length} pedidos</p>
          </div>
        </div>
      </main>

      {showModal && itemSeleccionado && (
        <Modal title={`Gestionar Pedido #${itemSeleccionado.id}`} onClose={() => setShowModal(false)}>
          <div className="modal-form">
            <div className="info-section">
              <h3>Información</h3>
              <p><strong>Solicitante:</strong> {itemSeleccionado.solicitante.nombre}</p>
              <p><strong>Obra:</strong> {itemSeleccionado.obra}</p>
              <p><strong>Cliente:</strong> {itemSeleccionado.cliente}</p>
              {itemSeleccionado.monto && <p><strong>Monto:</strong> ${itemSeleccionado.monto.toFixed(2)}</p>}
              <p><strong>Estado actual:</strong> {itemSeleccionado.estado}</p>
            </div>

            <div className="info-section" style={{ marginTop: '20px' }}>
              <h3>Productos Solicitados</h3>
              {(() => {
                try {
                  const productos = JSON.parse(itemSeleccionado.descripcion)
                  return (
                    <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f5f5f5' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Producto</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Cantidad</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Unidad</th>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Descripción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productos.map((producto, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '10px' }}><strong>{producto.nombre}</strong></td>
                              <td style={{ padding: '10px' }}>{producto.cantidad}</td>
                              <td style={{ padding: '10px' }}>{producto.unidad}</td>
                              <td style={{ padding: '10px', color: '#666' }}>{producto.descripcion || '---'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                } catch (e) {
                  // Si no es JSON, mostrar como texto plano (compatibilidad con pedidos antiguos)
                  return <p style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>{itemSeleccionado.descripcion}</p>
                }
              })()}
            </div>

            {/* Visor de Imágenes */}
            {itemSeleccionado.imagenes && itemSeleccionado.imagenes.length > 0 && (
              <div className="info-section" style={{ marginTop: '20px' }}>
                <h3>Imágenes del Pedido ({itemSeleccionado.imagenes.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                  {itemSeleccionado.imagenes.map((imagen, index) => {
                    const imageUrl = `http://localhost:3001${imagen}`;
                    return (
                      <div key={index} style={{ position: 'relative', paddingBottom: '100%', backgroundColor: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: '2px solid #ddd' }}>
                        <img
                          src={imageUrl}
                          alt={`Imagen ${index + 1}`}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          onClick={() => window.open(imageUrl, '_blank')}
                          title="Click para ver en tamaño completo"
                        />
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.85em', color: '#666', marginTop: '10px' }}>
                  💡 Click en cualquier imagen para verla en tamaño completo
                </p>
              </div>
            )}

            {itemSeleccionado.imagenes && itemSeleccionado.imagenes.length === 0 && (
              <div className="info-section" style={{ marginTop: '20px' }}>
                <h3>Imágenes del Pedido</h3>
                <p style={{ color: '#999', fontStyle: 'italic', marginTop: '10px' }}>No hay imágenes adjuntas a este pedido</p>
              </div>
            )}

            <div className="form-group">
              <h3>Cambiar Estado</h3>
              {itemSeleccionado.estado === 'Pendiente Validación' && (
                <div className="info-message info-warning" style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                  ⏳ Este pedido está en proceso de validación. No puedes cambiar su estado hasta que el validador lo apruebe o rechace.
                </div>
              )}
              <div className="estado-buttons">
                <button onClick={() => handleCambiarEstado('Registrado')} className="btn-estado" disabled={itemSeleccionado.estado === 'Pendiente Validación'}>Registrado</button>
                <button onClick={() => handleCambiarEstado('En Proceso')} className="btn-estado" disabled={itemSeleccionado.estado === 'Pendiente Validación'}>En Proceso</button>
                <button onClick={() => handleCambiarEstado('Revisado')} className="btn-estado" disabled={itemSeleccionado.estado === 'Pendiente Validación'}>Revisado</button>
                <button onClick={() => handleCambiarEstado('Completado')} className="btn-estado" disabled={itemSeleccionado.estado === 'Pendiente Validación'}>Completado</button>
                <button onClick={() => handleCambiarEstado('Cerrado')} className="btn-estado" disabled={itemSeleccionado.estado === 'Pendiente Validación'}>Cerrado</button>
              </div>
            </div>

            <div className="form-group">
              <button onClick={handleMarcarIncompleto} className="btn-warning" style={{ width: '100%' }}>
                ⚠️ Marcar como Incompleto
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
      {modalCancelar && pedidoACancelar && (
        <Modal title="Cancelar Pedido" onClose={() => setModalCancelar(false)}>
          <div className="modal-form">
            <p style={{ marginBottom: '15px' }}>
              ¿Estás seguro de que deseas cancelar este pedido?
            </p>
            <div className="pedido-cancelar-info">
              <p><strong>Pedido ID:</strong> #{pedidoACancelar.id}</p>
              <p><strong>Obra:</strong> {pedidoACancelar.obra}</p>
              <p><strong>Cliente:</strong> {pedidoACancelar.cliente}</p>
              <p><strong>Solicitante:</strong> {pedidoACancelar.solicitante.nombre}</p>
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
              <strong>Solicitante:</strong>
              <span>
                {pedidoDetalle.solicitante.avatar} {pedidoDetalle.solicitante.nombre}
              </span>
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
              <span>{formatearFechaCompleta(pedidoDetalle.fecha_cancelacion)}</span>
            </div>
            <div className="info-row motivo">
              <strong>Motivo:</strong>
              <p>{pedidoDetalle.motivo_cancelacion}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminPedidos
