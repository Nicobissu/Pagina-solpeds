import db from '../config/database.js';
import { processImages, deleteImagenes } from '../middleware/upload.js';

// Helper para crear notificaciones
function crearNotificacion(usuarioId, tipo, titulo, mensaje, icono = '🔔') {
  try {
    const stmt = db.prepare(`
      INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, icono)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(usuarioId, tipo, titulo, mensaje, icono);
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
}

// Helper para obtener fecha local en formato YYYY-MM-DD
function getFechaLocal() {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${year}-${mes}-${dia}`;
}

// Helper para obtener fecha y hora local en formato ISO
function getFechaHoraLocal() {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  return `${year}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

export function getAllPedidos(req, res) {
  try {
    const { userId, isAdmin } = req.query;

    let query = `
      SELECT
        p.*,
        u.id as solicitante_id,
        u.nombre as solicitante_nombre,
        u.avatar as solicitante_avatar,
        uc.nombre as cancelado_por_nombre,
        uc.avatar as cancelado_por_avatar
      FROM pedidos p
      LEFT JOIN usuarios u ON p.solicitante_id = u.id
      LEFT JOIN usuarios uc ON p.cancelado_por_id = uc.id
    `;

    // Si no es admin, solo mostrar sus propios pedidos
    // Filtramos los cancelados (se verán en otra vista)
    if (!isAdmin || isAdmin === 'false') {
      query += ` WHERE p.solicitante_id = ? AND p.cancelado = 0`;
    } else {
      query += ` WHERE p.cancelado = 0`;
    }

    query += ` ORDER BY p.id DESC`;

    const stmt = db.prepare(query);
    const pedidos = isAdmin === 'false' ? stmt.all(userId) : stmt.all();

    // Obtener comentarios por separado para cada pedido
    const comentariosStmt = db.prepare(`
      SELECT pc.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar, u.rol as usuario_rol
      FROM pedido_comentarios pc
      LEFT JOIN usuarios u ON pc.usuario_id = u.id
      WHERE pc.pedido_id = ?
      ORDER BY pc.created_at ASC
    `);

    // Formatear la respuesta
    const formattedPedidos = pedidos.map(p => {
      const comentarios = comentariosStmt.all(p.id).map(c => ({
        id: c.id,
        comentario: c.comentario,
        created_at: c.created_at,
        usuario: {
          id: c.usuario_id,
          nombre: c.usuario_nombre,
          avatar: c.usuario_avatar,
          rol: c.usuario_rol
        }
      }));

      return {
        id: p.id,
        cliente: p.cliente,
        estado: p.estado,
        fecha: p.fecha,
        obra: p.obra,
        centro_costo: p.centro_costo,
        descripcion: p.descripcion,
        monto: p.monto,
        imagenes: p.imagenes ? JSON.parse(p.imagenes) : [],
        solicitante: {
          id: p.solicitante_id,
          nombre: p.solicitante_nombre,
          avatar: p.solicitante_avatar
        },
        urgente: Boolean(p.urgente),
        incompleto: Boolean(p.incompleto),
        comentarios
      };
    });

    res.json(formattedPedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function getPedidoById(req, res) {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT
        p.*,
        u.id as solicitante_id,
        u.nombre as solicitante_nombre,
        u.avatar as solicitante_avatar
      FROM pedidos p
      LEFT JOIN usuarios u ON p.solicitante_id = u.id
      WHERE p.id = ?
    `);

    const pedido = stmt.get(id);

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Obtener comentarios con información del usuario
    const comentariosStmt = db.prepare(`
      SELECT pc.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar, u.rol as usuario_rol
      FROM pedido_comentarios pc
      LEFT JOIN usuarios u ON pc.usuario_id = u.id
      WHERE pc.pedido_id = ?
      ORDER BY pc.created_at ASC
    `);
    const comentarios = comentariosStmt.all(id).map(c => ({
      id: c.id,
      comentario: c.comentario,
      created_at: c.created_at,
      usuario: {
        id: c.usuario_id,
        nombre: c.usuario_nombre,
        avatar: c.usuario_avatar,
        rol: c.usuario_rol
      }
    }));

    res.json({
      id: pedido.id,
      cliente: pedido.cliente,
      estado: pedido.estado,
      fecha: pedido.fecha,
      obra: pedido.obra,
      centro_costo: pedido.centro_costo,
      descripcion: pedido.descripcion,
      monto: pedido.monto,
      imagenes: pedido.imagenes ? JSON.parse(pedido.imagenes) : [],
      solicitante: {
        id: pedido.solicitante_id,
        nombre: pedido.solicitante_nombre,
        avatar: pedido.solicitante_avatar
      },
      urgente: Boolean(pedido.urgente),
      incompleto: Boolean(pedido.incompleto),
      comentarios
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function createPedido(req, res) {
  try {
    const { clienteId, obraId, descripcion, urgente } = req.body;
    const solicitanteId = req.user.id;
    const imagenes = req.files || [];

    console.log('📸 Creando pedido - Imágenes recibidas:', imagenes.length);
    console.log('📸 req.files:', req.files);

    if (!clienteId || !obraId || !descripcion) {
      return res.status(400).json({ error: 'Campos requeridos: clienteId, obraId, descripcion' });
    }

    // Obtener información del cliente y obra
    const clienteStmt = db.prepare('SELECT nombre FROM clientes WHERE id = ? AND activo = 1');
    const cliente = clienteStmt.get(clienteId);

    const obraStmt = db.prepare('SELECT nombre FROM obras WHERE id = ? AND activo = 1');
    const obra = obraStmt.get(obraId);

    if (!cliente || !obra) {
      return res.status(400).json({ error: 'Cliente u obra no encontrados o inactivos' });
    }

    // Obtener el siguiente número secuencial
    const numeroStmt = db.prepare(`
      SELECT MAX(numero_secuencial) as ultimo_numero
      FROM pedidos
      WHERE cliente_id = ? AND obra_id = ?
    `);
    const numeroResult = numeroStmt.get(clienteId, obraId);
    const siguienteNumero = (numeroResult.ultimo_numero || 0) + 1;

    // Generar el centro de costo completo
    const centroCosto = `${cliente.nombre}-${obra.nombre}-${siguienteNumero}`;

    const fecha = getFechaHoraLocal();

    const stmt = db.prepare(`
      INSERT INTO pedidos (
        cliente, obra, cliente_id, obra_id, numero_secuencial, centro_costo,
        descripcion, solicitante_id,
        fecha, urgente, incompleto, imagenes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Crear pedido sin imágenes primero
    const incompleto = imagenes.length === 0 ? 1 : 0;
    const result = stmt.run(
      cliente.nombre,
      obra.nombre,
      clienteId,
      obraId,
      siguienteNumero,
      centroCosto,
      descripcion,
      solicitanteId,
      fecha,
      urgente ? 1 : 0,
      incompleto,
      null // Imágenes se guardarán después
    );

    const pedidoId = result.lastInsertRowid;

    // Procesar y guardar imágenes si existen
    let imagenesGuardadas = [];
    if (imagenes.length > 0) {
      console.log('📸 Procesando', imagenes.length, 'imágenes para pedido', pedidoId);
      imagenesGuardadas = await processImages(imagenes, pedidoId);
      console.log('📸 Imágenes procesadas:', imagenesGuardadas);

      // Actualizar pedido con las rutas de las imágenes
      const imagenesJSON = JSON.stringify(imagenesGuardadas.map(img => img.relativePath));
      console.log('📸 Guardando en BD:', imagenesJSON);
      const updateStmt = db.prepare('UPDATE pedidos SET imagenes = ? WHERE id = ?');
      updateStmt.run(imagenesJSON, pedidoId);
      console.log('✅ Imágenes guardadas en BD para pedido', pedidoId);
    } else {
      console.log('⚠️ No se recibieron imágenes para el pedido', pedidoId);
    }

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      pedidoId: pedidoId,
      centroCosto: centroCosto,
      imagenes: imagenesGuardadas.length
    });
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function updatePedido(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que el pedido existe
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Construir query dinámicamente
    const allowedFields = ['cliente', 'estado', 'obra', 'descripcion', 'monto', 'fotos', 'urgente', 'incompleto'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE pedidos SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);

    // Si cambió el estado, crear notificación para el solicitante
    if (updates.estado && updates.estado !== pedido.estado) {
      crearNotificacion(
        pedido.solicitante_id,
        'info',
        'Estado de pedido actualizado',
        `El pedido #${pedido.id} (${pedido.centro_costo}) cambió de "${pedido.estado}" a "${updates.estado}"`,
        '📦'
      );
    }

    res.json({ success: true, message: 'Pedido actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export async function updatePedidoUsuario(req, res) {
  try {
    const { id } = req.params;
    const { descripcion, urgente } = req.body;
    const usuarioId = req.user.id;
    const imagenes = req.files || [];

    // Verificar que el pedido existe y pertenece al usuario
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ? AND solicitante_id = ?').get(id, usuarioId);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado o no tienes permiso para modificarlo' });
    }

    // Verificar que el pedido puede ser modificado (no validado, no cancelado)
    if (pedido.cancelado) {
      return res.status(400).json({ error: 'No se puede modificar un pedido cancelado' });
    }

    if (pedido.validado) {
      return res.status(400).json({ error: 'No se puede modificar un pedido validado' });
    }

    // Estados que permiten edición por el usuario
    const estadosEditables = ['Registrado', 'En Proceso', 'Pendiente Foto'];
    if (!estadosEditables.includes(pedido.estado)) {
      return res.status(400).json({ error: `No se puede modificar un pedido en estado "${pedido.estado}". Solo se pueden editar pedidos en estados: ${estadosEditables.join(', ')}` });
    }

    const fechaHora = getFechaHoraLocal();

    // Actualizar descripción y urgente
    const updateFields = [];
    const values = [];

    if (descripcion !== undefined) {
      updateFields.push('descripcion = ?');
      values.push(descripcion);
    }

    if (urgente !== undefined) {
      updateFields.push('urgente = ?');
      values.push(urgente ? 1 : 0);
    }

    // Procesar nuevas imágenes si existen
    let imagenesActuales = pedido.imagenes ? JSON.parse(pedido.imagenes) : [];

    if (imagenes.length > 0) {
      console.log('📸 Actualizando pedido - Nuevas imágenes recibidas:', imagenes.length);
      const imagenesNuevas = await processImages(imagenes, id);
      imagenesActuales = [...imagenesActuales, ...imagenesNuevas.map(img => img.relativePath)];

      updateFields.push('imagenes = ?');
      values.push(JSON.stringify(imagenesActuales));

      // Si ahora tiene imágenes, quitar el flag de incompleto
      if (imagenesActuales.length > 0 && pedido.incompleto) {
        updateFields.push('incompleto = ?');
        values.push(0);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No hay campos válidos para actualizar' });
    }

    updateFields.push('updated_at = ?');
    values.push(fechaHora);
    values.push(id);

    const query = `UPDATE pedidos SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);

    res.json({
      success: true,
      message: 'Pedido actualizado exitosamente',
      imagenes: imagenesActuales.length
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function deletePedido(req, res) {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM pedidos WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ success: true, message: 'Pedido eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function addComentario(req, res) {
  try {
    const { id } = req.params;
    const { comentario } = req.body;
    const usuarioId = req.user.id;

    if (!comentario) {
      return res.status(400).json({ error: 'El comentario es requerido' });
    }

    // Obtener información del pedido
    const pedido = db.prepare('SELECT solicitante_id, centro_costo FROM pedidos WHERE id = ?').get(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const stmt = db.prepare('INSERT INTO pedido_comentarios (pedido_id, usuario_id, comentario, created_at) VALUES (?, ?, ?, ?)');
    const fechaHora = getFechaHoraLocal();
    stmt.run(id, usuarioId, comentario, fechaHora);

    // Obtener el comentario recién creado con información del usuario
    const comentarioStmt = db.prepare(`
      SELECT pc.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar, u.rol as usuario_rol
      FROM pedido_comentarios pc
      LEFT JOIN usuarios u ON pc.usuario_id = u.id
      WHERE pc.pedido_id = ? AND pc.usuario_id = ?
      ORDER BY pc.created_at DESC
      LIMIT 1
    `);
    const nuevoComentario = comentarioStmt.get(id, usuarioId);

    // Notificar al solicitante del pedido si el comentario no fue hecho por él mismo
    if (pedido.solicitante_id !== usuarioId) {
      crearNotificacion(
        pedido.solicitante_id,
        'info',
        'Nuevo comentario en tu pedido',
        `${nuevoComentario.usuario_nombre} ha comentado en el pedido #${id} (${pedido.centro_costo}): "${comentario.substring(0, 50)}${comentario.length > 50 ? '...' : ''}"`,
        '💬'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Comentario agregado exitosamente',
      comentario: {
        id: nuevoComentario.id,
        comentario: nuevoComentario.comentario,
        created_at: nuevoComentario.created_at,
        usuario: {
          id: nuevoComentario.usuario_id,
          nombre: nuevoComentario.usuario_nombre,
          avatar: nuevoComentario.usuario_avatar,
          rol: nuevoComentario.usuario_rol
        }
      }
    });
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function cancelarPedido(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const userId = req.user.id;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'El motivo de cancelación es requerido' });
    }

    // Verificar que el pedido existe
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Verificar que no esté ya cancelado
    if (pedido.cancelado) {
      return res.status(400).json({ error: 'El pedido ya está cancelado' });
    }

    // Calcular fecha de eliminación programada (1 día después)
    const ahora = new Date();
    const fechaEliminacion = new Date(ahora.getTime() + 24 * 60 * 60 * 1000); // +1 día
    const year = fechaEliminacion.getFullYear();
    const mes = String(fechaEliminacion.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaEliminacion.getDate()).padStart(2, '0');
    const horas = String(fechaEliminacion.getHours()).padStart(2, '0');
    const minutos = String(fechaEliminacion.getMinutes()).padStart(2, '0');
    const segundos = String(fechaEliminacion.getSeconds()).padStart(2, '0');
    const fechaEliminacionStr = `${year}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

    // Actualizar el pedido como cancelado con fecha de eliminación
    const stmt = db.prepare(`
      UPDATE pedidos
      SET cancelado = 1,
          motivo_cancelacion = ?,
          cancelado_por_id = ?,
          fecha_cancelacion = ?,
          fecha_eliminacion_programada = ?,
          updated_at = ?
      WHERE id = ?
    `);

    const fechaHora = getFechaHoraLocal();
    stmt.run(motivo, userId, fechaHora, fechaEliminacionStr, fechaHora, id);

    // Notificar al solicitante del pedido si fue cancelado por alguien más
    if (pedido.solicitante_id !== userId) {
      crearNotificacion(
        pedido.solicitante_id,
        'warning',
        'Pedido cancelado',
        `Tu pedido #${pedido.id} (${pedido.centro_costo}) ha sido cancelado. Motivo: ${motivo}`,
        '❌'
      );
    }

    res.json({ success: true, message: 'Pedido cancelado exitosamente' });
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function getPedidosCancelados(req, res) {
  try {
    const { userId, isAdmin } = req.query;

    let query = `
      SELECT
        p.*,
        u.id as solicitante_id,
        u.nombre as solicitante_nombre,
        u.avatar as solicitante_avatar,
        uc.id as cancelado_por_id,
        uc.nombre as cancelado_por_nombre,
        uc.avatar as cancelado_por_avatar,
        uc.rol as cancelado_por_rol
      FROM pedidos p
      LEFT JOIN usuarios u ON p.solicitante_id = u.id
      LEFT JOIN usuarios uc ON p.cancelado_por_id = uc.id
      WHERE p.cancelado = 1
    `;

    // Si no es admin, solo mostrar sus propios pedidos cancelados
    if (!isAdmin || isAdmin === 'false') {
      query += ` AND p.solicitante_id = ?`;
    }

    query += ` ORDER BY p.fecha_cancelacion DESC`;

    const stmt = db.prepare(query);
    const pedidos = isAdmin === 'false' ? stmt.all(userId) : stmt.all();

    // Obtener comentarios por separado para cada pedido
    const comentariosStmt = db.prepare(`
      SELECT pc.*, u.nombre as usuario_nombre, u.avatar as usuario_avatar, u.rol as usuario_rol
      FROM pedido_comentarios pc
      LEFT JOIN usuarios u ON pc.usuario_id = u.id
      WHERE pc.pedido_id = ?
      ORDER BY pc.created_at ASC
    `);

    // Formatear la respuesta
    const formattedPedidos = pedidos.map(p => {
      const comentarios = comentariosStmt.all(p.id).map(c => ({
        id: c.id,
        comentario: c.comentario,
        created_at: c.created_at,
        usuario: {
          id: c.usuario_id,
          nombre: c.usuario_nombre,
          avatar: c.usuario_avatar,
          rol: c.usuario_rol
        }
      }));

      return {
        id: p.id,
        cliente: p.cliente,
        estado: p.estado,
        fecha: p.fecha,
        obra: p.obra,
        centro_costo: p.centro_costo,
        descripcion: p.descripcion,
        monto: p.monto,
        imagenes: p.imagenes ? JSON.parse(p.imagenes) : [],
        solicitante: {
          id: p.solicitante_id,
          nombre: p.solicitante_nombre,
          avatar: p.solicitante_avatar
        },
        urgente: Boolean(p.urgente),
        incompleto: Boolean(p.incompleto),
        cancelado: Boolean(p.cancelado),
        motivo_cancelacion: p.motivo_cancelacion,
        fecha_cancelacion: p.fecha_cancelacion,
        cancelado_por: p.cancelado_por_id ? {
          id: p.cancelado_por_id,
          nombre: p.cancelado_por_nombre,
          avatar: p.cancelado_por_avatar,
          rol: p.cancelado_por_rol
        } : null,
        comentarios
      };
    });

    res.json(formattedPedidos);
  } catch (error) {
    console.error('Error al obtener pedidos cancelados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function validarPedido(req, res) {
  try {
    const { id } = req.params;
    const { accion, motivo } = req.body; // accion: 'validar' o 'rechazar'
    const validadorId = req.user.id;

    // Verificar que el pedido existe
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Verificar que está en estado Pendiente Validación
    if (pedido.estado !== 'Pendiente Validación') {
      return res.status(400).json({ error: 'El pedido no está en estado Pendiente Validación' });
    }

    if (accion === 'validar') {
      // Eliminar imágenes del pedido validado
      deleteImagenes(id);

      // Validar el pedido
      const stmt = db.prepare(`
        UPDATE pedidos
        SET validado = 1,
            validado_por_id = ?,
            fecha_validacion = CURRENT_TIMESTAMP,
            estado = 'Validado',
            imagenes = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(validadorId, id);

      res.json({ success: true, message: 'Pedido validado exitosamente' });
    } else if (accion === 'rechazar') {
      // Rechazar el pedido (volver a En Proceso o Revisado según indique el motivo)
      const nuevoEstado = req.body.nuevoEstado || 'En Proceso';

      const stmt = db.prepare(`
        UPDATE pedidos
        SET estado = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(nuevoEstado, id);

      res.json({ success: true, message: 'Pedido rechazado, devuelto a ' + nuevoEstado });
    } else {
      return res.status(400).json({ error: 'Acción no válida' });
    }
  } catch (error) {
    console.error('Error al validar pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Función para limpiar pedidos cancelados que han cumplido su tiempo
export function limpiarPedidosCancelados() {
  try {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    const fechaActual = `${year}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

    // Obtener pedidos que deben ser eliminados
    const pedidosParaEliminar = db.prepare(`
      SELECT id, centro_costo FROM pedidos
      WHERE cancelado = 1
      AND fecha_eliminacion_programada IS NOT NULL
      AND fecha_eliminacion_programada <= ?
    `).all(fechaActual);

    if (pedidosParaEliminar.length > 0) {
      console.log(`🗑️  Eliminando ${pedidosParaEliminar.length} pedido(s) cancelado(s)...`);

      pedidosParaEliminar.forEach(pedido => {
        // Eliminar imágenes asociadas
        deleteImagenes(pedido.id);

        // Eliminar comentarios asociados
        db.prepare('DELETE FROM pedido_comentarios WHERE pedido_id = ?').run(pedido.id);

        // Eliminar el pedido
        db.prepare('DELETE FROM pedidos WHERE id = ?').run(pedido.id);

        console.log(`  ✅ Pedido #${pedido.id} (${pedido.centro_costo}) eliminado`);
      });

      console.log(`✅ Limpieza completada: ${pedidosParaEliminar.length} pedido(s) eliminado(s)`);
    }

    return pedidosParaEliminar.length;
  } catch (error) {
    console.error('❌ Error al limpiar pedidos cancelados:', error);
    return 0;
  }
}
