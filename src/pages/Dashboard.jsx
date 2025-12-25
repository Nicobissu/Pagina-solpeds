import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { pedidosAPI, comprasAPI } from '../services/api'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const [showPedidoModal, setShowPedidoModal] = useState(false)
  const [showCompraModal, setShowCompraModal] = useState(false)
  const [misPedidos, setMisPedidos] = useState([])
  const [misCompras, setMisCompras] = useState([])
  const [loading, setLoading] = useState(true)

  // Formularios
  const [pedidoForm, setPedidoForm] = useState({
    cliente: '',
    obra: '',
    monto: '',
    urgente: false,
    fotos: 0
  })

  const [productos, setProductos] = useState([
    { nombre: '', unidad: '', cantidad: '', descripcion: '' }
  ])

  const [compraForm, setCompraForm] = useState({
    proveedor: '',
    obra: '',
    monto: '',
    descripcion: '',
    ticket: '',
    urgente: false
  })

  useEffect(() => {
    cargarDatos()
  }, [user])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const [pedidosData, comprasData] = await Promise.all([
        pedidosAPI.getAll(user.id, user.role === 'admin'),
        comprasAPI.getAll(user.id, user.role === 'admin')
      ])
      setMisPedidos(pedidosData)
      setMisCompras(comprasData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductoChange = (index, field, value) => {
    const nuevosProductos = [...productos]
    nuevosProductos[index][field] = value
    setProductos(nuevosProductos)

    // Si es la última fila y se están completando los campos obligatorios, agregar una nueva fila vacía
    const producto = nuevosProductos[index]
    if (index === productos.length - 1 && producto.nombre && producto.unidad && producto.cantidad) {
      setProductos([...nuevosProductos, { nombre: '', unidad: '', cantidad: '', descripcion: '' }])
    }
  }

  const cerrarModalPedido = () => {
    setShowPedidoModal(false)
    setPedidoForm({
      cliente: '',
      obra: '',
      monto: '',
      urgente: false,
      fotos: 0
    })
    setProductos([{ nombre: '', unidad: '', cantidad: '', descripcion: '' }])
  }

  const handlePedidoSubmit = async (e) => {
    e.preventDefault()

    // Filtrar productos completados (que tengan al menos nombre)
    const productosValidos = productos.filter(p => p.nombre.trim() !== '')

    if (productosValidos.length === 0) {
      alert('Debes agregar al menos un producto')
      return
    }

    // Convertir productos a descripción en formato JSON para mantener toda la información
    const descripcion = JSON.stringify(productosValidos)

    try {
      await pedidosAPI.create({
        ...pedidoForm,
        descripcion,
        monto: pedidoForm.monto ? parseFloat(pedidoForm.monto) : null
      })
      cerrarModalPedido()
      // Recargar los datos
      await cargarDatos()
    } catch (error) {
      console.error('Error al crear pedido:', error)
      alert('Error al crear el pedido')
    }
  }

  const handleCompraSubmit = async (e) => {
    e.preventDefault()
    try {
      await comprasAPI.create({
        ...compraForm,
        monto: parseFloat(compraForm.monto)
      })
      setShowCompraModal(false)
      setCompraForm({
        proveedor: '',
        obra: '',
        monto: '',
        descripcion: '',
        ticket: '',
        urgente: false
      })
      // Recargar los datos
      await cargarDatos()
    } catch (error) {
      console.error('Error al crear compra:', error)
      alert('Error al registrar la compra')
    }
  }

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

  if (loading) {
    return (
      <Layout>
        <div className="dashboard">
          <p>Cargando...</p>
        </div>
      </Layout>
    )
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
                  {ultimosPedidos.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>No hay pedidos recientes</td>
                    </tr>
                  )}
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
                  {ultimasCompras.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>No hay compras recientes</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showPedidoModal && (
          <Modal title="Crear Nuevo Pedido" onClose={cerrarModalPedido}>
            <form className="modal-form" onSubmit={handlePedidoSubmit}>
              <div className="form-group">
                <label>Cliente/Taller</label>
                <input
                  type="text"
                  placeholder="Ej: Taller Central"
                  value={pedidoForm.cliente}
                  onChange={(e) => setPedidoForm({ ...pedidoForm, cliente: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Obra</label>
                <input
                  type="text"
                  placeholder="Ej: Torre Central"
                  value={pedidoForm.obra}
                  onChange={(e) => setPedidoForm({ ...pedidoForm, obra: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Productos</label>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Nombre del Producto</th>
                        <th style={{ padding: '8px', textAlign: 'left', width: '120px' }}>Unidad</th>
                        <th style={{ padding: '8px', textAlign: 'left', width: '80px' }}>Cantidad</th>
                        <th style={{ padding: '8px', textAlign: 'left', width: '200px' }}>Descripción (opcional)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((producto, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              placeholder="Ej: Cemento Portland"
                              value={producto.nombre}
                              onChange={(e) => handleProductoChange(index, 'nombre', e.target.value)}
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <select
                              value={producto.unidad}
                              onChange={(e) => handleProductoChange(index, 'unidad', e.target.value)}
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                            >
                              <option value="">Seleccionar</option>
                              <option value="kg">kg</option>
                              <option value="g">g</option>
                              <option value="lb">lb</option>
                              <option value="ton">ton</option>
                              <option value="L">L</option>
                              <option value="ml">ml</option>
                              <option value="gal">gal</option>
                              <option value="m">m</option>
                              <option value="cm">cm</option>
                              <option value="mm">mm</option>
                              <option value="m²">m²</option>
                              <option value="m³">m³</option>
                              <option value="pza">pza</option>
                              <option value="caja">caja</option>
                              <option value="paquete">paquete</option>
                              <option value="bulto">bulto</option>
                              <option value="unidad">unidad</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              placeholder="Ej: 10"
                              value={producto.cantidad}
                              onChange={(e) => handleProductoChange(index, 'cantidad', e.target.value)}
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input
                              type="text"
                              placeholder="Detalles adicionales..."
                              value={producto.descripcion}
                              onChange={(e) => handleProductoChange(index, 'descripcion', e.target.value)}
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="form-group">
                <label>Monto (opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={pedidoForm.monto}
                  onChange={(e) => setPedidoForm({ ...pedidoForm, monto: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Número de fotos</label>
                <input
                  type="number"
                  placeholder="0"
                  value={pedidoForm.fotos}
                  onChange={(e) => setPedidoForm({ ...pedidoForm, fotos: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={pedidoForm.urgente}
                    onChange={(e) => setPedidoForm({ ...pedidoForm, urgente: e.target.checked })}
                  />
                  {' '}Urgente
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cerrarModalPedido}>
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
            <form className="modal-form" onSubmit={handleCompraSubmit}>
              <div className="form-group">
                <label>Proveedor</label>
                <input
                  type="text"
                  placeholder="Ej: Ferretería López"
                  value={compraForm.proveedor}
                  onChange={(e) => setCompraForm({ ...compraForm, proveedor: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Obra</label>
                <input
                  type="text"
                  placeholder="Ej: Torre Central"
                  value={compraForm.obra}
                  onChange={(e) => setCompraForm({ ...compraForm, obra: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={compraForm.monto}
                  onChange={(e) => setCompraForm({ ...compraForm, monto: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  rows="4"
                  placeholder="Describe la compra realizada..."
                  value={compraForm.descripcion}
                  onChange={(e) => setCompraForm({ ...compraForm, descripcion: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label>Ticket/Factura (número o referencia)</label>
                <input
                  type="text"
                  placeholder="Ej: TCK-123"
                  value={compraForm.ticket}
                  onChange={(e) => setCompraForm({ ...compraForm, ticket: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={compraForm.urgente}
                    onChange={(e) => setCompraForm({ ...compraForm, urgente: e.target.checked })}
                  />
                  {' '}Urgente
                </label>
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
