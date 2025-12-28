import db from '../config/database.js';

// ===== CLIENTES =====

export function getAllClientes(req, res) {
  try {
    const stmt = db.prepare('SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre ASC');
    const clientes = stmt.all();
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function createCliente(req, res) {
  try {
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del cliente es requerido' });
    }

    const stmt = db.prepare('INSERT INTO clientes (nombre) VALUES (?)');
    const result = stmt.run(nombre.trim());

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      clienteId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe un cliente con ese nombre' });
    }
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function updateCliente(req, res) {
  try {
    const { id } = req.params;
    const { nombre, activo } = req.body;

    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre.trim());
    }

    if (activo !== undefined) {
      updates.push('activo = ?');
      values.push(activo ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ success: true, message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function deleteCliente(req, res) {
  try {
    const { id } = req.params;

    // Desactivar en lugar de eliminar
    const stmt = db.prepare('UPDATE clientes SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ success: true, message: 'Cliente desactivado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ===== OBRAS =====

export function getObrasByCliente(req, res) {
  try {
    const { clienteId } = req.params;

    const stmt = db.prepare(`
      SELECT o.*, c.nombre as cliente_nombre
      FROM obras o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.cliente_id = ? AND o.activo = 1
      ORDER BY o.nombre ASC
    `);
    const obras = stmt.all(clienteId);

    res.json(obras);
  } catch (error) {
    console.error('Error al obtener obras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function getAllObras(req, res) {
  try {
    const stmt = db.prepare(`
      SELECT o.*, c.nombre as cliente_nombre
      FROM obras o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.activo = 1
      ORDER BY c.nombre ASC, o.nombre ASC
    `);
    const obras = stmt.all();

    res.json(obras);
  } catch (error) {
    console.error('Error al obtener obras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function createObra(req, res) {
  try {
    const { clienteId, nombre } = req.body;

    if (!clienteId || !nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El cliente y el nombre de la obra son requeridos' });
    }

    const stmt = db.prepare('INSERT INTO obras (cliente_id, nombre) VALUES (?, ?)');
    const result = stmt.run(clienteId, nombre.trim());

    res.status(201).json({
      success: true,
      message: 'Obra creada exitosamente',
      obraId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe una obra con ese nombre para este cliente' });
    }
    console.error('Error al crear obra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function updateObra(req, res) {
  try {
    const { id } = req.params;
    const { nombre, activo } = req.body;

    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre.trim());
    }

    if (activo !== undefined) {
      updates.push('activo = ?');
      values.push(activo ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE obras SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    res.json({ success: true, message: 'Obra actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar obra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function deleteObra(req, res) {
  try {
    const { id } = req.params;

    // Desactivar en lugar de eliminar
    const stmt = db.prepare('UPDATE obras SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Obra no encontrada' });
    }

    res.json({ success: true, message: 'Obra desactivada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar obra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ===== OBTENER SIGUIENTE NÚMERO SECUENCIAL =====

export function getSiguienteNumero(req, res) {
  try {
    const { clienteId, obraId } = req.params;

    // Obtener el último número para esta combinación cliente-obra
    const stmt = db.prepare(`
      SELECT MAX(numero_secuencial) as ultimo_numero
      FROM pedidos
      WHERE cliente_id = ? AND obra_id = ?
    `);
    const result = stmt.get(clienteId, obraId);

    const siguienteNumero = (result.ultimo_numero || 0) + 1;

    res.json({ siguienteNumero });
  } catch (error) {
    console.error('Error al obtener siguiente número:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
