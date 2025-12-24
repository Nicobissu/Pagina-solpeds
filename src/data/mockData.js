export const pedidos = [
  {
    id: 1024,
    cliente: 'Taller Central',
    estado: 'En Proceso',
    fecha: '2023-10-12',
    obra: 'Torre Central',
    descripcion: 'Materiales eléctricos: Cableado UTP Cat 6, placas de pared blancas y conectores RJ45.',
    monto: 1250.00,
    solicitante: { id: 2, nombre: 'Juan P.', avatar: '👤' },
    fotos: 2,
    urgente: false,
    incompleto: false,
    comentarios: []
  },
  {
    id: 1023,
    cliente: 'Juan Pérez',
    estado: 'Pendiente Foto',
    fecha: '2023-10-11',
    obra: 'Residencial Norte',
    descripcion: 'Cemento Portland (50 sacos) y varillas de acero de 1/2 pulgada.',
    monto: null,
    solicitante: { id: 2, nombre: 'Juan P.', avatar: '👤' },
    fotos: 0,
    urgente: false,
    incompleto: true,
    comentarios: ['Faltan especificar cantidades exactas']
  },
  {
    id: 1022,
    cliente: 'Taller Norte',
    estado: 'Completado',
    fecha: '2023-10-10',
    obra: 'Residencial Norte',
    descripcion: 'Pintura epóxica gris para señalización de estacionamiento. 10 cubetas de 19L.',
    monto: 450.00,
    solicitante: { id: 3, nombre: 'Luis M.', avatar: '👤' },
    fotos: 5,
    urgente: false,
    incompleto: false,
    comentarios: []
  },
  {
    id: 1021,
    cliente: 'Oficinas Centro',
    estado: 'Revisión Pendiente',
    fecha: '2023-10-11',
    obra: 'Oficinas Centro',
    descripcion: 'Material eléctrico: Cableado UTP Cat 6, placas de pared blancas y conectores RJ45. Faltan especificar cantidades exactas.',
    monto: 800.00,
    solicitante: { id: 4, nombre: 'Carlos R.', avatar: '👤' },
    fotos: 0,
    urgente: true,
    incompleto: true,
    comentarios: ['Revisar especificaciones técnicas']
  },
  {
    id: 1020,
    cliente: 'Torre A',
    estado: 'Registrado',
    fecha: '2023-10-12',
    obra: 'Torre Central',
    descripcion: 'Requerimiento urgente de 50 sacos de cemento y 20 varillas de acero de 1/2 pulgada para continuar con el colado de la losa.',
    monto: null,
    solicitante: { id: 2, nombre: 'Juan P.', avatar: '👤' },
    fotos: 2,
    urgente: true,
    incompleto: false,
    comentarios: []
  },
  {
    id: 1019,
    cliente: 'Residencial Lomas',
    estado: 'Cerrado',
    fecha: '2023-10-09',
    obra: 'Residencial Lomas',
    descripcion: 'Jardinería: 200m2 de pasto en rollo y 15 árboles frutales pequeños.',
    monto: 2100.00,
    solicitante: { id: 5, nombre: 'Ana S.', avatar: '👤' },
    fotos: 5,
    urgente: false,
    incompleto: false,
    comentarios: []
  },
  {
    id: 1018,
    cliente: 'Torre B',
    estado: 'Revisado',
    fecha: '2023-10-10',
    obra: 'Torre Central',
    descripcion: 'Pintura epóxica gris para señalización de estacionamiento. 10 cubetas de 19L. Incluir rodillos y thinner.',
    monto: 950.00,
    solicitante: { id: 6, nombre: 'Sofía G.', avatar: '👤' },
    fotos: 0,
    urgente: false,
    incompleto: false,
    comentarios: ['Aprobado para compra']
  }
]

