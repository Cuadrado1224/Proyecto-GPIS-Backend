import express from "express";
import * as reportsCtrl from "../controllers/reports.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Gestión de reportes
 *
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         dateReport:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora en que se creó el reporte
 *         type:
 *           type: string
 *         description:
 *           type: string
 *         userId:
 *           type: integer
 *         productId:
 *           type: integer
 */

/**
 * @swagger
 * /reports:
 *   get:
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener todos los reportes
 *     responses:
 *       200:
 *         description: Lista de reportes
 */
router.get("/", authenticateToken, reportsCtrl.getAllReports);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener un reporte por id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Reporte encontrado
 */
router.get("/:id", authenticateToken, reportsCtrl.getReportById);

/**
 * @swagger
 * /reports/user/{userId}:
 *   get:
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener reportes hechos por un usuario
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de reportes del usuario
 */
router.get("/user/:userId", authenticateToken, reportsCtrl.getReportsByUser);

/**
 * @swagger
 * /reports:
 *   post:
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     summary: Crear un reporte
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Report'
 *     responses:
 *       201:
 *         description: Reporte creado
 */
router.post("/", authenticateToken, reportsCtrl.createReport);

/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     summary: Eliminar un reporte
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Reporte eliminado
 */
router.delete("/:id", authenticateToken, reportsCtrl.deleteReport);

export default router;