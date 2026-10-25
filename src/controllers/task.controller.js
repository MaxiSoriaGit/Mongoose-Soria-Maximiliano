import { matchedData } from "express-validator";
import Task from "../models/task.model.js";

export const crearTask = async (req, res) => {
  try {
    const datos = matchedData(req);
    const task = await Task.create(datos);
    res
      .status(201)
      .json({ ok: true, mensaje: "Tarea creada correctamente", data: task });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: "Error al crear la tarea",
        error: error.message,
      });
  }
};

export const listarTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ activo: true })
      .populate("user", "nombre email")
      .populate("tags", "nombre");
    res.status(200).json({ ok: true, data: tasks });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: "Error al listar las tareas",
        error: error.message,
      });
  }
};

export const obtenerTask = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const task = await Task.findOne({ _id: id, activo: true })
      .populate("user", "nombre email")
      .populate("tags", "nombre");
    if (!task) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Tarea no encontrada" });
    }
    res.status(200).json({ ok: true, data: task });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: "Error al obtener la tarea",
        error: error.message,
      });
  }
};

export const actualizarTask = async (req, res) => {
  try {
    const { id, ...datos } = matchedData(req);
    const task = await Task.findOneAndUpdate({ _id: id, activo: true }, datos, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!task) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Tarea no encontrada" });
    }
    res
      .status(200)
      .json({
        ok: true,
        mensaje: "Tarea actualizada correctamente",
        data: task,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: "Error al actualizar la tarea",
        error: error.message,
      });
  }
};

export const eliminarTask = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const task = await Task.findOneAndUpdate(
      { _id: id, activo: true },
      { activo: false },
      { returnDocument: "after" },
    );
    if (!task) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Tarea no encontrada" });
    }
    res
      .status(200)
      .json({ ok: true, mensaje: "Tarea eliminada correctamente" });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: "Error al eliminar la tarea",
        error: error.message,
      });
  }
};
