import express from 'express';
import {
  getAllCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
  cancelarCompra,
  getComprasCanceladas
} from '../controllers/comprasController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllCompras);
router.get('/canceladas/lista', getComprasCanceladas);
router.post('/', createCompra);
router.put('/:id/cancelar', cancelarCompra);
router.get('/:id', getCompraById);
router.put('/:id', updateCompra);
router.delete('/:id', deleteCompra);

export default router;
