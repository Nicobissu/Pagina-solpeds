import db from '../config/database.js';
import { processImages, deleteImagenes } from '../middleware/upload.js';

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
        uc.avatar as cancelado_por_avatar,
        GROUP_CONCAT(pc.comentario, '|||') as comentarios
      FROM pedidos p
      LEFT JOIN usuarios u ON p.solicitante_id = u.id
      LEFT JOIN usuarios uc ON p.cancelado_por_id = uc.id
      LEFT JOIN pedido_comentarios pc ON p.id = pc.pedido_id
    `;

    // Si no es admin, solo mostrar sus propios pedidos
    // Filtramos los cancelados (se verán en otra vista)
    if (!isAdmin || isAdmin === 'false') {
      query += ` WHERE p.solicitante_id = ? AND p.cancelado = 0`;
    } else {
      query += ` WHERE p.cancelado = 0`;
    }

    query += ` GROUP BY p.id ORDER BY p.id DESC`;

    const stmt = db.prepare(query);
    const pedidos = isAdmin === 'false' ? stmt.all(userId) : stmt.all();

    // Formatear la respuesta
    const formattedPedidos = pedidos.map(p => ({
      id: p.id,
      cliente: p.cliente,
      estado: p.estado,
      fecha: p.fecha,
      obra: p.obra,
      centro_costo: p.centro_costo,
      descripcion: p.descripcion,
      imagenes: p.imagenes ? JSON.parse(p.imagenes) : [],
      solicitante: {
        id: p.solicitante_id,
        nombre: p.solicitante_nombre,
        avatar: p.solicitante_avatar
      },
      urgente: Boolean(p.urgente),
      incompleto: Boolean(p.incompleto),
      comentarios: p.comentarios ? p.comentarios.split('|||').filter(c => c) : []
    }));

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

    // Obtener comentarios
    const comentariosStmt = db.prepare('SELECT comentario FROM pedido_comentarios WHERE pedido_id = ?');
    const comentarios = comentariosStmt.all(id).map(c => c.comentario);

    res.json({
      id: pedido.id,
      cliente: pedido.cliente,
      estado: pedido.estado,
      fecha: pedido.fecha,
      obra: pedido.obra,
      centro_costo: pedido.centro_costo,
      descripcion: pedido.descripcion,
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

    const fecha = new Date().toISOString().split('T')[0];

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
      imagenesGuardadas = await processImages(imagenes, pedidoId);

      // Actualizar pedido con las rutas de las imágenes
      const updateStmt = db.prepare('UPDATE pedidos SET imagenes = ? WHERE id = ?');
      updateStmt.run(JSON.stringify(imagenesGuardadas.map(img => img.relativePath)), pedidoId);
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

    res.json({ success: true, message: 'Pedido actualizado exitosamente' });
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

    if (!comentario) {
      return res.status(400).json({ error: 'El comentario es requerido' });
    }

    const stmt = db.prepare('INSERT INTO pedido_comentarios (pedido_id, comentario) VALUES (?, ?)');
    stmt.run(id, comentario);

    res.status(201).json({ success: true, message: 'Comentario agregado exitosamente' });
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

    // Actualizar el pedido como cancelado
    const stmt = db.prepare(`
      UPDATE pedidos
      SET cancelado = 1,
          motivo_cancelacion = ?,
          cancelado_por_id = ?,
          fecha_cancelacion = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(motivo, userId, id);

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
        uc.rol as cancelado_por_rol,
        GROUP_CONCAT(pc.comentario, '|||') as comentarios
      FROM pedidos p
      LEFT JOIN usuarios u ON p.solicitante_id = u.id
      LEFT JOIN usuarios uc ON p.cancelado_por_id = uc.id
      LEFT JOIN pedido_comentarios pc ON p.id = pc.pedido_id
      WHERE p.cancelado = 1
    `;

    // Si no es admin, solo mostrar sus propios pedidos cancelados
    if (!isAdmin || isAdmin === 'false') {
      query += ` AND p.solicitante_id = ?`;
    }

    query += ` GROUP BY p.id ORDER BY p.fecha_cancelacion DESC`;

    const stmt = db.prepare(query);
    const pedidos = isAdmin === 'false' ? stmt.all(userId) : stmt.all();

    // Formatear la respuesta
    const formattedPedidos = pedidos.map(p => ({
      id: p.id,
      cliente: p.cliente,
      estado: p.estado,
      fecha: p.fecha,
      obra: p.obra,
      centro_costo: p.centro_costo,
      descripcion: p.descripcion,
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
      comentarios: p.comentarios ? p.comentarios.split('|||').filter(c => c) : []
    }));

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
