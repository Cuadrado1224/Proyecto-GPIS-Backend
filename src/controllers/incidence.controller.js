import { Incidence } from "../models/index.js";

export const getAllIncidences = async (req, res) => {
  try {
    const incidences = await Incidence.findAll();
    res.json(incidences);
  } catch (error) {
    console.error("Error en getAllIncidences:", error);
    res.status(500).json({ message: "Error al obtener incidencias", error: error.message });
  }
};

export const getIncidenceById = async (req, res) => {
  try {
    const incidence = await Incidence.findByPk(req.params.id);
    if (!incidence) return res.status(404).json({ message: "Incidencia no encontrada" });
    res.json(incidence);
  } catch (error) {
    console.error("Error en getIncidenceById:", error);
    res.status(500).json({ message: "Error al obtener la incidencia", error: error.message });
  }
};

export const getIncidencesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const incidences = await Incidence.findAll({ where: { userId } });
    res.json(incidences);
  } catch (error) {
    console.error("Error en getIncidencesByUser:", error);
    res.status(500).json({ message: "Error al obtener incidencias del usuario", error: error.message });
  }
};

export const createIncidence = async (req, res) => {
  try {
    const { description, userId, productId, moderatorId, status } = req.body;

    if (!description || !userId || !productId) {
      return res.status(400).json({ message: "description, userId y productId son requeridos" });
    }

    const incidence = await Incidence.create({
      dateIncidence: new Date(),
      description,
      userId,
      productId,
      moderatorId: moderatorId || userId,
      status: status || "pending",
    });

    res.status(201).json({ message: "Incidencia creada", incidence });
  } catch (error) {
    console.error("Error en createIncidence:", error);
    res.status(500).json({ message: "Error al crear incidencia", error: error.message });
  }
};

export const updateIncidence = async (req, res) => {
  try {
    const incidenceId = req.params.id;
    const { description, status, productId, moderatorId } = req.body;

    const incidence = await Incidence.findByPk(incidenceId);
    if (!incidence) return res.status(404).json({ message: "Incidencia no encontrada" });

    await incidence.update({
      description: description !== undefined ? description : incidence.description,
      status: status !== undefined ? status : incidence.status,
      productId: productId !== undefined ? productId : incidence.productId,
      moderatorId: moderatorId !== undefined ? moderatorId : incidence.moderatorId
    });

    res.json({ message: "Incidencia actualizada", incidence });
  } catch (error) {
    console.error("Error en updateIncidence:", error);
    res.status(500).json({ message: "Error al actualizar incidencia", error: error.message });
  }
};

export const deleteIncidence = async (req, res) => {
  try {
    const incidenceId = req.params.id;
    const incidence = await Incidence.findByPk(incidenceId);
    if (!incidence) return res.status(404).json({ message: "Incidencia no encontrada" });

    await incidence.destroy();
    res.json({ message: "Incidencia eliminada", incidence });
  } catch (error) {
    console.error("Error en deleteIncidence:", error);
    res.status(500).json({ message: "Error al eliminar incidencia", error: error.message });
  }
};