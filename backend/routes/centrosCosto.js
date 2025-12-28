import express from 'express';
import {
  getAllClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getObrasByCliente,
  getAllObras,
  createObra,
  updateObra,
  deleteObra,
  getSiguienteNumero
} from '../controllers/centrosCostoController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de clientes
router.get('/clientes', getAllClientes);
router.post('/clientes', isAdmin, createCliente);
router.put('/clientes/:id', isAdmin, updateCliente);
router.delete('/clientes/:id', isAdmin, deleteCliente);

// Rutas de obras
router.get('/obras', getAllObras);
router.get('/obras/cliente/:clienteId', getObrasByCliente);
router.post('/obras', isAdmin, createObra);
router.put('/obras/:id', isAdmin, updateObra);
router.delete('/obras/:id', isAdmin, deleteObra);

// Obtener siguiente número secuencial
router.get('/siguiente-numero/:clienteId/:obraId', getSiguienteNumero);

export default router;
