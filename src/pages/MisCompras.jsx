import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { comprasAPI } from '../services/api'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import './MisCompras.css'

function MisCompras() {
  const { user } = useAuth()
  const [vista, setVista] = useState('activas') // 'activas' o 'canceladas'
  const [filtroObra, setFiltroObra] = useState('todas')
  const [sinTicket, setSinTicket] = useState(false)
  const [misCompras, setMisCompras] = useState([])
  const [comprasCanceladas, setComprasCanceladas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalCancelar, setModalCancelar] = useState(false)
  const [compraACancelar, setCompraACancelar] = useState(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [compraDetalle, setCompraDetalle] = useState(null)
  const [modalDetalle, setModalDetalle] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [user, vista])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      if (vista === 'activas') {
        const data = await comprasAPI.getAll(user.id, user.role === 'admin')
        setMisCompras(data)
      } else {
        const data = await comprasAPI.getCanceladas(user.id, user.role === 'admin')
        setComprasCanceladas(data)
      }
    } catch (error) {
      console.error('Error al cargar compras:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const comprasFiltradas = vista === 'activas'
    ? misCompras.filter(compra => {
        let pasa = true
        if (filtroObra !== 'todas' && compra.obra !== filtroObra) pasa = false
        if (sinTicket && compra.ticket !== null) pasa = false
        return pasa
      })
    : comprasCanceladas

  const obras = ['todas', ...new Set(misCompras.map(c => c.obra))]

  const formatearFecha = (fecha) => {
    const date = new Date(fecha)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
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

  if (loading) {
    return (
      <Layout>
        <div className="mis-compras">
          <p>Cargando compras...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mis-compras">
        <div className="page-header">
          <div>
            <h1>Mis Compras</h1>
            <p>Gestiona y revisa tus gastos personales por obra.</p>
          </div>
          <button className="btn-registrar-gasto" onClick={() => window.location.href = '/'}>+ Registrar Gasto</button>
        </div>

        <div className="tabs">
          <button className="tab" onClick={() => window.location.href = '/pedidos'}>Mis Pedidos</button>
          <button className="tab active">Mis Compras</button>
          <button className="tab">Aprobaciones</button>
        </div>

        {/* Pestañas Activas/Canceladas */}
        <div className="sub-tabs">
          <button
            className={`sub-tab ${vista === 'activas' ? 'active' : ''}`}
            onClick={() => setVista('activas')}
          >
            📋 Activas
          </button>
          <button
            className={`sub-tab ${vista === 'canceladas' ? 'active' : ''}`}
            onClick={() => setVista('canceladas')}
          >
            ❌ Canceladas
          </button>
        </div>

        {vista === 'activas' && (
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
        )}

        <div className="results-info">
          Mostrando {comprasFiltradas.length} resultados
        </div>

        <div className="compras-grid">
          {comprasFiltradas.map(compra => (
            <div key={compra.id} className={`compra-card ${compra.urgente ? 'urgente' : ''} ${!compra.ticket ? 'sin-ticket' : ''} ${compra.cancelado ? 'cancelada' : ''}`}>
              <div className="compra-date">{formatearFecha(compra.cancelado ? compra.fecha_cancelacion : compra.fecha)}</div>
              <h3 className="compra-titulo">{compra.descripcion}</h3>

              <div className="compra-info-grid">
                <div className="info-item">
                  <span className="info-label">Proveedor</span>
                  <span className="info-value">{compra.proveedor}</span>
                </div>
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
                  {compra.cancelado ? (
                    <span className="status-badge cancelada">
                      <span className="status-dot"></span>
                      CANCELADA
                    </span>
                  ) : compra.ticket ? (
                    <span className="status-badge subido">
                      <span className="status-dot"></span>
                      Subido ({compra.ticket})
                    </span>
                  ) : (
                    <span className="status-badge pendiente">
                      <span className="status-dot"></span>
                      Pendiente
                    </span>
                  )}
                </div>

                {!compra.cancelado && (
                  <div className="compra-actions">
                    <button className="btn-view">👁️</button>
                    <button
                      className="btn-cancelar-compra"
                      onClick={() => abrirModalCancelar(compra)}
                      title="Cancelar compra"
                    >
                      ❌
                    </button>
                  </div>
                )}
              </div>

              {compra.urgente && !compra.cancelado && (
                <div className="urgente-badge">⚠️</div>
              )}
              {!compra.ticket && !compra.cancelado && (
                <div className="ticket-icon">🧾</div>
              )}

              {compra.cancelado && compra.cancelado_por && (
                <div className="cancelacion-info">
                  <p>
                    <strong>Cancelado por:</strong> {compra.cancelado_por.avatar} {compra.cancelado_por.nombre}
                    {compra.cancelado_por.rol === 'admin' && ' (Administrador)'}
                  </p>
                  <button
                    className="btn-ver-motivo"
                    onClick={() => verDetalleCancelacion(compra)}
                  >
                    Ver motivo
                  </button>
                </div>
              )}

              {compra.solicitante && (
                <div className="compra-solicitante">
                  <span>{compra.solicitante.avatar} {compra.solicitante.nombre}</span>
                </div>
              )}
            </div>
          ))}

          {comprasFiltradas.length === 0 && (
            <div className="empty-state">
              <p>
                {vista === 'canceladas'
                  ? 'No hay compras canceladas.'
                  : 'No se encontraron compras con los filtros seleccionados.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal para cancelar */}
        {modalCancelar && (
          <Modal title="Cancelar Compra" onClose={() => setModalCancelar(false)}>
            <div className="modal-form">
              <p style={{ marginBottom: '15px' }}>
                ¿Estás seguro de que deseas cancelar esta compra?
              </p>
              <div className="compra-cancelar-info">
                <p><strong>Proveedor:</strong> {compraACancelar.proveedor}</p>
                <p><strong>Obra:</strong> {compraACancelar.obra}</p>
                <p><strong>Monto:</strong> ${compraACancelar.monto.toFixed(2)}</p>
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
                <span>#{compraDetalle.id} - {compraDetalle.descripcion}</span>
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
    </Layout>
  )
}

export default MisCompras
