import { Schema, model } from "mongoose";

const tagSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 30,
    },
    descripcion: { type: String, trim: true, maxlength: 150 },
    activo: { type: Boolean, default: true }, // eliminación lógica
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Índice único PARCIAL: solo se repite el nombre entre etiquetas ACTIVAS,
// así una etiqueta borrada (activo: false) no bloquea volver a usar ese nombre
tagSchema.index(
  { nombre: 1 },
  { unique: true, partialFilterExpression: { activo: true } },
);

tagSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "tags", // Task.tags es un array: Mongoose busca las tareas que contienen este _id
  match: { activo: true },
});

export default model("Tag", tagSchema);
