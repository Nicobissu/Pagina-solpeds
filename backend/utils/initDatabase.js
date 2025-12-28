import bcrypt from 'bcryptjs';
import db, { initDatabase } from '../config/database.js';

console.log('🔧 Poblando base de datos con datos de prueba...\n');

// Inicializar base de datos
await initDatabase();

console.log('✅ Base de datos inicializada\n');

// Limpiar datos existentes
db.exec('DELETE FROM notificaciones');
db.exec('DELETE FROM pedido_comentarios');
db.exec('DELETE FROM compras');
db.exec('DELETE FROM pedidos');
db.exec('DELETE FROM usuarios');

// Reiniciar autoincrement
db.exec('DELETE FROM sqlite_sequence');

console.log('✅ Datos anteriores eliminados\n');

// Crear usuarios
const usuarios = [
  { username: 'supervisor', password: 'supervisor', nombre: 'Supervisor Supremo', rol: 'supervisor' },
  { username: 'admin', password: 'admin', nombre: 'Roberto Gómez', rol: 'admin' },
  { username: 'validador', password: 'validador', nombre: 'María Valdez', rol: 'validador' },
  { username: 'juan', password: 'juan', nombre: 'Juan P.', rol: 'user' },
  { username: 'luis', password: 'luis', nombre: 'Luis M.', rol: 'user' },
  { username: 'carlos', password: 'carlos', nombre: 'Carlos R.', rol: 'user' },
  { username: 'ana', password: 'ana', nombre: 'Ana S.', rol: 'user' },
  { username: 'sofia', password: 'sofia', nombre: 'Sofía G.', rol: 'user' }
];

const insertUser = db.prepare(`
  INSERT INTO usuarios (username, password, nombre, rol)
  VALUES (?, ?, ?, ?)
`);

usuarios.forEach(u => {
  const hashedPassword = bcrypt.hashSync(u.password, 10);
  insertUser.run(u.username, hashedPassword, u.nombre, u.rol);
});

console.log(`✅ ${usuarios.length} usuarios creados`);

// Crear pedidos
const pedidos = [
  {
    cliente: 'Taller Central',
    estado: 'En Proceso',
    fecha: '2023-10-12',
    obra: 'Torre Central',
    descripcion: 'Materiales eléctricos: Cableado UTP Cat 6, placas de pared blancas y conectores RJ45.',
    monto: 1250.00,
    solicitante_id: 2,
    fotos: 2,
    urgente: 0,
    incompleto: 0
  },
  {
    cliente: 'Juan Pérez',
    estado: 'Pendiente Foto',
    fecha: '2023-10-11',
    obra: 'Residencial Norte',
    descripcion: 'Cemento Portland (50 sacos) y varillas de acero de 1/2 pulgada.',
    monto: null,
    solicitante_id: 2,
    fotos: 0,
    urgente: 0,
    incompleto: 1
  },
  {
    cliente: 'Taller Norte',
    estado: 'Completado',
    fecha: '2023-10-10',
    obra: 'Residencial Norte',
    descripcion: 'Pintura epóxica gris para señalización de estacionamiento. 10 cubetas de 19L.',
    monto: 450.00,
    solicitante_id: 3,
    fotos: 5,
    urgente: 0,
    incompleto: 0
  },
  {
    cliente: 'Oficinas Centro',
    estado: 'Revisión Pendiente',
    fecha: '2023-10-11',
    obra: 'Oficinas Centro',
    descripcion: 'Material eléctrico: Cableado UTP Cat 6, placas de pared blancas y conectores RJ45. Faltan especificar cantidades exactas.',
    monto: 800.00,
    solicitante_id: 4,
    fotos: 0,
    urgente: 1,
    incompleto: 1
  },
  {
    cliente: 'Torre A',
    estado: 'Registrado',
    fecha: '2023-10-12',
    obra: 'Torre Central',
    descripcion: 'Requerimiento urgente de 50 sacos de cemento y 20 varillas de acero de 1/2 pulgada para continuar con el colado de la losa.',
    monto: null,
    solicitante_id: 2,
    fotos: 2,
    urgente: 1,
    incompleto: 0
  },
  {
    cliente: 'Residencial Lomas',
    estado: 'Cerrado',
    fecha: '2023-10-09',
    obra: 'Residencial Lomas',
    descripcion: 'Jardinería: 200m2 de pasto en rollo y 15 árboles frutales pequeños.',
    monto: 2100.00,
    solicitante_id: 5,
    fotos: 5,
    urgente: 0,
    incompleto: 0
  },
  {
    cliente: 'Torre B',
    estado: 'Revisado',
    fecha: '2023-10-10',
    obra: 'Torre Central',
    descripcion: 'Pintura epóxica gris para señalización de estacionamiento. 10 cubetas de 19L. Incluir rodillos y thinner.',
    monto: 950.00,
    solicitante_id: 6,
    fotos: 0,
    urgente: 0,
    incompleto: 0
  }
];

