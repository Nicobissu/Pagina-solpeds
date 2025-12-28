import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase } from './config/database.js';
import { limpiarPedidosCancelados } from './controllers/pedidosController.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import pedidosRoutes from './routes/pedidos.js';
import comprasRoutes from './routes/compras.js';
import notificacionesRoutes from './routes/notificaciones.js';
import centrosCostoRoutes from './routes/centrosCosto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Inicializar base de datos (ahora es asíncrono)
await initDatabase();

// Middlewares
// CORS configurado para permitir solicitudes desde el frontend en Hostinger
const allowedOrigins = [
  'http://localhost:5173', // Desarrollo local
  process.env.FRONTEND_URL // URL de producción en Hostinger (configurar en variables de entorno)
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/centros-costo', centrosCostoRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente', env: NODE_ENV });
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  const urlDisplay = NODE_ENV === 'production'
    ? `Puerto: ${PORT}`
    : `http://localhost:${PORT}`;

  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 Servidor Backend iniciado               ║
║                                              ║
║   🌍 Entorno: ${NODE_ENV.padEnd(31)}║
║   📡 ${urlDisplay.padEnd(44)}║
║   📊 Base de datos: SQLite                   ║
║   🔐 Autenticación: JWT                      ║
║   🌐 CORS: ${(process.env.FRONTEND_URL || 'localhost').padEnd(35)}║
║                                              ║
╚══════════════════════════════════════════════╝
  `);

  // Iniciar limpieza automática de pedidos cancelados
  iniciarLimpiezaAutomatica();
});

// Función para programar la limpieza automática de pedidos cancelados
function iniciarLimpiezaAutomatica() {
  // Ejecutar limpieza inmediatamente al iniciar
  console.log('🔄 Ejecutando limpieza inicial de pedidos cancelados...');
  limpiarPedidosCancelados();

  // Programar limpieza cada hora (3600000 ms)
  const intervaloLimpieza = 60 * 60 * 1000; // 1 hora
  setInterval(() => {
    console.log('🔄 Ejecutando limpieza programada de pedidos cancelados...');
    limpiarPedidosCancelados();
  }, intervaloLimpieza);

  console.log(`✅ Limpieza automática programada cada ${intervaloLimpieza / 1000 / 60} minutos`);
}

export default app;
