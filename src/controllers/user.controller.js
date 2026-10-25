import { matchedData } from "express-validator";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Task from "../models/task.model.js";

export const crearUser = async (req, res) => {
  try {
    const datos = matchedData(req);
    const user = await User.create(datos);
    res
      .status(201)
      .json({ ok: true, mensaje: "Usuario creado correctamente", data: user });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al crear el usuario",
      error: error.message,
    });
  }
};

export const listarUsers = async (req, res) => {
  try {
    const users = await User.find({ activo: true }).populate([
      "profile",
      "tasks",
    ]);
    res.status(200).json({ ok: true, data: users });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al listar los usuarios",
      error: error.message,
    });
  }
};

export const obtenerUser = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const user = await User.findOne({ _id: id, activo: true }).populate([
      "profile",
      "tasks",
    ]);
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }
    res.status(200).json({ ok: true, data: user });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al obtener el usuario",
      error: error.message,
    });
  }
};

export const actualizarUser = async (req, res) => {
  try {
    const { id, ...datos } = matchedData(req);
    const user = await User.findOneAndUpdate({ _id: id, activo: true }, datos, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }
    res.status(200).json({
      ok: true,
      mensaje: "Usuario actualizado correctamente",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al actualizar el usuario",
      error: error.message,
    });
  }
};

export const eliminarUser = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const user = await User.findOneAndUpdate(
      { _id: id, activo: true },
      { activo: false },
      { returnDocument: "after" },
    );
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    // Cascada: desactiva el perfil del usuario (más adelante, también sus tareas)
    //await Profile.updateMany({ user: id }, { activo: false });

    // Cascada: desactiva el perfil y las tareas del usuario
    await Profile.updateMany({ user: id }, { activo: false });
    await Task.updateMany({ user: id }, { activo: false });

    res
      .status(200)
      .json({ ok: true, mensaje: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al eliminar el usuario",
      error: error.message,
    });
  }
};
