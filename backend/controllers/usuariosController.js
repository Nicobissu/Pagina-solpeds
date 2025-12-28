import bcrypt from 'bcryptjs';
import db, { saveDatabase } from '../config/database.js';

// Obtener todos los usuarios
export function getAllUsuarios(req, res) {
  try {
    const stmt = db.prepare(`
      SELECT id, username, nombre, rol, avatar, created_at, updated_at
      FROM usuarios
      ORDER BY created_at DESC
    `);
    const usuarios = stmt.all();

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Obtener un usuario por ID
export function getUsuarioById(req, res) {
  const { id } = req.params;

  try {
    const stmt = db.prepare(`
      SELECT id, username, nombre, rol, avatar, created_at, updated_at
      FROM usuarios
      WHERE id = ?
    `);
    const usuario = stmt.get(id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Crear nuevo usuario
export function createUsuario(req, res) {
  const { username, password, nombre, rol = 'user', avatar = '👤' } = req.body;

  if (!username || !password || !nombre) {
    return res.status(400).json({ error: 'Username, password y nombre son requeridos' });
  }

  // Validar rol
  const rolesValidos = ['user', 'validador', 'admin', 'supervisor'];
  if (!rolesValidos.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insertar usuario
    const stmt = db.prepare(`
      INSERT INTO usuarios (username, password, nombre, rol, avatar)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, hashedPassword, nombre, rol, avatar);

    // Obtener el usuario creado
    const nuevoUsuario = db.prepare(`
      SELECT id, username, nombre, rol, avatar, created_at
      FROM usuarios
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      usuario: nuevoUsuario
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Actualizar usuario (cambiar rol, nombre, etc.)
export function updateUsuario(req, res) {
  const { id } = req.params;
  const { nombre, rol, avatar, password } = req.body;

  try {
    // Verificar que el usuario existe
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validar rol si se proporciona
    if (rol) {
      const rolesValidos = ['user', 'validador', 'admin', 'supervisor'];
      if (!rolesValidos.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
    }

    // Construir query dinámicamente
    const updates = [];
    const params = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      params.push(nombre);
    }

    if (rol !== undefined) {
      updates.push('rol = ?');
      params.push(rol);
    }

    if (avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(avatar);
    }

    if (password !== undefined && password.trim() !== '') {
      const hashedPassword = bcrypt.hashSync(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...params);

    // Obtener el usuario actualizado
    const usuarioActualizado = db.prepare(`
      SELECT id, username, nombre, rol, avatar, created_at, updated_at
      FROM usuarios
      WHERE id = ?
    `).get(id);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Eliminar usuario
export function deleteUsuario(req, res) {
  const { id } = req.params;

  try {
    // Verificar que el usuario existe
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // No permitir eliminar al supervisor principal (id = 1)
    if (parseInt(id) === 1) {
      return res.status(403).json({ error: 'No se puede eliminar al supervisor principal' });
    }

    // Verificar que no sea el usuario logueado
    if (parseInt(id) === req.user.id) {
      return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // Verificar si el usuario tiene pedidos o compras asociados
    const pedidosCount = db.prepare('SELECT COUNT(*) as count FROM pedidos WHERE solicitante_id = ?').get(id).count;
    const comprasCount = db.prepare('SELECT COUNT(*) as count FROM compras WHERE solicitante_id = ?').get(id).count;

    if (pedidosCount > 0 || comprasCount > 0) {
      return res.status(400).json({
        error: `No se puede eliminar el usuario porque tiene ${pedidosCount} pedidos y ${comprasCount} compras asociados. Considera desactivarlo en su lugar.`
      });
    }

    // Eliminar usuario
    const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
    stmt.run(id);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Obtener estadísticas de usuarios
export function getEstadisticasUsuarios(req, res) {
  try {
    const stats = {
      total: db.prepare('SELECT COUNT(*) as count FROM usuarios').get().count,
      supervisores: db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'supervisor'").get().count,
      admins: db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'admin'").get().count,
      validadores: db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'validador'").get().count,
      usuarios: db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'user'").get().count
    };

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
