import express from "express";
import * as appealsCtrl from "../controllers/appeals.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Appeals
 *     description: Gestión de apelaciones sobre incidencias
 *
 * components:
 *   schemas:
 *     Appeal:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         incidenceId:
 *           type: integer
 *         userId:
 *           type: integer
 *         message:
 *           type: string
 *         status:
 *           type: string
 */

/**
 * @swagger
 * /appeals:
 *   get:
 *     tags: [Appeals]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener todas las apelaciones
 *     responses:
 *       200:
 *         description: Lista de apelaciones
 */
router.get("/", authenticateToken, appealsCtrl.getAllAppeals);

/**
 * @swagger
 * /appeals/{id}:
 *   get:
 *     tags: [Appeals]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener apelación por id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Apelación encontrada
 */
router.get("/:id", authenticateToken, appealsCtrl.getAppealById);

/**
 * @swagger
 * /appeals/incidence/{incidenceId}:
 *   get:
 *     tags: [Appeals]
 *     security:
 *       - bearerAuth: []
 *     summary: Obtener apelaciones de una incidencia
 *     parameters:
 *       - in: path
 *         name: incidenceId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Lista de apelaciones para la incidencia
 */
router.get("/incidence/:incidenceId", authenticateToken, appealsCtrl.getAppealsByIncidence);

/**
 * @swagger
 * /appeals:
 *   post:
 *     tags: [Appeals]
 *     security:
 *       - bearerAuth: []
 *     summary: Crear una apelación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appeal'
 *     responses:
 *       201:
 *         description: Apelación creada
 */
router.post("/", authenticateToken, appealsCtrl.createAppeal);

/**
 * @swagger
 * /appeals/{id}:
 *   put:
 *     tags: [Appeals]
 *     security:
 *       - bearerAuth: []
 *     summary: Actualizar una apelación
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
 *             $ref: '#/components/schemas/Appeal'
 *     responses:
 *       200:
 *         description: Apelación actualizada
 */
router.put("/:id", authenticateToken, appealsCtrl.updateAppeal);

/**
 * @swagger
 * /appeals/{id}:
 *   delete:
 *     tags: [Appeals]
 *     security:
 *       - bearerAuth: []
 *     summary: Eliminar una apelación
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Apelación eliminada
 */
router.delete("/:id", authenticateToken, appealsCtrl.deleteAppeal);

export default router;