import { useState } from 'react'
import { notificaciones } from '../data/mockData'
import Layout from '../components/Layout'
import './Notificaciones.css'

function Notificaciones() {
  const [filtro, setFiltro] = useState('todas')

  const notificacionesFiltradas = notificaciones.filter(notif => {
    if (filtro === 'no-leidas') return !notif.leida
    if (filtro === 'archivadas') return false // No hay archivadas en mock data
    return true
  })

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida)
  const notificacionesNuevas = notificacionesFiltradas.filter(n => !n.leida)
  const notificacionesAnteriores = notificacionesFiltradas.filter(n => n.leida)

  const formatearTiempo = (fecha) => {
    const diff = new Date() - new Date(fecha)
    const minutos = Math.floor(diff / (1000 * 60))
    const horas = Math.floor(diff / (1000 * 60 * 60))
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutos < 60) return `Hace ${minutos} min`
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`
    if (dias === 1) return 'Ayer'
    return `${dias} Oct`
  }

  const getNotifIconClass = (tipo) => {
    const map = {
      'warning': 'notif-icon-warning',
      'info': 'notif-icon-info',
      'success': 'notif-icon-success',
      'locked': 'notif-icon-locked'
    }
    return map[tipo] || 'notif-icon-info'
  }

  return (
    <Layout>
      <div className="notificaciones-page">
        <div className="page-header">
          <div>
            <h1>Notificaciones</h1>
            <p>Mantente al tanto de tus pedidos y actualizaciones administrativas.</p>
          </div>
          <button className="btn-marcar-leidas">✓ Marcar todas como leídas</button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${filtro === 'todas' ? 'active' : ''}`}
            onClick={() => setFiltro('todas')}
          >
            Todas
          </button>
          <button
            className={`tab ${filtro === 'no-leidas' ? 'active' : ''}`}
            onClick={() => setFiltro('no-leidas')}
          >
            No leídas
            {notificacionesNoLeidas.length > 0 && (
              <span className="badge-count">{notificacionesNoLeidas.length}</span>
            )}
          </button>
          <button
            className={`tab ${filtro === 'archivadas' ? 'active' : ''}`}
            onClick={() => setFiltro('archivadas')}
          >
            Archivadas
          </button>
        </div>

        <div className="notificaciones-container">
          {notificacionesNuevas.length > 0 && (
            <div className="notif-section">
              <h3 className="section-title">NUEVAS</h3>
              {notificacionesNuevas.map(notif => (
                <div key={notif.id} className={`notif-card ${notif.leida ? '' : 'no-leida'}`}>
                  <div className="notif-dot"></div>
                  <div className={`notif-icon ${getNotifIconClass(notif.tipo)}`}>
                    {notif.icono}
                  </div>
                  <div className="notif-content">
                    <h4 className="notif-titulo">{notif.titulo}</h4>
                    <p className="notif-mensaje">{notif.mensaje}</p>
                  </div>
                  <div className="notif-time">{formatearTiempo(notif.fecha)}</div>
                  <button className="btn-arrow-notif">→</button>
                </div>
              ))}
            </div>
          )}

          {notificacionesAnteriores.length > 0 && (
            <div className="notif-section">
              <h3 className="section-title">ANTERIORES</h3>
              {notificacionesAnteriores.map(notif => (
                <div key={notif.id} className={`notif-card ${notif.leida ? '' : 'no-leida'}`}>
                  <div className={`notif-icon ${getNotifIconClass(notif.tipo)}`}>
                    {notif.icono}
                  </div>
                  <div className="notif-content">
                    <h4 className="notif-titulo">{notif.titulo}</h4>
                    <p className="notif-mensaje">{notif.mensaje}</p>
                  </div>
                  <div className="notif-time">{formatearTiempo(notif.fecha)}</div>
                  <button className="btn-arrow-notif">→</button>
                </div>
              ))}
            </div>
          )}

          {notificacionesFiltradas.length === 0 && (
            <div className="empty-state">
              <p>No tienes notificaciones {filtro === 'no-leidas' ? 'sin leer' : filtro === 'archivadas' ? 'archivadas' : ''}.</p>
            </div>
          )}
        </div>

        <button className="btn-ver-antiguas">Ver notificaciones antiguas ↓</button>
      </div>
    </Layout>
  )
}

export default Notificaciones
