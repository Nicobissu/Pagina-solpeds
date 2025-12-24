import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { compras } from '../data/mockData'
import Layout from '../components/Layout'
import './MisCompras.css'

function MisCompras() {
  const { user } = useAuth()
  const [filtroObra, setFiltroObra] = useState('todas')
  const [sinTicket, setSinTicket] = useState(false)

  // Filtrar solo las compras del usuario actual
  const misCompras = compras.filter(c => c.solicitante.id === user.id)

  const comprasFiltradas = misCompras.filter(compra => {
    let pasa = true
    if (filtroObra !== 'todas' && compra.obra !== filtroObra) pasa = false
    if (sinTicket && compra.ticket !== null) pasa = false
    return pasa
  })

  const obras = ['todas', ...new Set(misCompras.map(c => c.obra))]

  const formatearFecha = (fecha) => {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <Layout>
      <div className="mis-compras">
        <div className="page-header">
          <div>
            <h1>Mis Compras</h1>
            <p>Gestiona y revisa tus gastos personales por obra.</p>
          </div>
          <button className="btn-registrar-gasto">+ Registrar Gasto</button>
        </div>

        <div className="tabs">
          <button className="tab" onClick={() => window.location.href = '/pedidos'}>Mis Pedidos</button>
          <button className="tab active">Mis Compras</button>
          <button className="tab">Aprobaciones</button>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Obra:</label>
            <select value={filtroObra} onChange={(e) => setFiltroObra(e.target.value)}>
              {obras.map(obra => (
                <option key={obra} value={obra}>
                  {obra === 'todas' ? 'Todas' : obra}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Período:</label>
            <select>
              <option>Últimos 30 días</option>
              <option>Últimos 60 días</option>
              <option>Últimos 90 días</option>
              <option>Todo el tiempo</option>
            </select>
          </div>

          <div className="filter-checkbox">
            <input
              type="checkbox"
              id="sinTicket"
              checked={sinTicket}
              onChange={(e) => setSinTicket(e.target.checked)}
            />
            <label htmlFor="sinTicket">Sin ticket</label>
          </div>
        </div>

        <div className="results-info">
          Mostrando {comprasFiltradas.length} resultados
        </div>

        <div className="compras-grid">
          {comprasFiltradas.map(compra => (
            <div key={compra.id} className={`compra-card ${compra.urgente ? 'urgente' : ''} ${!compra.ticket ? 'sin-ticket' : ''}`}>
              <div className="compra-date">{formatearFecha(compra.fecha)}</div>
              <h3 className="compra-titulo">{compra.descripcion}</h3>

              <div className="compra-info-grid">
                <div className="info-item">
                  <span className="info-label">Obra</span>
                  <span className="info-value">{compra.obra}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Monto</span>
                  <span className="info-value monto">${compra.monto.toFixed(2)}</span>
                </div>
              </div>

              <div className="compra-footer">
                <div className="compra-status">
                  {compra.ticket ? (
                    <span className="status-badge subido">
                      <span className="status-dot"></span>
                      Subido
                    </span>
                  ) : (
                    <span className="status-badge pendiente">
                      <span className="status-dot"></span>
                      Pendiente
                    </span>
                  )}
                </div>
                <button className="btn-view">👁️</button>
              </div>

              {compra.urgente && (
                <div className="urgente-badge">⚠️</div>
              )}
              {!compra.ticket && (
                <div className="ticket-icon">🧾</div>
              )}
            </div>
          ))}

          {comprasFiltradas.length === 0 && (
            <div className="empty-state">
              <p>No se encontraron compras con los filtros seleccionados.</p>
            </div>
          )}
        </div>

        <button className="btn-load-more">Cargar más</button>
      </div>
    </Layout>
  )
}

export default MisCompras
