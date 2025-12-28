import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { pedidosAPI, comprasAPI, notificacionesAPI } from '../services/api'
import Modal from '../components/Modal'
import './AdminPanel.css'

function SupervisorPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [comentario, setComentario] = useState('')
  const [showRechazarModal, setShowRechazarModal] = useState(false)
  const [motivo, setMotivo] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [pedidosData, comprasData] = await Promise.all([
        pedidosAPI.getAll(user.id, true),
        comprasAPI.getAll(user.id, true)
      ])
      setPedidos(pedidosData)
      setCompras(comprasData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Combinar pedidos y compras
  const todosCombinados = [
    ...pedidos.map(p => ({ ...p, tipo: 'Pedido' })),
    ...compras.map(c => ({ ...c, tipo: 'Compra' }))
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  // Filtrar por estado
  const itemsFiltrados = todosCombinados.filter(item => {
    let pasa = true

    // Filtro de estado
    if (filtroEstado === 'todos') {
      pasa = true
    } else if (filtroEstado === 'nuevos') {
      pasa = item.tipo === 'Pedido' ? (item.estado === 'Registrado' || item.estado === 'En Proceso') : (item.estado === 'Pendiente')
    } else if (filtroEstado === 'urgentes') {
      pasa = item.urgente
    } else if (filtroEstado === 'incompletos') {
      pasa = item.incompleto || (item.tipo === 'Compra' && !item.ticket)
    } else if (filtroEstado === 'pendiente-validacion') {
      pasa = item.tipo === 'Pedido' && item.estado === 'Pendiente Validación'
    } else if (filtroEstado === 'validados') {
      pasa = item.tipo === 'Pedido' && item.estado === 'Validado'
    } else if (filtroEstado === 'revisados') {
      pasa = item.tipo === 'Pedido' ? item.estado === 'Revisado' : item.estado === 'Subido'
    } else if (filtroEstado === 'cerrados') {
      pasa = item.tipo === 'Pedido' ? (item.estado === 'Completado' || item.estado === 'Cerrado') : false
    }

    // Filtro de búsqueda
    if (busqueda) {
      const searchLower = busqueda.toLowerCase()
      pasa = pasa && (
        item.obra?.toLowerCase().includes(searchLower) ||
        item.cliente?.toLowerCase().includes(searchLower) ||
        item.proveedor?.toLowerCase().includes(searchLower) ||
        item.descripcion?.toLowerCase().includes(searchLower) ||
        item.id?.toString().includes(searchLower) ||
        item.solicitante?.nombre.toLowerCase().includes(searchLower)
      )
    }

    return pasa
  })

  // Contar por categorías
  const contadores = {
    todos: todosCombinados.length,
    nuevos: todosCombinados.filter(i =>
      i.tipo === 'Pedido' ? (i.estado === 'Registrado' || i.estado === 'En Proceso') : (i.estado === 'Pendiente')
    ).length,
    urgentes: todosCombinados.filter(i => i.urgente).length,
    incompletos: todosCombinados.filter(i => i.incompleto || (i.tipo === 'Compra' && !i.ticket)).length,
    pendienteValidacion: pedidos.filter(p => p.estado === 'Pendiente Validación').length,
    validados: pedidos.filter(p => p.estado === 'Validado').length
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getEstadoBadge = (item) => {
    if (item.tipo === 'Pedido') {
      const map = {
        'Registrado': { class: 'badge-blue', icon: '📝' },
        'En Proceso': { class: 'badge-blue', icon: '🔄' },
        'Pendiente Foto': { class: 'badge-orange', icon: '📷' },
        'Revisión Pendiente': { class: 'badge-orange', icon: '⚠️' },
        'Revisado': { class: 'badge-green', icon: '✅' },
        'Pendiente Validación': { class: 'badge-orange', icon: '⏳' },
        'Validado': { class: 'badge-green', icon: '✅' },
        'Completado': { class: 'badge-green', icon: '✅' },
        'Cerrado': { class: 'badge-gray', icon: '📦' }
      }
      return map[item.estado] || map['Registrado']
    } else {
      return item.ticket
        ? { class: 'badge-green', icon: '✅' }
        : { class: 'badge-orange', icon: '⚠️' }
    }
  }

  const handleItemClick = (item) => {
    setItemSeleccionado(item)
    setShowModal(true)
    setComentario('')
    setMotivo('')
  }

  // Función para validar pedido directamente
  const handleValidar = async () => {
    if (!itemSeleccionado) return

    if (!confirm('¿Confirmas que deseas VALIDAR este pedido? Esta acción eliminará las imágenes del servidor.')) {
      return
    }

    try {
      await pedidosAPI.validar(itemSeleccionado.id, 'validar')

      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'success',
        titulo: '✅ Pedido Validado por Supervisor',
        mensaje: `Tu pedido #${itemSeleccionado.id} (${itemSeleccionado.obra || itemSeleccionado.cliente}) ha sido validado por el supervisor y está listo para comprar.`,
        icono: '✅'
      })

      await cargarDatos()
      setShowModal(false)
      alert('✅ Pedido validado exitosamente')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al validar: ' + error.message)
    }
  }

  // Función para rechazar pedido
  const handleRechazar = async (nuevoEstado) => {
    if (!motivo.trim()) {
      alert('Debes proporcionar un motivo de rechazo')
      return
    }

    try {
      await pedidosAPI.validar(itemSeleccionado.id, 'rechazar', motivo, nuevoEstado)

      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'warning',
        titulo: '❌ Pedido Rechazado por Supervisor',
        mensaje: `Tu pedido #${itemSeleccionado.id} fue rechazado. Motivo: ${motivo}`,
        icono: '❌'
      })

      await cargarDatos()
      setShowRechazarModal(false)
      setShowModal(false)
      alert('Pedido rechazado y devuelto a estado: ' + nuevoEstado)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al rechazar: ' + error.message)
    }
  }

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!itemSeleccionado) return

    try {
      if (itemSeleccionado.tipo === 'Pedido') {
        await pedidosAPI.update(itemSeleccionado.id, { estado: nuevoEstado })

        // Crear notificación para el usuario
        await notificacionesAPI.create({
          usuario_id: itemSeleccionado.solicitante.id,
          tipo: 'info',
          titulo: `Estado de pedido actualizado por Supervisor`,
          mensaje: `Tu pedido #${itemSeleccionado.id} cambió a estado: ${nuevoEstado}`,
          icono: '📝'
        })
      } else {
        await comprasAPI.update(itemSeleccionado.id, { estado: nuevoEstado })

        // Crear notificación para el usuario
        await notificacionesAPI.create({
          usuario_id: itemSeleccionado.solicitante.id,
          tipo: 'info',
          titulo: `Estado de compra actualizado por Supervisor`,
          mensaje: `Tu compra #${itemSeleccionado.id} cambió a estado: ${nuevoEstado}`,
          icono: '🧾'
        })
      }
      await cargarDatos()
      setShowModal(false)
      alert('Estado actualizado y notificación enviada')
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      alert('Error al cambiar el estado')
    }
  }

  const handleEnviarComentario = async () => {
    if (!itemSeleccionado || !comentario.trim()) return

    try {
      if (itemSeleccionado.tipo === 'Pedido') {
        await pedidosAPI.addComentario(itemSeleccionado.id, comentario)
      }

      // Crear notificación para el usuario
      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'warning',
        titulo: `💬 Comentario del Supervisor en ${itemSeleccionado.tipo} #${itemSeleccionado.id}`,
        mensaje: comentario,
        icono: '💬'
      })

      await cargarDatos()
      setComentario('')
      alert('Comentario enviado y notificación creada')
    } catch (error) {
      console.error('Error al enviar comentario:', error)
      alert('Error al enviar el comentario')
    }
  }

  const handleMarcarIncompleto = async () => {
    if (!itemSeleccionado) return

    try {
      if (itemSeleccionado.tipo === 'Pedido') {
        await pedidosAPI.update(itemSeleccionado.id, { incompleto: 1 })
      }

      // Crear notificación
      await notificacionesAPI.create({
        usuario_id: itemSeleccionado.solicitante.id,
        tipo: 'warning',
        titulo: `${itemSeleccionado.tipo} marcado como incompleto`,
        mensaje: `Tu ${itemSeleccionado.tipo.toLowerCase()} #${itemSeleccionado.id} ha sido marcado como incompleto por el supervisor. Por favor, revisa la información.`,
        icono: '⚠️'
      })

      await cargarDatos()
      setShowModal(false)
      alert('Marcado como incompleto y notificación enviada')
    } catch (error) {
      console.error('Error:', error)
      alert('Error al marcar como incompleto')
    }
  }

  if (loading) {
    return <div className="admin-panel"><p>Cargando...</p></div>
  }

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">👑</div>
          <div className="admin-title">
            <h2>Supervisor</h2>
            <p>Control Total</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="admin-nav-item active">
            <span className="nav-icon">👁️</span>
            <span>Vista General</span>
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
          <button className="admin-nav-item" onClick={() => navigate('/validador')}>
            <span className="nav-icon">✓</span>
            <span>Panel Validador</span>
          </button>
          <button className="admin-nav-item" onClick={() => navigate('/admin')}>
            <span className="nav-icon">⚙️</span>
            <span>Panel Admin</span>
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
            <div className="admin-user-avatar">👑</div>
            <div className="admin-user-info">
              <p className="admin-user-name">{user.name}</p>
              <p className="admin-user-role">Supervisor Supremo</p>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span>🚪</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-breadcrumb">
          <span>Supervisor</span>
          <span>›</span>
          <span>Vista General</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>👁️ Vista General del Sistema</h1>
            <p>Control total: Ver todo, validar todo, administrar todo. Monitoreo completo de pedidos, compras y comunicaciones.</p>
          </div>
          <button className="btn-nueva-solicitud" onClick={() => navigate('/')}>+ Nueva Solicitud</button>
        </div>

        <div className="admin-tabs" style={{ overflowX: 'auto', flexWrap: 'wrap' }}>
          <button
            className={`admin-tab ${filtroEstado === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('todos')}
          >
            Todos
            <span className="tab-count">{contadores.todos}</span>
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'nuevos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('nuevos')}
          >
            Nuevos
            <span className="tab-count">{contadores.nuevos}</span>
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'pendiente-validacion' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('pendiente-validacion')}
            style={{ backgroundColor: contadores.pendienteValidacion > 0 ? '#ff6b6b' : undefined }}
          >
            ⏳ Pendiente Validación
            <span className="tab-count">{contadores.pendienteValidacion}</span>
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'validados' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('validados')}
          >
            Validados
            <span className="tab-count">{contadores.validados}</span>
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'urgentes' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('urgentes')}
          >
            🔴 Urgentes
            <span className="tab-count">{contadores.urgentes}</span>
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'incompletos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('incompletos')}
          >
            ⚠️ Incompletos
            <span className="tab-count">{contadores.incompletos}</span>
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'revisados' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('revisados')}
          >
            Revisados
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'cerrados' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('cerrados')}
          >
            Cerrados
          </button>
        </div>

        <div className="admin-filters">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por Obra, Solicitante, ID, Descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <button className="filter-btn">📅 Seleccionar fechas</button>
          <button className="filter-btn" onClick={cargarDatos}>🔄 Actualizar</button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>TIPO</th>
                <th>FECHA</th>
                <th>OBRA/CLIENTE</th>
                <th>MONTO</th>
                <th>SOLICITANTE</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map(item => {
                const badge = getEstadoBadge(item)
                const esPendienteValidacion = item.tipo === 'Pedido' && item.estado === 'Pendiente Validación'

                return (
                  <tr
                    key={`${item.tipo}-${item.id}`}
                    style={esPendienteValidacion ? { backgroundColor: '#fff3cd' } : undefined}
                  >
                    <td>
                      <span className={`tipo-badge ${item.tipo === 'Pedido' ? 'tipo-pedido' : 'tipo-compra'}`}>
                        {item.tipo === 'Pedido' ? '📦 Pedido' : '🧾 Compra'}
                      </span>
                      {esPendienteValidacion && <span style={{ marginLeft: '5px', color: '#ff6b6b' }}>⏳</span>}
                    </td>
                    <td>{new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td><strong>{item.obra || item.cliente || '-'}</strong></td>
                    <td>
                      {item.monto !== null && item.monto !== undefined
                        ? `$${item.monto.toFixed(2)}`
                        : item.tipo === 'Compra' ? '-' : '---'}
                    </td>
                    <td>
                      <div className="solicitante-cell">
                        <span className="solicitante-avatar">{item.solicitante.avatar}</span>
                        <span>{item.solicitante.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <div className="estado-cell">
                        <span className={`estado-badge ${badge.class}`}>
                          {badge.icon}
                        </span>
                        {item.urgente && <span className="urgente-icon">🔴</span>}
                        {item.incompleto && <span className="incompleto-icon">⚠️</span>}
                      </div>
                    </td>
                    <td>
                      {esPendienteValidacion ? (
                        <button
                          className="btn-action"
                          onClick={() => handleItemClick(item)}
                          title="VALIDAR AHORA"
                          style={{ backgroundColor: '#ff6b6b', color: 'white', fontWeight: 'bold' }}
                        >
                          ✓ VALIDAR
                        </button>
                      ) : (
                        <button
                          className="btn-action"
                          onClick={() => handleItemClick(item)}
                          title="Gestionar"
                        >
                          ⚙️
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {itemsFiltrados.length === 0 && (
            <div className="empty-table">
              <p>No se encontraron resultados.</p>
            </div>
          )}

          <div className="table-footer">
            <p>Mostrando {itemsFiltrados.length} de {todosCombinados.length} resultados</p>
          </div>
        </div>
      </main>

      {showModal && itemSeleccionado && (
        <Modal
          title={`🎯 Supervisión ${itemSeleccionado.tipo} #${itemSeleccionado.id}`}
          onClose={() => setShowModal(false)}
        >
          <div className="modal-form">
            <div className="info-section">
              <h3>📋 Información Completa</h3>
              <p><strong>Solicitante:</strong> {itemSeleccionado.solicitante.nombre} ({itemSeleccionado.solicitante.username})</p>
              <p><strong>Obra/Cliente:</strong> {itemSeleccionado.obra || itemSeleccionado.cliente}</p>
              <p><strong>Descripción:</strong> {itemSeleccionado.descripcion}</p>
              {itemSeleccionado.monto && <p><strong>Monto:</strong> ${itemSeleccionado.monto.toFixed(2)}</p>}
              <p><strong>Estado actual:</strong> <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#e3f2fd',
                fontWeight: 'bold'
              }}>{itemSeleccionado.estado}</span></p>
              <p><strong>Urgente:</strong> {itemSeleccionado.urgente ? '🔴 SÍ' : 'No'}</p>
              <p><strong>Incompleto:</strong> {itemSeleccionado.incompleto ? '⚠️ SÍ' : 'No'}</p>
              {itemSeleccionado.tipo === 'Pedido' && itemSeleccionado.fotos > 0 && (
                <p><strong>Imágenes:</strong> {itemSeleccionado.fotos} archivos</p>
              )}
            </div>

            {/* MOSTRAR COMENTARIOS/CHAT COMPLETO */}
            {itemSeleccionado.tipo === 'Pedido' && itemSeleccionado.comentarios && itemSeleccionado.comentarios.length > 0 && (
              <div className="info-section" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                <h3>💬 Historial de Comentarios / Chat</h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {itemSeleccionado.comentarios.map((c, idx) => (
                    <div key={idx} style={{
                      marginBottom: '10px',
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      borderLeft: '3px solid #4CAF50'
                    }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}>
                        <strong>{c.usuario_nombre || 'Admin'}</strong> - {new Date(c.created_at).toLocaleString('es-ES')}
                      </p>
                      <p style={{ margin: 0, fontSize: '14px' }}>{c.comentario}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VALIDACIÓN DIRECTA - Solo para pedidos pendientes de validación */}
            {itemSeleccionado.tipo === 'Pedido' && itemSeleccionado.estado === 'Pendiente Validación' && (
              <div className="form-group" style={{
                backgroundColor: '#fff3cd',
                padding: '15px',
                borderRadius: '8px',
                border: '2px solid #ffc107',
                marginTop: '15px'
              }}>
                <h3 style={{ color: '#ff6b6b' }}>⏳ VALIDACIÓN DE PEDIDO</h3>
                <p style={{ marginBottom: '15px' }}>Este pedido está esperando validación. Como supervisor, puedes:</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleValidar}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '12px',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    ✅ VALIDAR PEDIDO
                  </button>
                  <button
                    onClick={() => setShowRechazarModal(true)}
                    className="btn-warning"
                    style={{
                      flex: 1,
                      backgroundColor: '#ff6b6b',
                      color: 'white',
                      padding: '12px',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    ❌ RECHAZAR PEDIDO
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <h3>🔄 Cambiar Estado</h3>
              <div className="estado-buttons">
                {itemSeleccionado.tipo === 'Pedido' ? (
                  <>
                    <button onClick={() => handleCambiarEstado('En Proceso')} className="btn-estado">En Proceso</button>
                    <button onClick={() => handleCambiarEstado('Revisado')} className="btn-estado">Revisado</button>
                    <button onClick={() => handleCambiarEstado('Pendiente Validación')} className="btn-estado">Pendiente Validación</button>
                    <button onClick={() => handleCambiarEstado('Completado')} className="btn-estado">Completado</button>
                    <button onClick={() => handleCambiarEstado('Cerrado')} className="btn-estado">Cerrado</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleCambiarEstado('Subido')} className="btn-estado">Subido</button>
                    <button onClick={() => handleCambiarEstado('Pendiente')} className="btn-estado">Pendiente</button>
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <h3>⚠️ Acciones Especiales</h3>
              <button
                onClick={handleMarcarIncompleto}
                className="btn-warning"
                style={{ marginBottom: '10px', width: '100%' }}
              >
                ⚠️ Marcar como Incompleto y Notificar
              </button>
            </div>

            <div className="form-group">
              <h3>💬 Agregar Comentario / Mensaje al Usuario</h3>
              <textarea
                rows="4"
                placeholder="Escribe un comentario, instrucciones o mensaje para el usuario. Será visible en el chat y notificado..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              ></textarea>
              <button
                onClick={handleEnviarComentario}
                className="btn-primary"
                disabled={!comentario.trim()}
                style={{ marginTop: '10px' }}
              >
                💬 Enviar Comentario y Notificar
              </button>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Rechazo */}
      {showRechazarModal && (
        <Modal
          title="❌ Rechazar Pedido"
          onClose={() => setShowRechazarModal(false)}
        >
          <div className="modal-form">
            <div className="form-group">
              <label>Motivo del rechazo:</label>
              <textarea
                rows="4"
                placeholder="Escribe el motivo por el cual se rechaza este pedido..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              ></textarea>
            </div>

            <div className="form-group">
              <label>¿A qué estado deseas devolverlo?</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => handleRechazar('En Proceso')}
                  className="btn-estado"
                  style={{ flex: 1 }}
                >
                  🔄 En Proceso
                </button>
                <button
                  onClick={() => handleRechazar('Revisado')}
                  className="btn-estado"
                  style={{ flex: 1 }}
                >
                  ✅ Revisado
                </button>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowRechazarModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default SupervisorPanel
