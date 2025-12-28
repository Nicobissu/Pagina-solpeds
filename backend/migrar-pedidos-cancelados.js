import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Script para migrar pedidos cancelados antiguos sin fecha_eliminacion_programada
async function migrarPedidosAntiguos() {
  console.log('🔄 Migrando pedidos cancelados antiguos...\n');

  const dbPath = join(__dirname, 'database.sqlite');
  const buffer = readFileSync(dbPath);
  const SQL = await initSqlJs();
  const db = new SQL.Database(buffer);

  // Obtener pedidos cancelados sin fecha de eliminación programada
  const stmt = db.prepare(`
    SELECT id, centro_costo, fecha_cancelacion
    FROM pedidos
    WHERE cancelado = 1 AND fecha_eliminacion_programada IS NULL
  `);

  const pedidosParaMigrar = [];
  while (stmt.step()) {
    pedidosParaMigrar.push(stmt.getAsObject());
  }
  stmt.free();

  if (pedidosParaMigrar.length === 0) {
    console.log('✅ No hay pedidos para migrar\n');
    db.close();
    return;
  }

  console.log(`📊 Total de pedidos a migrar: ${pedidosParaMigrar.length}\n`);

  // Actualizar cada pedido
  pedidosParaMigrar.forEach(pedido => {
    // Parsear la fecha de cancelación
    const fechaCancelacion = new Date(pedido.fecha_cancelacion);

    // Agregar 1 día
    const fechaEliminacion = new Date(fechaCancelacion.getTime() + 24 * 60 * 60 * 1000);

    // Formatear como YYYY-MM-DD HH:mm:ss
    const year = fechaEliminacion.getFullYear();
    const mes = String(fechaEliminacion.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaEliminacion.getDate()).padStart(2, '0');
    const horas = String(fechaEliminacion.getHours()).padStart(2, '0');
    const minutos = String(fechaEliminacion.getMinutes()).padStart(2, '0');
    const segundos = String(fechaEliminacion.getSeconds()).padStart(2, '0');
    const fechaEliminacionStr = `${year}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;

    // Actualizar el pedido
    db.run(
      'UPDATE pedidos SET fecha_eliminacion_programada = ? WHERE id = ?',
      [fechaEliminacionStr, pedido.id]
    );

    console.log(`✅ Pedido #${pedido.id} (${pedido.centro_costo || 'N/A'})`);
    console.log(`   Cancelado: ${pedido.fecha_cancelacion}`);
    console.log(`   Eliminación programada: ${fechaEliminacionStr}\n`);
  });

  // Guardar cambios en la base de datos
  const data = db.export();
  const newBuffer = Buffer.from(data);
  writeFileSync(dbPath, newBuffer);

  db.close();

  console.log(`\n✅ Migración completada: ${pedidosParaMigrar.length} pedido(s) actualizado(s)`);
  console.log('⚠️  NOTA: Los pedidos cancelados hace más de 1 día se eliminarán en la próxima ejecución de limpieza automática\n');
}

migrarPedidosAntiguos().catch(console.error);
