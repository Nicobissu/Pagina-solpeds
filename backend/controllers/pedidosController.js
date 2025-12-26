import db from '../config/database.js';

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
      descripcion: p.descripcion,
      monto: p.monto,
      solicitante: {
        id: p.solicitante_id,
        nombre: p.solicitante_nombre,
        avatar: p.solicitante_avatar
      },
      fotos: p.fotos,
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
      descripcion: pedido.descripcion,
      monto: pedido.monto,
      solicitante: {
        id: pedido.solicitante_id,
        nombre: pedido.solicitante_nombre,
        avatar: pedido.solicitante_avatar
      },
      fotos: pedido.fotos,
      urgente: Boolean(pedido.urgente),
      incompleto: Boolean(pedido.incompleto),
      comentarios
    });
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function createPedido(req, res) {
  try {
    const { cliente, obra, descripcion, monto, urgente, fotos } = req.body;
    const solicitanteId = req.user.id;

    if (!cliente || !obra || !descripcion) {
      return res.status(400).json({ error: 'Campos requeridos: cliente, obra, descripcion' });
    }

    const fecha = new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO pedidos (
        cliente, obra, descripcion, monto, solicitante_id,
        fecha, urgente, fotos, incompleto
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const incompleto = !fotos || fotos === 0 || !monto;
    const result = stmt.run(
      cliente,
      obra,
      descripcion,
      monto || null,
      solicitanteId,
      fecha,
      urgente ? 1 : 0,
      fotos || 0,
      incompleto ? 1 : 0
    );

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      pedidoId: result.lastInsertRowid
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
      descripcion: p.descripcion,
      monto: p.monto,
      solicitante: {
        id: p.solicitante_id,
        nombre: p.solicitante_nombre,
        avatar: p.solicitante_avatar
      },
      fotos: p.fotos,
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
