import express from 'express';
import {
  getAllCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra
} from '../controllers/comprasController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getAllCompras);
router.get('/:id', getCompraById);
router.post('/', createCompra);
router.put('/:id', updateCompra);
router.delete('/:id', deleteCompra);

export default router;
