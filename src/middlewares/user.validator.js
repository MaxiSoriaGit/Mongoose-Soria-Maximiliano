import { body, param } from 'express-validator';
import User from '../models/user.model.js';

export const validarId = [
  param('id').isMongoId().withMessage('El ID no es un ObjectId válido'),
];

export const validarCrearUser = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isString()
    .withMessage('El nombre debe ser texto')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('El email no es válido')
    .custom(async (email) => {
      const existe = await User.findOne({ email: email.toLowerCase() });
      if (existe) throw new Error('Ya existe un usuario con ese email');
    }),
];

export const validarActualizarUser = [
  ...validarId,
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('El email no es válido')
    .custom(async (email, { req }) => {
      const existe = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }, // ignora al propio usuario
      });
      if (existe) throw new Error('Ya existe un usuario con ese email');
    }),
];
