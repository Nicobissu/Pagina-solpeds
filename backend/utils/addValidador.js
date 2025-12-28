import { initDatabase } from '../config/database.js';
import db from '../config/database.js';
import bcrypt from 'bcryptjs';

// Inicializar la base de datos primero
await initDatabase();

// Verificar si el usuario validador ya existe
const stmt = db.prepare('SELECT * FROM usuarios WHERE username = ?');
const existingValidador = stmt.get('validador');

if (existingValidador) {
  console.log('✅ El usuario validador ya existe');
  console.log('Usuario:', existingValidador.username);
  console.log('Nombre:', existingValidador.nombre);
  console.log('Rol:', existingValidador.rol);
} else {
  // Crear el usuario validador
  const hashedPassword = bcrypt.hashSync('validador', 10);
  const insertStmt = db.prepare(`
    INSERT INTO usuarios (username, password, nombre, rol, avatar)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = insertStmt.run('validador', hashedPassword, 'María Valdez', 'validador', '✅');
  
  console.log('✅ Usuario validador creado exitosamente');
  console.log('Username: validador');
  console.log('Password: validador');
  console.log('ID:', result.lastInsertRowid);
}

process.exit(0);
