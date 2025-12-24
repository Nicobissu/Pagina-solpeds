import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { pedidos, compras } from '../data/mockData'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const [showPedidoModal, setShowPedidoModal] = useState(false)
  const [showCompraModal, setShowCompraModal] = useState(false)

  // Filtrar solo los pedidos/compras del usuario actual
  const misPedidos = pedidos.filter(p => p.solicitante.id === user.id)
  const misCompras = compras.filter(c => c.solicitante.id === user.id)

  // Estadísticas
  const pedidosSinFotos = misPedidos.filter(p => p.fotos === 0).length
  const comprasUrgentes = misCompras.filter(c => c.urgente).length
  const totalPendientes = misPedidos.filter(p => p.estado !== 'Completado' && p.estado !== 'Cerrado').length
  const completadosHoy = [...misPedidos, ...misCompras].filter(item => {
    const hoy = new Date().toISOString().split('T')[0]
    return item.fecha === hoy
  }).length

  // Últimos 3 pedidos y compras
  const ultimosPedidos = misPedidos.slice(0, 3)
  const ultimasCompras = misCompras.slice(0, 3)

  const getEstadoBadgeClass = (estado) => {
    const map = {
      'En Proceso': 'badge-info',
      'Pendiente Foto': 'badge-warning',
      'Completado': 'badge-success',
      'Revisión Pendiente': 'badge-warning',
      'Registrado': 'badge-info',
      'Cerrado': 'badge-secondary',
      'Revisado': 'badge-success'
    }
    return map[estado] || 'badge-info'
  }

  const getEstadoCompraClass = (estado) => {
    const map = {
      'Pendiente': 'badge-warning',
      'Subido': 'badge-success'
    }
    return map[estado] || 'badge-info'
  }

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Hola, {user.name}</h1>
          <p>Aquí tienes un resumen de la actividad reciente de tu taller.</p>
        </div>

        <div className="action-cards">
          <div className="action-card" onClick={() => setShowPedidoModal(true)}>
            <div className="action-icon blue">
              <span>➕</span>
            </div>
            <h3>Crear Pedido</h3>
            <p>Solicitar nuevos materiales o refacciones</p>
          </div>

          <div className="action-card" onClick={() => setShowCompraModal(true)}>
            <div className="action-icon green">
              <span>🧾</span>
            </div>
            <h3>Registrar Compra</h3>
            <p>Subir ticket o factura de gastos</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card orange">
            <div className="stat-icon">🚫</div>
            <div className="stat-content">
              <p className="stat-label">Pedidos sin fotos</p>
              <p className="stat-value">{pedidosSinFotos}</p>
            </div>
          </div>

          <div className="stat-card red">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <p className="stat-label">Compras urgentes</p>
              <p className="stat-value">{comprasUrgentes}</p>
            </div>
          </div>

          <div className="stat-card blue">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <p className="stat-label">Total Pendientes</p>
              <p className="stat-value">{totalPendientes}</p>
            </div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <p className="stat-label">Completados Hoy</p>
              <p className="stat-value">{completadosHoy}</p>
            </div>
          </div>
        </div>

        <div className="tables-grid">
          <div className="table-section">
            <div className="table-header">
              <h2>Últimos 3 pedidos</h2>
              <a href="/pedidos" className="view-all">Ver todos</a>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente/Taller</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map(pedido => (
                    <tr key={pedido.id}>
                      <td>#{pedido.id}</td>
                      <td>{pedido.cliente}</td>
                      <td>
                        <span className={`badge ${getEstadoBadgeClass(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon">➡️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-section">
            <div className="table-header">
              <h2>Últimas 3 compras</h2>
              <a href="/compras" className="view-all">Ver todas</a>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Monto</th>
                    <th>Ticket</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasCompras.map(compra => (
                    <tr key={compra.id}>
                      <td>{compra.proveedor}</td>
                      <td>${compra.monto.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getEstadoCompraClass(compra.estado)}`}>
                          {compra.ticket ? '● Subido' : '● Pendiente'}
                        </span>
                      </td>
                      <td>
                        <button className="btn-icon">👁️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showPedidoModal && (
          <Modal title="Crear Nuevo Pedido" onClose={() => setShowPedidoModal(false)}>
            <form className="modal-form">
              <div className="form-group">
                <label>Cliente/Taller</label>
                <input type="text" placeholder="Ej: Taller Central" required />
              </div>
              <div className="form-group">
                <label>Obra</label>
                <input type="text" placeholder="Ej: Torre Central" required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows="4" placeholder="Describe los materiales o refacciones necesarias..." required></textarea>
              </div>
              <div className="form-group">
                <label>Urgente</label>
                <input type="checkbox" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPedidoModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Pedido
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showCompraModal && (
          <Modal title="Registrar Nueva Compra" onClose={() => setShowCompraModal(false)}>
            <form className="modal-form">
              <div className="form-group">
                <label>Proveedor</label>
                <input type="text" placeholder="Ej: Ferretería López" required />
              </div>
              <div className="form-group">
                <label>Obra</label>
                <input type="text" placeholder="Ej: Torre Central" required />
              </div>
              <div className="form-group">
                <label>Monto</label>
                <input type="number" step="0.01" placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea rows="4" placeholder="Describe la compra realizada..." required></textarea>
              </div>
              <div className="form-group">
                <label>Ticket/Factura</label>
                <input type="file" accept="image/*,.pdf" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCompraModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Registrar Compra
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
