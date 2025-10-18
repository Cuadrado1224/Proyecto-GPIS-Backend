import { Router } from "express";
import {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
} from "../controllers/message.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         conversationId:
 *           type: integer
 *         senderId:
 *           type: integer
 *         content:
 *           type: string
 *         sentAt:
 *           type: string
 *           format: date-time
 *         read:
 *           type: boolean
 *     MessageCreate:
 *       type: object
 *       required:
 *         - conversationId
 *         - content
 *       properties:
 *         conversationId:
 *           type: integer
 *         content:
 *           type: string
 */

/**
 * @swagger
 * /messages/:
 *   get:
 *     summary: Lista mensajes de una conversación del usuario
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 */
router.get("/", authenticateToken, getAllMessages);
//router.get("/:id", getMessageById);
/**
 * @swagger
 * /messages/:
 *   post:
 *     summary: Envía un mensaje en una conversación
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageCreate'
 *     responses:
 *       201:
 *         description: Mensaje creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       403:
 *         description: No autorizado (no eres participante)
 *       404:
 *         description: Conversación no encontrada
 */
router.post("/", authenticateToken, createMessage);
//router.put("/:id", updateMessage);
//router.delete("/:id", deleteMessage);

export default router;
