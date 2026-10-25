import { body } from 'express-validator';
import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';

export { validarId } from './user.validator.js';

export const validarCrearProfile = [
  body('user')
    .notEmpty()
    .withMessage('El usuario es obligatorio')
    .isMongoId()
    .withMessage('El ID del usuario no es un ObjectId válido')
    .bail() // si no es un ObjectId, no sigue al custom (evita un error de cast)
    .custom(async (userId) => {
      const user = await User.findOne({ _id: userId, activo: true });
      if (!user) throw new Error('El usuario no existe');

      const perfil = await Profile.findOne({ user: userId, activo: true });
      if (perfil)
        throw new Error('Ese usuario ya tiene un perfil (relación 1:1)');
    }),
  body('bio')
    .optional()
    .trim()
    .isString()
    .withMessage('La bio debe ser texto')
    .isLength({ max: 300 })
    .withMessage('La bio no puede superar los 300 caracteres'),
  body('telefono')
    .optional()
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('El teléfono debe tener entre 6 y 20 caracteres'),

  // Propiedad embebida: la dirección es opcional, pero si viene, calle y ciudad son obligatorias
  body('direccion.calle')
    .if(body('direccion').exists())
    .trim()
    .notEmpty()
    .withMessage('La calle es obligatoria')
    .isLength({ max: 100 })
    .withMessage('La calle no puede superar los 100 caracteres'),
  body('direccion.ciudad')
    .if(body('direccion').exists())
    .trim()
    .notEmpty()
    .withMessage('La ciudad es obligatoria')
    .isLength({ max: 60 })
    .withMessage('La ciudad no puede superar los 60 caracteres'),
  body('direccion.codigoPostal')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('El código postal no puede superar los 10 caracteres'),
];

// En la actualizaciones no se permite cambiar el usuario del perfil
export const validarActualizarProfile = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('La bio no puede superar los 300 caracteres'),
  body('telefono')
    .optional()
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('El teléfono debe tener entre 6 y 20 caracteres'),
  body('direccion.calle')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La calle no puede estar vacía')
    .isLength({ max: 100 })
    .withMessage('La calle no puede superar los 100 caracteres'),
  body('direccion.ciudad')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La ciudad no puede estar vacía')
    .isLength({ max: 60 })
    .withMessage('La ciudad no puede superar los 60 caracteres'),
  body('direccion.codigoPostal')
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage('El código postal no puede superar los 10 caracteres'),
];
