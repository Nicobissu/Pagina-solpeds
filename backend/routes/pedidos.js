import express from 'express';
import {
  getAllPedidos,
  getPedidoById,
  createPedido,
  updatePedido,
  updatePedidoUsuario,
  deletePedido,
  addComentario,
  cancelarPedido,
  getPedidosCancelados,
  validarPedido
} from '../controllers/pedidosController.js';
import { authenticateToken, isAdminOrValidador } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', getAllPedidos);
router.get('/cancelados/lista', getPedidosCancelados);
router.post('/', upload.array('imagenes', 10), createPedido); // Permitir hasta 10 imágenes
router.put('/:id/cancelar', cancelarPedido);
router.put('/:id/validar', isAdminOrValidador, validarPedido);
router.put('/:id/editar-usuario', upload.array('imagenes', 10), updatePedidoUsuario); // Editar pedido por usuario
router.post('/:id/comentarios', addComentario);
router.get('/:id', getPedidoById);
router.put('/:id', updatePedido);
router.delete('/:id', deletePedido);

export default router;