export const compras = [
  {
    id: 921,
    proveedor: 'AutoZone',
    monto: 1450.00,
    ticket: null,
    fecha: '2023-10-12',
    obra: 'Torre Central',
    descripcion: 'Aceite de motor sintético 5W-30 y filtros',
    estado: 'Pendiente',
    solicitante: { id: 2, nombre: 'Juan P.', avatar: '👤' },
    urgente: false
  },
  {
    id: 920,
    proveedor: 'Ferretería López',
    monto: 320.50,
    ticket: 'TCK-920',
    fecha: '2023-10-10',
    obra: 'Casa Lomas',
    descripcion: 'Materiales de plomería y refacciones',
    estado: 'Subido',
    solicitante: { id: 2, nombre: 'Juan P.', avatar: '👤' },
    urgente: false
  },
  {
    id: 919,
    proveedor: 'Refaccionaria 24/7',
    monto: 890.00,
    ticket: 'TCK-919',
    fecha: '2023-10-08',
    obra: 'General',
    descripcion: 'Piezas de repuesto para maquinaria',
    estado: 'Subido',
    solicitante: { id: 2, nombre: 'Juan P.', avatar: '👤' },
    urgente: false
  },
  {
    id: 918,
    proveedor: 'TechSupplies MX',
    monto: 2100.00,
    ticket: 'TCK-918',
    fecha: '2023-10-01',
    obra: 'Torre Reforma',
    descripcion: 'Cables eléctricos calibre 12',
    estado: 'Subido',
    solicitante: { id: 5, nombre: 'Ana S.', avatar: '👤' },
    urgente: false
  },
  {
    id: 917,
    proveedor: 'Plaza Satélite',
    monto: 1500.00,
    ticket: 'TCK-917',
    fecha: '2023-10-05',
    obra: 'Plaza Satélite',
    descripcion: 'Renta de rotomartillo',
    estado: 'Subido',
    solicitante: { id: 2, nombre: 'Juan P.', avatar: '👤' },
    urgente: false
  },
  {
    id: 916,
    proveedor: 'General',
    monto: 950.00,
    ticket: null,
    fecha: '2023-10-02',
    obra: 'General',
    descripcion: 'Gasolina camioneta Ford',
    estado: 'Pendiente',
    solicitante: { id: 2, nombre: 'Juan P.', avatar: '👤' },
    urgente: true
  }
]

export const notificaciones = [
  {
    id: 1,
    tipo: 'warning',
    titulo: 'Falta ticket en la compra del día 12/Oct',
    mensaje: 'Se requiere adjuntar el comprobante fiscal para procesar el reembolso de la orden #921.',
    fecha: '2023-10-12T10:30:00',
    leida: false,
    icono: '⚠️'
  },
  {
    id: 2,
    tipo: 'info',
    titulo: 'Tu pedido urgente fue registrado',
    mensaje: 'Solicitud #URG-2024 recibida. El equipo de almacén ha iniciado la preparación prioritaria.',
    fecha: '2023-10-12T09:00:00',
    leida: false,
    icono: '⚡'
  },
  {
    id: 3,
    tipo: 'success',
    titulo: 'Tu pedido fue revisado por administración',
    mensaje: 'La orden #882 ha pasado la validación de presupuesto y está lista para envío.',
    fecha: '2023-10-11T16:00:00',
    leida: true,
    icono: '✅'
  },
  {
    id: 4,
    tipo: 'locked',
    titulo: 'Se cerró tu registro de compras',
    mensaje: 'El periodo de registro para el mes de Septiembre ha finalizado correctamente.',
    fecha: '2023-10-12T08:00:00',
    leida: true,
    icono: '🔒'
  },
  {
    id: 5,
    tipo: 'info',
    titulo: 'Nuevo proveedor agregado al catálogo',
    mensaje: 'Ahora puedes realizar pedidos a "TechSupplies MX" desde el módulo de compras.',
    fecha: '2023-10-10T14:00:00',
    leida: true,
    icono: '🏪'
  }
]