const insertPedido = db.prepare(`
  INSERT INTO pedidos (
    cliente, estado, fecha, obra, descripcion, monto,
    solicitante_id, fotos, urgente, incompleto
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

pedidos.forEach(p => {
  insertPedido.run(
    p.cliente, p.estado, p.fecha, p.obra, p.descripcion,
    p.monto, p.solicitante_id, p.fotos, p.urgente, p.incompleto
  );
});

console.log(`✅ ${pedidos.length} pedidos creados`);

// Agregar comentarios a algunos pedidos
const comentarios = [
  { pedido_id: 2, comentario: 'Faltan especificar cantidades exactas' },
  { pedido_id: 4, comentario: 'Revisar especificaciones técnicas' },
  { pedido_id: 7, comentario: 'Aprobado para compra' }
];

const insertComentario = db.prepare('INSERT INTO pedido_comentarios (pedido_id, comentario) VALUES (?, ?)');
comentarios.forEach(c => {
  insertComentario.run(c.pedido_id, c.comentario);
});

console.log(`✅ ${comentarios.length} comentarios agregados`);

// Crear compras
const compras = [
  {
    proveedor: 'AutoZone',
    monto: 1450.00,
    ticket: null,
    fecha: '2023-10-12',
    obra: 'Torre Central',
    descripcion: 'Aceite de motor sintético 5W-30 y filtros',
    estado: 'Pendiente',
    solicitante_id: 2,
    urgente: 0
  },
  {
    proveedor: 'Ferretería López',
    monto: 320.50,
    ticket: 'TCK-920',
    fecha: '2023-10-10',
    obra: 'Casa Lomas',
    descripcion: 'Materiales de plomería y refacciones',
    estado: 'Subido',
    solicitante_id: 2,
    urgente: 0
  },
  {
    proveedor: 'Refaccionaria 24/7',
    monto: 890.00,
    ticket: 'TCK-919',
    fecha: '2023-10-08',
    obra: 'General',
    descripcion: 'Piezas de repuesto para maquinaria',
    estado: 'Subido',
    solicitante_id: 2,
    urgente: 0
  },
  {
    proveedor: 'TechSupplies MX',
    monto: 2100.00,
    ticket: 'TCK-918',
    fecha: '2023-10-01',
    obra: 'Torre Reforma',
    descripcion: 'Cables eléctricos calibre 12',
    estado: 'Subido',
    solicitante_id: 5,
    urgente: 0
  },
  {
    proveedor: 'Plaza Satélite',
    monto: 1500.00,
    ticket: 'TCK-917',
    fecha: '2023-10-05',
    obra: 'Plaza Satélite',
    descripcion: 'Renta de rotomartillo',
    estado: 'Subido',
    solicitante_id: 2,
    urgente: 0
  },
  {
    proveedor: 'General',
    monto: 950.00,
    ticket: null,
    fecha: '2023-10-02',
    obra: 'General',
    descripcion: 'Gasolina camioneta Ford',
    estado: 'Pendiente',
    solicitante_id: 2,
    urgente: 1
  }
];

const insertCompra = db.prepare(`
  INSERT INTO compras (
    proveedor, monto, ticket, fecha, obra,
    descripcion, estado, solicitante_id, urgente
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

compras.forEach(c => {
  insertCompra.run(
    c.proveedor, c.monto, c.ticket, c.fecha, c.obra,
    c.descripcion, c.estado, c.solicitante_id, c.urgente
  );
});

console.log(`✅ ${compras.length} compras creadas`);

// Crear notificaciones para el usuario Juan (id: 2)
const notificaciones = [
  {
    usuario_id: 2,
    tipo: 'warning',
    titulo: 'Falta ticket en la compra del día 12/Oct',
    mensaje: 'Se requiere adjuntar el comprobante fiscal para procesar el reembolso de la orden #921.',
    icono: '⚠️',
    leida: 0
  },
  {
    usuario_id: 2,
    tipo: 'info',
    titulo: 'Tu pedido urgente fue registrado',
    mensaje: 'Solicitud #URG-2024 recibida. El equipo de almacén ha iniciado la preparación prioritaria.',
    icono: '⚡',
    leida: 0
  },
  {
    usuario_id: 2,
    tipo: 'success',
    titulo: 'Tu pedido fue revisado por administración',
    mensaje: 'La orden #882 ha pasado la validación de presupuesto y está lista para envío.',
    icono: '✅',
    leida: 1
  },
  {
    usuario_id: 2,
    tipo: 'locked',
    titulo: 'Se cerró tu registro de compras',
    mensaje: 'El periodo de registro para el mes de Septiembre ha finalizado correctamente.',
    icono: '🔒',
    leida: 1
  },
  {
    usuario_id: 2,
    tipo: 'info',
    titulo: 'Nuevo proveedor agregado al catálogo',
    mensaje: 'Ahora puedes realizar pedidos a "TechSupplies MX" desde el módulo de compras.',
    icono: '🏪',
    leida: 1
  }
];

const insertNotificacion = db.prepare(`
  INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, icono, leida)
  VALUES (?, ?, ?, ?, ?, ?)
`);

notificaciones.forEach(n => {
  insertNotificacion.run(n.usuario_id, n.tipo, n.titulo, n.mensaje, n.icono, n.leida);
});

console.log(`✅ ${notificaciones.length} notificaciones creadas\n`);

console.log('╔══════════════════════════════════════════════╗');
console.log('║                                              ║');
console.log('║   ✅ Base de datos inicializada              ║');
console.log('║                                              ║');
console.log('║   Usuarios de prueba:                        ║');
console.log('║   • supervisor / supervisor (SUPERVISOR)     ║');
console.log('║   • admin / admin (Administrador)            ║');
console.log('║   • validador / validador (Validador)        ║');
console.log('║   • juan / juan (Usuario)                    ║');
console.log('║   • luis / luis (Usuario)                    ║');
console.log('║   • carlos / carlos (Usuario)                ║');
console.log('║   • ana / ana (Usuario)                      ║');
console.log('║   • sofia / sofia (Usuario)                  ║');
console.log('║                                              ║');
console.log('╚══════════════════════════════════════════════╝');

// db.close() no es necesario con sql.js - se guarda automáticamente
process.exit(0);
