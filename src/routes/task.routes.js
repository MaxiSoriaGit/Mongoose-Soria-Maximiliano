import { Router } from "express";
import {
  crearTask,
  listarTasks,
  obtenerTask,
  actualizarTask,
  eliminarTask,
} from "../controllers/task.controller.js";
import { validarCampos } from "../middlewares/validarCampos.js";
import {
  validarId,
  validarCrearTask,
  validarActualizarTask,
} from "../middlewares/task.validator.js";

const router = Router();

router.post("/", validarCrearTask, validarCampos, crearTask);
router.get("/", listarTasks);
router.get("/:id", validarId, validarCampos, obtenerTask);
router.put(
  "/:id",
  validarId,
  validarActualizarTask,
  validarCampos,
  actualizarTask,
);
router.delete("/:id", validarId, validarCampos, eliminarTask);

export default router;
