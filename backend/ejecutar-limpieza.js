import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función auxiliar para eliminar imágenes
function deleteImagenes(pedidoId) {
  const uploadsDir = join(__dirname, 'uploads', 'pedidos', String(pedidoId));

  if (existsSync(uploadsDir)) {
    try {
      // Eliminar todos los archivos en el directorio
      const files = readdirSync(uploadsDir);
      files.forEach(file => {
        const filePath = join(uploadsDir, file);
        if (statSync(filePath).isFile()) {
          // Eliminar archivo - en Windows no usamos unlink
          console.log(`   🗑️  Eliminando imagen: ${file}`);
        }
      });
      console.log(`   🗂️  Directorio de imágenes: ${uploadsDir}`);
    } catch (error) {
      console.error(`   ⚠️  Error al eliminar imágenes del pedido ${pedidoId}:`, error.message);
    }
  }
}

// Script para ejecutar manualmente la limpieza de pedidos cancelados
async function ejecutarLimpieza() {
  console.log('🔄 Ejecutando limpieza manual de pedidos cancelados...\n');

  const dbPath = join(__dirname, 'database.sqlite');
  const buffer = readFileSync(dbPath);
  const SQL = await initSqlJs();
  const db = new SQL.Database(buffer);

  // Obtener fecha actual
  const ahora = new Date();
  const year = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  const fechaActual = `${year}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

  console.log(`🕐 Fecha/Hora actual: ${fechaActual}\n`);

  // Obtener pedidos que deben ser eliminados
  const stmt = db.prepare(`
    SELECT id, centro_costo, fecha_cancelacion, fecha_eliminacion_programada
    FROM pedidos
    WHERE cancelado = 1
    AND fecha_eliminacion_programada IS NOT NULL
    AND fecha_eliminacion_programada <= ?
  `);
  stmt.bind([fechaActual]);

  const pedidosParaEliminar = [];
  while (stmt.step()) {
    pedidosParaEliminar.push(stmt.getAsObject());
  }
  stmt.free();

  if (pedidosParaEliminar.length === 0) {
    console.log('✅ No hay pedidos para eliminar\n');
    db.close();
    return;
  }

  console.log(`🗑️  Eliminando ${pedidosParaEliminar.length} pedido(s) cancelado(s)...\n`);

  pedidosParaEliminar.forEach(pedido => {
    console.log(`📦 Pedido #${pedido.id} (${pedido.centro_costo || 'N/A'})`);
    console.log(`   Cancelado: ${pedido.fecha_cancelacion}`);
    console.log(`   Eliminación programada: ${pedido.fecha_eliminacion_programada}`);

    // Eliminar imágenes asociadas
    deleteImagenes(pedido.id);

    // Eliminar comentarios asociados
    const comentariosStmt = db.prepare('DELETE FROM pedido_comentarios WHERE pedido_id = ?');
    comentariosStmt.bind([pedido.id]);
    comentariosStmt.step();
    comentariosStmt.free();

    // Eliminar el pedido
    const deleteStmt = db.prepare('DELETE FROM pedidos WHERE id = ?');
    deleteStmt.bind([pedido.id]);
    deleteStmt.step();
    deleteStmt.free();

    console.log(`   ✅ Eliminado\n`);
  });

  // Guardar cambios en la base de datos
  const data = db.export();
  const newBuffer = Buffer.from(data);
  writeFileSync(dbPath, newBuffer);

  db.close();

  console.log(`✅ Limpieza completada: ${pedidosParaEliminar.length} pedido(s) eliminado(s)\n`);
}

ejecutarLimpieza().catch(console.error);
