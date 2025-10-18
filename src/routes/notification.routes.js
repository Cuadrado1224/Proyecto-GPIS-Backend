import { Router } from "express";
import {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         typeId:
 *           type: integer
 *         message:
 *           type: string
 *         title:
 *           type: string
 *         read:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     NotificationCreate:
 *       type: object
 *       required:
 *         - typeName
 *         - message
 *         - title
 *       properties:
 *         typeName:
 *           type: string
 *         message:
 *           type: string
 *         title:
 *           type: string
 *     NotificationUpdate:
 *       type: object
 *       properties:
 *         read:
 *           type: boolean
 */

/**
 * @swagger
 * /notifications/:
 *   get:
 *     summary: Lista notificaciones del usuario autenticado
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 */
router.get("/", authenticateToken, getAllNotifications);

/**
 * @swagger
 * /notifications/{id}:
 *   get:
 *     summary: Obtiene una notificación por ID (solo si es tuya)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Notificación no encontrada
 */
router.get("/:id", authenticateToken, getNotificationById);

/**
 * @swagger
 * /notifications/:
 *   post:
 *     summary: Crea una notificación para el usuario autenticado (útil para pruebas)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationCreate'
 *     responses:
 *       201:
 *         description: Notificación creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 */
router.post("/", authenticateToken, createNotification);

/**
 * @swagger
 * /notifications/{id}:
 *   put:
 *     summary: Actualiza una notificación (marcar como leída)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la notificación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationUpdate'
 *     responses:
 *       200:
 *         description: Notificación actualizada
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Notificación no encontrada
 */
router.put("/:id", authenticateToken, updateNotification);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Elimina una notificación
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la notificación
 *     responses:
 *       200:
 *         description: Notificación eliminada
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Notificación no encontrada
 */
router.delete("/:id", authenticateToken, deleteNotification);

export default router;
