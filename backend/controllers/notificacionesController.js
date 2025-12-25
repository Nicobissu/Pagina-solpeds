import db from '../config/database.js';

export function getNotificaciones(req, res) {
  try {
    const userId = req.user.id;

    const stmt = db.prepare(`
      SELECT * FROM notificaciones
      WHERE usuario_id = ?
      ORDER BY fecha DESC
    `);

    const notificaciones = stmt.all(userId);

    const formatted = notificaciones.map(n => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      fecha: n.fecha,
      leida: Boolean(n.leida),
      icono: n.icono
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function createNotificacion(req, res) {
  try {
    // Aceptar tanto usuarioId (camelCase) como usuario_id (snake_case)
    const { usuarioId, usuario_id, tipo, titulo, mensaje, icono } = req.body;
    const userId = usuarioId || usuario_id;

    if (!userId || !tipo || !titulo || !mensaje) {
      return res.status(400).json({
        error: 'Campos requeridos: usuarioId, tipo, titulo, mensaje'
      });
    }

    const stmt = db.prepare(`
      INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, icono)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(userId, tipo, titulo, mensaje, icono || null);

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      notificacionId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function marcarComoLeida(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const stmt = db.prepare(`
      UPDATE notificaciones
      SET leida = 1
      WHERE id = ? AND usuario_id = ?
    `);

    const result = stmt.run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ success: true, message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function marcarTodasLeidas(req, res) {
  try {
    const userId = req.user.id;

    const stmt = db.prepare('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?');
    stmt.run(userId);

    res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error al marcar notificaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function deleteNotificacion(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const stmt = db.prepare('DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?');
    const result = stmt.run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json({ success: true, message: 'Notificación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
