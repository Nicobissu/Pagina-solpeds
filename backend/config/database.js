import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', process.env.DATABASE_PATH || 'database.sqlite');

const db = new Database(dbPath, { verbose: console.log });

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Crear las tablas
export function initDatabase() {
  // Tabla de usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'user',
      avatar TEXT DEFAULT '👤',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de pedidos
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Registrado',
      fecha DATE NOT NULL,
      obra TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      monto DECIMAL(10,2),
      solicitante_id INTEGER NOT NULL,
      fotos INTEGER DEFAULT 0,
      urgente BOOLEAN DEFAULT 0,
      incompleto BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
    )
  `);

  // Tabla de comentarios de pedidos
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedido_comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
    )
  `);

  // Tabla de compras
  db.exec(`
    CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proveedor TEXT NOT NULL,
      monto DECIMAL(10,2) NOT NULL,
      ticket TEXT,
      fecha DATE NOT NULL,
      obra TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Pendiente',
      solicitante_id INTEGER NOT NULL,
      urgente BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
    )
  `);

  // Tabla de notificaciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS notificaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      leida BOOLEAN DEFAULT 0,
      icono TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  console.log('✅ Base de datos inicializada correctamente');
}

export default db;
