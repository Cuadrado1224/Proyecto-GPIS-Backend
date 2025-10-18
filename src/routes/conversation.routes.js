import { Router } from "express";
import {
  getAllConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
} from "../controllers/conversation.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Conversation:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         productId:
 *           type: integer
 *         buyerId:
 *           type: integer
 *         sellerId:
 *           type: integer
 *     ConversationCreate:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: integer
 *     ConversationUpdate:
 *       type: object
 *       properties:
 *         markRead:
 *           type: boolean
 */

/**
 * @swagger
 * /conversations/:
 *   get:
 *     summary: Lista las conversaciones del usuario autenticado
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 */
router.get("/", authenticateToken, getAllConversations);
/**
 * @swagger
 * /conversations/{id}:
 *   get:
 *     summary: Obtiene una conversación por ID (solo si participas)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Conversación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Conversación no encontrada
 */
router.get("/:id", authenticateToken, getConversationById);
/**
 * @swagger
 * /conversations/:
 *   post:
 *     summary: Crea (o reutiliza) una conversación con el vendedor del producto
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConversationCreate'
 *     responses:
 *       201:
 *         description: Conversación creada o existente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Datos inválidos o conversación contigo mismo
 *       404:
 *         description: Producto no encontrado
 */
router.post("/", authenticateToken, createConversation);
/**
 * @swagger
 * /conversations/{id}:
 *   put:
 *     summary: Actualiza la conversación (p. ej., marcar mensajes como leídos)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la conversación
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConversationUpdate'
 *     responses:
 *       200:
 *         description: Conversación actualizada
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Conversación no encontrada
 */
router.put("/:id", authenticateToken, updateConversation);
/**
 * @swagger
 * /conversations/{id}:
 *   delete:
 *     summary: Elimina una conversación (solo participantes)
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la conversación
 *     responses:
 *       200:
 *         description: Conversación eliminada
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Conversación no encontrada
 */
router.delete("/:id", authenticateToken, deleteConversation);

export default router;
