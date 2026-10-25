import { body } from "express-validator";
import User from "../models/user.model.js";
import Tag from "../models/tag.model.js";

export { validarId } from "./user.validator.js";

const ESTADOS = ["pendiente", "en_progreso", "completada"];
const esObjectId = (valor) =>
  typeof valor === "string" && /^[0-9a-fA-F]{24}$/.test(valor);

export const validarCrearTask = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("El título es obligatorio")
    .isString()
    .withMessage("El título debe ser texto")
    .isLength({ min: 3, max: 100 })
    .withMessage("El título debe tener entre 3 y 100 caracteres"),
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede superar los 500 caracteres"),
  body("estado")
    .optional()
    .isIn(ESTADOS)
    .withMessage(`El estado debe ser uno de: ${ESTADOS.join(", ")}`),
  body("user")
    .notEmpty()
    .withMessage("El usuario es obligatorio")
    .isMongoId()
    .withMessage("El ID del usuario no es un ObjectId válido")
    .bail()
    .custom(async (userId) => {
      const user = await User.findOne({ _id: userId, activo: true });
      if (!user) throw new Error("El usuario no existe");
    }),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Las etiquetas deben enviarse en un array")
    .bail()
    .custom((tags) => {
      if (!tags.every(esObjectId))
        throw new Error(
          "Todos los IDs de etiquetas deben ser ObjectId válidos",
        );
      if (new Set(tags).size !== tags.length)
        throw new Error("Hay etiquetas repetidas en el array");
      return true;
    })
    .bail()
    .custom(async (tags) => {
      const cantidad = await Tag.countDocuments({
        _id: { $in: tags },
        activo: true,
      });
      if (cantidad !== tags.length)
        throw new Error("Alguna de las etiquetas no existe");
    }),
];

// En la actualización no se cambia el usuario ni las etiquetas (las etiquetas se vinculan por el endpoint N:M)
export const validarActualizarTask = [
  body("titulo")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("El título no puede estar vacío")
    .isLength({ min: 3, max: 100 })
    .withMessage("El título debe tener entre 3 y 100 caracteres"),
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("La descripción no puede superar los 500 caracteres"),
  body("estado")
    .optional()
    .isIn(ESTADOS)
    .withMessage(`El estado debe ser uno de: ${ESTADOS.join(", ")}`),
];
