import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { pedidosAPI, comprasAPI, notificacionesAPI } from '../services/api'
import Modal from '../components/Modal'
import './AdminPanel.css'

function AdminPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [filtroEstado, setFiltroEstado] = useState('nuevos')
  const [busqueda, setBusqueda] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [compras, setCompras] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [comentario, setComentario] = useState('')

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
    if (filtroEstado === 'nuevos') {
      pasa = item.tipo === 'Pedido' ? (item.estado === 'Registrado' || item.estado === 'En Proceso') : (item.estado === 'Pendiente')
    } else if (filtroEstado === 'urgentes') {
      pasa = item.urgente
    } else if (filtroEstado === 'incompletos') {
      pasa = item.incompleto || (item.tipo === 'Compra' && !item.ticket)
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
    nuevos: todosCombinados.filter(i =>
      i.tipo === 'Pedido' ? (i.estado === 'Registrado' || i.estado === 'En Proceso') : (i.estado === 'Pendiente')
    ).length,
    urgentes: todosCombinados.filter(i => i.urgente).length,
    incompletos: todosCombinados.filter(i => i.incompleto || (i.tipo === 'Compra' && !i.ticket)).length
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
  }

  const handleCambiarEstado = async (nuevoEstado) => {
    if (!itemSeleccionado) return

    try {
      if (itemSeleccionado.tipo === 'Pedido') {
        await pedidosAPI.update(itemSeleccionado.id, { estado: nuevoEstado })
      } else {
        await comprasAPI.update(itemSeleccionado.id, { estado: nuevoEstado })
      }
      await cargarDatos()
      setShowModal(false)
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
        titulo: `Comentario en ${itemSeleccionado.tipo} #${itemSeleccionado.id}`,
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
        mensaje: `Tu ${itemSeleccionado.tipo.toLowerCase()} #${itemSeleccionado.id} ha sido marcado como incompleto. Por favor, revisa la información.`,
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
          <div className="admin-logo">⚙️</div>
          <div className="admin-title">
            <h2>AdminPanel</h2>
            <p>Gestión v2.0</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="admin-nav-item active">
            <span className="nav-icon">📥</span>
            <span>Bandeja de Entrada</span>
          </button>
          <button className="admin-nav-item">
            <span className="nav-icon">📦</span>
            <span>Pedidos</span>
          </button>
          <button className="admin-nav-item">
            <span className="nav-icon">🧾</span>
            <span>Compras</span>
          </button>
          <button className="admin-nav-item">
            <span className="nav-icon">👥</span>
            <span>Usuarios</span>
          </button>
          <button className="admin-nav-item">
            <span className="nav-icon">📊</span>
            <span>Reportes</span>
          </button>
          <button className="admin-nav-item">
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
          <button className="admin-logout-btn" onClick={handleLogout}>
            <span>🚪</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-breadcrumb">
          <span>Inicio</span>
          <span>›</span>
          <span>Bandeja de Entrada</span>
        </div>

        <div className="admin-header">
          <div>
            <h1>Bandeja de Entrada</h1>
            <p>Gestión y aprobación de pedidos y compras recientes.</p>
          </div>
          <button className="btn-nueva-solicitud" onClick={() => navigate('/')}>+ Nueva Solicitud</button>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${filtroEstado === 'nuevos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('nuevos')}
          >
            Nuevos
            <span className="tab-count">{contadores.nuevos}</span>
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'urgentes' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('urgentes')}
          >
            Urgentes
            <span className="tab-count">{contadores.urgentes}</span>
          </button>
          <button
            className={`admin-tab ${filtroEstado === 'incompletos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('incompletos')}
          >
            Incompletos
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
              placeholder="Buscar por Obra, Solicitante o ID..."
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
                <th>OBRA</th>
                <th>DESCRIPCIÓN</th>
                <th>MONTO/CANT.</th>
                <th>SOLICITANTE</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map(item => {
                const badge = getEstadoBadge(item)
                return (
                  <tr key={`${item.tipo}-${item.id}`}>
                    <td>
                      <span className={`tipo-badge ${item.tipo === 'Pedido' ? 'tipo-pedido' : 'tipo-compra'}`}>
                        {item.tipo === 'Pedido' ? '📦 Pedido' : '🧾 Compra'}
                      </span>
                    </td>
                    <td>{new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td><strong>{item.obra || item.cliente || '-'}</strong></td>
                    <td className="descripcion-cell">
                      {item.descripcion?.substring(0, 60)}
                      {item.descripcion?.length > 60 ? '...' : ''}
                    </td>
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
                      <button
                        className="btn-action"
                        onClick={() => handleItemClick(item)}
                        title="Gestionar"
                      >
                        ⚙️
                      </button>
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
            <p>Mostrando {itemsFiltrados.length} resultados</p>
          </div>
        </div>
      </main>

      {showModal && itemSeleccionado && (
        <Modal
          title={`Gestionar ${itemSeleccionado.tipo} #${itemSeleccionado.id}`}
          onClose={() => setShowModal(false)}
        >
          <div className="modal-form">
            <div className="info-section">
              <h3>Información</h3>
              <p><strong>Solicitante:</strong> {itemSeleccionado.solicitante.nombre}</p>
              <p><strong>Obra:</strong> {itemSeleccionado.obra || itemSeleccionado.cliente}</p>
              <p><strong>Descripción:</strong> {itemSeleccionado.descripcion}</p>
              {itemSeleccionado.monto && <p><strong>Monto:</strong> ${itemSeleccionado.monto.toFixed(2)}</p>}
              <p><strong>Estado actual:</strong> {itemSeleccionado.estado}</p>
            </div>

            <div className="form-group">
              <h3>Cambiar Estado</h3>
              <div className="estado-buttons">
                {itemSeleccionado.tipo === 'Pedido' ? (
                  <>
                    <button onClick={() => handleCambiarEstado('En Proceso')} className="btn-estado">En Proceso</button>
                    <button onClick={() => handleCambiarEstado('Revisado')} className="btn-estado">Revisado</button>
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
              <h3>Acciones</h3>
              <button
                onClick={handleMarcarIncompleto}
                className="btn-warning"
                style={{ marginBottom: '10px', width: '100%' }}
              >
                ⚠️ Marcar como Incompleto y Notificar
              </button>
            </div>

            <div className="form-group">
              <h3>Agregar Comentario / Notificación</h3>
              <textarea
                rows="4"
                placeholder="Escribe un comentario o instrucciones para el usuario..."
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
    </div>
  )
}

export default AdminPanel
