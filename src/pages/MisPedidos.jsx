import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { pedidosAPI } from '../services/api'
import Layout from '../components/Layout'
import './MisPedidos.css'

function MisPedidos() {
  const { user } = useAuth()
  const [filtro, setFiltro] = useState('todos')
  const [misPedidos, setMisPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarPedidos()
  }, [user])

  const cargarPedidos = async () => {
    try {
      setLoading(true)
      const data = await pedidosAPI.getAll(user.id, user.role === 'admin')
      setMisPedidos(data)
    } catch (error) {
      console.error('Error al cargar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const pedidosFiltrados = misPedidos.filter(pedido => {
    if (filtro === 'urgentes') return pedido.urgente
    if (filtro === 'incompletos') return pedido.incompleto
    return true
  })

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

        <div className="pedidos-list">
          {pedidosFiltrados.map(pedido => (
            <div key={pedido.id} className={`pedido-card ${pedido.urgente ? 'urgente' : ''}`}>
              <div className="pedido-header">
                <div className="pedido-icon">{getEstadoIcon(pedido.estado)}</div>
                <div className="pedido-info">
                  <div className="pedido-meta">
                    <span className={`badge ${getEstadoBadgeClass(pedido.estado)}`}>
                      {pedido.estado}
                    </span>
                    <span className="pedido-time">{formatearTiempo(pedido.fecha)}</span>
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
                      // Si no es JSON, mostrar como texto (compatibilidad con pedidos antiguos)
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
                <button className="btn-arrow">→</button>
              </div>
            </div>
          ))}

          {pedidosFiltrados.length === 0 && (
            <div className="empty-state">
              <p>No se encontraron pedidos con los filtros seleccionados.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default MisPedidos
