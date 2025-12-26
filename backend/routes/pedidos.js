import express from 'express';
import {
  getAllPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  deletePedido,
  addComentario,
  cancelarPedido,
  getPedidosCancelados
} from '../controllers/pedidosController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getAllPedidos);
router.get('/cancelados/lista', getPedidosCancelados);
router.post('/', createPedido);
router.put('/:id/cancelar', cancelarPedido);
router.post('/:id/comentarios', addComentario);
router.get('/:id', getPedidoById);
router.put('/:id', updatePedido);
router.delete('/:id', deletePedido);

export default router;
