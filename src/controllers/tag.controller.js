import { matchedData } from "express-validator";
import Tag from "../models/tag.model.js";

export const crearTag = async (req, res) => {
  try {
    const datos = matchedData(req);
    const tag = await Tag.create(datos);
    res
      .status(201)
      .json({ ok: true, mensaje: "Etiqueta creada correctamente", data: tag });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al crear la etiqueta",
      error: error.message,
    });
  }
};

export const listarTags = async (req, res) => {
  try {
    const tags = await Tag.find({ activo: true });
    res.status(200).json({ ok: true, data: tags });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al listar las etiquetas",
      error: error.message,
    });
  }
};

export const obtenerTag = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const tag = await Tag.findOne({ _id: id, activo: true });
    if (!tag) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Etiqueta no encontrada" });
    }
    res.status(200).json({ ok: true, data: tag });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener la etiqueta",
      error: error.message,
    });
  }
};

export const actualizarTag = async (req, res) => {
  try {
    const { id, ...datos } = matchedData(req);
    const tag = await Tag.findOneAndUpdate({ _id: id, activo: true }, datos, {
      new: true,
      runValidators: true,
    });
    if (!tag) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Etiqueta no encontrada" });
    }
    res.status(200).json({
      ok: true,
      mensaje: "Etiqueta actualizada correctamente",
      data: tag,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar la etiqueta",
      error: error.message,
    });
  }
};

export const eliminarTag = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const tag = await Tag.findOneAndUpdate(
      { _id: id, activo: true },
      { activo: false },
      { new: true },
    );
    if (!tag) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Etiqueta no encontrada" });
    }

    // Cuando exista Task, acá se agrega la cascada: quitar esta etiqueta de Task.tags

    res
      .status(200)
      .json({ ok: true, mensaje: "Etiqueta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar la etiqueta",
      error: error.message,
    });
  }
};
