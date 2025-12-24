import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { pedidos } from '../data/mockData'
import Layout from '../components/Layout'
import './MisPedidos.css'

function MisPedidos() {
  const { user } = useAuth()
  const [filtro, setFiltro] = useState('todos')

  // Filtrar solo los pedidos del usuario actual
  const misPedidos = pedidos.filter(p => p.solicitante.id === user.id)

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

  return (
    <Layout>
      <div className="mis-pedidos">
        <div className="page-header">
          <div>
            <h1>Mis Pedidos</h1>
            <p>Gestiona y rastrea el estado de tus requisiciones.</p>
          </div>
          <button className="btn-new-pedido">+ Nuevo Pedido</button>
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
                  <p className="pedido-description">{pedido.descripcion}</p>

                  <div className="pedido-details">
                    {pedido.fotos > 0 && (
                      <span className="detail-badge">📸 {pedido.fotos} fotos</span>
                    )}
                    {pedido.incompleto && (
                      <span className="detail-badge warning">❗ Incompleto</span>
                    )}
                    {pedido.urgente && (
                      <span className="detail-badge urgent">⚡ Urgente</span>
                    )}
                  </div>

                  {pedido.comentarios.length > 0 && (
                    <div className="pedido-comments">
                      {pedido.comentarios.map((comentario, idx) => (
                        <p key={idx} className="comment">{comentario}</p>
                      ))}
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

          <button className="btn-load-more">Cargar más pedidos...</button>
        </div>
      </div>
    </Layout>
  )
}

export default MisPedidos
