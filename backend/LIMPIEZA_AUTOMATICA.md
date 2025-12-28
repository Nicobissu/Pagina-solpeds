# Sistema de Eliminación Automática de Pedidos Cancelados

## Descripción

Este sistema implementa una eliminación diferida de pedidos cancelados. Cuando un pedido se cancela, permanece en el sistema durante **1 día** antes de ser eliminado completamente de la base de datos.

## Características

- **Eliminación Diferida**: Los pedidos cancelados se mantienen visibles durante 1 día
- **Limpieza Automática**: El sistema ejecuta una limpieza cada hora
- **Eliminación Completa**: Se eliminan:
  - El pedido de la base de datos
  - Los comentarios asociados
  - Las imágenes almacenadas en disco

## Implementación

### 1. Campo en la Base de Datos

Se agregó el campo `fecha_eliminacion_programada` a la tabla `pedidos`:

```sql
ALTER TABLE pedidos ADD COLUMN fecha_eliminacion_programada DATETIME
```

### 2. Función de Cancelación

Cuando se cancela un pedido, se calcula automáticamente la fecha de eliminación (fecha actual + 1 día):

```javascript
// En pedidosController.js - cancelarPedido()
const fechaEliminacion = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
```

### 3. Función de Limpieza

La función `limpiarPedidosCancelados()` en `pedidosController.js`:
- Busca pedidos cancelados cuya fecha de eliminación ya pasó
- Elimina las imágenes asociadas
- Elimina los comentarios del pedido
- Elimina el pedido de la base de datos

### 4. Proceso Programado

En `server.js` se configura un proceso que:
- Ejecuta la limpieza al iniciar el servidor
- Programa ejecuciones cada 60 minutos
- Registra en consola las actividades de limpieza

## Scripts de Utilidad

### test-limpieza.js
Script para verificar el estado de los pedidos cancelados:
```bash
node test-limpieza.js
```

Muestra:
- Total de pedidos cancelados
- Fecha de cancelación de cada uno
- Fecha de eliminación programada
- Si ya deberían ser eliminados o no

### migrar-pedidos-cancelados.js
Script para migrar pedidos antiguos que fueron cancelados antes de implementar este sistema:
```bash
node migrar-pedidos-cancelados.js
```

Actualiza pedidos cancelados sin `fecha_eliminacion_programada` calculándola basándose en su `fecha_cancelacion`.

### ejecutar-limpieza.js
Script para ejecutar manualmente la limpieza sin esperar el intervalo programado:
```bash
node ejecutar-limpieza.js
```

Útil para:
- Pruebas
- Limpieza inmediata después de una migración
- Debugging

## Configuración

### Intervalo de Limpieza

Por defecto, la limpieza se ejecuta cada 60 minutos. Para cambiarlo, modifica el valor en `server.js`:

```javascript
const intervaloLimpieza = 60 * 60 * 1000; // 60 minutos en milisegundos
```

### Tiempo de Retención

Por defecto, los pedidos se mantienen 1 día (24 horas). Para cambiarlo, modifica el cálculo en `pedidosController.js`:

```javascript
// En cancelarPedido()
const fechaEliminacion = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
// Cambiar 24 por el número de horas deseadas
```

## Logs del Sistema

El sistema registra automáticamente:

```
🔄 Ejecutando limpieza inicial de pedidos cancelados...
✅ Limpieza automática programada cada 60 minutos

🗑️  Eliminando 4 pedido(s) cancelado(s)...
  ✅ Pedido #7 (Cliente-Obra-1) eliminado
✅ Limpieza completada: 4 pedido(s) eliminado(s)
```

## Consideraciones

1. **Zona Horaria**: El sistema usa la hora local del servidor
2. **Base de Datos**: Los cambios se persisten automáticamente en SQLite
3. **Imágenes**: Se eliminan del sistema de archivos durante la limpieza
4. **Notificaciones**: Las notificaciones relacionadas NO se eliminan (se mantienen como historial)

## Monitoreo

Para verificar el estado del sistema:

1. Revisar los logs del servidor (se registra cada ejecución)
2. Ejecutar el script de prueba: `node test-limpieza.js`
3. Consultar directamente la base de datos:

```sql
SELECT id, centro_costo, fecha_cancelacion, fecha_eliminacion_programada
FROM pedidos
WHERE cancelado = 1
ORDER BY fecha_cancelacion DESC;
```

## Mantenimiento

- **Migración de Datos**: Ejecutar `migrar-pedidos-cancelados.js` después de actualizar el código
- **Limpieza Manual**: Ejecutar `ejecutar-limpieza.js` cuando sea necesario
- **Verificación**: Ejecutar `test-limpieza.js` para auditorías

## Troubleshooting

### Los pedidos no se eliminan
1. Verificar que el servidor esté corriendo
2. Revisar los logs del servidor
3. Ejecutar `test-limpieza.js` para ver el estado
4. Verificar que `fecha_eliminacion_programada` esté configurada

### Pedidos antiguos sin fecha de eliminación
1. Ejecutar `migrar-pedidos-cancelados.js`
2. Verificar que la migración fue exitosa con `test-limpieza.js`

### Necesito eliminar pedidos inmediatamente
1. Ejecutar `ejecutar-limpieza.js`
2. O modificar el tiempo de retención a 0 horas temporalmente
