import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    activo: { type: Boolean, default: true }, // eliminación lógica
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Índice único PARCIAL: el email solo debe repetirse entre usuarios ACTIVOS,
// así un usuario borrado (activo: false) no bloquea volver a usar ese email
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { activo: true } },
);

userSchema.virtual("profile", {
  ref: "Profile",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "user",
  match: { activo: true }, // no trae tareas eliminadas
});
export default model("User", userSchema);
