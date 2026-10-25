import { Schema, model } from "mongoose";

const taskSchema = new Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    descripcion: { type: String, trim: true, maxlength: 500 },
    estado: {
      type: String,
      enum: ["pendiente", "en_progreso", "completada"],
      default: "pendiente",
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 1:N
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }], // N:M
    activo: { type: Boolean, default: true }, // eliminación lógica
  },
  { timestamps: true },
);

export default model("Task", taskSchema);
