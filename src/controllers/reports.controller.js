import { Report } from "../models/index.js";

export const getAllReports = async (req, res) => {
  try {
    const reports = await Report.findAll();
    res.json(reports);
  } catch (error) {
    console.error("Error en getAllReports:", error);
    res.status(500).json({ message: "Error al obtener reportes", error: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: "Reporte no encontrado" });
    res.json(report);
  } catch (error) {
    console.error("Error en getReportById:", error);
    res.status(500).json({ message: "Error al obtener el reporte", error: error.message });
  }
};

export const getReportsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await Report.findAll({ where: { userId } });
    res.json(reports);
  } catch (error) {
    console.error("Error en getReportsByUser:", error);
    res.status(500).json({ message: "Error al obtener reportes del usuario", error: error.message });
  }
};

export const createReport = async (req, res) => {
  try {
    const { type, description, userId, productId } = req.body;

    if (!type || !description || !userId || !productId) {
      return res.status(400).json({ message: "type, description, userId y productId son requeridos" });
    }

    // Map API fields to model fields and set date by default
    const report = await Report.create({
      dateReport: new Date(),
      typeReport: type,
      description,
      userId,
      productId,
    });

    res.status(201).json({ message: "Reporte creado", report });
  } catch (error) {
    console.error("Error en createReport:", error);
    res.status(500).json({ message: "Error al crear reporte", error: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const report = await Report.findByPk(reportId);
    if (!report) return res.status(404).json({ message: "Reporte no encontrado" });

    await report.destroy();
    res.json({ message: "Reporte eliminado", report });
  } catch (error) {
    console.error("Error en deleteReport:", error);
    res.status(500).json({ message: "Error al eliminar reporte", error: error.message });
  }
};