import express from "express";
import * as incidenceCtrl from "../controllers/incidence.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Incidences
 *     description: Gestión de incidencias
 *
 * components:
 *   schemas:
 *     Incidence:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         dateIncidence:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, in_progress, resolved]
 *         userId:
 *           type: integer
 *           description: ID del moderador/administrador asignado
 *         productId:
 *           type: integer
 */

/**
 * @swagger
 * /incidences:
 *   get:
 *     tags: [Incidences]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener todas las incidencias
 *     responses:
 *       200:
 *         description: Lista de incidencias
 */
router.get("/", authenticateToken, incidenceCtrl.getAllIncidences);

/**
 * @swagger
 * /incidences/{id}:
 *   get:
 *     tags: [Incidences]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener una incidencia por id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Incidencia encontrada
 */
router.get("/:id", authenticateToken, incidenceCtrl.getIncidenceById);

/**
 * @swagger
 * /incidences/user/{userId}:
 *   get:
 *     tags: [Incidences]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener incidencias por usuario
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de incidencias del usuario
 */
router.get("/user/:userId", authenticateToken, incidenceCtrl.getIncidencesByUser);

/**
 * @swagger
 * /incidences:
 *   post:
 *     tags: [Incidences]
 *     security:
 *       - bearerAuth: []
 *     summary: Crear una incidencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Incidence'
 *     responses:
 *       201:
 *         description: Incidencia creada
 */
router.post("/", authenticateToken, incidenceCtrl.createIncidence);

/**
 * @swagger
 * /incidences/{id}:
 *   put:
 *     tags: [Incidences]
 *     security:
 *       - bearerAuth: []
 *     summary: Actualizar una incidencia
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Incidence'
 *     responses:
 *       200:
 *         description: Incidencia actualizada
 */
router.put("/:id", authenticateToken, incidenceCtrl.updateIncidence);

/**
 * @swagger
 * /incidences/{id}:
 *   delete:
 *     tags: [Incidences]
 *     security:
 *       - bearerAuth: []
 *     summary: Eliminar una incidencia
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Incidencia eliminada
 */
router.delete("/:id", authenticateToken, incidenceCtrl.deleteIncidence);

export default router;