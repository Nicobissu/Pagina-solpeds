import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', process.env.DATABASE_PATH || 'database.sqlite');

let db;
let SQL;

// Inicializar SQL.js
async function initDB() {
  SQL = await initSqlJs();

  // Cargar la base de datos si existe
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  return db;
}

// Guardar la base de datos en disco
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

// Ejecutar consulta
export function exec(sql) {
  return db.exec(sql);
}

// Preparar statement - Compatible con better-sqlite3
export function prepare(sql) {
  return {
    run: (...params) => {
      try {
        db.run(sql, params);
        saveDatabase();

        // Obtener el último ID insertado
        const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
        lastIdStmt.step();
        const row = lastIdStmt.getAsObject();
        lastIdStmt.free();

        return {
          lastInsertRowid: row.id,
          changes: 1
        };
      } catch (error) {
        console.error('Error en run:', error);
        throw error;
      }
    },
    get: (...params) => {
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return null;
      } catch (error) {
        console.error('Error en get:', error);
        throw error;
      }
    },
    all: (...params) => {
      try {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const result = [];
        while (stmt.step()) {
          result.push(stmt.getAsObject());
        }
        stmt.free();
        return result;
      } catch (error) {
        console.error('Error en all:', error);
        throw error;
      }
    }
  };
}

// Crear las tablas
export async function initDatabase() {
  await initDB();

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

  // Guardar cambios
  saveDatabase();

  // Inicializar usuarios de prueba si no existen
  initDefaultUsers();
}

// Función para crear usuarios de prueba
function initDefaultUsers() {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM usuarios');
  stmt.step();
  const row = stmt.getAsObject();
  stmt.free();
  const userCount = row.count;

  if (userCount === 0) {
    console.log('🔧 Creando usuarios de prueba...');

    const usuarios = [
      { username: 'admin', password: 'admin', nombre: 'Roberto Gómez', rol: 'admin' },
      { username: 'juan', password: 'juan', nombre: 'Juan P.', rol: 'user' },
      { username: 'luis', password: 'luis', nombre: 'Luis M.', rol: 'user' },
      { username: 'carlos', password: 'carlos', nombre: 'Carlos R.', rol: 'user' },
      { username: 'ana', password: 'ana', nombre: 'Ana S.', rol: 'user' },
      { username: 'sofia', password: 'sofia', nombre: 'Sofía G.', rol: 'user' }
    ];

    usuarios.forEach(u => {
      const hashedPassword = bcrypt.hashSync(u.password, 10);
      db.run('INSERT INTO usuarios (username, password, nombre, rol) VALUES (?, ?, ?, ?)',
        [u.username, hashedPassword, u.nombre, u.rol]);
    });

    // Guardar cambios
    saveDatabase();

    console.log(`✅ ${usuarios.length} usuarios de prueba creados`);
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   Usuarios de prueba disponibles:           ║');
    console.log('║   • admin / admin (Administrador)            ║');
    console.log('║   • juan / juan (Usuario)                    ║');
    console.log('║   • luis / luis (Usuario)                    ║');
    console.log('║   • carlos / carlos (Usuario)                ║');
    console.log('║   • ana / ana (Usuario)                      ║');
    console.log('║   • sofia / sofia (Usuario)                  ║');
    console.log('╚══════════════════════════════════════════════╝');
  }
}

export default { prepare, exec, saveDatabase };
