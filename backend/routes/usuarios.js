import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getEstadisticasUsuarios
} from '../controllers/usuariosController.js';

const router = express.Router();

// Todas las rutas requieren autenticación y permisos de admin/supervisor
router.get('/', authenticateToken, isAdmin, getAllUsuarios);
router.get('/estadisticas', authenticateToken, isAdmin, getEstadisticasUsuarios);
router.get('/:id', authenticateToken, isAdmin, getUsuarioById);
router.post('/', authenticateToken, isAdmin, createUsuario);
router.put('/:id', authenticateToken, isAdmin, updateUsuario);
router.delete('/:id', authenticateToken, isAdmin, deleteUsuario);

export default router;
