import { Appeal, Incidence } from "../models/index.js";

export const getAllAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.findAll();
    res.json(appeals);
  } catch (error) {
    console.error("Error en getAllAppeals:", error);
    res.status(500).json({ message: "Error al obtener apelaciones", error: error.message });
  }
};

export const getAppealById = async (req, res) => {
  try {
    const appeal = await Appeal.findByPk(req.params.id);
    if (!appeal) return res.status(404).json({ message: "Apelación no encontrada" });
    res.json(appeal);
  } catch (error) {
    console.error("Error en getAppealById:", error);
    res.status(500).json({ message: "Error al obtener la apelación", error: error.message });
  }
};

export const getAppealsByIncidence = async (req, res) => {
  try {
    const { incidenceId } = req.params;
    const appeals = await Appeal.findAll({ where: { incidenceId } });
    res.json(appeals);
  } catch (error) {
    console.error("Error en getAppealsByIncidence:", error);
    res.status(500).json({ message: "Error al obtener apelaciones de la incidencia", error: error.message });
  }
};

export const createAppeal = async (req, res) => {
  try {
    const { incidenceId, message, status } = req.body;

    if (!incidenceId || !message) {
      return res.status(400).json({ message: "incidenceId y message son requeridos" });
    }

    // Validar existencia de la incidencia
    const incidence = await Incidence.findByPk(incidenceId);
    if (!incidence) return res.status(404).json({ message: "Incidencia relacionada no encontrada" });

    const appeal = await Appeal.create({
      incidenceId,
      message,
      status: status || "pending",
    });

    res.status(201).json({ message: "Apelación creada", appeal });
  } catch (error) {
    console.error("Error en createAppeal:", error);
    res.status(500).json({ message: "Error al crear apelación", error: error.message });
  }
};

export const updateAppeal = async (req, res) => {
  try {
    const appealId = req.params.id;
    const { message, status } = req.body;

    const appeal = await Appeal.findByPk(appealId);
    if (!appeal) return res.status(404).json({ message: "Apelación no encontrada" });

    await appeal.update({
      message: message !== undefined ? message : appeal.message,
      status: status !== undefined ? status : appeal.status,
    });

    res.json({ message: "Apelación actualizada", appeal });
  } catch (error) {
    console.error("Error en updateAppeal:", error);
    res.status(500).json({ message: "Error al actualizar apelación", error: error.message });
  }
};

export const deleteAppeal = async (req, res) => {
  try {
    const appealId = req.params.id;
    const appeal = await Appeal.findByPk(appealId);
    if (!appeal) return res.status(404).json({ message: "Apelación no encontrada" });

    await appeal.destroy();
    res.json({ message: "Apelación eliminada", appeal });
  } catch (error) {
    console.error("Error en deleteAppeal:", error);
    res.status(500).json({ message: "Error al eliminar apelación", error: error.message });
  }
};