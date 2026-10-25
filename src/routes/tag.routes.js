import { Router } from "express";
import {
  crearTag,
  listarTags,
  obtenerTag,
  actualizarTag,
  eliminarTag,
} from "../controllers/tag.controller.js";
import { validarCampos } from "../middlewares/validarCampos.js";
import {
  validarId,
  validarCrearTag,
  validarActualizarTag,
} from "../middlewares/tag.validator.js";

const router = Router();

router.post("/", validarCrearTag, validarCampos, crearTag);
router.get("/", listarTags);
router.get("/:id", validarId, validarCampos, obtenerTag);
router.put(
  "/:id",
  validarId,
  validarActualizarTag,
  validarCampos,
  actualizarTag,
);
router.delete("/:id", validarId, validarCampos, eliminarTag);

export default router;
