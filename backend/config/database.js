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

        // Obtener el último ID insertado ANTES de guardar
        const lastIdStmt = db.prepare('SELECT last_insert_rowid() as id');
        lastIdStmt.step();
        const row = lastIdStmt.getAsObject();
        lastIdStmt.free();

        const lastId = row.id || 0;

        // Guardar después de obtener el ID
        saveDatabase();

        return {
          lastInsertRowid: lastId,
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
      cancelado BOOLEAN DEFAULT 0,
      motivo_cancelacion TEXT,
      cancelado_por_id INTEGER,
      fecha_cancelacion DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
      FOREIGN KEY (cancelado_por_id) REFERENCES usuarios(id)
    )
  `);

  // Tabla de comentarios de pedidos
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedido_comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
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
      cancelado BOOLEAN DEFAULT 0,
      motivo_cancelacion TEXT,
      cancelado_por_id INTEGER,
      fecha_cancelacion DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (solicitante_id) REFERENCES usuarios(id),
      FOREIGN KEY (cancelado_por_id) REFERENCES usuarios(id)
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

  // Tabla de clientes (centros de costo)
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      activo BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de obras (centros de costo por cliente)
  db.exec(`
    CREATE TABLE IF NOT EXISTS obras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      activo BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
      UNIQUE(cliente_id, nombre)
    )
  `);

  // Migraciones: agregar columnas de cancelación si no existen
  try {
    // Verificar si las columnas de cancelación existen en pedidos
    const pedidosInfo = db.exec("PRAGMA table_info(pedidos)");
    const pedidosColumns = pedidosInfo.length > 0 ? pedidosInfo[0].values.map(row => row[1]) : [];

    if (!pedidosColumns.includes('cancelado')) {
      console.log('🔄 Migrando tabla pedidos: agregando columnas de cancelación...');
      db.exec('ALTER TABLE pedidos ADD COLUMN cancelado BOOLEAN DEFAULT 0');
      db.exec('ALTER TABLE pedidos ADD COLUMN motivo_cancelacion TEXT');
      db.exec('ALTER TABLE pedidos ADD COLUMN cancelado_por_id INTEGER');
      db.exec('ALTER TABLE pedidos ADD COLUMN fecha_cancelacion DATETIME');
      console.log('✅ Columnas de cancelación agregadas a pedidos');
    }

    if (!pedidosColumns.includes('validado')) {
      console.log('🔄 Migrando tabla pedidos: agregando columnas de validación...');
      db.exec('ALTER TABLE pedidos ADD COLUMN validado BOOLEAN DEFAULT 0');
      db.exec('ALTER TABLE pedidos ADD COLUMN validado_por_id INTEGER');
      db.exec('ALTER TABLE pedidos ADD COLUMN fecha_validacion DATETIME');
      console.log('✅ Columnas de validación agregadas a pedidos');
    }

    if (!pedidosColumns.includes('cliente_id')) {
      console.log('🔄 Migrando tabla pedidos: agregando columnas de centro de costo...');
      db.exec('ALTER TABLE pedidos ADD COLUMN cliente_id INTEGER');
      db.exec('ALTER TABLE pedidos ADD COLUMN obra_id INTEGER');
      db.exec('ALTER TABLE pedidos ADD COLUMN numero_secuencial INTEGER');
      db.exec('ALTER TABLE pedidos ADD COLUMN centro_costo TEXT');
      console.log('✅ Columnas de centro de costo agregadas a pedidos');
    }

    if (!pedidosColumns.includes('imagenes')) {
      console.log('🔄 Migrando tabla pedidos: agregando columna de imágenes...');
      db.exec('ALTER TABLE pedidos ADD COLUMN imagenes TEXT');
      console.log('✅ Columna de imágenes agregada a pedidos');
    }

    if (!pedidosColumns.includes('fecha_eliminacion_programada')) {
      console.log('🔄 Migrando tabla pedidos: agregando columna de eliminación programada...');
      db.exec('ALTER TABLE pedidos ADD COLUMN fecha_eliminacion_programada DATETIME');
      console.log('✅ Columna de eliminación programada agregada a pedidos');
    }

    // Verificar si la tabla de comentarios tiene la columna usuario_id
    const comentariosInfo = db.exec("PRAGMA table_info(pedido_comentarios)");
    const comentariosColumns = comentariosInfo.length > 0 ? comentariosInfo[0].values.map(row => row[1]) : [];

    if (!comentariosColumns.includes('usuario_id')) {
      console.log('🔄 Migrando tabla pedido_comentarios: agregando columna usuario_id...');
      db.exec('ALTER TABLE pedido_comentarios ADD COLUMN usuario_id INTEGER');
      console.log('✅ Columna usuario_id agregada a pedido_comentarios');
    }

    // Verificar si las columnas de cancelación existen en compras
    const comprasInfo = db.exec("PRAGMA table_info(compras)");
    const comprasColumns = comprasInfo.length > 0 ? comprasInfo[0].values.map(row => row[1]) : [];

    if (!comprasColumns.includes('cancelado')) {
      console.log('🔄 Migrando tabla compras: agregando columnas de cancelación...');
      db.exec('ALTER TABLE compras ADD COLUMN cancelado BOOLEAN DEFAULT 0');
      db.exec('ALTER TABLE compras ADD COLUMN motivo_cancelacion TEXT');
      db.exec('ALTER TABLE compras ADD COLUMN cancelado_por_id INTEGER');
      db.exec('ALTER TABLE compras ADD COLUMN fecha_cancelacion DATETIME');
      console.log('✅ Columnas de cancelación agregadas a compras');
    }
  } catch (migrationError) {
    console.error('⚠️  Error durante la migración:', migrationError);
  }

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
      { username: 'validador', password: 'validador', nombre: 'María Valdez', rol: 'validador' },
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
    console.log('║   • validador / validador (Validador)        ║');
    console.log('║   • juan / juan (Usuario)                    ║');
    console.log('║   • luis / luis (Usuario)                    ║');
    console.log('║   • carlos / carlos (Usuario)                ║');
    console.log('║   • ana / ana (Usuario)                      ║');
    console.log('║   • sofia / sofia (Usuario)                  ║');
    console.log('╚══════════════════════════════════════════════╝');
  }
}

export default { prepare, exec, saveDatabase };
