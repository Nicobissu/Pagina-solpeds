import express from 'express';
import {
  getNotificaciones,
  createNotificacion,
  marcarComoLeida,
  marcarTodasLeidas,
  deleteNotificacion
} from '../controllers/notificacionesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotificaciones);
router.post('/', createNotificacion);
router.put('/:id/leida', marcarComoLeida);
router.put('/marcar-todas-leidas', marcarTodasLeidas);
router.delete('/:id', deleteNotificacion);

export default router;
