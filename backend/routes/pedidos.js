import express from 'express';
import {
  getAllPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  deletePedido,
  addComentario
} from '../controllers/pedidosController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getAllPedidos);
router.get('/:id', getPedidoById);
router.post('/', createPedido);
router.put('/:id', updatePedido);
router.delete('/:id', deletePedido);
router.post('/:id/comentarios', addComentario);

export default router;
