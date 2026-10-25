import { Schema, model } from "mongoose";

const tagSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
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

export default model("Tag", tagSchema);
