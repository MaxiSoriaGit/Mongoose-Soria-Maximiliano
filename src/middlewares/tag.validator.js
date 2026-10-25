import { body } from "express-validator";
import Tag from "../models/tag.model.js";

export { validarId } from "./user.validator.js";

export const validarCrearTag = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isString()
    .withMessage("El nombre debe ser texto")
    .isLength({ min: 2, max: 30 })
    .withMessage("El nombre debe tener entre 2 y 30 caracteres")
    .custom(async (nombre) => {
      const existe = await Tag.findOne({ nombre: nombre.toLowerCase() });
      if (existe) throw new Error("Ya existe una etiqueta con ese nombre");
    }),
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("La descripción no puede superar los 150 caracteres"),
];

export const validarActualizarTag = [
  body("nombre")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El nombre no puede estar vacío")
    .isLength({ min: 2, max: 30 })
    .withMessage("El nombre debe tener entre 2 y 30 caracteres")
    .custom(async (nombre, { req }) => {
      const existe = await Tag.findOne({
        nombre: nombre.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existe) throw new Error("Ya existe una etiqueta con ese nombre");
    }),
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage("La descripción no puede superar los 150 caracteres"),
];
