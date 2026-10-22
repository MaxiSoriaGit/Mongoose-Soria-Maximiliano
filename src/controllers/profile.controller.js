import { matchedData } from 'express-validator';
import Profile from '../models/profile.model.js';

export const crearProfile = async (req, res) => {
  try {
    const datos = matchedData(req);
    const profile = await Profile.create(datos);
    res
      .status(201)
      .json({
        ok: true,
        mensaje: 'Perfil creado correctamente',
        data: profile,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: 'Error al crear el perfil',
        error: error.message,
      });
  }
};

export const listarProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ activo: true }).populate(
      'user',
      'nombre email',
    );
    res.status(200).json({ ok: true, data: profiles });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: 'Error al listar los perfiles',
        error: error.message,
      });
  }
};

export const obtenerProfile = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const profile = await Profile.findOne({ _id: id, activo: true }).populate(
      'user',
      'nombre email',
    );
    if (!profile) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Perfil no encontrado' });
    }
    res.status(200).json({ ok: true, data: profile });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: 'Error al obtener el perfil',
        error: error.message,
      });
  }
};

export const actualizarProfile = async (req, res) => {
  try {
    const { id, direccion, ...resto } = matchedData(req);

    const cambios = { ...resto };
    if (direccion) {
      for (const [campo, valor] of Object.entries(direccion)) {
        cambios[`direccion.${campo}`] = valor;
      }
    }

    const profile = await Profile.findOneAndUpdate(
      { _id: id, activo: true },
      { $set: cambios },
      { new: true, runValidators: true },
    );
    if (!profile) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Perfil no encontrado' });
    }
    res
      .status(200)
      .json({
        ok: true,
        mensaje: 'Perfil actualizado correctamente',
        data: profile,
      });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: 'Error al actualizar el perfil',
        error: error.message,
      });
  }
};

export const eliminarProfile = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const profile = await Profile.findOneAndUpdate(
      { _id: id, activo: true },
      { activo: false },
      { new: true },
    );
    if (!profile) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Perfil no encontrado' });
    }
    res
      .status(200)
      .json({ ok: true, mensaje: 'Perfil eliminado correctamente' });
  } catch (error) {
    res
      .status(500)
      .json({
        ok: false,
        mensaje: 'Error al eliminar el perfil',
        error: error.message,
      });
  }
};
