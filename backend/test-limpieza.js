import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Script para probar la limpieza automática de pedidos cancelados
async function testLimpieza() {
  console.log('🧪 Iniciando prueba de limpieza automática...\n');

  const SQL = await initSqlJs();
  const dbPath = join(__dirname, 'database.sqlite');
  const buffer = readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // Consultar pedidos cancelados con fecha de eliminación
  const stmt = db.prepare(`
    SELECT
      id,
      centro_costo,
      cancelado,
      fecha_cancelacion,
      fecha_eliminacion_programada,
      CASE
        WHEN fecha_eliminacion_programada <= datetime('now', 'localtime')
        THEN 'SI - Ya debería eliminarse'
        ELSE 'NO - Aún no'
      END as debe_eliminarse
    FROM pedidos
    WHERE cancelado = 1
    ORDER BY fecha_cancelacion DESC
  `);

  const pedidosCancelados = [];
  while (stmt.step()) {
    pedidosCancelados.push(stmt.getAsObject());
  }
  stmt.free();

  if (pedidosCancelados.length === 0) {
    console.log('✅ No hay pedidos cancelados en el sistema\n');
  } else {
    console.log(`📊 Total de pedidos cancelados: ${pedidosCancelados.length}\n`);
    console.log('Detalles de pedidos cancelados:');
    console.log('='.repeat(120));

    pedidosCancelados.forEach((p, idx) => {
      console.log(`\n${idx + 1}. Pedido #${p.id} - ${p.centro_costo}`);
      console.log(`   📅 Cancelado: ${p.fecha_cancelacion}`);
      console.log(`   🗑️  Eliminación programada: ${p.fecha_eliminacion_programada}`);
      console.log(`   ⏰ Debe eliminarse: ${p.debe_eliminarse}`);
    });

    console.log('\n' + '='.repeat(120));
  }

  // Consultar fecha y hora actual
  const ahora = db.prepare("SELECT datetime('now', 'localtime') as fecha_actual");
  ahora.step();
  const fechaActual = ahora.getAsObject();
  ahora.free();

  console.log(`\n🕐 Fecha/Hora actual del sistema: ${fechaActual.fecha_actual}`);
  console.log('\nℹ️  Los pedidos cancelados se eliminarán automáticamente 1 día después de su cancelación');
  console.log('ℹ️  El sistema verifica cada hora si hay pedidos para eliminar');

  db.close();
}

testLimpieza().catch(console.error);
