import { Router } from 'express';
import {
  crearUser,
  listarUsers,
  obtenerUser,
  actualizarUser,
  eliminarUser,
} from '../controllers/user.controller.js';
import { validarCampos } from '../middlewares/validarCampos.js';
import {
  validarId,
  validarCrearUser,
  validarActualizarUser,
} from '../middlewares/user.validator.js';

const router = Router();

router.post('/users', validarCrearUser, validarCampos, crearUser);
router.get('/users', listarUsers);
router.get('/users/:id', validarId, validarCampos, obtenerUser);
router.put('/users/:id', validarActualizarUser, validarCampos, actualizarUser);
router.delete('/users/:id', validarId, validarCampos, eliminarUser);

export default router;
