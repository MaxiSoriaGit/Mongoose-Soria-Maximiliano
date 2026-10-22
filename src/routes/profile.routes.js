import { Router } from 'express';
import {
  crearProfile,
  listarProfiles,
  obtenerProfile,
  actualizarProfile,
  eliminarProfile,
} from '../controllers/profile.controller.js';
import { validarCampos } from '../middlewares/validarCampos.js';
import {
  validarId,
  validarCrearProfile,
  validarActualizarProfile,
} from '../middlewares/profile.validator.js';

const router = Router();

router.post('/profiles', validarCrearProfile, validarCampos, crearProfile);
router.get('/profiles', listarProfiles);
router.get('/profiles/:id', validarId, validarCampos, obtenerProfile);
router.put(
  '/profiles/:id',
  validarId,
  validarActualizarProfile,
  validarCampos,
  actualizarProfile,
);
router.delete('/profiles/:id', validarId, validarCampos, eliminarProfile);

export default router;
