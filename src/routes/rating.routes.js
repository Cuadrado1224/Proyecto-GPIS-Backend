import { Router } from "express";
import { upsertSellerRating, deleteSellerRating } from "../controllers/rating.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: Calificaciones de vendedores
 */

/**
 * @swagger
 * /ratings/{sellerId}:
 *   post:
 *     summary: Crear o actualizar calificación de un vendedor
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 format: float
 *                 example: 4.5
 *               comment:
 *                 type: string
 *                 example: "Excelente atención y rápido envío"
 *     responses:
 *       200:
 *         description: Calificación guardada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Vendedor no encontrado
 */
router.post("/:sellerId", authenticateToken, upsertSellerRating);

/**
 * @swagger
 * /ratings/{sellerId}:
 *   put:
 *     summary: Actualizar calificación existente de un vendedor
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 format: float
 *                 example: 3.5
 *               comment:
 *                 type: string
 *                 example: "Modificando mi opinión tras segunda compra"
 *     responses:
 *       200:
 *         description: Calificación actualizada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Calificación o vendedor no encontrado
 */
router.put("/:sellerId", authenticateToken, upsertSellerRating);

/**
 * @swagger
 * /ratings/{sellerId}:
 *   delete:
 *     summary: Eliminar mi calificación hacia un vendedor
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Calificación eliminada
 *       404:
 *         description: Calificación no encontrada
 */
router.delete("/:sellerId", authenticateToken, deleteSellerRating);

export default router;
