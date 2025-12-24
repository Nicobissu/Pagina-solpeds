import db from '../config/database.js';

export function getAllCompras(req, res) {
  try {
    const { userId, isAdmin } = req.query;

    let query = `
      SELECT
        c.*,
        u.id as solicitante_id,
        u.nombre as solicitante_nombre,
        u.avatar as solicitante_avatar
      FROM compras c
      LEFT JOIN usuarios u ON c.solicitante_id = u.id
    `;

    // Si no es admin, solo mostrar sus propias compras
    if (!isAdmin || isAdmin === 'false') {
      query += ` WHERE c.solicitante_id = ?`;
    }

    query += ` ORDER BY c.id DESC`;

    const stmt = db.prepare(query);
    const compras = isAdmin === 'false' ? stmt.all(userId) : stmt.all();

    const formattedCompras = compras.map(c => ({
      id: c.id,
      proveedor: c.proveedor,
      monto: c.monto,
      ticket: c.ticket,
      fecha: c.fecha,
      obra: c.obra,
      descripcion: c.descripcion,
      estado: c.estado,
      solicitante: {
        id: c.solicitante_id,
        nombre: c.solicitante_nombre,
        avatar: c.solicitante_avatar
      },
      urgente: Boolean(c.urgente)
    }));

    res.json(formattedCompras);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function getCompraById(req, res) {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`
      SELECT
        c.*,
        u.id as solicitante_id,
        u.nombre as solicitante_nombre,
        u.avatar as solicitante_avatar
      FROM compras c
      LEFT JOIN usuarios u ON c.solicitante_id = u.id
      WHERE c.id = ?
    `);

    const compra = stmt.get(id);

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.json({
      id: compra.id,
      proveedor: compra.proveedor,
      monto: compra.monto,
      ticket: compra.ticket,
      fecha: compra.fecha,
      obra: compra.obra,
      descripcion: compra.descripcion,
      estado: compra.estado,
      solicitante: {
        id: compra.solicitante_id,
        nombre: compra.solicitante_nombre,
        avatar: compra.solicitante_avatar
      },
      urgente: Boolean(compra.urgente)
    });
  } catch (error) {
    console.error('Error al obtener compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function createCompra(req, res) {
  try {
    const { proveedor, monto, ticket, obra, descripcion, urgente } = req.body;
    const solicitanteId = req.user.id;

    if (!proveedor || !monto || !obra || !descripcion) {
      return res.status(400).json({
        error: 'Campos requeridos: proveedor, monto, obra, descripcion'
      });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const estado = ticket ? 'Subido' : 'Pendiente';

    const stmt = db.prepare(`
      INSERT INTO compras (
        proveedor, monto, ticket, fecha, obra,
        descripcion, estado, solicitante_id, urgente
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      proveedor,
      monto,
      ticket || null,
      fecha,
      obra,
      descripcion,
      estado,
      solicitanteId,
      urgente ? 1 : 0
    );

    res.status(201).json({
      success: true,
      message: 'Compra registrada exitosamente',
      compraId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error al crear compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function updateCompra(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const compra = db.prepare('SELECT * FROM compras WHERE id = ?').get(id);
    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const allowedFields = ['proveedor', 'monto', 'ticket', 'obra', 'descripcion', 'estado', 'urgente'];
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

    // Si se agrega un ticket, cambiar estado a 'Subido'
    if (updates.ticket && !compra.ticket) {
      updateFields.push('estado = ?');
      values.push('Subido');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE compras SET ${updateFields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);

    res.json({ success: true, message: 'Compra actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function deleteCompra(req, res) {
  try {
    const { id } = req.params;

    const stmt = db.prepare('DELETE FROM compras WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.json({ success: true, message: 'Compra eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
