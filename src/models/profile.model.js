import { Schema, model } from 'mongoose';

const direccionSchema = new Schema(
  {
    calle: { type: String, required: true, trim: true, maxlength: 100 },
    ciudad: { type: String, required: true, trim: true, maxlength: 60 },
    codigoPostal: { type: String, trim: true, maxlength: 10 },
  },
  { _id: false },
);

const profileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true, // 1:1: un usuario solo puede tener un perfil
    },
    bio: { type: String, trim: true, maxlength: 300 },
    telefono: { type: String, trim: true, maxlength: 20 },
    direccion: direccionSchema, // propiedad embebida
    activo: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Índice único PARCIAL: relación 1:1 solo entre perfiles ACTIVOS,
// así un perfil borrado (activo: false) no bloquea crearle otro al mismo usuario
profileSchema.index(
  { user: 1 },
  { unique: true, partialFilterExpression: { activo: true } },
);

export default model('Profile', profileSchema);
