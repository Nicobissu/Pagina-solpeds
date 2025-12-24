import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

export function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE username = ?');
    const user = stmt.get(username);

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // No enviar el password en la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: {
        id: userWithoutPassword.id,
        name: userWithoutPassword.nombre,
        username: userWithoutPassword.username,
        role: userWithoutPassword.rol,
        avatar: userWithoutPassword.avatar
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function register(req, res) {
  const { username, password, nombre, rol = 'user' } = req.body;

  if (!username || !password || !nombre) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
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
      INSERT INTO usuarios (username, password, nombre, rol)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(username, hashedPassword, nombre, rol);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

export function verifyToken(req, res) {
  // Si llegó aquí, el token es válido (middleware authenticateToken)
  const stmt = db.prepare('SELECT id, username, nombre, rol, avatar FROM usuarios WHERE id = ?');
  const user = stmt.get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.nombre,
      username: user.username,
      role: user.rol,
      avatar: user.avatar
    }
  });
}
