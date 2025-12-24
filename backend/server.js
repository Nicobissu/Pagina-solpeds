import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import pedidosRoutes from './routes/pedidos.js';
import comprasRoutes from './routes/compras.js';
import notificacionesRoutes from './routes/notificaciones.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Inicializar base de datos
initDatabase();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 Servidor iniciado correctamente         ║
║                                              ║
║   📡 Puerto: ${PORT}                          ║
║   🌐 URL: http://localhost:${PORT}           ║
║   📊 Base de datos: SQLite                   ║
║   🔐 Autenticación: JWT                      ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
});

export default app;
